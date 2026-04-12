import { requireAuth } from "@/lib/auth/session";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  return (
    <div className="flex h-screen bg-background">
      <Sidebar role={session.role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header session={session} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
