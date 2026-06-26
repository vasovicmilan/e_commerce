import { formatDateTime } from "../utils/date.time.util.js";

function getParentName(category) {
  if (!category.parent) return null;
  if (typeof category.parent === "object" && category.parent !== null) {
    return category.parent.name || null;
  }
  return null;
}

function getParentId(category) {
  if (!category.parent) return null;
  if (typeof category.parent === "object" && category.parent !== null) {
    return category.parent._id?.toString() || null;
  }
  return category.parent.toString();
}

function translateDomain(domain) {
  const map = {
    item: "Proizvod",
    post: "Blog",
  };
  return map[domain] || domain;
}

function translateActive(isActive) {
  return isActive ? "Aktivan" : "Neaktivan";
}

function translateIndexable(isIndexable) {
  return isIndexable ? "Dozvoljeno" : "Zabranjeno";
}

export function mapCategoryForAdminList(category) {
  if (!category) return null;

  return {
    id: category._id.toString(),
    naziv: category.name,
    slug: category.slug,
    domen: translateDomain(category.domain),
    parentNaziv: getParentName(category),
    kratakOpis: category.shortDescription || null,
    indeksiranje: translateIndexable(category.isIndexable),
    aktivna: translateActive(category.meta?.isActive),
    prioritet: category.meta?.priority ?? 0,
    kreirana: formatDateTime(category.createdAt),
    // 🔥 DODATO: slika sa punom putanjom za admin listu
    slika: category.featureImage?.img ? `/images/categories/${category.featureImage.img}` : null,
  };
}

export function mapCategoriesForAdminList(categories = []) {
  return categories.map(mapCategoryForAdminList).filter(Boolean);
}

export function mapCategoryForAdminDetail(category) {
  if (!category) return null;

  return {
    id: category._id.toString(),
    osnovno: {
      naziv: category.name,
      slug: category.slug,
      domen: translateDomain(category.domain),
      domenRaw: category.domain,
      parentId: getParentId(category),
      parentNaziv: getParentName(category),
      kratakOpis: category.shortDescription || null,
      dugiOpis: category.longDescription || null,
    },
    slika: category.featureImage?.img
      ? {
          url: category.featureImage.img,
          opis: category.featureImage.imgDesc || null,
        }
      : null,
    meta: {
      indeksiranje: translateIndexable(category.isIndexable),
      prioritet: category.meta?.priority ?? 0,
      aktivna: translateActive(category.meta?.isActive),
    },
    vreme: {
      kreirano: formatDateTime(category.createdAt),
      azurirano: formatDateTime(category.updatedAt),
    },
  };
}

export function mapCategoryForPublic(category) {
  if (!category) return null;

  return {
    id: category._id.toString(),
    naziv: category.name,
    slug: category.slug,
    domen: category.domain,
    kratakOpis: category.shortDescription || null,
    slika: category.featureImage?.img || null,
    slikaOpis: category.featureImage?.imgDesc || null,
  };
}

export function mapCategoriesForPublic(categories = []) {
  return categories.map(mapCategoryForPublic).filter(Boolean);
}

export function mapCategoryForSelect(category) {
  if (!category) return null;

  return {
    id: category._id.toString(),
    slug: category.slug,
    naziv: category.name,
    domen: category.domain,
  };
}

export function mapCategoriesForSelect(categories = []) {
  return categories.map(mapCategoryForSelect).filter(Boolean);
}

export function mapCategoryRaw(category) {
  return category;
}

export default {
  mapCategoryForAdminList,
  mapCategoriesForAdminList,
  mapCategoryForAdminDetail,
  mapCategoryForPublic,
  mapCategoriesForPublic,
  mapCategoryForSelect,
  mapCategoriesForSelect,
  mapCategoryRaw,
};