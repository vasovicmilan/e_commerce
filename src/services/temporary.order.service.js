import mongoose from "mongoose";
import eventEmitter from "../events/event.emitter.js";
import * as tempOrderRepo from "../repositories/temporary.order.repository.js";
import * as itemService from "./item.service.js";
import * as couponService from "./coupon.service.js"; // ✅ DODATO
import { encrypt, generateRandomToken } from "./crypto.service.js";
import { encryptTelephone, encryptAddress } from "../utils/encryption.util.js";
import {
  mapTemporaryOrdersForAdminList,
  mapTemporaryOrderForAdminDetail,
  mapTemporaryOrderForMigration,
} from "../mappers/temporary-order.mapper.js";
import { logError } from "../utils/logger.util.js";
import {
  validationError,
  notFound,
  badRequest,
  unauthorized,
} from "../utils/error.util.js";

function validateCheckoutData(data) {
  if (!data) validationError("data");
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    validationError("items");
  }
  if (!data.buyerId) validationError("buyerId");
  if (!data.buyerModel) validationError("buyerModel");
  if (!data.buyerInfo?.email) validationError("email");
  if (!data.telephone) validationError("telephone");
  if (!data.address) validationError("address");

  for (const item of data.items) {
    if (!item.itemId) validationError("itemId");
    if (!item.variationId) validationError("variationId");
    if (!item.quantity || item.quantity <= 0) validationError("quantity");
    if (!item.title) validationError("title");
    if (item.price === undefined || item.price === null) validationError("price");
  }
}

function calculateTotals(items, shipping, discountAmount) {
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.price || 0) * (item.quantity || 1);
  }, 0);

  const discount = Math.min(discountAmount || 0, subtotal);
  const totalPrice = Math.max(0, subtotal + (shipping || 0) - discount);

  return {
    subtotal: Math.round((subtotal + Number.EPSILON) * 100) / 100,
    discount: Math.round((discount + Number.EPSILON) * 100) / 100,
    totalPrice: Math.round((totalPrice + Number.EPSILON) * 100) / 100,
  };
}

export async function listTemporaryOrders({
  buyerId,
  buyerModel,
  email,
  partnerId,
  source,
  limit = 10,
  page = 1,
} = {}) {
  const result = await tempOrderRepo.findTemporaryOrders({
    buyerId,
    buyerModel,
    email,
    partnerId,
    source,
    limit,
    page,
    sort: { createdAt: -1 },
  });

  return {
    data: mapTemporaryOrdersForAdminList(result.data),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  };
}

export async function getTemporaryOrderById(orderId) {
  if (!orderId) validationError("orderId");

  const order = await tempOrderRepo.findTemporaryOrderById(orderId);
  if (!order) notFound("Privremena porudžbina");

  return mapTemporaryOrderForAdminDetail(order);
}

export async function getTemporaryOrderRawById(orderId) {
  if (!orderId) validationError("orderId");
  const order = await tempOrderRepo.findTemporaryOrderById(orderId);
  if (!order) notFound("Privremena porudžbina");
  return order;
}

