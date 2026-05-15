import Sidebar from "@/components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0d0d1f] text-white selection:bg-indigo-500/30 flex">
      <Sidebar />
      <main className="flex-1 p-16 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
