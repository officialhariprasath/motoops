"use client";

import { useEffect } from "react";

/**
 * Quietly renews the access cookie while the dashboard is open so the user
 * is not bounced to login when the short-lived access token expires.
 */
export default function SessionKeepAlive() {
  useEffect(() => {
    let cancelled = false;

    const renew = async () => {
      try {
        await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
        });
      } catch {
        // Ignore — middleware will re-check on next navigation.
      }
    };

    // Renew about every 20 minutes while the tab is visible.
    const intervalMs = 20 * 60 * 1000;

    const timer = window.setInterval(() => {
      if (!cancelled && document.visibilityState === "visible") {
        void renew();
      }
    }, intervalMs);

    const onVisible = () => {
      if (document.visibilityState === "visible") void renew();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
