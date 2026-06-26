import { formatDateTime, formatDate } from "../utils/date.time.util.js";

function getDisplayName(testimonial) {
  if (testimonial.displayName) return testimonial.displayName;
  if (testimonial.user && typeof testimonial.user === "object") {
    return `${testimonial.user.firstName || ""} ${testimonial.user.lastName || ""}`.trim() || "Anonimno";
  }
  return "Anonimno";
}

function getAvatar(testimonial) {
  if (testimonial.avatar) return testimonial.avatar;
  if (testimonial.user && typeof testimonial.user === "object") {
    return testimonial.user.avatar || null;
  }
  return null;
}

function renderStars(rating) {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

export function mapTestimonialsForAdminList(testimonials = []) {
  return testimonials
    .map((t) => {
      if (!t) return null;
      return {
        id: t._id.toString(),
        ime: getDisplayName(t),
        email: t.email || "",
        ocena: renderStars(t.rating),
        ocenaRaw: t.rating,
        naslov: t.title || "",
        komentar: t.comment?.substring(0, 100) || "",
        proizvod: t.product?.name || "",
        odobren: t.isApproved ? "Da" : "Ne",
        istaknut: t.isFeatured ? "Da" : "Ne",
        aktivan: t.isActive ? "Da" : "Ne",
        kreiran: formatDate(t.createdAt),
      };
    })
    .filter(Boolean);
}

export function mapTestimonialForAdminDetail(testimonial) {
  if (!testimonial) return null;

  return {
    id: testimonial._id.toString(),
    osnovno: {
      ime: getDisplayName(testimonial),
      email: testimonial.email || "",
      avatar: getAvatar(testimonial),
      ocena: testimonial.rating,
      ocenaZvezdice: renderStars(testimonial.rating),
      naslov: testimonial.title || "",
      komentar: testimonial.comment,
    },
    proizvod: testimonial.product?.itemId
      ? {
          itemId: testimonial.product.itemId.toString(),
          naziv: testimonial.product.name || "",
          slug: testimonial.product.slug || "",
        }
      : null,
    korisnik: testimonial.user
      ? {
          userId: typeof testimonial.user === "object" ? testimonial.user._id?.toString() : testimonial.user.toString(),
          ime: typeof testimonial.user === "object" ? `${testimonial.user.firstName} ${testimonial.user.lastName}` : "",
        }
      : null,
    status: {
      odobren: testimonial.isApproved,
      odobrenAt: testimonial.approvedAt ? formatDateTime(testimonial.approvedAt) : null,
      odobrio: testimonial.approvedBy?.toString() || null,
      istaknut: testimonial.isFeatured,
      aktivan: testimonial.isActive,
    },
    vreme: {
      kreirano: formatDateTime(testimonial.createdAt),
      azurirano: formatDateTime(testimonial.updatedAt),
    },
  };
}

export function mapTestimonialForPublic(testimonial) {
  if (!testimonial) return null;

  return {
    id: testimonial._id.toString(),
    ime: getDisplayName(testimonial),
    avatar: getAvatar(testimonial),
    ocena: testimonial.rating,
    ocenaZvezdice: renderStars(testimonial.rating),
    naslov: testimonial.title || "",
    komentar: testimonial.comment,
    proizvod: testimonial.product?.name || "",
    proizvodSlug: testimonial.product?.slug || "",
    datum: formatDate(testimonial.createdAt),
  };
}

export function mapTestimonialsForPublic(testimonials = []) {
  return testimonials.map(mapTestimonialForPublic).filter(Boolean);
}

export function mapTestimonialRaw(testimonial) {
  return testimonial;
}

export default {
  mapTestimonialsForAdminList,
  mapTestimonialForAdminDetail,
  mapTestimonialForPublic,
  mapTestimonialsForPublic,
  mapTestimonialRaw,
};