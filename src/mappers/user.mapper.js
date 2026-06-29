import { formatDateTime, formatDate } from "../utils/date.time.util.js";
import { decryptTelephones, decryptAddresses } from "../utils/encryption.util.js";

function translateRole(role) {
  if (!role) return "Korisnik";
  if (typeof role === "object" && role.name) return role.name;
  const map = { user: "Korisnik", partner: "Partner", moderator: "Moderator", admin: "Administrator" };
  return map[role] || role;
}

function translateStatus(status) {
  const map = { pending: "Na čekanju", active: "Aktivan", inactive: "Neaktivan", suspended: "Suspendovan" };
  return map[status] || status;
}

function translateProvider(provider) {
  const map = { local: "Email/Lozinka", google: "Google" };
  return map[provider] || provider;
}

function translateConfirmed(confirmed) {
  return confirmed ? "Potvrđen" : "Nepotvrđen";
}

function countOrders(orders = []) {
  return orders.length;
}

export function mapUserForAdminList(user) {
  if (!user) return null;

  return {
    id: user._id.toString(),
    email: user.email,
    ime: user.firstName,
    prezime: user.lastName,
    rola: translateRole(user.role),
    rolaRaw: typeof user.role === "object" ? user.role._id?.toString() : user.role,
    status: translateStatus(user.status),
    statusRaw: user.status,
    provider: translateProvider(user.provider),
    potvrđen: translateConfirmed(user.confirmed),
    partner: user.partner?.isPartner ? "Da" : "Ne",
    brojPorudzbina: countOrders(user.orders),
    poslednjiLogin: user.lastLogin ? formatDateTime(user.lastLogin) : "Nikad",
    kreiran: formatDate(user.createdAt),
  };
}

export function mapUsersForAdminList(users = []) {
  return users.map(mapUserForAdminList).filter(Boolean);
}

export function mapUserForAdminDetail(user) {
  if (!user) return null;

  return {
    id: user._id.toString(),
    osnovno: {
      email: user.email,
      ime: user.firstName,
      prezime: user.lastName,
      avatar: user.avatar || null,
      rola: translateRole(user.role),
      rolaRaw: typeof user.role === "object" ? user.role._id?.toString() : user.role,
      rolaPermisije: typeof user.role === "object" ? (user.role.permissions || []) : [],
      status: translateStatus(user.status),
      statusRaw: user.status,
      provider: translateProvider(user.provider),
      providerRaw: user.provider,
      potvrđen: translateConfirmed(user.confirmed),
      potvrđenRaw: user.confirmed,
      prihvaćeno: user.acceptance ? "Da" : "Ne",
      googleId: user.googleId || null,
    },
    kontakt: {
      telefoni: decryptTelephones(user.telephoneNumbers),
      adrese: decryptAddresses(user.addresses),
    },
    porudzbine: {
      ukupno: countOrders(user.orders),
      ids: user.orders?.map((o) => o.toString()) || [],
    },
    partner: user.partner?.isPartner
      ? {
          isPartner: true,
          slug: user.partner.slug || null,
          shopStatus: user.partner.shop?.status || false,
          shopLogo: user.partner.shop?.logo || null,
          shopColors: user.partner.shop?.colors || [],
          shopFonts: user.partner.shop?.fonts || [],
          novčanik: user.partner.wallet || 0,
          rank: {
            poeni: user.partner.rank?.points || 0,
            popust: `${user.partner.rank?.discount || 0}%`,
            nivo: user.partner.rank?.level || 0,
            maxPonuda: user.partner.rank?.maxOffers || 1,
          },
          affiliatePonude: (user.partner.affiliateOffers || []).map((a) => ({
            itemId: a.itemId?.toString(),
            kod: a.affiliateCode,
            prodato: a.soldCount,
          })),
        }
      : null,
    vreme: {
      kreirano: formatDateTime(user.createdAt),
      ažurirano: formatDateTime(user.updatedAt),
      poslednjiLogin: user.lastLogin ? formatDateTime(user.lastLogin) : null,
    },
  };
}

export function mapUserForEdit(user) {
  if (!user) return null;

  return {
    id: user._id.toString(),
    email: user.email,
    ime: user.firstName,
    prezime: user.lastName,
    rola: typeof user.role === "object" ? user.role._id?.toString() : user.role,
    status: user.status,
    provider: user.provider,
    potvrđen: user.confirmed,
    prihvaćeno: user.acceptance,
    partner: user.partner?.isPartner || false,
    slug: user.partner?.slug || null,
  };
}

export function mapMyProfile(user) {
  if (!user) return null;

  return {
    id: user._id.toString(),
    osnovno: {
      email: user.email,
      ime: user.firstName,
      prezime: user.lastName,
      avatar: user.avatar || null,
      provider: translateProvider(user.provider),
      rola: translateRole(user.role),
    },
    kontakt: {
      telefoni: decryptTelephones(user.telephoneNumbers),
      adrese: decryptAddresses(user.addresses),
    },
    porudzbine: user.orders?.map((o) => ({
      id: o._id?.toString(),
      status: o.status, // raw status string
      ukupno: o.totalPrice || 0, // ✅ popravljeno: totalPrice umesto total
      kreirana: o.createdAt ? formatDateTime(o.createdAt) : null,
    })) || [],
    partner: user.partner?.isPartner
      ? { shopAktivan: user.partner.shop?.status || false, logo: user.partner.shop?.logo || null, novčanik: user.partner.wallet || 0 }
      : null,
    vreme: { članOd: formatDate(user.createdAt), poslednjiLogin: user.lastLogin ? formatDateTime(user.lastLogin) : null },
  };
}

export function mapUserCheckoutProfile(user) {
  if (!user) return null;

  return {
    email: user.email,
    ime: user.firstName,
    prezime: user.lastName,
    telefoni: decryptTelephones(user.telephoneNumbers).map((t) => ({ id: t.id, value: t.value })),
    adrese: decryptAddresses(user.addresses).map((a) => ({
      id: a.id, city: a.city, street: a.street, number: a.number, postalCode: a.postalCode,
      punaAdresa: `${a.street} ${a.number}, ${a.postalCode} ${a.city}`,
    })),
  };
}

export function mapMyShop(user) {
  if (!user || !user.partner) return null;
  const partner = user.partner;

  return {
    shop: { aktivan: partner.shop?.status || false, logo: partner.shop?.logo || null, boje: partner.shop?.colors || [], fontovi: partner.shop?.fonts || [] },
    novčanik: partner.wallet || 0,
    rank: { poeni: partner.rank?.points || 0, popust: partner.rank?.discount || 0, nivo: partner.rank?.level || 0, maxPonuda: partner.rank?.maxOffers || 1 },
    affiliate: (partner.affiliateOffers || []).map((a) => ({ itemId: a.itemId?.toString(), kod: a.affiliateCode, prodato: a.soldCount })),
  };
}

export function mapUserForPublic(user) {
  if (!user) return null;
  return { id: user._id.toString(), ime: user.firstName, prezime: user.lastName, avatar: user.avatar || null };
}

export function mapUsersForPublic(users = []) {
  return users.map(mapUserForPublic).filter(Boolean);
}

export function mapUserRaw(user) {
  return user;
}

export default {
  mapUserForAdminList, mapUsersForAdminList, mapUserForAdminDetail, mapUserForEdit,
  mapMyProfile, mapUserCheckoutProfile, mapMyShop,
  mapUserForPublic, mapUsersForPublic, mapUserRaw,
};