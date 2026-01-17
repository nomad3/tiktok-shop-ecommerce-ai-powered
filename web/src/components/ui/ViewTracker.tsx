"use client";

import { useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    // Get or create session ID
    let sessionId = sessionStorage.getItem("view_session");
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem("view_session", sessionId);
    }

    // Check if we already tracked this product this session
    const viewedKey = `viewed_${slug}`;
    if (sessionStorage.getItem(viewedKey)) {
      return; // Don't double-count
    }

    // Record the view
    fetch(`${API_URL}/admin/products/${slug}/view?session_id=${sessionId}`, {
      method: "POST"
    })
      .then(() => {
        sessionStorage.setItem(viewedKey, "true");
      })
      .catch(() => {
        // Silently fail - analytics shouldn't break the page
      });
  }, [slug]);

  return null; // This component doesn't render anything
}
