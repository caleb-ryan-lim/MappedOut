import { AdminDashboard } from "@/components/admin-dashboard";

export default function AdminPage() {
  return (
    <main className="display-grid min-h-screen">
      <div className="page-shell">
        <AdminDashboard />
      </div>
    </main>
  );
}
