// app/(dashboard)/layout.tsx
import { Sidebar }       from "@/components/layout/Sidebar";
import { Topbar }        from "@/components/layout/Topbar";
import { ToastProvider } from "@/components/ui/Toast";
import { getDashboardStats } from "@/actions/tasks"; // или ваш экшн

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const stats = await getDashboardStats();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-base)" }}>
      <Sidebar />

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Topbar criticalCount={stats.critical} />

        <main className="page-content">
          {children}
        </main>
      </div>

      <ToastProvider />
    </div>
  );
}