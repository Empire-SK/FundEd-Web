'use server'

import prisma from '@/lib/db';
import { startOfDay, startOfWeek, startOfMonth, subDays, subWeeks, subMonths, format } from 'date-fns';

export async function getDashboardStatistics(period: 'day' | 'week' | 'month' = 'week') {
  try {
    const now = new Date();
    let startDate: Date;
    let dataPoints: { date: string; collections: number; transactions: number }[] = [];

    if (period === 'day') {
      // Last 7 days
      startDate = subDays(now, 6);
      for (let i = 6; i >= 0; i--) {
        const date = subDays(now, i);
        const dayStart = startOfDay(date);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const payments = await prisma.payment.findMany({
          where: {
            paymentDate: {
              gte: dayStart,
              lt: dayEnd,
            },
            status: 'Paid',
          },
        });

        dataPoints.push({
          date: format(date, 'MMM dd'),
          collections: payments.reduce((sum, p) => sum + p.amount, 0),
          transactions: payments.length,
        });
      }
    } else if (period === 'week') {
      // Last 8 weeks
      startDate = subWeeks(now, 7);
      for (let i = 7; i >= 0; i--) {
        const date = subWeeks(now, i);
        const weekStart = startOfWeek(date);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const payments = await prisma.payment.findMany({
          where: {
            paymentDate: {
              gte: weekStart,
              lt: weekEnd,
            },
            status: 'Paid',
          },
        });

        dataPoints.push({
          date: `Week ${format(weekStart, 'MMM dd')}`,
          collections: payments.reduce((sum, p) => sum + p.amount, 0),
          transactions: payments.length,
        });
      }
    } else {
      // Last 6 months
      startDate = subMonths(now, 5);
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(now, i);
        const monthStart = startOfMonth(date);
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);

        const payments = await prisma.payment.findMany({
          where: {
            paymentDate: {
              gte: monthStart,
              lt: monthEnd,
            },
            status: 'Paid',
          },
        });

        dataPoints.push({
          date: format(date, 'MMM yyyy'),
          collections: payments.reduce((sum, p) => sum + p.amount, 0),
          transactions: payments.length,
        });
      }
    }

    return {
      success: true,
      data: dataPoints,
    };
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    return { success: false, error: 'Failed to fetch statistics' };
  }
}
