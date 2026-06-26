import { decrypt } from "../services/crypto.service.js";
import { formatDateTime, formatDate } from "../utils/date.time.util.js";

function translateStatus(status) {
  const map = {
    new: "Novi",
    read: "Pročitan",
    replied: "Odgovoren",
    archived: "Arhiviran",
  };
  return map[status] || status;
}

function decryptMessage(message) {
  if (!message) return "";
  try {
    return decrypt(message);
  } catch {
    return message;
  }
}

function decryptTelephone(telephone) {
  if (!telephone) return "";
  try {
    return decrypt(telephone);
  } catch {
    return telephone;
  }
}

export function mapContactsForAdminList(contacts = []) {
  return contacts
    .map((contact) => {
      if (!contact) return null;

      return {
        id: contact._id.toString(),
        ime: contact.firstName,
        email: contact.email,
        naslov: contact.title,
        status: translateStatus(contact.status),
        statusRaw: contact.status,
        datum: formatDate(contact.createdAt),
      };
    })
    .filter(Boolean);
}

export function mapContactForAdminDetail(contact) {
  if (!contact) return null;

  return {
    id: contact._id.toString(),
    osnovno: {
      ime: contact.firstName,
      email: contact.email,
      telefon: decryptTelephone(contact.telephoneNumber),
      naslov: contact.title,
      status: translateStatus(contact.status),
      statusRaw: contact.status,
      prihvaćeno: contact.acceptance ? "Da" : "Ne",
    },
    poruka: decryptMessage(contact.message),
    vreme: {
      kreirano: formatDateTime(contact.createdAt),
      ažurirano: formatDateTime(contact.updatedAt),
    },
  };
}

export function mapContactRaw(contact) {
  return contact;
}

export default {
  mapContactsForAdminList,
  mapContactForAdminDetail,
  mapContactRaw,
};