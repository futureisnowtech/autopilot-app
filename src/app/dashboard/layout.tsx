export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0d0d1f] text-white selection:bg-indigo-500/30">
      <main className="p-6 md:p-16 max-w-4xl mx-auto">
        {children}
      </main>
    </div>
  );
}

