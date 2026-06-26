export const ORDER_STATUS_TRANSITIONS = {
  pending: ["confirmed", "cancelled", "failed"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "returned"],
  delivered: ["returned", "completed"],     // ✅ može da pređe u completed ili returned
  completed: [],                            // ✅ finalno – nema daljih tranzicija
  cancelled: [],
  returned: ["refunded"],                   // povraćaj može da se refundira
  refunded: [],
  failed: [],
};

export const EDITABLE_CONTACT_STATUSES = ["pending", "confirmed", "processing"];

export const CANCELLABLE_STATUSES = ["pending", "confirmed", "processing"];

// Aktivni statusi – još uvek mogu da se menjaju (nisu finalni)
export const ACTIVE_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered"];

// Finalni statusi – proces je završen, više nema promena
export const FINAL_STATUSES = ["completed", "cancelled", "returned", "refunded", "failed"];

export function canTransition(from, to) {
  const allowed = ORDER_STATUS_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

export function getAllowedStatuses(status) {
  return ORDER_STATUS_TRANSITIONS[status] || [];
}

export function getStatusTimestampField(status) {
  const map = {
    confirmed: "confirmedAt",
    shipped: "shippedAt",
    delivered: "deliveredAt",
    completed: "completedAt",     // ✅ dodato
    cancelled: "cancelledAt",
    returned: "returnedAt",
    refunded: "refundedAt",
  };
  return map[status] || null;
}

export function isFinalStatus(status) {
  return FINAL_STATUSES.includes(status);
}

export function isActiveStatus(status) {
  return ACTIVE_STATUSES.includes(status);
}

export function canEditContactInfo(status) {
  return EDITABLE_CONTACT_STATUSES.includes(status);
}

export function isCancellable(status) {
  return CANCELLABLE_STATUSES.includes(status);
}