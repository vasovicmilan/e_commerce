import { formatDateTime } from "../utils/date.time.util.js";
import { decryptTelephones, decryptAddresses } from "../utils/encryption.util.js";

function countOrders(orders = []) {
  return orders.length;
}

export function mapCustomerForAdminList(customer) {
  if (!customer) return null;

  return {
    id: customer._id.toString(),
    email: customer.email,
    ime: customer.firstName,
    prezime: customer.lastName,
    brojTelefona: customer.telephoneNumbers?.length || 0,
    brojAdresa: customer.addresses?.length || 0,
    brojPorudzbina: countOrders(customer.orders),
    kreiran: formatDateTime(customer.createdAt),
  };
}

export function mapCustomersForAdminList(customers = []) {
  return customers.map(mapCustomerForAdminList).filter(Boolean);
}

export function mapCustomerForAdminDetail(customer) {
  if (!customer) return null;

  return {
    id: customer._id.toString(),
    osnovno: {
      email: customer.email,
      ime: customer.firstName,
      prezime: customer.lastName,
      prihvaceno: customer.acceptance ? "Da" : "Ne",
    },
    telefoni: decryptTelephones(customer.telephoneNumbers),
    adrese: decryptAddresses(customer.addresses),
    porudzbine: {
      ukupno: countOrders(customer.orders),
      ids: customer.orders?.map((o) => o.toString()) || [],
    },
    vreme: {
      kreirano: formatDateTime(customer.createdAt),
      azurirano: formatDateTime(customer.updatedAt),
    },
  };
}

export function mapCustomerForMigration(customer) {
  if (!customer) return null;

  return {
    id: customer._id.toString(),
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    telephoneNumbers: decryptTelephones(customer.telephoneNumbers),
    addresses: decryptAddresses(customer.addresses),
    orders: customer.orders?.map((o) => o.toString()) || [],
  };
}

export function mapCustomerRaw(customer) {
  return customer;
}

export default {
  mapCustomerForAdminList,
  mapCustomersForAdminList,
  mapCustomerForAdminDetail,
  mapCustomerForMigration,
  mapCustomerRaw,
};