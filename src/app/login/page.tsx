'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GraduationCap, Loader2, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { login } from '@/actions/auth';
import { Label } from '@/components/ui/label';
import { useFormStatus } from 'react-dom';
import { CustomCursor } from '@/components/custom-cursor';
import { MouseFollower } from '@/components/mouse-follower';

const initialState = {
  error: '',
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className="w-full relative text-base font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-0 px-10 py-6 rounded-full shadow-xl shadow-emerald-500/40 hover:shadow-emerald-500/60 transition-all hover:scale-105 group"
      disabled={pending}
    >
      {pending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
      <span className="flex items-center gap-2 justify-center">
        <Lock className="w-5 h-5" />
        {pending ? 'Signing in...' : 'Access Dashboard'}
      </span>
    </Button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useActionState(login, initialState);
  const [showPassword, setShowPassword] = useState(false);

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
        {/* Orb 1: Deep Emerald */}
        <div className="absolute top-[-15%] left-[-15%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-emerald-600/40 via-emerald-800/30 to-transparent blur-[140px] mix-blend-screen opacity-70 animate-float" />

        {/* Orb 2: Bright Lime */}
        <div className="absolute top-[25%] right-[-15%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-lime-500/30 via-lime-700/20 to-transparent blur-[120px] mix-blend-screen opacity-60 animate-float-delayed" />

        {/* Orb 3: Cool Teal */}
        <div className="absolute bottom-[-25%] left-[15%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-br from-teal-600/35 via-teal-800/25 to-transparent blur-[130px] mix-blend-screen opacity-65 animate-float-slow" />

        {/* Additional accent orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] rounded-full bg-gradient-to-br from-cyan-500/20 via-emerald-600/15 to-transparent blur-[100px] mix-blend-screen opacity-50 animate-pulse-slow" />

        {/* Mouse Follower Light */}
        <MouseFollower />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-md">

          {/* Logo/Brand */}
          <Link href="/" className="flex items-center justify-center gap-4 mb-12 group">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full group-hover:bg-emerald-500/30 transition-all"></div>
              <GraduationCap className="w-10 h-10 text-emerald-400 relative z-10" />
            </div>
            <div className="relative">
              <span className="text-3xl font-bold tracking-tight text-white group-hover:text-emerald-200 transition-colors">
                FundEd
              </span>
              <span className="block text-xs text-emerald-400/70 tracking-wider">Classroom OS</span>
            </div>
          </Link>

          {/* Login Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-10 border border-white/10 backdrop-blur-xl shadow-2xl">

            {/* Glow Effect */}
            <div className="absolute -top-24 -right-24 w-56 h-56 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-3xl"></div>

            <div className="relative z-10">
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
                <p className="text-stone-400">Sign in to access your dashboard</p>
              </div>

              {/* Form */}
              <form action={formAction} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-stone-300">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-500" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="admin@funded.com"
                      required
                      className="h-12 pl-12 bg-white/5 border-white/10 focus:border-emerald-500/50 text-white placeholder:text-stone-500 rounded-xl transition-all"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium text-stone-300">
                      Password
                    </Label>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-500" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      className="h-12 pl-12 pr-12 bg-white/5 border-white/10 focus:border-emerald-500/50 text-white placeholder:text-stone-500 rounded-xl transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 transition-colors focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {state?.error && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 animate-shake">
                    <p className="text-sm text-red-400 text-center">{state.error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <SubmitButton />
              </form>

              {/* Footer Links */}
              <div className="mt-8 text-center">
                <p className="text-sm text-stone-400">
                  Don't have an account?{' '}
                  <Link href="/signup" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                    Contact Admin
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Terms Footer */}
          <div className="mt-8 text-center text-xs text-stone-500">
            <p>
              By signing in, you agree to our{' '}
              <Link href="/terms" className="text-emerald-400/70 hover:text-emerald-400 transition-colors">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-emerald-400/70 hover:text-emerald-400 transition-colors">
                Privacy Policy
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
