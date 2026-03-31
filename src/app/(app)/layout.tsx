import AppLayoutClient from "./AppLayoutClient";

export const runtime = "edge";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppLayoutClient>{children}</AppLayoutClient>;
}
