import { Sidebar } from '../../components/admin/Sidebar';
import { Header } from '../../components/admin/Header';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch RBAC Role
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = (userData as unknown as { role: string })?.role || 'client';

  if (role === 'client') {
    // If client somehow logs in, don't let them in admin
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050810] text-slate-200">
        <div className="text-center p-8 bg-red-500/10 border border-red-500/20 rounded-2xl max-w-md">
          <h2 className="text-xl font-bold text-red-400 mb-2">Access Denied</h2>
          <p className="text-slate-400">You do not have administrative privileges to view this area.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#050810] text-slate-200">
      {/* We can pass role to Sidebar to filter navigation if needed in the future */}
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header userEmail={user.email} userRole={role} />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto scrollbar-thin">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
