'use server';

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';

interface AddStudentInput {
  name: string;
  rollNumber: string;
  email?: string;
  phone?: string;
}

export async function addStudent(input: AddStudentInput) {
  try {
    // Check if student with same roll number already exists
    const existingStudent = await prisma.student.findFirst({
      where: { rollNo: input.rollNumber }
    });
    
    if (existingStudent) {
      return { success: false, error: 'A student with this roll number already exists' };
    }

    // Create new student
    const student = await prisma.student.create({
      data: {
        name: input.name,
        rollNo: input.rollNumber,
        email: input.email || '',
        class: '', // Default empty class
      },
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/students');
    revalidatePath('/dashboard/events');

    return { 
      success: true, 
      student: {
        id: student.id,
        name: student.name,
        rollNumber: student.rollNo,
      }
    };
  } catch (error) {
    console.error('Error adding student:', error);
    return { success: false, error: 'Failed to add student' };
  }
}

export async function getStudents() {
  try {
    const students = await prisma.student.findMany({
      orderBy: {
        rollNo: 'asc',
      },
    });

    return { 
      success: true, 
      students: students.map(s => ({
        id: s.id,
        name: s.name,
        rollNo: s.rollNo,  // Changed from rollNumber to rollNo
        email: s.email,
        class: s.class,
        createdAt: s.createdAt.toISOString(),
      }))
    };
  } catch (error) {
    console.error('Error fetching students:', error);
    return { success: false, error: 'Failed to fetch students' };
  }
}
