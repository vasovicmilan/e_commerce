import mongoose from "mongoose";

export function buildHistoryFilter({
  search,
  partnerId,
  type,
  fromDate,
  toDate,
  minAmount,
  maxAmount,
  ids,
} = {}) {
  const filter = {};

  // Pretraga po opisu
  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), "i");
    filter.$or = [
      { description: regex },
      // Možemo dodati i pretragu po partneru ako želimo, ali to je ObjectId pa ne može regex
    ];
  }

  // Filtriranje po partneru
  if (partnerId) {
    if (mongoose.Types.ObjectId.isValid(partnerId)) {
      filter.partnerId = new mongoose.Types.ObjectId(partnerId);
    }
  }

  // Filtriranje po tipu
  if (type) {
    filter.type = type;
  }

  // Datumski opseg (createdAt)
  if (fromDate) {
    const from = new Date(fromDate);
    if (!isNaN(from.getTime())) {
      filter.createdAt = { $gte: from };
    }
  }
  if (toDate) {
    const to = new Date(toDate);
    if (!isNaN(to.getTime())) {
      // Postavi na kraj dana
      to.setHours(23, 59, 59, 999);
      filter.createdAt = { ...filter.createdAt, $lte: to };
    }
  }

  // Iznos (amount)
  if (minAmount !== undefined && minAmount !== null) {
    const min = parseFloat(minAmount);
    if (!isNaN(min)) {
      filter.amount = { ...filter.amount, $gte: min };
    }
  }
  if (maxAmount !== undefined && maxAmount !== null) {
    const max = parseFloat(maxAmount);
    if (!isNaN(max)) {
      filter.amount = { ...filter.amount, $lte: max };
    }
  }

  // Filtriranje po ID-jevima
  if (ids && Array.isArray(ids) && ids.length > 0) {
    const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id)).map(id => new mongoose.Types.ObjectId(id));
    if (validIds.length) {
      filter._id = { $in: validIds };
    }
  }

  return filter;
}