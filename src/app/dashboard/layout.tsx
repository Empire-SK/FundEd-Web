'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Printer,
  Settings,
  Users,
  Wallet,
  ArrowRight,
  GraduationCap,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { Transaction } from '@/lib/types';
import { useEffect, useState } from 'react';
import { logout } from '@/actions/auth';
import { getPendingTransactions } from '@/actions/notifications';
import { CustomCursor } from '@/components/custom-cursor';
import { MouseFollower } from '@/components/mouse-follower';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/events', icon: Wallet, label: 'Events' },
  { href: '/dashboard/prints', icon: Printer, label: 'Prints' },
  { href: '/dashboard/students', icon: Users, label: 'Students' },
  { href: '/dashboard/reports', icon: FileText, label: 'Reports' },
];

function MainNav() {
  const pathname = usePathname();
  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href}>
            <SidebarMenuButton
              isActive={pathname.startsWith(item.href) && (item.href === '/dashboard' ? pathname === item.href : true)}
              tooltip={item.label}
            >
              <item.icon />
              <span>{item.label}</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0 md:hidden bg-white/5 border-white/10 hover:bg-white/10">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col p-0 bg-black/95 border-white/10 backdrop-blur-xl">
        <SheetHeader className="p-4 border-b border-white/10">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <Link href="/" className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <GraduationCap className="h-5 w-5 text-emerald-400" />
            </div>
            <span className="font-bold text-white">FundEd</span>
          </Link>
        </SheetHeader>
        <nav className="flex-1 overflow-y-auto p-4">
          <MainNav />
        </nav>
      </SheetContent>
    </Sheet>
  );
}

const NotificationItem = ({ transaction }: { transaction: Transaction }) => {
  return (
    <DropdownMenuItem asChild>
      <Link href={`/dashboard/events/${transaction.eventId}/payments`}>
        <div className="flex flex-col">
          <p className="text-sm font-medium">{transaction.studentName}</p>
          <p className="text-xs text-muted-foreground">{transaction.eventName} - ₹{transaction.amount}</p>
        </div>
        <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
      </Link>
    </DropdownMenuItem>
  );
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      const res = await getPendingTransactions();
      if (res.success && res.data) {
        setPendingTransactions(res.data as unknown as Transaction[]);
      }
    };
    fetchNotifications();

    // Poll every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
  }

  return (
    <div className="dark min-h-screen bg-black text-stone-200 font-sans selection:bg-emerald-500/30 selection:text-emerald-100 overflow-hidden relative cursor-none">

      {/* Custom Cursor */}
      <CustomCursor />

      {/* Noise Texture Overlay */}
      <div className="fixed inset-0 z-[50] opacity-[0.07] pointer-events-none mix-blend-overlay"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
      </div>

      {/* Floating Orbs Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Orb 1: Deep Emerald */}
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-emerald-600/30 via-emerald-800/20 to-transparent blur-[120px] mix-blend-screen opacity-60 animate-float will-change-transform" />

        {/* Orb 2: Bright Lime */}
        <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-br from-lime-500/20 via-lime-700/15 to-transparent blur-[100px] mix-blend-screen opacity-50 animate-float-delayed will-change-transform" />

        {/* Orb 3: Cool Teal */}
        <div className="absolute bottom-[-15%] left-[15%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-br from-teal-600/25 via-teal-800/20 to-transparent blur-[110px] mix-blend-screen opacity-55 animate-float-slow will-change-transform" />

        {/* Mouse Follower Light */}
        <MouseFollower />
      </div>

      <SidebarProvider>
        <div className="min-h-screen w-full flex relative z-10">
          <Sidebar
            collapsible="icon"
            className="border-r border-white/5 bg-gradient-to-b from-black/40 to-black/60 backdrop-blur-xl hidden md:flex flex-col"
          >
            <SidebarHeader className="p-4 md:p-6 border-b border-white/5">
              <Link href="/dashboard" className="flex items-center gap-3 group">
                <div className="p-2 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                  <GraduationCap className="h-5 w-5 text-emerald-400" />
                </div>
                <span className={cn(
                  "font-bold text-white whitespace-nowrap",
                  "group-data-[collapsible=icon]:hidden",
                )}>FundEd</span>
              </Link>
            </SidebarHeader>
            <SidebarContent className="px-3 py-4 gap-2">
              <MainNav />
            </SidebarContent>
            <SidebarFooter className="p-4 md:p-6 border-t border-white/5">
              <SidebarMenu>
                <SidebarMenuItem>
                  <Link href="/dashboard/settings">
                    <SidebarMenuButton tooltip="Settings" isActive={pathname === '/dashboard/settings'}>
                      <Settings />
                      <span>Settings</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
          </Sidebar>

          <div className="flex flex-col flex-1">
            <header className="flex h-16 items-center gap-4 border-b border-white/5 bg-black/40 backdrop-blur-xl px-4 md:px-8 sticky top-0 z-30">
              <MobileNav />
              <div className="w-full flex-1">
                {/* Optional: Add a search bar here */}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-white/10">
                    <Bell className="h-5 w-5 text-stone-300" />
                    {pendingTransactions && pendingTransactions.length > 0 && (
                      <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-emerald-500">
                        {pendingTransactions.length}
                      </Badge>
                    )}
                    <span className="sr-only">Toggle notifications</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 bg-black/95 border-white/10 backdrop-blur-xl">
                  <DropdownMenuLabel className="text-white">Pending Verifications</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  {pendingTransactions && pendingTransactions.length > 0 ? (
                    <DropdownMenuGroup>
                      {pendingTransactions.map(t => (
                        <NotificationItem key={t.id} transaction={t} />
                      ))}
                    </DropdownMenuGroup>
                  ) : (
                    <div className="px-2 py-4 text-center text-sm text-stone-400">
                      No pending verifications.
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-white/10">
                    <Avatar className="h-9 w-9 ring-2 ring-emerald-500/20">
                      <AvatarImage src={"https://picsum.photos/seed/1/100/100"} alt={"Admin"} />
                      <AvatarFallback className="bg-emerald-500/20 text-emerald-400">A</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-black/95 border-white/10 backdrop-blur-xl" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-white">Admin</p>
                      <p className="text-xs leading-none text-stone-400">
                        admin@funded.com
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem asChild className="hover:bg-white/10">
                    <Link href="/dashboard/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={handleLogout} className="hover:bg-white/10 text-red-400">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 relative z-10">
              {children}
            </main>

            {/* Footer with Branding */}
            <footer className="border-t border-white/5 bg-black/40 backdrop-blur-xl px-4 md:px-8 py-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
                <p>© 2024 FundEd - Classroom OS. All rights reserved.</p>
                <p className="flex items-center gap-1">
                  A sub-product of <span className="text-emerald-400 font-semibold">SKS DM</span>
                </p>
              </div>
            </footer>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}
