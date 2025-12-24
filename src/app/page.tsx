import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Shield,
  Zap,
  BarChart3,
  Bell,
  FileText,
  Users,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Lock
} from 'lucide-react';
import { Logo } from '@/components/icons';
import { GlassCard } from '@/components/ui/glass-card';
import { CustomCursor } from '@/components/custom-cursor';
import { MouseFollower } from '@/components/mouse-follower';

export default function Home() {
  const features = [
    {
      icon: <Users className="w-7 h-7" />,
      title: "Unified Management",
      desc: "Centralized admin, class rep, and student panels with role-based access control for seamless collaboration.",
      blobColor: "bg-emerald-500/30",
      gradient: "from-emerald-500/10 to-transparent"
    },
    {
      icon: <Zap className="w-7 h-7" />,
      title: "Seamless Payments",
      desc: "Integrated Razorpay and QR-based payment solutions with automated screenshot verification.",
      blobColor: "bg-lime-500/30",
      gradient: "from-lime-500/10 to-transparent"
    },
    {
      icon: <BarChart3 className="w-7 h-7" />,
      title: "Insightful Reporting",
      desc: "Real-time visualization of fund collection, pending payments, and expenses with interactive charts.",
      blobColor: "bg-teal-500/30",
      gradient: "from-teal-500/10 to-transparent"
    },
    {
      icon: <Bell className="w-7 h-7" />,
      title: "Smart Notifications",
      desc: "Automated email and in-app alerts for payment reminders, deadlines, and important updates.",
      blobColor: "bg-emerald-400/30",
      gradient: "from-emerald-400/10 to-transparent"
    },
    {
      icon: <Shield className="w-7 h-7" />,
      title: "AI-Powered Security",
      desc: "Advanced fraud detection using machine learning to analyze payment patterns and screenshots.",
      blobColor: "bg-cyan-500/30",
      gradient: "from-cyan-500/10 to-transparent"
    },
    {
      icon: <FileText className="w-7 h-7" />,
      title: "Auto Invoicing",
      desc: "Professional invoice and receipt generation with customizable templates and instant downloads.",
      blobColor: "bg-green-500/30",
      gradient: "from-green-500/10 to-transparent"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-stone-200 font-sans selection:bg-emerald-500/30 selection:text-emerald-100 overflow-x-hidden relative cursor-none">

      {/* Custom Cursor */}
      <CustomCursor />

      {/* Noise Texture Overlay */}
      <div className="fixed inset-0 z-[50] opacity-[0.07] pointer-events-none mix-blend-overlay"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
      </div>

      {/* Enhanced Floating Orbs Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-black">
        {/* Orb 1: Deep Emerald - Larger and more vibrant */}
        <div className="absolute top-[-15%] left-[-15%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-emerald-600/40 via-emerald-800/30 to-transparent blur-[140px] mix-blend-screen opacity-70 animate-float" />

        {/* Orb 2: Bright Lime - Enhanced glow */}
        <div className="absolute top-[25%] right-[-15%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-lime-500/30 via-lime-700/20 to-transparent blur-[120px] mix-blend-screen opacity-60 animate-float-delayed" />

        {/* Orb 3: Cool Teal - Deeper color */}
        <div className="absolute bottom-[-25%] left-[15%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-br from-teal-600/35 via-teal-800/25 to-transparent blur-[130px] mix-blend-screen opacity-65 animate-float-slow" />

        {/* Additional accent orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] rounded-full bg-gradient-to-br from-cyan-500/20 via-emerald-600/15 to-transparent blur-[100px] mix-blend-screen opacity-50 animate-pulse-slow" />

        {/* Mouse Follower Light */}
        <MouseFollower />
      </div>

      {/* Decorative Side Elements - Enhanced */}
      <div className="fixed left-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-3 z-40 text-emerald-400/60 text-[10px] tracking-[0.4em] font-mono">
        <div className="h-16 w-[2px] bg-gradient-to-b from-transparent via-emerald-500/40 to-transparent mx-auto"></div>
        <div className="writing-vertical-rl rotate-180 py-6 hover:text-emerald-300 transition-colors">EXPLORE</div>
        <div className="h-16 w-[2px] bg-gradient-to-b from-transparent via-emerald-500/40 to-transparent mx-auto"></div>
      </div>

      <div className="fixed right-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-2 z-40">
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === 0 ? 'bg-emerald-400 scale-125' : 'bg-white/20 hover:bg-emerald-400/50'}`} />
        ))}
      </div>

      {/* Navigation - Enhanced */}
      <nav className="fixed top-0 w-full z-[60] bg-transparent py-8 backdrop-blur-sm">
        <div className="w-full px-8 md:px-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-4 group">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full group-hover:bg-emerald-500/30 transition-all"></div>
              <span className="relative text-base font-bold tracking-[0.25em] text-white group-hover:text-emerald-200 transition-colors uppercase">
                FundEd <span className="text-emerald-500/50 mx-3">●</span> Finance
              </span>
            </div>
          </a>

          <div className="flex items-center gap-4">
            <Link href="/check-status" className="hidden md:block">
              <Button variant="ghost" className="text-sm font-medium tracking-[0.1em] text-emerald-100 hover:text-white uppercase hover:bg-emerald-500/10">
                Check Status
              </Button>
            </Link>
            <Link href="/login">
              <Button className="relative text-xs font-bold tracking-[0.25em] bg-emerald-500/10 backdrop-blur-md border-2 border-emerald-500/30 text-emerald-100 hover:bg-emerald-500/20 hover:border-emerald-400/50 uppercase transition-all px-8 py-6 rounded-full overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <span className="relative z-10">Access Portal</span>
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Enhanced */}
      <section className="relative z-10 min-h-screen flex flex-col justify-center px-6 md:px-16 pt-20">
        <div className="max-w-7xl mx-auto w-full relative">

          {/* Decorative Label - Enhanced */}
          <div className="absolute top-8 right-0 text-[11px] tracking-[0.35em] text-emerald-300/90 uppercase hidden md:flex items-center gap-3 border-r-2 border-emerald-500/60 pr-5 py-3 bg-gradient-to-l from-black/60 to-transparent backdrop-blur-md rounded-l-lg z-10">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <div>
              SIMPLICITY &<br />CONTROL
            </div>
          </div>

          {/* Main Heading - Enhanced */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/5 via-transparent to-transparent blur-3xl"></div>
            <h1 className="relative text-5xl md:text-7xl lg:text-[8rem] font-bold text-white tracking-tight leading-[0.95] mb-16">
              Manage <br />
              <span className="font-light italic text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-emerald-200 to-teal-300 ml-4 md:ml-16">education</span> <br />
              <span className="relative inline-block">
                funds seamlessly
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/50 to-transparent"></div>
              </span>
            </h1>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-16 mt-16 border-t border-emerald-500/20 pt-12">
            <div className="max-w-md">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-6">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300/90 font-mono text-xs tracking-wider">SYSTEM_01 / ACTIVE</span>
              </div>
              <p className="text-lg md:text-xl text-stone-300 leading-relaxed font-light">
                Bringing <span className="text-emerald-300 font-medium">transparency</span> and <span className="text-emerald-300 font-medium">efficiency</span> to students, reps, and admins.
                Eliminate the chaos of cash.
              </p>
            </div>

            <Link href="/login">
              <Button className="group relative px-10 py-6 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-md border-2 border-emerald-400/40 text-white text-base font-bold tracking-[0.2em] uppercase hover:border-emerald-300/60 transition-all flex items-center gap-4 rounded-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/30 to-teal-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <Lock className="w-5 h-5 relative z-10 group-hover:rotate-12 transition-transform" />
                <span className="relative z-10 flex items-center gap-3">
                  Get Started
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
                </span>
              </Button>
            </Link>
          </div>

        </div>
      </section>

      {/* Glass Stats - Enhanced */}
      <section className="relative z-10 py-32 border-t border-emerald-500/10">
        <div className="w-full max-w-7xl mx-auto px-6 md:px-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { val: "100%", label: "Transparency", icon: <Shield className="w-6 h-6" />, color: "emerald" },
              { val: "24/7", label: "Availability", icon: <Zap className="w-6 h-6" />, color: "lime" },
              { val: "AI", label: "Security Protocol", icon: <Lock className="w-6 h-6" />, color: "teal" }
            ].map((stat, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] p-10 border border-white/10 backdrop-blur-md hover:border-emerald-500/40 transition-all duration-500 hover:scale-[1.02]"
              >
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/10 rounded-full blur-[60px] group-hover:bg-emerald-500/20 transition-all duration-700"></div>
                <div className="relative z-10 flex items-start justify-between mb-6">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                    {stat.icon}
                  </div>
                </div>
                <span className="relative z-10 text-6xl md:text-7xl font-thin text-white/95 group-hover:text-emerald-200 transition-colors duration-500 block mb-4">{stat.val}</span>
                <span className="relative z-10 text-sm tracking-[0.25em] uppercase text-stone-400 group-hover:text-stone-300">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features - Enhanced */}
      <section className="relative z-10 py-32 px-6 md:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div>
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-6">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300/90 font-mono text-xs tracking-wider">FEATURES</span>
              </div>
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white max-w-3xl leading-tight">
                Everything you need,<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 italic font-light">in one place.</span>
              </h2>
            </div>
            <span className="text-xs font-mono text-stone-500 hidden md:block tracking-wider">06 MODULES ↓</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10 p-10 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-500/10"
              >
                {/* Enhanced Liquid Blob */}
                <div className={`absolute -top-24 -right-24 w-56 h-56 bg-gradient-to-br ${feature.gradient} rounded-full blur-[80px] opacity-30 group-hover:opacity-60 group-hover:scale-150 transition-all duration-1000 ease-in-out`}></div>
                <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-white/5 rounded-full blur-[50px] opacity-20 group-hover:opacity-40 transition-all duration-1000 delay-100"></div>

                <div className="relative z-10 flex flex-col gap-8 h-full">
                  <div className="flex items-start justify-between">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 flex items-center justify-center text-emerald-200 shadow-lg group-hover:shadow-emerald-500/20 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                      {feature.icon}
                    </div>
                    <div className="text-xs font-mono text-stone-600 group-hover:text-emerald-500/50 transition-colors">
                      0{index + 1}
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold text-white mb-4 group-hover:text-emerald-100 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-base text-stone-400 leading-relaxed font-light group-hover:text-stone-300 transition-colors">
                      {feature.desc}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-emerald-400 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
                    <span className="text-sm font-medium tracking-wider">Explore</span>
                    <div className="w-10 h-10 rounded-full border-2 border-emerald-400/40 flex items-center justify-center group-hover:border-emerald-400 transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Enhanced */}
      <section className="relative z-10 py-40 px-6 md:px-16 border-t border-emerald-500/10 overflow-hidden">
        {/* Enhanced Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] bg-gradient-to-r from-emerald-600/20 via-teal-600/20 to-cyan-600/20 blur-[150px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-12">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-emerald-300/90 font-mono text-xs tracking-wider">JOIN THE REVOLUTION</span>
          </div>

          <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight mb-8 hover:italic transition-all duration-500 cursor-default">
            Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">transform</span>?
          </h2>

          <div className="flex flex-col items-center gap-10">
            <p className="text-stone-300 text-xl font-light max-w-2xl leading-relaxed">
              Join <span className="text-emerald-300 font-medium">hundreds of institutions</span> using FundEd to streamline financial operations and bring transparency to education funding.
            </p>
            <Link href="/login">
              <Button className="relative px-16 py-7 rounded-full bg-gradient-to-r from-emerald-500/30 to-teal-500/30 backdrop-blur-md border-2 border-emerald-400/50 text-white text-base font-bold tracking-[0.2em] uppercase overflow-hidden group hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/30">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/40 via-teal-400/40 to-cyan-400/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <span className="relative z-10 flex items-center gap-3">
                  <Lock className="w-5 h-5" />
                  Transform Now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer - Enhanced */}
      <footer className="relative z-10 py-16 px-6 md:px-16 border-t border-emerald-500/10 bg-gradient-to-b from-transparent to-black/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-col items-center md:items-start gap-2">
              <div className="text-stone-500 text-xs tracking-widest uppercase">
                © {new Date().getFullYear()} FundEd. <span className="text-emerald-500/50">●</span> All rights reserved.
              </div>
              <p className="text-[10px] uppercase tracking-widest text-stone-600">
                A sub-product of <span className="text-emerald-500/80 font-semibold">SKS DM</span>
              </p>
            </div>
            <div className="flex gap-10">
              <Link href="#" className="text-stone-500 hover:text-emerald-400 transition-colors text-xs tracking-widest uppercase">Privacy</Link>
              <Link href="#" className="text-stone-500 hover:text-emerald-400 transition-colors text-xs tracking-widest uppercase">Terms</Link>
              <Link href="/check-status" className="text-stone-500 hover:text-emerald-400 transition-colors text-xs tracking-widest uppercase">Check Status</Link>
              <Link href="#" className="text-stone-500 hover:text-emerald-400 transition-colors text-xs tracking-widest uppercase">Support</Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
