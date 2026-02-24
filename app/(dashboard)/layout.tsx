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
    <div style={{
      display: "flex",
      height: "100vh",
      width: "100vw",
      overflow: "hidden",
      background: "oklch(26% 0.045 268)",
    }}>
      <Sidebar criticalCount={criticalCount} />

      <div style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        overflow: "hidden",
        minWidth: 0,
      }}>
        <Topbar criticalCount={criticalCount} />

        {/* ── Main content area ── */}
        <main style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 24px",
          position: "relative",
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}