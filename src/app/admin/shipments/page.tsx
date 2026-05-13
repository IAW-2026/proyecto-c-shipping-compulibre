import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AdminDashboardClient from "./AdminDashboardClient";

/**
 * Server Component — runs on the server before any client JS is sent.
 *
 * Responsibilities:
 *  1. Verify the user is authenticated (middleware already does this at the
 *     edge, but this is a second check in case the page is imported directly).
 *  2. Verify publicMetadata.roles includes "admin".
 *  3. Pass the user's display name down to the client for the header badge.
 *
 * The actual dashboard UI lives in AdminDashboardClient (the "use client" file).
 */
export default async function AdminShipmentsPage() {
  const { userId, sessionClaims } = await auth();

  // Should never reach here if middleware is configured correctly,
  // but guard anyway for safety.
  if (!userId) {
    redirect("/sign-in");
  }

  const role =
    (sessionClaims?.metadata as { role?: string[] } | undefined)
      ?.role ?? [];

  if (!role.includes("admin")) {
    redirect("/unauthorized");
  }

  // Pass safe, non-sensitive display info to the client component
  const displayName =
    (sessionClaims?.metadata as { displayName?: string } | undefined)
      ?.displayName ?? "Admin";

  return <AdminDashboardClient displayName={displayName} />;
}
