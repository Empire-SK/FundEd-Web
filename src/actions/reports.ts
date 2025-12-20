'use server'

import prisma from '@/lib/db';
import Papa from 'papaparse';

export interface ReportFilters {
  dateFrom?: string;
  dateTo?: string;
  eventId?: string;
  studentId?: string;
  status?: string[];
  paymentMethod?: string[];
}

export async function generateEventReport(eventId: string, filters?: { dateFrom?: string; dateTo?: string }) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        payments: {
          where: {
            ...(filters?.dateFrom && { paymentDate: { gte: new Date(filters.dateFrom) } }),
            ...(filters?.dateTo && { paymentDate: { lte: new Date(filters.dateTo) } }),
          },
          include: {
            student: true,
          },
          orderBy: { paymentDate: 'desc' }
        }
      }
    });

    if (!event) {
      return { success: false, error: 'Event not found' };
    }

    const reportData = event.payments.map(p => ({
      'Payment ID': p.id,
      'Student Name': p.student.name,
      'Roll Number': p.student.rollNo,
      'Email': p.student.email,
      'Amount': p.amount,
      'Payment Date': new Date(p.paymentDate).toLocaleDateString(),
      'Payment Method': p.paymentMethod,
      'Status': p.status,
      'Transaction ID': p.transactionId || 'N/A',
      'Manual Entry': p.isManualEntry ? 'Yes' : 'No',
      'Receipt Number': p.receiptNumber || 'N/A',
    }));

    const totalCollected = event.payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
    const totalPending = event.payments.filter(p => p.status === 'Pending' || p.status === 'Verification Pending').reduce((sum, p) => sum + p.amount, 0);

    return {
      success: true,
      data: {
        event: {
          name: event.name,
          description: event.description,
          cost: event.cost,
          deadline: event.deadline.toISOString(),
        },
        summary: {
          totalCollected,
          totalPending,
          totalTransactions: event.payments.length,
          paidCount: event.payments.filter(p => p.status === 'Paid').length,
          pendingCount: event.payments.filter(p => p.status !== 'Paid').length,
        },
        transactions: reportData,
      }
    };
  } catch (error) {
    console.error('Error generating event report:', error);
    return { success: false, error: 'Failed to generate report' };
  }
}

export async function generateTransactionReport(filters: ReportFilters) {
  try {
    const whereClause: any = {};

    if (filters.dateFrom) {
      whereClause.paymentDate = { ...whereClause.paymentDate, gte: new Date(filters.dateFrom) };
    }
    if (filters.dateTo) {
      whereClause.paymentDate = { ...whereClause.paymentDate, lte: new Date(filters.dateTo) };
    }
    if (filters.eventId) {
      whereClause.eventId = filters.eventId;
    }
    if (filters.studentId) {
      whereClause.studentId = filters.studentId;
    }
    if (filters.status && filters.status.length > 0) {
      whereClause.status = { in: filters.status };
    }
    if (filters.paymentMethod && filters.paymentMethod.length > 0) {
      whereClause.paymentMethod = { in: filters.paymentMethod };
    }

    const transactions = await prisma.payment.findMany({
      where: whereClause,
      include: {
        student: true,
        event: true,
      },
      orderBy: { paymentDate: 'desc' }
    });

    const reportData = transactions.map(t => ({
      'Transaction ID': t.id,
      'Student Name': t.student.name,
      'Roll Number': t.student.rollNo,
      'Email': t.student.email,
      'Event Name': t.event.name,
      'Amount': t.amount,
      'Payment Date': new Date(t.paymentDate).toLocaleDateString(),
      'Payment Method': t.paymentMethod,
      'Status': t.status,
      'Transaction Reference': t.transactionId || 'N/A',
      'Manual Entry': t.isManualEntry ? 'Yes' : 'No',
      'Recorded By': t.recordedBy || 'N/A',
      'Receipt Number': t.receiptNumber || 'N/A',
      'Notes': t.manualEntryNotes || 'N/A',
    }));

    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const paidAmount = transactions.filter(t => t.status === 'Paid').reduce((sum, t) => sum + t.amount, 0);

    return {
      success: true,
      data: {
        summary: {
          totalTransactions: transactions.length,
          totalAmount,
          paidAmount,
          pendingAmount: totalAmount - paidAmount,
        },
        transactions: reportData,
      }
    };
  } catch (error) {
    console.error('Error generating transaction report:', error);
    return { success: false, error: 'Failed to generate report' };
  }
}

export async function generateStudentReport(studentId: string) {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        payments: {
          include: {
            event: true,
          },
          orderBy: { paymentDate: 'desc' }
        }
      }
    });

    if (!student) {
      return { success: false, error: 'Student not found' };
    }

    const reportData = student.payments.map(p => ({
      'Event Name': p.event.name,
      'Amount': p.amount,
      'Payment Date': new Date(p.paymentDate).toLocaleDateString(),
      'Payment Method': p.paymentMethod,
      'Status': p.status,
      'Transaction ID': p.transactionId || 'N/A',
      'Receipt Number': p.receiptNumber || 'N/A',
    }));

    const totalPaid = student.payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
    const totalPending = student.payments.filter(p => p.status !== 'Paid').reduce((sum, p) => sum + p.amount, 0);

    return {
      success: true,
      data: {
        student: {
          name: student.name,
          rollNo: student.rollNo,
          email: student.email,
          class: student.class,
        },
        summary: {
          totalPaid,
          totalPending,
          totalTransactions: student.payments.length,
        },
        transactions: reportData,
      }
    };
  } catch (error) {
    console.error('Error generating student report:', error);
    return { success: false, error: 'Failed to generate report' };
  }
}

