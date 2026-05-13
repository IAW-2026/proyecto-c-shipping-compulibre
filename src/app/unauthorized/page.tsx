import { auth } from "@clerk/nextjs/server";
import UnauthorizedClient from "./UnauthorizedClient";

export default async function UnauthorizedPage() {
  const { sessionClaims } = await auth();
  const email =
    (sessionClaims?.email as string | undefined) ?? "your account";

  return <UnauthorizedClient email={email} />;
}
