"use client";

import { useEffect, useState } from "react";

export const DELETE_ACTIONS_SETTING_KEY = "garageSettings";
export const DELETE_ACTIONS_UPDATED_EVENT = "garage-settings-updated";

export function areDeleteActionsEnabled() {
  if (typeof window === "undefined") return false;

  try {
    const saved = localStorage.getItem(DELETE_ACTIONS_SETTING_KEY);
    if (!saved) return false;

    const settings = JSON.parse(saved);
    return settings?.deleteActionsEnabled === true;
  } catch {
    return false;
  }
}

export function useDeleteActionsEnabled() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const sync = () => setEnabled(areDeleteActionsEnabled());

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(DELETE_ACTIONS_UPDATED_EVENT, sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(DELETE_ACTIONS_UPDATED_EVENT, sync);
    };
  }, []);

  return enabled;
}
