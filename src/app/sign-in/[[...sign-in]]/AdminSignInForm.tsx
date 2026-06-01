"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

function getSafeRedirectUrl(rawRedirectUrl: string | null) {
  const fallbackUrl = "/admin/shipments";

  if (!rawRedirectUrl) {
    return fallbackUrl;
  }

  if (rawRedirectUrl.startsWith("/") && !rawRedirectUrl.startsWith("//")) {
    return rawRedirectUrl;
  }

  try {
    const parsed = new URL(rawRedirectUrl, window.location.origin);

    if (parsed.origin !== window.location.origin) {
      return fallbackUrl;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallbackUrl;
  }
}

function getClerkErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "errors" in error &&
    Array.isArray(error.errors) &&
    error.errors.length > 0
  ) {
    const clerkError = error.errors[0] as {
      longMessage?: string;
      message?: string;
    };

    return clerkError.longMessage ?? clerkError.message ?? "Unable to sign in.";
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "longMessage" in error &&
    typeof error.longMessage === "string"
  ) {
    return error.longMessage;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Unable to sign in. Check the email and password, then try again.";
}

export default function AdminSignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fetchStatus, signIn } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectUrl = useMemo(
    () => getSafeRedirectUrl(searchParams.get("redirect_url")),
    [searchParams],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!signIn || fetchStatus === "fetching" || isSubmitting) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const { error: passwordError } = await signIn.password({
        identifier: email,
        password,
      });

      if (passwordError) {
        setError(getClerkErrorMessage(passwordError));
        return;
      }

      if (signIn.status !== "complete") {
        setError(
          "This account requires an additional sign-in step that is not enabled on this admin page.",
        );
        return;
      }

      const { error: finalizeError } = await signIn.finalize();

      if (finalizeError) {
        setError(getClerkErrorMessage(finalizeError));
        return;
      }

      router.push(redirectUrl);
    } catch (caughtError) {
      setError(getClerkErrorMessage(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#060d18",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
        padding: 24,
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Image
          src="/compuLibre-logo.png"
          alt="CompuLibre"
          width={44}
          height={44}
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            objectFit: "cover",
          }}
        />
        <div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#f8fafc",
            }}
          >
            CompuLibre
          </div>
          <div
            style={{
              fontSize: 11,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Shipping Admin
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          width: "min(100%, 400px)",
          background: "#0d1929",
          border: "1px solid #1e293b",
          borderRadius: 10,
          boxShadow: "0 24px 64px #00000088",
          padding: 28,
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              color: "#f8fafc",
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            Admin sign in
          </h1>
          <p
            style={{
              margin: "8px 0 0",
              color: "#94a3b8",
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            Use your admin email and password to continue.
          </p>
        </div>

        <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ color: "#cbd5e1", fontSize: 13, fontWeight: 600 }}>
            Email
          </span>
          <input
            required
            autoComplete="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            style={{
              height: 44,
              borderRadius: 8,
              border: "1px solid #334155",
              background: "#0f172a",
              color: "#f8fafc",
              padding: "0 12px",
              fontSize: 15,
              outline: "none",
            }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ color: "#cbd5e1", fontSize: 13, fontWeight: 600 }}>
            Password
          </span>
          <input
            required
            autoComplete="current-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            style={{
              height: 44,
              borderRadius: 8,
              border: "1px solid #334155",
              background: "#0f172a",
              color: "#f8fafc",
              padding: "0 12px",
              fontSize: 15,
              outline: "none",
            }}
          />
        </label>

        {error ? (
          <div
            role="alert"
            style={{
              borderRadius: 8,
              border: "1px solid #7f1d1d",
              background: "#450a0a",
              color: "#fecaca",
              padding: "10px 12px",
              fontSize: 13,
              lineHeight: 1.45,
            }}
          >
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={!signIn || fetchStatus === "fetching" || isSubmitting}
          style={{
            height: 44,
            border: 0,
            borderRadius: 8,
            background:
              !signIn || fetchStatus === "fetching" || isSubmitting
                ? "#1e3a8a"
                : "#3b82f6",
            color: "#ffffff",
            cursor:
              !signIn || fetchStatus === "fetching" || isSubmitting
                ? "not-allowed"
                : "pointer",
            fontSize: 15,
            fontWeight: 700,
          }}
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