export async function createTemporaryOrder(data, { session: existingSession } = {}) {
  validateCheckoutData(data);

  const ownsSession = !existingSession;
  const session = existingSession || await mongoose.startSession();

  try {
    if (ownsSession) session.startTransaction();

    await itemService.decreaseStock(data.items, { session });

    const encryptedTelephone = encryptTelephone(data.telephone);
    const encryptedAddress = encryptAddress(data.address);

    const shipping = data.shipping || Number(process.env.DEFAULT_SHIPPING_PRICE || 350);
    const discountAmount = data.coupon?.discount || 0;
    const { subtotal, discount, totalPrice } = calculateTotals(
      data.items,
      shipping,
      discountAmount
    );

    const verificationToken = generateRandomToken(32);
    const tokenTTL = Number(process.env.TEMP_ORDER_TOKEN_TTL || 30) * 60 * 1000;
    const tokenExpiration = new Date(Date.now() + tokenTTL);

    const orderData = {
      buyerId: data.buyerId,
      buyerModel: data.buyerModel,
      buyerInfo: data.buyerInfo,
      telephone: {
        value: encryptedTelephone.value,
        hash: encryptedTelephone.hash,
      },
      address: {
        city: encryptedAddress.city,
        street: encryptedAddress.street,
        number: encryptedAddress.number,
        postalCode: encryptedAddress.postalCode,
        hash: encryptedAddress.hash,
      },
      items: data.items,
      subtotal,
      shipping,
      coupon: data.coupon || {},
      partner: data.partner || { partnerId: null, source: "direct" },
      totalPrice,
      note: data.note ? encrypt(data.note) : "",
      createNewAccount: data.createNewAccount || false,
      hasNewTelephone: data.hasNewTelephone || false,
      hasNewAddress: data.hasNewAddress || false,
      verificationToken,
      tokenExpiration,
    };

    const created = await tempOrderRepo.createTemporaryOrder(orderData, session);

    if (ownsSession) await session.commitTransaction();

    const orderObject = created.toObject ? created.toObject() : created;

    eventEmitter.emit("temporary-order:created", {
      orderId: orderObject._id.toString(),
      email: data.buyerInfo.email,
      firstName: data.buyerInfo.firstName,
      verificationToken,
      tokenExpiration,
    });

    return {
      id: orderObject._id.toString(),
      verificationToken,
      tokenExpiration,
      totalPrice: orderObject.totalPrice,
    };

  } catch (error) {
    if (ownsSession) await session.abortTransaction();
    throw error;
  } finally {
    if (ownsSession) session.endSession();
  }
}

export async function verifyToken(orderId, token, { ignoreExpiration = false } = {}) {
  if (!orderId) validationError("orderId");
  if (!token) validationError("token");

  const order = await tempOrderRepo.findTemporaryOrderById(orderId);
  if (!order) badRequest("Privremena porudžbina ne postoji");

  if (order.verificationToken !== token) {
    unauthorized("Neispravan verifikacioni token");
  }

  if (!ignoreExpiration && new Date(order.tokenExpiration) < new Date()) {
    badRequest("Verifikacioni token je istekao");
  }

  return mapTemporaryOrderForMigration(order);
}

export async function deleteTemporaryOrder(orderId, { session } = {}) {
  if (!orderId) validationError("orderId");

  const deleted = await tempOrderRepo.deleteTemporaryOrderById(orderId, session);
  if (!deleted) notFound("Privremena porudžbina");

  return { deleted: true, id: orderId };
}

export async function deleteExpiredTemporaryOrders() {
  const now = new Date();
  const all = await tempOrderRepo.findAllTemporaryOrders();

  let deletedCount = 0;
  for (const order of all) {
    if (new Date(order.tokenExpiration) < now) {
      const session = await mongoose.startSession();
      try {
        session.startTransaction();

        // Restore stock
        await itemService.restoreStock(order.items, { session });

        // ✅ Release coupon if present – podržava i goste
        if (order.coupon?.couponId && order.buyerId) {
          const isUser = order.buyerModel === "User";
          await couponService.releaseCoupon(
            order.coupon.couponId,
            isUser ? order.buyerId : null,
            isUser ? null : order.buyerInfo.email,
            order._id,
            session
          );
        }

        await tempOrderRepo.deleteTemporaryOrderById(order._id, session);
        await session.commitTransaction();
        deletedCount++;
      } catch (error) {
        await session.abortTransaction();
        logError("Failed to cleanup expired order", error, {
          orderId: order._id,
        });
      } finally {
        session.endSession();
      }
    }
  }

  return { deletedCount };
}

export async function countTemporaryOrders() {
  return tempOrderRepo.countTemporaryOrders();
}

export default {
  listTemporaryOrders,
  getTemporaryOrderById,
  getTemporaryOrderRawById,
  createTemporaryOrder,
  verifyToken,
  deleteTemporaryOrder,
  deleteExpiredTemporaryOrders,
  countTemporaryOrders,
};