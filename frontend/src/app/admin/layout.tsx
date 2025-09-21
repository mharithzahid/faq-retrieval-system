import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const isAuthed = cookieStore.get('admin_auth')?.value === '1';

  if (!isAuthed) {
    redirect('/login');
  }

  return <>{children}</>;
}
