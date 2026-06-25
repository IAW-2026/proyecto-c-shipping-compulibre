"use client";

import { useEffect, useState } from "react";
import { useClerk } from "@clerk/nextjs";

export default function UnauthorizedClient({ email }: { email: string }) {
  const { signOut } = useClerk();
  const [seconds, setSeconds] = useState(3);

  useEffect(() => {
    if (seconds <= 0) {
      signOut({ redirectUrl: "/sign-in" });
      return;
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds, signOut]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#060d18",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Sora', sans-serif",
        padding: 24,
      }}
    >
      <div
        style={{
          background: "#0d1929",
          border: "1px solid #7f1d1d",
          borderRadius: 16,
          padding: "40px 48px",
          maxWidth: 440,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 16 }}>🚫</div>
        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#f8fafc",
            margin: "0 0 12px",
            letterSpacing: "-0.02em",
          }}
        >
          Access Denied
        </h1>
        <p style={{ fontSize: 14, color: "#94a3b8", margin: "0 0 8px", lineHeight: 1.6 }}>
          <strong style={{ color: "#f8fafc" }}>{email}</strong> does not have
          the{" "}
          <code
            style={{
              background: "#1e293b",
              padding: "1px 6px",
              borderRadius: 4,
              fontSize: 12,
              color: "#60a5fa",
            }}
          >
            admin
          </code>{" "}
          role required to access the Shipping Admin panel.
        </p>
        <p style={{ fontSize: 13, color: "#475569", margin: "0 0 28px" }}>
          Contact your system administrator to request access.
        </p>

        {/* Countdown */}
        <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 20px" }}>
          Signing you out in{" "}
          <span style={{ color: "#f87171", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
            {seconds}
          </span>
          …
        </p>

        {/* Manual sign out */}
        <button
          onClick={() => signOut({ redirectUrl: "/sign-in" })}
          style={{
            background: "transparent",
            border: "1px solid #334155",
            color: "#94a3b8",
            padding: "8px 24px",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 13,
            fontFamily: "inherit",
          }}
        >
          Sign out now
        </button>
      </div>
    </div>
  );
}
