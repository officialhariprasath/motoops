"use client";

import { useEffect, useState } from "react";
import { DELETE_ACTIONS_UPDATED_EVENT } from "@/lib/delete-settings";

const SETTINGS_KEY = "garageSettings";

export function isPasswordEditingEnabled() {
  if (typeof window === "undefined") return false;

  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (!saved) return false;

    const settings = JSON.parse(saved);
    return settings?.passwordEditingEnabled === true;
  } catch {
    return false;
  }
}

export function usePasswordEditingEnabled() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const sync = () => setEnabled(isPasswordEditingEnabled());

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
