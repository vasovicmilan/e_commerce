import { formatDateTime } from "../utils/date.time.util.js";

function translateDomain(domain) {
  const map = {
    item: "Proizvod",
    post: "Blog",
  };
  return map[domain] || domain;
}

function translateType(type) {
  const map = {
    color: "Boja",
    size: "Veličina",
    material: "Materijal",
    season: "Sezona",
    style: "Stil",
    collection: "Kolekcija",
    brand: "Brend",
    topic: "Tema",
    custom: "Prilagođeno",
  };
  return map[type] || type;
}

function translateActive(isActive) {
  return isActive ? "Aktivan" : "Neaktivan";
}

function translateIndexable(isIndexable) {
  return isIndexable ? "Dozvoljeno" : "Zabranjeno";
}

// 🔥 ZAŠTITA: provera da li tag i tag._id postoje
export function mapTagForAdminList(tag) {
  if (!tag || !tag._id) return null;

  return {
    id: tag._id.toString(),
    naziv: tag.name || "",
    slug: tag.slug || "",
    domen: translateDomain(tag.domain),
    tip: translateType(tag.type),
    tipRaw: tag.type,
    kratakOpis: tag.shortDescription || null,
    indeksiranje: translateIndexable(tag.isIndexable),
    aktivna: translateActive(tag.meta?.isActive),
    prioritet: tag.meta?.priority ?? 0,
    kreiran: formatDateTime(tag.createdAt),
  };
}

export function mapTagsForAdminList(tags = []) {
  return tags.map(mapTagForAdminList).filter(Boolean);
}

// 🔥 ZAŠTITA: provera da li tag i tag._id postoje
export function mapTagForAdminDetail(tag) {
  if (!tag || !tag._id) return null;

  return {
    id: tag._id.toString(),
    osnovno: {
      naziv: tag.name || "",
      slug: tag.slug || "",
      domen: translateDomain(tag.domain),
      domenRaw: tag.domain,
      tip: translateType(tag.type),
      tipRaw: tag.type,
      kratakOpis: tag.shortDescription || null,
      dugiOpis: tag.longDescription || null,
    },
    meta: {
      indeksiranje: translateIndexable(tag.isIndexable),
      prioritet: tag.meta?.priority ?? 0,
      aktivna: translateActive(tag.meta?.isActive),
    },
    vreme: {
      kreirano: formatDateTime(tag.createdAt),
      azurirano: formatDateTime(tag.updatedAt),
    },
  };
}

// 🔥 ZAŠTITA: provera da li tag i tag._id postoje
export function mapTagForPublic(tag) {
  if (!tag || !tag._id) return null;

  return {
    id: tag._id.toString(),
    naziv: tag.name || "",
    slug: tag.slug || "",
    domen: tag.domain || "",
    tip: tag.type || "",
    tipLabel: translateType(tag.type),
    kratakOpis: tag.shortDescription || null,
    slika: tag.featureImage?.img || null,
    slikaOpis: tag.featureImage?.imgDesc || null,
  };
}

export function mapTagsForPublic(tags = []) {
  return tags.map(mapTagForPublic).filter(Boolean);
}

// 🔥 ZAŠTITA: provera da li tag i tag._id postoje
export function mapTagForSelect(tag) {
  if (!tag || !tag._id) return null;

  return {
    id: tag._id.toString(),
    slug: tag.slug || "",
    naziv: tag.name || "",
    domen: tag.domain || "",
    tip: tag.type || "",
    tipNaziv: translateType(tag.type),
  };
}

export function mapTagsForSelect(tags = []) {
  return tags.map(mapTagForSelect).filter(Boolean);
}

// 🔥 ZAŠTITA: provera pre poziva mapTagForPublic
export function mapTagsGroupedForPublic(tags = []) {
  const grouped = {};

  for (const tag of tags) {
    // Provera da tag postoji i da ima _id
    if (!tag || !tag._id) continue;
    
    const mapped = mapTagForPublic(tag);
    if (!mapped) continue;

    const type = tag.type || "custom";
    if (!grouped[type]) {
      grouped[type] = [];
    }
    grouped[type].push(mapped);
  }

  return grouped;
}

export function mapTagRaw(tag) {
  return tag;
}

export default {
  mapTagForAdminList,
  mapTagsForAdminList,
  mapTagForAdminDetail,
  mapTagForPublic,
  mapTagsForPublic,
  mapTagForSelect,
  mapTagsForSelect,
  mapTagsGroupedForPublic,
  mapTagRaw,
};