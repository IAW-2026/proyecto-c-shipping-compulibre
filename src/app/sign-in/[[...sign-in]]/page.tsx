import { Suspense } from "react";
import AdminSignInForm from "./AdminSignInForm";

/**
 * Clerk sign-in UI mounted at /sign-in.
 * The [[...sign-in]] catch-all is required by Clerk's routing.
 *
 * Appearance is customised to match the dark CompuLibre theme.
 */
export default function SignInPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#060d18",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
        fontFamily: "'Sora', sans-serif",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            background: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
          }}
        >
          📦
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#f8fafc", letterSpacing: "-0.02em" }}>
            CompuLibre
          </div>
          <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Shipping Admin
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        <AdminSignInForm />
      </Suspense>
    </div>
  );
}
