import mongoose from "mongoose";
import eventEmitter from "../events/event.emitter.js";
import * as orderRepo from "../repositories/order.repository.js";
import * as tempOrderService from "./temporary.order.service.js";
import * as customerService from "./customer.service.js";
import * as userService from "./user.service.js";
import * as itemService from "./item.service.js";
import * as couponService from "./coupon.service.js";
import { generateRandomToken } from "./crypto.service.js";
import { encryptTelephone, encryptAddress } from "../utils/encryption.util.js";
import {
  mapOrdersForAdminList,
  mapOrderForAdminDetail,
  mapOrdersForCustomer,
  mapOrderForCustomer,
} from "../mappers/order.mapper.js";
import {
  canTransition,
  canEditContactInfo,
  isCancellable,
} from "../models/order-status-transitions.js";
import {
  validationError,
  notFound,
  badRequest,
  forbidden,
} from "../utils/error.util.js";

import { logError, logWarn, logInfo } from "../utils/logger.util.js";

export async function listOrders({
  search,
  buyerId,
  email,
  status,
  city,
  partnerId,
  source,
  dateFrom,
  dateTo,
  limit = 10,
  page = 1,
} = {}) {
  const result = await orderRepo.findOrders({
    search,
    buyerId,
    email,
    status,
    city,
    partnerId,
    source,
    dateFrom,
    dateTo,
    limit,
    page,
    sort: { createdAt: -1 },
  });

  return {
    data: mapOrdersForAdminList(result.data),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  };
}

export async function getOrderById(orderId) {
  if (!orderId) validationError("orderId");

  const order = await orderRepo.findOrderById(orderId);
  if (!order) notFound("Porudžbina");

  return mapOrderForAdminDetail(order);
}

export async function getOrderByCancelToken(token) {
  if (!token) validationError("token");

  const order = await orderRepo.findOrderByCancelToken(token);
  if (!order) notFound("Porudžbina");

  return mapOrderForAdminDetail(order);
}

async function migrateOrderFromCustomerToUser(customerId, orderId, session) {
  const customerData = await customerService.getCustomerRawById(customerId, { session });
 
  const result = await userService.migrateCustomerToUser({
    customer:          customerData,
    orderId,
    autoCreateAccount: true,
    session,           // outer session — migrateCustomerToUser will NOT commit/emit
  });
 
  if (!result.userId) return null;
 
  // Re-assign ALL historical orders that still belong to the Customer
  await orderRepo.updateManyOrders(
    { buyerId: customerId, buyerModel: "Customer" },
    { buyerId: result.userId, buyerModel: "User" },
    session
  );
 
  await customerService.deleteCustomerAfterMigration(customerId, session);
 
  return result; // full payload (includes confirmToken, resetToken, email, etc.)
}
 
