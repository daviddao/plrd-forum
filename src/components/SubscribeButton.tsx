"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Follow a publication via site.standard.graph.subscription — the
 * standard.site follow relationship, interoperable with leaflet.pub
 * subscriptions. Styled like the profile sidebar's action link.
 */
export function SubscribeButton({
  publication,
  initialSubscribed,
  initialCount,
}: {
  publication: string;
  initialSubscribed: boolean;
  initialCount: number;
}) {
  const router = useRouter();
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publication }),
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) return;
      const data = (await res.json()) as { subscribed: boolean };
      setSubscribed(data.subscribed);
      setCount((c) => c + (data.subscribed ? 1 : -1));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className="sidebar-action"
      style={{
        cursor: "pointer",
        background: "none",
        border: "none",
        padding: 0,
        font: "inherit",
        textAlign: "left",
      }}
      title={
        subscribed
          ? "Unsubscribe (site.standard.graph.subscription)"
          : "Subscribe to this publication"
      }
    >
      {subscribed ? "Subscribed" : "Subscribe"}
      {count > 0 && <span style={{ opacity: 0.6 }}> · {count}</span>}
    </button>
  );
}
