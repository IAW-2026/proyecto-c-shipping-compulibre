import { SignIn } from "@clerk/nextjs";

/**
 * Clerk's hosted sign-in UI mounted at /sign-in.
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

      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl={undefined}          // disable self-registration
        fallbackRedirectUrl="/admin/shipments"
        appearance={{
          variables: {
            colorPrimary: "#3b82f6",
            colorBackground: "#0d1929",
            colorInputBackground: "#0f172a",
            colorInputText: "#f8fafc",
            colorText: "#f8fafc",
            colorTextSecondary: "#94a3b8",
            colorNeutral: "#334155",
            borderRadius: "10px",
          },
          elements: {
            card: {
              border: "1px solid #1e293b",
              boxShadow: "0 24px 64px #00000088",
            },
            footerAction: { display: "none" }, // hides "Don't have an account? Sign up"
          },
        }}
      />
    </div>
  );
}
