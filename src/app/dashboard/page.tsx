'use client';

import { GlassCard } from '@/components/ui/glass-card';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Transaction, Event } from '@/lib/types';
import { useState, useEffect, useMemo } from 'react';
import { getDashboardData } from '@/actions/dashboard';
import { useToast } from '@/hooks/use-toast';
import { PageLoader } from '@/components/ui/page-loader';
import { Wallet, TrendingUp, Clock, Users } from 'lucide-react';
import Link from 'next/link';
import { StatisticsChart } from '@/components/statistics-chart';

const getStatusBadgeVariant = (status: Transaction['status']) => {
    switch (status) {
        case 'Paid':
            return 'paid';
        case 'Pending':
            return 'pending';
        case 'Failed':
            return 'failed';
        case 'Verification Pending':
            return 'verification';
        default:
            return 'default';
    }
};

interface StatCardProps {
    title: string;
    value: string;
    description: string;
    icon: React.ReactNode;
    trend?: string;
    className?: string;
}

function StatCard({ title, value, description, icon, trend, className }: StatCardProps) {
    return (
        <GlassCard className={`relative overflow-hidden transition-all hover:shadow-lg w-full min-w-0 ${className}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pr-10 md:pr-12">
                <CardTitle className="text-sm font-medium truncate pr-2">{title}</CardTitle>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-xl md:text-2xl font-bold truncate">{value}</div>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                    {description}
                </p>
                {trend && (
                    <div className="flex items-center mt-2 text-xs text-green-600 dark:text-green-400 truncate">
                        <TrendingUp className="h-3 w-3 mr-1 shrink-0" />
                        <span className="truncate">{trend}</span>
                    </div>
                )}
            </CardContent>
            <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full -mr-12 -mt-12 md:-mr-16 md:-mt-16 pointer-events-none" />
        </GlassCard>
    );
}

export default function DashboardPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const res = await getDashboardData();
            if (res.success && res.data) {
                setEvents(res.data.events as unknown as Event[]);
                setTransactions(res.data.transactions as unknown as Transaction[]);
                setRecentTransactions(res.data.recentTransactions as unknown as Transaction[]);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch dashboard data' });
            }
            setIsLoading(false);
        };
        fetchData();
    }, []);

    const stats = useMemo(() => {
        const totalCollected = transactions
            .filter(t => t.status === 'Paid')
            .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

        const pendingAmount = transactions
            .filter(t => t.status === 'Pending' || t.status === 'Verification Pending')
            .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

        const uniqueStudents = new Set(transactions.map(t => t.studentId)).size;

        return {
            totalEvents: events.length,
            totalCollected,
            pendingAmount,
            uniqueStudents,
        };
    }, [events, transactions]);

    const formatDate = (date: string | Date) => {
        const d = new Date(date);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
    };

    const StatusBadge = ({ status }: { status: Transaction['status'] }) => {
        const variant = getStatusBadgeVariant(status);
        return (
            <Badge variant={variant as any}>
                {status}
            </Badge>
        );
    };

    if (isLoading) {
        return <PageLoader message="Preparing dashboard statistics..." />;
    }

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground mt-2">
                    Welcome back! Here's an overview of your fund collection activities.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 min-w-0">
                <StatCard
                    title="Total Events"
                    value={stats.totalEvents.toString()}
                    description="Active fund collection events"
                    icon={<Wallet className="h-4 w-4" />}
                />
                <StatCard
                    title="Total Collected"
                    value={`₹${stats.totalCollected.toLocaleString()}`}
                    description="Successfully collected funds"
                    icon={<TrendingUp className="h-4 w-4" />}
                    trend="+12% from last month"
                    className="border-green-200 dark:border-green-900"
                />
                <StatCard
                    title="Pending Payments"
                    value={`₹${stats.pendingAmount.toLocaleString()}`}
                    description="Awaiting verification"
                    icon={<Clock className="h-4 w-4" />}
                    className="border-orange-200 dark:border-orange-900"
                />
                <StatCard
                    title="Active Students"
                    value={stats.uniqueStudents.toString()}
                    description="Students with transactions"
                    icon={<Users className="h-4 w-4" />}
                />
            </div>

            {/* Statistics Chart */}
            <StatisticsChart />

            {/* Recent Transactions */}
            <GlassCard className="shadow-md">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Recent Transactions</CardTitle>
                            <CardDescription className="mt-1">
                                Latest payment activities across all events
                            </CardDescription>
                        </div>
                        <Link href="/dashboard/reports">
                            <span className="text-sm text-primary hover:underline cursor-pointer">
                                View all →
                            </span>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Mobile View */}
                    <div className="grid gap-4 md:hidden">
                        {recentTransactions?.map(transaction => (
                            <GlassCard key={transaction.id} className="w-full border-l-4 border-l-primary/20">
                                <CardHeader>
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="min-w-0 flex-1">
                                            <CardTitle className="text-sm font-code truncate" title={transaction.id}>
                                                #{transaction.id.slice(-8)}
                                            </CardTitle>
                                            <CardDescription className="truncate">{transaction.studentName}</CardDescription>
                                        </div>
                                        <div className="shrink-0">
                                            <StatusBadge status={transaction.status} />
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="grid gap-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Event</span>
                                        <span className="font-medium">{transaction.eventName}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Amount</span>
                                        <span className="font-semibold text-green-600 dark:text-green-400">
                                            ₹{transaction.amount.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Date</span>
                                        <span>{formatDate(transaction.paymentDate)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Method</span>
                                        <span>{transaction.paymentMethod}</span>
                                    </div>
                                </CardContent>
                            </GlassCard>
                        ))}
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="text-center">Transaction ID</TableHead>
                                    <TableHead className="text-center">Student</TableHead>
                                    <TableHead className="text-center">Event</TableHead>
                                    <TableHead className="text-center">Amount</TableHead>
                                    <TableHead className="text-center">Date</TableHead>
                                    <TableHead className="text-center">Method</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentTransactions?.map((transaction) => (
                                    <TableRow key={transaction.id} className="hover:bg-muted/50 transition-colors">
                                        <TableCell className="font-code text-center text-xs">{transaction.id}</TableCell>
                                        <TableCell className="text-center">
                                            <div className="font-medium">{transaction.studentName}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {transaction.studentRoll}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="text-sm">{transaction.eventName}</span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="font-semibold text-green-600 dark:text-green-400">
                                                ₹{transaction.amount.toLocaleString()}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center text-sm">{formatDate(transaction.paymentDate)}</TableCell>
                                        <TableCell className="text-center">
                                            <span className="text-xs px-2 py-1 rounded-full bg-muted">
                                                {transaction.paymentMethod}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex justify-center">
                                                <StatusBadge status={transaction.status} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {recentTransactions?.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <Wallet className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p className="text-lg font-medium">No transactions yet</p>
                            <p className="text-sm mt-1">Transactions will appear here once students start making payments</p>
                        </div>
                    )}
                </CardContent>
            </GlassCard>
        </div>
    );
}