// ── main: confirmOrder ───────────────────────────────────────────────────────
export async function confirmOrder(
  token,
  tempOrderId,
  { ignoreExpiration = false, providedTempOrder = null, session: existingSession = null } = {}
) {
  const ownsSession = !existingSession;
  const session     = existingSession || (await mongoose.startSession());
 
  try {
    // ── Phase 1: verify the token (outside the transaction — read-only) ─────
    const tempOrder = providedTempOrder
      ? providedTempOrder
      : await tempOrderService.verifyToken(tempOrderId, token, { ignoreExpiration });
 
    if (ownsSession) session.startTransaction();
 
    // ── Phase 2: build the permanent order ──────────────────────────────────
    const cancelToken = generateRandomToken(16);
 
    const orderData = {
      buyerId:    tempOrder.buyerId,
      buyerModel: tempOrder.buyerModel,
      buyerInfo:  tempOrder.buyerInfo,
      telephone:  tempOrder.telephone,
      address:    tempOrder.address,
      items:      tempOrder.items,
      subtotal:   tempOrder.subtotal,
      shipping:   tempOrder.shipping,
      coupon:     tempOrder.coupon   || {},
      partner:    tempOrder.partner  || {},
      totalPrice: tempOrder.totalPrice,
      note:       tempOrder.note     || "",
      status:     "confirmed",
      cancelToken,
      temporaryOrderId: tempOrderId,
      confirmedAt: new Date(),
    };
 
    const created     = await orderRepo.createOrder(orderData, session);
    const newOrderId  = created._id.toString();
    const orderObject = created.toObject ? created.toObject() : created;
 
    // ── Phase 3: ensure phone/address saved to buyer profile ────────────────
    await ensureClientData(
      tempOrder.buyerModel,
      tempOrder.buyerId,
      {
        telephone:          tempOrder.telephone,
        address:            tempOrder.address,
        orderId:            newOrderId,
        hasNewTelephone:    tempOrder.hasNewTelephone,
        hasNewAddress:      tempOrder.hasNewAddress,
      },
      session
    );
 
    // ── Phase 4: optional Customer → User migration ─────────────────────────
    let migrationResult = null;
    if (tempOrder.createNewAccount && tempOrder.buyerModel === "Customer") {
      migrationResult = await migrateOrderFromCustomerToUser(
        tempOrder.buyerId,
        newOrderId,
        session
      );
    }
 
    // ── Phase 5: finalise coupon — update the Phase-1 entry with real orderId
    if (tempOrder.coupon?.couponId) {
      const isUser = tempOrder.buyerModel === "User";
      await couponService.updateCouponUsedByOrder(
        tempOrder.coupon.couponId,
        isUser ? tempOrder.buyerId    : null,
        isUser ? null                 : tempOrder.buyerInfo?.email,
        tempOrderId,   // find the Phase-1 usedBy entry by temporaryOrderId
        newOrderId,    // set the real orderId; clear temporaryOrderId
        session
      );
    }
 
    // ── Phase 6: delete temp order (acts as idempotency guard) ─────────────
    // If two concurrent requests race, the second delete returns null → throws
    // → transaction aborts → only one Order is ever created.
    await tempOrderService.deleteTemporaryOrder(tempOrderId, { session });
 
    // ── Commit ──────────────────────────────────────────────────────────────
    if (ownsSession) await session.commitTransaction();
 
    // ── Events AFTER commit (never before — no phantom emails on rollback) ──
    if (migrationResult?.migrated || migrationResult?.extended) {
      eventEmitter.emit("user:migrated", {
        email:          migrationResult.email,
        firstName:      migrationResult.firstName,
        userId:         migrationResult.userId,
        confirmToken:   migrationResult.confirmToken,
        resetToken:     migrationResult.resetToken,
        migrated:       migrationResult.migrated,
        extended:       migrationResult.extended,
        accountCreated: migrationResult.accountCreated,
      });
    }
 
    eventEmitter.emit("order:confirmed", {
      order:      orderObject,
      orderId:    newOrderId,
      email:      tempOrder.buyerInfo.email,
      firstName:  tempOrder.buyerInfo.firstName,
      totalPrice: orderObject.totalPrice,
      cancelToken,
    });
 
    return {
      id:          newOrderId,
      email:       tempOrder.buyerInfo.email,
      firstName:   tempOrder.buyerInfo.firstName,
      totalPrice:  orderObject.totalPrice,
      cancelToken,
      migrated:    !!migrationResult?.migrated,
    };
  } catch (error) {
    if (ownsSession) await session.abortTransaction();
    logError("confirmOrder failed", error, { tempOrderId });
    throw error;
  } finally {
    if (ownsSession) session.endSession();
  }
}

export async function confirmOrderByAdmin(token, orderId, { session: existingSession } = {}) {
  const tempOrder = await tempOrderService.getTemporaryOrderRawById(orderId);
  return confirmOrder(token || tempOrder.verificationToken, orderId, {
    session: existingSession,
    tempOrder,
    ignoreExpiration: true,
  });
}

async function ensureClientData(buyerModel, buyerId, { telephone, address, orderId }, session) {
  if (buyerModel === "User") {
    await userService.ensureUserData(
      buyerId,
      {
        telephones: telephone ? [telephone] : [],
        addresses: address ? [address] : [],
        orderId,
      },
      { session }
    );
  } else if (buyerModel === "Customer") {
    await customerService.ensureCustomerData(
      buyerId,
      {
        telephones: telephone ? [telephone] : [],
        addresses: address ? [address] : [],
        orderId,
      },
      { session }
    );
  }
}

export async function updateOrderStatusByAdmin(orderId, newStatus) {
  if (!orderId) validationError("orderId");
  if (!newStatus) validationError("status");

  const order = await orderRepo.findOrderById(orderId);
  if (!order) notFound("Porudžbina");

  if (!canTransition(order.status, newStatus)) {
    badRequest(`Nedozvoljena tranzicija: ${order.status} → ${newStatus}`);
  }

  const updated = await orderRepo.updateOrderStatus(orderId, newStatus);
  const updatedOrder = updated.toObject ? updated.toObject() : updated;

  eventEmitter.emit("order:status_changed", {
    order: updatedOrder,
    orderId,
    email: order.buyerInfo.email,
    firstName: order.buyerInfo.firstName,
    oldStatus: order.status,
    newStatus,
  });

  return mapOrderForAdminDetail(updated);
}

export async function updateOrderContactInfo(orderId, { telephone, address } = {}) {
  if (!orderId) validationError("orderId");

  const order = await orderRepo.findOrderById(orderId);
  if (!order) notFound("Porudžbina");

  if (!canEditContactInfo(order.status)) {
    badRequest(`Kontakt informacije se ne mogu menjati u statusu: ${order.status}`);
  }

  const updateData = {};

  if (telephone) {
    const encrypted = encryptTelephone(telephone);
    updateData.telephone = {
      value: encrypted.value,
      hash: encrypted.hash,
    };
  }

  if (address) {
    if (!address.city || !address.street || !address.number || !address.postalCode) {
      validationError("address");
    }
    const encrypted = encryptAddress(address);
    updateData.address = {
      city: encrypted.city,
      street: encrypted.street,
      number: encrypted.number,
      postalCode: encrypted.postalCode,
      hash: encrypted.hash,
    };
  }

  if (Object.keys(updateData).length === 0) {
    validationError("data");
  }

  const updated = await orderRepo.updateOrderById(orderId, updateData);
  return mapOrderForAdminDetail(updated);
}

