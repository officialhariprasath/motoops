const SETTINGS_KEY = "garageSettings";

export async function fetchGarageSettings(): Promise<Record<string, any> | null> {
  try {
    const res = await fetch("/api/garage-settings", { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function saveGarageSettingsRemote(
  settings: Record<string, any>,
): Promise<Record<string, any>> {
  const res = await fetch("/api/garage-settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!res.ok) {
    throw new Error("Failed to save garage settings");
  }
  return res.json();
}

export function cacheGarageSettingsLocally(settings: Record<string, any>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

/** Sync remote settings into localStorage for print/estimate helpers. */
export async function syncGarageSettingsCache() {
  const remote = await fetchGarageSettings();
  if (remote) cacheGarageSettingsLocally(remote);
  return remote;
}
