import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Admin-only routes
const isAdminRoute = createRouteMatcher([
  "/admin(.*)",
]);

// Public webhook/API routes that must bypass auth
const isPublicRoute = createRouteMatcher([
  "/api/shipments/update",
]);

export default clerkMiddleware(async (auth, req) => {
  // Allow public webhook routes immediately
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Non-admin routes remain public
  if (!isAdminRoute(req)) {
    return NextResponse.next();
  }

  const { userId, sessionClaims } = await auth();

  // Not signed in → redirect to sign-in
  if (!userId) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);

    return NextResponse.redirect(signInUrl);
  }

  // Check admin role
  const roles =
    sessionClaims?.metadata as
      | { role?: string; roles?: string[] }
      | undefined;

  const isAdmin =
    roles?.roles?.includes("admin") ||
    roles?.role === "admin";

  // Signed in but not admin
  if (!isAdmin) {
    return NextResponse.redirect(
      new URL("/unauthorized", req.url)
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - _next
     * - static files
     */
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};