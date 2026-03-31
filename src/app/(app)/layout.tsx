import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AppLayoutClient from "./AppLayoutClient";

export const runtime = "edge";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const hasSession = cookieStore.has("ratio_session");
  const isOnboarded = cookieStore.has("ratio_onboarded");

  if (!hasSession || !isOnboarded) {
    redirect("/onboarding");
  }

  return <AppLayoutClient>{children}</AppLayoutClient>;
}
