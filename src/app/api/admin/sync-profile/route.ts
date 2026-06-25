import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/admin/sync-profile
 *
 * Upserts an AdminProfile row for the currently signed-in admin user.
 * Called once on first login from the client (see AdminDashboardClient).
 *
 * Per 05-usuarios.md: each app syncs the user's profile on first login
 * by intercepting the Clerk JWT. Only users with role "admin" reach this app.
 */
export async function POST() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const roles =
    (sessionClaims?.publicMetadata as { roles?: string[] } | undefined)
      ?.roles ?? [];

  if (!roles.includes("admin")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const displayName =
    (sessionClaims?.publicMetadata as { displayName?: string } | undefined)
      ?.displayName ??
    (sessionClaims?.name as string | undefined) ??
    "Admin";

  await prisma.adminProfile.upsert({
    where: { clerkUserId: userId },
    update: { displayName },
    create: {
      clerkUserId: userId,
      displayName,
      role: "SUPERADMIN",
    },
  });

  return NextResponse.json({ ok: true });
}
