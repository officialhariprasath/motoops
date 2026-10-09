/** Shared list fetchers for React Query (same payload across screens). */

async function readJson(res: Response, fallbackMessage: string) {
  let json: any = null;
  try {
    json = await res.json();
  } catch {
    throw new Error("Invalid response from server");
  }
  if (!res.ok) {
    throw new Error(json?.message || fallbackMessage);
  }
  const rows = json?.data ?? json;
  return Array.isArray(rows) ? rows : [];
}

export async function fetchServicesList() {
  const res = await fetch("/api/services", { cache: "no-store" });
  return readJson(res, "Failed to load services");
}

export async function fetchInvoicesList() {
  const res = await fetch("/api/invoices", { cache: "no-store" });
  return readJson(res, "Failed to load invoices");
}

export async function fetchUsersList() {
  const res = await fetch("/api/user", { cache: "no-store" });
  return readJson(res, "Failed to load users");
}

export async function fetchVehiclesList() {
  const res = await fetch("/api/vehicles", { cache: "no-store" });
  return readJson(res, "Failed to load vehicles");
}

export async function fetchCatalogItems(all = false) {
  const url = all ? "/api/catalog/items?all=true" : "/api/catalog/items";
  const res = await fetch(url, { cache: "no-store" });
  return readJson(res, "Failed to load catalog");
}