export async function exportToCSV(data: any[], filename: string, summary?: any) {
  try {
    let csvContent = '';

    // If summary is provided, add it as header section
    if (summary) {
      // 1. Create Summary Array for Unparsing
      const summaryRows = [
        { Label: '=== SUMMARY ===', Value: '' },
        ...Object.entries(summary).map(([key, value]) => ({
          Label: key.replace(/([A-Z])/g, ' $1').trim(), // CamelCase to Title Case
          Value: value
        })),
        { Label: '', Value: '' }, // Spacer
        { Label: '=== REPORT DATA ===', Value: '' },
      ];
      
      // 2. Unparse Summary (disable quotes to look cleaner if desired, but default is safer)
      const summaryCSV = Papa.unparse(summaryRows, {
        header: false // We don't need "Label,Value" header
      });
      
      csvContent += summaryCSV + '\n\n';
    }
    
    // 3. Unparse Main Data
    if (data.length > 0) {
      const dataCSV = Papa.unparse(data);
      csvContent += dataCSV;
    } else {
        csvContent += "No data available for the selected range.";
    }
    
    return {
      success: true,
      data: {
        csv: csvContent,
        filename: `${filename}_${new Date().toISOString().split('T')[0]}.csv`,
      }
    };
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    return { success: false, error: 'Failed to export to CSV' };
  }
}

// Generate Transaction Summary Report
export async function generateTransactionSummary(filters?: ReportFilters) {
  try {
    const whereClause: any = {};
    
    if (filters?.dateFrom) {
      whereClause.paymentDate = { ...whereClause.paymentDate, gte: new Date(filters.dateFrom) };
    }
    if (filters?.dateTo) {
      whereClause.paymentDate = { ...whereClause.paymentDate, lte: new Date(filters.dateTo) };
    }

    const transactions = await prisma.payment.findMany({
      where: whereClause,
      include: {
        event: true,
      },
    });

    // Group by event
    const eventSummary = transactions.reduce((acc: any, t) => {
      if (!acc[t.eventId]) {
        acc[t.eventId] = {
          eventName: t.event.name,
          totalTransactions: 0,
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
          paidCount: 0,
          pendingCount: 0,
        };
      }
      acc[t.eventId].totalTransactions++;
      acc[t.eventId].totalAmount += t.amount;
      if (t.status === 'Paid') {
        acc[t.eventId].paidAmount += t.amount;
        acc[t.eventId].paidCount++;
      } else {
        acc[t.eventId].pendingAmount += t.amount;
        acc[t.eventId].pendingCount++;
      }
      return acc;
    }, {});

    const summaryData = Object.values(eventSummary).map((s: any) => ({
      'Event Name': s.eventName,
      'Total Transactions': s.totalTransactions,
      'Total Amount': s.totalAmount,
      'Collected Amount': s.paidAmount,
      'Pending Amount': s.pendingAmount,
      'Paid Count': s.paidCount,
      'Pending Count': s.pendingCount,
    }));

    const overallSummary = {
      totalTransactions: transactions.length,
      totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
      paidAmount: transactions.filter(t => t.status === 'Paid').reduce((sum, t) => sum + t.amount, 0),
      pendingAmount: transactions.filter(t => t.status !== 'Paid').reduce((sum, t) => sum + t.amount, 0),
    };

    return {
      success: true,
      data: {
        summary: overallSummary,
        transactions: summaryData,
      }
    };
  } catch (error) {
    console.error('Error generating transaction summary:', error);
    return { success: false, error: 'Failed to generate summary' };
  }
}

// Generate Student-wise Report
export async function generateStudentWiseReport(filters?: ReportFilters) {
  try {
    const whereClause: any = {};
    
    if (filters?.dateFrom) {
      whereClause.paymentDate = { ...whereClause.paymentDate, gte: new Date(filters.dateFrom) };
    }
    if (filters?.dateTo) {
      whereClause.paymentDate = { ...whereClause.paymentDate, lte: new Date(filters.dateTo) };
    }

    const students = await prisma.student.findMany({
      include: {
        payments: {
          where: whereClause,
          include: {
            event: true,
          },
        },
      },
    });

    const reportData = students
      .filter(s => s.payments.length > 0)
      .map(s => ({
        'Student Name': s.name,
        'Roll Number': s.rollNo,
        'Email': s.email,
        'Class': s.class,
        'Total Transactions': s.payments.length,
        'Total Amount': s.payments.reduce((sum, p) => sum + p.amount, 0),
        'Paid Amount': s.payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0),
        'Pending Amount': s.payments.filter(p => p.status !== 'Paid').reduce((sum, p) => sum + p.amount, 0),
        'Paid Count': s.payments.filter(p => p.status === 'Paid').length,
        'Pending Count': s.payments.filter(p => p.status !== 'Paid').length,
      }));

    const summary = {
      totalStudents: reportData.length,
      totalTransactions: reportData.reduce((sum, s) => sum + s['Total Transactions'], 0),
      totalAmount: reportData.reduce((sum, s) => sum + s['Total Amount'], 0),
      paidAmount: reportData.reduce((sum, s) => sum + s['Paid Amount'], 0),
      pendingAmount: reportData.reduce((sum, s) => sum + s['Pending Amount'], 0),
    };

    return {
      success: true,
      data: {
        summary,
        transactions: reportData,
      }
    };
  } catch (error) {
    console.error('Error generating student-wise report:', error);
    return { success: false, error: 'Failed to generate report' };
  }
}