export async function getClientOrders(buyerId, { limit = 10, page = 1 } = {}) {
  if (!buyerId) validationError("buyerId");

  const result = await orderRepo.findOrdersByBuyer(buyerId, { limit, page });

  return {
    data: mapOrdersForCustomer(result.data),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  };
}

export async function getClientOrderById(orderId, buyerId) {
  if (!orderId) validationError("orderId");
  if (!buyerId) validationError("buyerId");

  const order = await orderRepo.findOrderById(orderId);
  if (!order) notFound("Porudžbina");

  if (String(order.buyerId) !== String(buyerId)) {
    forbidden("Nemate pristup ovoj porudžbini");
  }

  return mapOrderForCustomer(order);
}

export async function cancelOrderByClient(orderId, buyerId) {
  if (!orderId) validationError("orderId");
  if (!buyerId) validationError("buyerId");

  const order = await orderRepo.findOrderById(orderId);
  if (!order) notFound("Porudžbina");

  if (String(order.buyerId) !== String(buyerId)) {
    forbidden("Nemate pristup ovoj porudžbini");
  }

  if (!isCancellable(order.status)) {
    badRequest(`Porudžbina ne može biti otkazana u statusu: ${order.status}`);
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const items = order.items.map((item) => ({
      itemId: item.itemId,
      variationId: item.variationId,
      quantity: item.quantity,
    }));
    await itemService.restoreStock(items, { session });

    const updated = await orderRepo.updateOrderStatus(order._id, "cancelled", session);
    const updatedOrder = updated.toObject ? updated.toObject() : updated;

    await session.commitTransaction();

    eventEmitter.emit("order:cancelled", {
      order: updatedOrder,
      orderId,
      email: order.buyerInfo.email,
      firstName: order.buyerInfo.firstName,
      cancelledBy: "client",
    });

    return mapOrderForCustomer(updated);

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

export async function cancelOrderByToken(cancelToken) {
  if (!cancelToken) validationError("cancelToken");

  const order = await orderRepo.findOrderByCancelToken(cancelToken);
  if (!order) badRequest("Token nije validan");

  if (!isCancellable(order.status)) {
    badRequest("Porudžbina ne može biti otkazana u trenutnom statusu");
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const items = order.items.map((item) => ({
      itemId: item.itemId,
      variationId: item.variationId,
      quantity: item.quantity,
    }));
    await itemService.restoreStock(items, { session });

    const updated = await orderRepo.updateOrderStatus(order._id, "cancelled", session);
    const updatedOrder = updated.toObject ? updated.toObject() : updated;

    await session.commitTransaction();

    eventEmitter.emit("order:cancelled", {
      order: updatedOrder,
      orderId: order._id,
      email: order.buyerInfo.email,
      firstName: order.buyerInfo.firstName,
      cancelledBy: "token",
    });

    return mapOrderForAdminDetail(updated);

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

export async function getOrderStats() {
  const [total, byStatus, totalRevenue, recentRevenue] = await Promise.all([
    orderRepo.countOrders(),
    orderRepo.countOrdersByStatus(),
    orderRepo.getTotalRevenue(),
    orderRepo.getRevenueByPeriod(30),
  ]);

  return { total, byStatus, totalRevenue, recentRevenue };
}

export async function getOrderDashboardStats() {
  const [total, byStatus, totalRevenue, recentRevenue] = await Promise.all([
    orderRepo.countOrders(),
    orderRepo.countOrdersByStatus(),
    orderRepo.getTotalRevenue({ statuses: ["delivered", "completed"] }),
    orderRepo.getRevenueByPeriod(30, { statuses: ["delivered", "completed"] }),
  ]);

  const finalStatuses = ["completed", "cancelled", "returned", "refunded", "failed"];
  let active = 0;
  let completed = 0;
  for (const [status, count] of Object.entries(byStatus)) {
    if (status === "completed") completed = count;
    if (!finalStatuses.includes(status)) active += count;
  }

  return {
    total,
    active,
    completed,
    byStatus,
    totalRevenue,
    recentRevenue,
  };
}

export default {
  listOrders,
  getOrderById,
  getOrderByCancelToken,

  confirmOrder,
  confirmOrderByAdmin,

  updateOrderStatusByAdmin,
  updateOrderContactInfo,

  getClientOrders,
  getClientOrderById,

  cancelOrderByClient,
  cancelOrderByToken,

  getOrderStats,
  getOrderDashboardStats,
};