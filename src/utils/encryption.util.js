import { encrypt, decrypt, sha256 } from "../services/crypto.service.js";

export function encryptTelephone(plainValue) {
  const hash = sha256(plainValue);
  const value = encrypt(plainValue);
  return { value, hash };
}

export function encryptAddress(plainAddress) {
  const hash = sha256(
    `${plainAddress.street}|${plainAddress.number}|${plainAddress.city}|${plainAddress.postalCode}`
  );
  return {
    city: plainAddress.city,
    street: encrypt(plainAddress.street),
    number: encrypt(plainAddress.number),
    postalCode: plainAddress.postalCode,
    hash,
  };
}

export function encryptTelephones(telephones = []) {
  return telephones.map(encryptTelephone);
}

export function encryptAddresses(addresses = []) {
  return addresses.map(encryptAddress);
}

export function decryptTelephones(telephoneNumbers = []) {
  return telephoneNumbers.map((t) => ({
    id: t._id?.toString(),
    value: decrypt(t.value),
    hash: t.hash,
  }));
}

export function decryptAddresses(addresses = []) {
  return addresses.map((a) => ({
    id: a._id?.toString(),
    city: a.city,
    street: decrypt(a.street),
    number: decrypt(a.number),
    postalCode: a.postalCode,
    hash: a.hash,
  }));
}

export function hashTelephone(plainValue) {
  return sha256(plainValue);
}

export function hashAddress(plainAddress) {
  return sha256(
    `${plainAddress.street}|${plainAddress.number}|${plainAddress.city}|${plainAddress.postalCode}`
  );
}