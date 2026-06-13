import { AdminDashboard } from "@/components/admin-dashboard";

export default function AdminPage() {
  return (
    <main className="display-grid min-h-screen px-5 py-8 md:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <AdminDashboard />
      </div>
    </main>
  );
}
