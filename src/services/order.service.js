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

export async function confirmOrder(token, orderId, options = {}) {
  const { session: existingSession, tempOrder: providedTempOrder, ignoreExpiration = false } = options;

  if (!token && !providedTempOrder) validationError("token");
  if (!orderId) validationError("orderId");

  const ownsSession = !existingSession;
  const session = existingSession || await mongoose.startSession();

  try {
    if (ownsSession) session.startTransaction();

    const tempOrder = providedTempOrder
      ? providedTempOrder
      : await tempOrderService.verifyToken(orderId, token, { ignoreExpiration });

    const tempOrderId = tempOrder._id ? tempOrder._id.toString() : tempOrder.temporaryOrderId;
    if (!tempOrderId) validationError("tempOrderId");

    const cancelToken = generateRandomToken(16);

    const orderData = {
      buyerId: tempOrder.buyerId,
      buyerModel: tempOrder.buyerModel,
      buyerInfo: tempOrder.buyerInfo,
      telephone: tempOrder.telephone,
      address: tempOrder.address,
      items: tempOrder.items,
      subtotal: tempOrder.subtotal,
      shipping: tempOrder.shipping,
      coupon: tempOrder.coupon,
      partner: tempOrder.partner,
      totalPrice: tempOrder.totalPrice,
      note: tempOrder.note,
      status: "confirmed",
      confirmedAt: new Date(),
      cancelToken,
      temporaryOrderId: tempOrderId,
    };

    const created = await orderRepo.createOrder(orderData, session);
    const orderObject = created.toObject ? created.toObject() : created;
    const newOrderId = orderObject._id.toString();

    await ensureClientData(
      tempOrder.buyerModel,
      tempOrder.buyerId,
      {
        telephone: tempOrder.telephone,
        address: tempOrder.address,
        orderId: newOrderId,
      },
      session
    );

    if (tempOrder.createNewAccount && tempOrder.buyerModel === "Customer") {
      const migrationResult = await migrateOrderFromCustomerToUser(
        tempOrder.buyerId,
        newOrderId,
        session
      );
      if (migrationResult) {
        orderObject.buyerId = migrationResult.userId;
        orderObject.buyerModel = "User";
      }
    }

    if (tempOrder.coupon?.couponId) {
      await couponService.markCouponAsUsed(
        tempOrder.coupon.couponId,
        newOrderId,
        tempOrder.buyerId,
        session
      );
    }

    await tempOrderService.deleteTemporaryOrder(tempOrderId, { session });

    if (ownsSession) await session.commitTransaction();

    eventEmitter.emit("order:confirmed", {
      order: orderObject,
      orderId: newOrderId,
      email: tempOrder.buyerInfo.email,
      firstName: tempOrder.buyerInfo.firstName,
      totalPrice: orderObject.totalPrice,
      cancelToken: orderObject.cancelToken,
    });

    return {
      id: newOrderId,
      cancelToken: orderObject.cancelToken,
      totalPrice: orderObject.totalPrice,
    };

  } catch (error) {
    if (ownsSession) await session.abortTransaction();
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

async function migrateOrderFromCustomerToUser(customerId, orderId, session) {
  // Fetch raw customer data within the transaction – includes newly added telephone/address/order
  const customerData = await customerService.getCustomerRawById(customerId, { session });

  const result = await userService.migrateCustomerToUser({
    customer: customerData,
    orderId,
    autoCreateAccount: true,
    session,
  });

  if (!result.userId) return null;

  // Reassign all orders from this customer to the new user
  await orderRepo.updateManyOrders(
    {
      buyerId: customerId,
      buyerModel: "Customer",
    },
    {
      buyerId: result.userId,
      buyerModel: "User",
    },
    session
  );

  // ✅ Delete the original customer after all data is transferred
  await customerService.deleteCustomerAfterMigration(customerId, session);

  return { userId: result.userId };
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