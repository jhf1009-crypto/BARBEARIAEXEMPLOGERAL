import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import AdminPanel from '@/components/admin-panel';
export const metadata = {
  title: 'Painel | Barbearia Geral',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';
export default async function Page() {
  const user = await currentUser();
  if (!user) redirect('/admin/login');
  return (
    <AdminPanel
      user={{
        name: user.name,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        barberId: user.barberId,
      }}
    />
  );
}
