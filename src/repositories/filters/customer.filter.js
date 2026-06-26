export function buildCustomerFilter({
  search,
  email,
  city,
  telephoneHash,
  addressHash,
  hasOrders,
  ids,
} = {}) {
  const filter = {};

  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), "i");
    filter.$or = [
      { email: regex },
      { firstName: regex },
      { lastName: regex },
    ];
  }

  if (email) {
    filter.email = email.toLowerCase().trim();
  }

  if (city) {
    filter["addresses.city"] = city;
  }

  if (telephoneHash) {
    filter["telephoneNumbers.hash"] = telephoneHash;
  }

  if (addressHash) {
    filter["addresses.hash"] = addressHash;
  }

  if (hasOrders === true) {
    filter["orders.0"] = { $exists: true };
  } else if (hasOrders === false) {
    filter.orders = { $size: 0 };
  }

  if (ids && Array.isArray(ids) && ids.length > 0) {
    filter._id = { $in: ids };
  }

  return filter;
}