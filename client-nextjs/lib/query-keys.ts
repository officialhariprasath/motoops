/** Shared React Query keys so screens reuse the same cached lists. */

export const queryKeys = {
  servicesList: ["services", "list"] as const,
  invoicesList: ["invoices", "list"] as const,
  usersList: ["users", "list"] as const,
  vehiclesList: ["vehicles", "list"] as const,
  catalogItems: ["catalog", "items"] as const,
  catalogItemsActive: ["catalog", "items", "active"] as const,
};

export const STALE = {
  /** Job cards / invoices lists */
  listsMs: 1000 * 60 * 3,
  /** Users / catalog / vehicles */
  referenceMs: 1000 * 60 * 10,
};
