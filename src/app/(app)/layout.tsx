import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AppLayoutClient from "./AppLayoutClient";


export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const hasSession = cookieStore.has("ratio_session");

  if (!hasSession) {
    redirect("/onboarding");
  }

  return <AppLayoutClient>{children}</AppLayoutClient>;
}
