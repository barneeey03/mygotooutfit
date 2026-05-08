import { Sidebar } from '@/components/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 min-h-screen overflow-y-auto md:ml-64">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
