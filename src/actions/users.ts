'use server'

import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

export async function getUsers() {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: { id: true, name: true, email: true, role: true, createdAt: true }
        });
        return { success: true, data: users };
    } catch (error) {
        console.error("Failed to fetch users:", error);
        return { success: false, error: "Failed to fetch users" };
    }
}

export async function createUser(data: { name: string; email: string; password: string }) {
    try {
        // Check if email exists
        const existing = await prisma.user.findUnique({
            where: { email: data.email }
        });

        if (existing) {
            return { success: false, error: "Email already exists" };
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const newUser = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
                role: 'admin' // Default to admin for now
            }
        });

        revalidatePath('/dashboard/settings');
        return { success: true, data: newUser };

    } catch (error) {
        console.error("Failed to create user:", error);
        return { success: false, error: "Failed to create user" };
    }
}

export async function deleteUser(userId: string) {
    try {
        // Prevent deleting the last user ? 
        // For now, just allow delete. Logic can be improved.
        await prisma.user.delete({
            where: { id: userId }
        });
        revalidatePath('/dashboard/settings');
        return { success: true };
    } catch (error) {
         console.error("Failed to delete user:", error);
         return { success: false, error: "Failed to delete user" };
    }
}
