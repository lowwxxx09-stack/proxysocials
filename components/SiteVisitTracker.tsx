"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const VISITOR_ID_KEY = "proxysocials_visitor_id";

function createVisitorId(): string {
  return crypto.randomUUID();
}

export default function SiteVisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    // Don't track admin pages, APIs, or framework routes.
    if (
      pathname.startsWith("/admin") ||
      pathname.startsWith("/api") ||
      pathname.startsWith("/_next") ||
      pathname.startsWith("/auth")
    ) {
      return;
    }

    try {
      let visitorId = localStorage.getItem(VISITOR_ID_KEY);

      if (!visitorId) {
        visitorId = createVisitorId();
        localStorage.setItem(VISITOR_ID_KEY, visitorId);
      }

      void fetch("/api/track-visit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          visitorId,
          pagePath: pathname,
        }),
        keepalive: true,
      }).catch(() => {
        // Analytics failures should never interrupt browsing.
      });
    } catch {
      // Tracking may be unavailable if browser storage is disabled.
    }
  }, [pathname]);

  return null;
}