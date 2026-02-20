// app/(dashboard)/layout.tsx
import { Sidebar }           from "@/components/layout/Sidebar";
import { Topbar }            from "@/components/layout/Topbar";
import { getDashboardStats } from "@/actions/tasks";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { critical } = await getDashboardStats();
  const criticalCount = critical ?? 0;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-deep">
      <Sidebar criticalCount={criticalCount} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Topbar criticalCount={criticalCount} />
        <main className="flex-1 overflow-y-auto p-5 px-6">
          {children}
        </main>
      </div>
    </div>
  );
}