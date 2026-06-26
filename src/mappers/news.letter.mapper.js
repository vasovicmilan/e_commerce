import { formatDateTime, formatDate } from "../utils/date.time.util.js";

export function mapNewslettersForAdminList(newsletters = []) {
  return newsletters
    .map((n) => {
      if (!n) return null;
      return {
        id: n._id.toString(),
        email: n.email,
        ime: n.firstName || "Nepoznato",
        aktivan: n.isActive ? "Da" : "Ne",
        isActiveRaw: n.isActive,
        prihvaćeno: n.acceptance ? "Da" : "Ne",
        kreiran: formatDate(n.createdAt),
      };
    })
    .filter(Boolean);
}

export function mapNewsletterForAdminDetail(newsletter) {
  if (!newsletter) return null;

  return {
    id: newsletter._id.toString(),
    osnovno: {
      email: newsletter.email,
      ime: newsletter.firstName || "",
      aktivan: newsletter.isActive,
      prihvaćeno: newsletter.acceptance,
    },
    vreme: {
      kreirano: formatDateTime(newsletter.createdAt),
      ažurirano: formatDateTime(newsletter.updatedAt),
    },
  };
}

export function mapNewsletterRaw(newsletter) {
  return newsletter;
}

export default {
  mapNewslettersForAdminList,
  mapNewsletterForAdminDetail,
  mapNewsletterRaw,
};