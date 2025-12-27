import DashboardClientLayout from './client-layout';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

async function getUser() {
  const session = await getSession();
  if (!session || !session.user || !session.user.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, image: true }
  });

  return user;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  return (
    <DashboardClientLayout user={user}>
      {children}
    </DashboardClientLayout>
  );
}
