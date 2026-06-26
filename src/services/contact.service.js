import eventEmitter from "../events/event.emitter.js";
import * as contactRepo from "../repositories/contact.repository.js";
import { encrypt } from "./crypto.service.js";
import {
  mapContactsForAdminList,
  mapContactForAdminDetail,
} from "../mappers/contact.mapper.js";
import {
  validationError,
  notFound,
} from "../utils/error.util.js";

function validateContactData(data) {
  if (!data) validationError("data");
  if (!data.firstName) validationError("firstName");
  if (!data.email) validationError("email");
  if (!data.title) validationError("title");
  if (!data.message) validationError("message");
}

export async function listContacts({
  search,
  email,
  status,
  limit = 10,
  page = 1,
} = {}) {
  const result = await contactRepo.findContacts({
    search,
    email,
    status,
    limit,
    page,
    sort: { createdAt: -1 },
  });

  return {
    data: mapContactsForAdminList(result.data),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  };
}

export async function getContactById(contactId) {
  if (!contactId) validationError("contactId");

  const contact = await contactRepo.findContactById(contactId);
  if (!contact) notFound("Poruka");

  return mapContactForAdminDetail(contact);
}

export async function createContact(data) {
  validateContactData(data);

  const contactData = {
    firstName: data.firstName,
    email: data.email.toLowerCase().trim(),
    telephoneNumber: data.telephoneNumber
      ? encrypt(data.telephoneNumber)
      : "",
    title: data.title,
    message: encrypt(data.message),
    status: "new",
    acceptance: data.acceptance ?? true,
  };

  const created = await contactRepo.createContact(contactData);
  const contactObject = created.toObject ? created.toObject() : created;

  eventEmitter.emit("contact:created", {
    id: contactObject._id.toString(),
    email: data.email,
    firstName: data.firstName,
    title: data.title,
    message: data.message,
  });

  return { success: true, id: contactObject._id.toString() };
}

export async function updateContactStatus(contactId, status) {
  if (!contactId) validationError("contactId");
  if (!status) validationError("status");

  const validStatuses = ["new", "read", "replied", "archived"];
  if (!validStatuses.includes(status)) {
    validationError("status");
  }

  const updated = await contactRepo.updateContactStatus(contactId, status);
  if (!updated) notFound("Poruka");

  return mapContactForAdminDetail(updated);
}

export async function getContactStats() {
  const [total, byStatus, newCount] = await Promise.all([
    contactRepo.countContacts(),
    contactRepo.countContactsByStatus(),
    contactRepo.countNewContacts(),
  ]);

  return { total, byStatus, newCount };
}

export default {
  listContacts,
  getContactById,
  createContact,
  updateContactStatus,
  getContactStats,
};