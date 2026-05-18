"use client";

import { useEffect, useState } from "react";
import { DELETE_ACTIONS_UPDATED_EVENT } from "@/lib/delete-settings";

const SETTINGS_KEY = "garageSettings";
const DEFAULT_PAGE_SIZE = 10;

export function getGaragePageSize() {
  if (typeof window === "undefined") return DEFAULT_PAGE_SIZE;

  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (!saved) return DEFAULT_PAGE_SIZE;

    const settings = JSON.parse(saved);
    const pageSize = Number(settings?.listPageSize ?? DEFAULT_PAGE_SIZE);

    if (!Number.isFinite(pageSize) || pageSize < 1) {
      return DEFAULT_PAGE_SIZE;
    }

    return pageSize;
  } catch {
    return DEFAULT_PAGE_SIZE;
  }
}

export function useGaragePageSize() {
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    const sync = () => setPageSize(getGaragePageSize());

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(DELETE_ACTIONS_UPDATED_EVENT, sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(DELETE_ACTIONS_UPDATED_EVENT, sync);
    };
  }, []);

  return pageSize;
}

