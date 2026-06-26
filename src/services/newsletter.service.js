import eventEmitter from "../events/event.emitter.js";
import * as newsletterRepo from "../repositories/news.letter.repository.js";
import {
  mapNewslettersForAdminList,
  mapNewsletterForAdminDetail,
} from "../mappers/news.letter.mapper.js";
import {
  validationError,
  notFound,
  conflict,
} from "../utils/error.util.js";

function validateNewsletterData(data) {
  if (!data) validationError("data");
  if (!data.email) validationError("email");
}

export async function listNewsletters({
  search,
  isActive,
  limit = 10,
  page = 1,
} = {}) {
  const result = await newsletterRepo.findNewsletters({
    search,
    isActive,
    limit,
    page,
    sort: { createdAt: -1 },
  });

  return {
    data: mapNewslettersForAdminList(result.data),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  };
}

export async function getNewsletterById(newsletterId) {
  if (!newsletterId) validationError("newsletterId");

  const newsletter = await newsletterRepo.findNewsletterById(newsletterId);
  if (!newsletter) notFound("Newsletter");

  return mapNewsletterForAdminDetail(newsletter);
}

export async function subscribe(data) {
  validateNewsletterData(data);

  const email = data.email.toLowerCase().trim();
  const existing = await newsletterRepo.findNewsletterByEmail(email);

  if (existing) {
    if (!existing.isActive) {
      await newsletterRepo.updateNewsletterStatus(existing._id, true);

      eventEmitter.emit("newsletter:subscribed", {
        email,
        firstName: data.firstName || existing.firstName || "",
      });

      return { subscribed: true, reactivated: true };
    }
    return { subscribed: true, alreadySubscribed: true };
  }

  await newsletterRepo.createNewsletter({
    email,
    firstName: data.firstName || "",
    isActive: true,
    acceptance: data.acceptance ?? true,
  });

  eventEmitter.emit("newsletter:subscribed", {
    email,
    firstName: data.firstName || "",
  });

  return { subscribed: true };
}

export async function unsubscribe(email) {
  if (!email) validationError("email");

  const existing = await newsletterRepo.findNewsletterByEmail(email);
  if (!existing) notFound("Newsletter");

  await newsletterRepo.updateNewsletterStatus(existing._id, false);

  return { unsubscribed: true };
}

export async function updateNewsletterStatus(newsletterId, isActive) {
  if (!newsletterId) validationError("newsletterId");

  const updated = await newsletterRepo.updateNewsletterStatus(newsletterId, isActive);
  if (!updated) notFound("Newsletter");

  return mapNewsletterForAdminDetail(updated);
}

export async function deleteNewsletter(newsletterId) {
  if (!newsletterId) validationError("newsletterId");

  const deleted = await newsletterRepo.deleteNewsletterById(newsletterId);
  if (!deleted) notFound("Newsletter");

  return { deleted: true, id: newsletterId };
}

export async function getNewsletterStats() {
  const [total, active] = await Promise.all([
    newsletterRepo.countNewsletters(),
    newsletterRepo.countActiveNewsletters(),
  ]);

  return { total, active, inactive: total - active };
}

export default {
  listNewsletters,
  getNewsletterById,
  subscribe,
  unsubscribe,
  updateNewsletterStatus,
  deleteNewsletter,
  getNewsletterStats,
};