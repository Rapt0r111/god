// src/app/(dashboard)/layout.tsx
import { Sidebar }    from "@/components/layout/Sidebar";
import { Topbar }     from "@/components/layout/Topbar";
import { getDashboardStats } from "@/actions/tasks";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { critical } = await getDashboardStats();
  const criticalPending = critical ?? 0;    

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-deep">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar criticalCount={criticalPending} />
        <main className="flex-1 overflow-y-auto p-5 px-6">
          {children}
        </main>
      </div>
    </div>
  );
}