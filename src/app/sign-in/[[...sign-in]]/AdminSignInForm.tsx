"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useSignIn as useLegacySignIn } from "@clerk/nextjs/legacy";
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

type SecondFactor =
  | { strategy: "email_code"; id?: string; label: string }
  | { strategy: "phone_code"; id?: string; label: string }
  | { strategy: "totp"; label: string }
  | { strategy: "backup_code"; label: string };

export default function AdminSignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const { isLoaded: isSignInLoaded, signIn, setActive } = useLegacySignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secondFactor, setSecondFactor] = useState<SecondFactor | null>(null);
  const [secondFactorCode, setSecondFactorCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectUrl = useMemo(
    () => getSafeRedirectUrl(searchParams.get("redirect_url")),
    [searchParams],
  );

  useEffect(() => {
  if (!auth.isLoaded || !auth.isSignedIn) {
    return;
  }

  const roles =
    auth.sessionClaims?.metadata as
      | { role?: string; roles?: string[] }
      | undefined;

  const isAdmin =
    roles?.roles?.includes("admin") ||
    roles?.role === "admin";

  if (isAdmin) {
    router.replace(redirectUrl);
    return;
  }

  router.replace("/unauthorized");
  }, [auth, redirectUrl, router]);

  async function activateCompletedSignIn(sessionId: string) {
    if (!setActive) {
      setError("Clerk is still loading. Try signing in again.");
      return;
    }

    await setActive({ session: sessionId });
    router.push(redirectUrl);
  }

  async function startSecondFactor() {
    if (!signIn) {
      setError("Clerk is still loading. Try signing in again.");
      return;
    }

    const factors = signIn.supportedSecondFactors ?? [];
    const emailFactor = factors.find((factor) => factor.strategy === "email_code");
    const phoneFactor = factors.find((factor) => factor.strategy === "phone_code");
    const totpFactor = factors.find((factor) => factor.strategy === "totp");
    const backupCodeFactor = factors.find((factor) => factor.strategy === "backup_code");

    if (emailFactor && "emailAddressId" in emailFactor) {
      await signIn.prepareSecondFactor({
        strategy: "email_code",
        emailAddressId: emailFactor.emailAddressId,
      });
      setSecondFactor({
        strategy: "email_code",
        id: emailFactor.emailAddressId,
        label: `Enter the confirmation code sent to ${emailFactor.safeIdentifier}.`,
      });
      return;
    }

    if (phoneFactor && "phoneNumberId" in phoneFactor) {
      await signIn.prepareSecondFactor({
        strategy: "phone_code",
        phoneNumberId: phoneFactor.phoneNumberId,
      });
      setSecondFactor({
        strategy: "phone_code",
        id: phoneFactor.phoneNumberId,
        label: `Enter the confirmation code sent to ${phoneFactor.safeIdentifier}.`,
      });
      return;
    }

    if (totpFactor) {
      setSecondFactor({
        strategy: "totp",
        label: "Enter the code from your authenticator app.",
      });
      return;
    }

    if (backupCodeFactor) {
      setSecondFactor({
        strategy: "backup_code",
        label: "Enter one of your backup codes.",
      });
      return;
    }

    setError("This account requires a second sign-in step that is not supported on this admin page.");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isSignInLoaded || isSubmitting) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      let result = await signIn.create({
        identifier: email,
      });

      if (result.status === "needs_first_factor") {
        const canUsePassword = result.supportedFirstFactors?.some(
          (factor) => factor.strategy === "password",
        );

        if (!canUsePassword) {
          setError(
            "This account does not have password sign-in enabled. Set a password for this Clerk user or use Continue with Google.",
          );
          return;
        }

        result = await signIn.attemptFirstFactor({
          strategy: "password",
          password,
        });
      }

      if (result.status !== "complete" || !result.createdSessionId) {
        if (result.status === "needs_second_factor") {
          await startSecondFactor();
          return;
        }

        if (result.status === "needs_new_password") {
          setError(
            "This account needs a password reset before it can sign in here.",
          );
          return;
        }

        setError(
          "This account requires an additional sign-in step that is not enabled on this admin page.",
        );
        return;
      }

      await activateCompletedSignIn(result.createdSessionId);
    } catch (caughtError) {
      setError(getClerkErrorMessage(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSecondFactorSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isSignInLoaded || !secondFactor || isSubmitting) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const result = await signIn.attemptSecondFactor({
        strategy: secondFactor.strategy,
        code: secondFactorCode,
      });

      if (result.status !== "complete" || !result.createdSessionId) {
        setError("The confirmation code was accepted, but sign-in did not complete.");
        return;
      }

      await activateCompletedSignIn(result.createdSessionId);
    } catch (caughtError) {
      setError(getClerkErrorMessage(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    if (!isSignInLoaded || isSubmitting) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: redirectUrl,
        continueSignIn: true,
      });
    } catch (caughtError) {
      setError(getClerkErrorMessage(caughtError));
      setIsSubmitting(false);
    }
  }

  const isDisabled = !isSignInLoaded || isSubmitting;
  const formSubmitHandler = secondFactor ? handleSecondFactorSubmit : handleSubmit;

  if (!auth.isLoaded || auth.isSignedIn) {
    return (
      <div
        style={{
          width: "min(100%, 400px)",
          background: "#0d1929",
          border: "1px solid #1e293b",
          borderRadius: 10,
          boxShadow: "0 24px 64px #00000088",
          padding: 28,
          color: "#94a3b8",
          fontSize: 14,
          textAlign: "center",
        }}
      >
        Preparing sign in...
      </div>
    );
  }

  return (
    <form
      onSubmit={formSubmitHandler}
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
        {secondFactor ? (
          <>
            <div>
              <h1
                style={{
                  margin: 0,
                  color: "#f8fafc",
                  fontSize: 24,
                  fontWeight: 700,
                }}
              >
                Verification code
              </h1>
              <p
                style={{
                  margin: "8px 0 0",
                  color: "#94a3b8",
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                {secondFactor.label}
              </p>
            </div>

            <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ color: "#cbd5e1", fontSize: 13, fontWeight: 600 }}>
                Code
              </span>
              <input
                required
                autoComplete="one-time-code"
                inputMode="numeric"
                type="text"
                value={secondFactorCode}
                onChange={(event) => setSecondFactorCode(event.target.value)}
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
          </>
        ) : (
          <>
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
          </>
        )}

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
          disabled={isDisabled}
          style={{
            height: 44,
            border: 0,
            borderRadius: 8,
            background: isDisabled ? "#1e3a8a" : "#3b82f6",
            color: "#ffffff",
            cursor: isDisabled ? "not-allowed" : "pointer",
            fontSize: 15,
            fontWeight: 700,
          }}
        >
          {isSubmitting
            ? "Signing in..."
            : secondFactor
              ? "Verify code"
              : "Sign in"}
        </button>

        {!secondFactor ? (
          <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              color: "#64748b",
              fontSize: 12,
            }}
          >
            <span style={{ flex: 1, height: 1, background: "#1e293b" }} />
            <span>or</span>
            <span style={{ flex: 1, height: 1, background: "#1e293b" }} />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isDisabled}
            style={{
              height: 44,
              borderRadius: 8,
              border: "1px solid #334155",
              background: isDisabled ? "#111827" : "#0f172a",
              color: "#f8fafc",
              cursor: isDisabled ? "not-allowed" : "pointer",
              fontSize: 15,
              fontWeight: 700,
            }}
          >
            Continue with Google
          </button>
          </>
        ) : null}
    </form>
  );
}
