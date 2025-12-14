'use server'

import { cookies } from 'next/headers';
import prisma from '@/lib/db';
import { encrypt } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';

export async function login(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Please provide both email and password' };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  // For demo purposes, if no user exists, create one with the provided credentials
  // This is NOT for production, but helps the user get started immediately.
  // Or better, check if it's the admin email.
  
  // Let's just check credentials.
  if (!user || !bcrypt.compareSync(password, user.password)) {
    // Fallback: If no users exist in DB at all, create this one as admin?
    const userCount = await prisma.user.count();
    if (userCount === 0) {
        const hashedPassword = bcrypt.hashSync(password, 10);
        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: 'Admin',
                role: 'admin'
            }
        });
        
        // Login immediately
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const session = await encrypt({ user: { id: newUser.id, email: newUser.email, name: newUser.name }, expires });
        (await cookies()).set('session', session, { expires, httpOnly: true });
        redirect('/dashboard');
    }

    return { error: 'Invalid credentials' };
  }

  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session = await encrypt({ user: { id: user.id, email: user.email, name: user.name }, expires });

  (await cookies()).set('session', session, { expires, httpOnly: true });
  
  redirect('/dashboard');
}

export async function logout() {
  (await cookies()).delete('session');
  redirect('/login');
}
