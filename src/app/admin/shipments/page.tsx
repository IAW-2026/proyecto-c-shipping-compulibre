import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AdminDashboardClient from "./AdminDashboardClient";

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
