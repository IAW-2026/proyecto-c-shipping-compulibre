import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Routes that require authentication
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isAdminRoute(req)) return; // public routes pass through
  const { userId, sessionClaims } = await auth();

  // 1. Not signed in at all → redirect to Clerk's hosted sign-in
  if (!userId) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }

  // 2. Signed in but not an admin → 403 page
  const roles =
  (sessionClaims?.metadata as { role?: string; roles?: string[] } | undefined);

  const isAdmin =
    roles?.roles?.includes("admin") || roles?.role === "admin";

  if (!isAdmin) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }
});

export const config = {
  matcher: [
    // Run on all routes except Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
