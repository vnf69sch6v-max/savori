'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Button } from '@/components/ui';
import {
  Sparkles,
  Target,
  Zap,
  ArrowRight,
  Check,
  Lock,
  Smartphone,
  ScanLine,
  CreditCard,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

// CSS-only iPhone Mockup showing Dashboard
function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[280px] h-[580px] bg-slate-900 rounded-[55px] border-8 border-slate-800 shadow-2xl overflow-hidden ring-1 ring-white/10">
      {/* Dynamic Island */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100px] h-[30px] bg-black rounded-b-2xl z-20" />

      {/* Screen Content */}
      <div className="absolute inset-0 bg-[#0B0E14] flex flex-col pt-12 px-5">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="text-xs text-slate-400">Dostępne środki</div>
            <div className="text-2xl font-bold text-white">4 250,00 zł</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-800" />
        </div>

        {/* Chart Area */}
        <div className="h-32 mb-6 relative">
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-emerald-500/20 to-transparent" />
          <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
            <path
              d="M0,64 C40,64 40,32 80,32 C120,32 120,80 160,80 C200,80 200,10 240,10"
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div className="absolute top-0 right-0 bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded-full border border-emerald-500/20">
            +12% vs ost. msc
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50">
            <ScanLine className="w-5 h-5 text-purple-400 mb-2" />
            <div className="text-xs font-medium text-slate-300">Skanuj</div>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50">
            <Target className="w-5 h-5 text-amber-400 mb-2" />
            <div className="text-xs font-medium text-slate-300">Cele</div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="space-y-3">
          <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Dzisiaj</div>
          {[
            { name: 'Spotify Music', amount: '-19.99 zł', icon: '🎵', color: 'bg-green-500/20' },
            { name: 'Uber Eats', amount: '-45.50 zł', icon: '🍔', color: 'bg-orange-500/20' },
            { name: 'Żabka', amount: '-23.10 zł', icon: '🛒', color: 'bg-blue-500/20' },
          ].map((tx, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${tx.color} flex items-center justify-center text-sm`}>
                {tx.icon}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{tx.name}</div>
                <div className="text-xs text-slate-500">Rozrywka</div>
              </div>
              <div className="text-sm font-medium text-white">{tx.amount}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Reflection Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none z-10" />
    </div>
  );
}

// Bento Grid Item
function BentoCard({ children, className = "", delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay, duration: 0.5 }}
      className={`bg-[#161b22] border border-slate-800/50 rounded-3xl overflow-hidden relative group hover:border-slate-700 transition-colors ${className}`}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0B0E14] text-white selection:bg-emerald-500/30">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#0B0E14]/80 backdrop-blur-md border-b border-slate-800/50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <div className="w-6 h-6 rounded bg-emerald-500 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-black" />
            </div>
            Savori
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">Logowanie</Link>
            <Link href="/register">
              <Button size="sm" className="bg-white text-black hover:bg-slate-200 rounded-full px-4 h-8 text-xs font-semibold">
                Rozpocznij
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6 max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row items-center gap-12 mb-32">
          <div className="flex-1 text-center md:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-emerald-400 mb-6"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Savori 2.0 już dostępne
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
              Twoje finanse.<br />
              Uproszczone.
            </h1>

            <p className="text-lg text-slate-400 mb-8 max-w-lg mx-auto md:mx-0 leading-relaxed">
              Savori to nie tylko aplikacja. To Twój osobisty asystent finansowy AI, który pomaga Ci oszczędzać bez wysiłku i stresu.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
              <Link href="/register" className="w-full sm:w-auto">
                <Button className="w-full h-12 rounded-full bg-blue-600 hover:bg-blue-500 text-white px-8 text-base font-medium transition-all hover:scale-105">
                  Rozpocznij za darmo
                </Button>
              </Link>
              <Link href="/demo" className="w-full sm:w-auto">
                <Button variant="ghost" className="w-full h-12 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 px-6 gap-2 group">
                  Zobacz jak to działa
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex items-center justify-center md:justify-start gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                Bezpłatny start
              </div>
              <div className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                Bez karty kredytowej
              </div>
            </div>
          </div>

          {/* Phone Mockup Hero Visual */}
          <div className="flex-1 relative">
            <motion.div
              initial={{ opacity: 0, rotate: 10, y: 50 }}
              animate={{ opacity: 1, rotate: -5, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative z-10"
            >
              <PhoneMockup />
            </motion.div>

            {/* Glow effect behind phone */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[600px] bg-blue-500/20 blur-[100px] -z-10 rounded-full" />
          </div>
        </div>

        {/* Bento Grid Features */}
        <div className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Wszystko, czego potrzebujesz</h2>
            <p className="text-slate-400">Kompletny zestaw narzędzi do kontroli Twoich pieniędzy.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
            {/* Large Card - AI Analysis */}
            <BentoCard className="md:col-span-2 p-8 flex flex-col justify-between bg-gradient-to-br from-slate-900 to-[#161b22]">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Sztuczna Inteligencja</h3>
                <p className="text-slate-400 max-w-md">Nasze AI automatycznie kategoryzuje 99% Twoich transakcji i wykrywa anomalie w wydatkach zanim stracisz pieniądze.</p>
              </div>
              <div className="mt-8 flex gap-4 overflow-hidden">
                {['Netflix', 'Uber', 'Biedronka', 'Orlen'].map((m, i) => (
                  <div key={m} className="bg-slate-800 px-4 py-2 rounded-lg text-xs text-slate-300 border border-slate-700 whitespace-nowrap animate-in fade-in slide-in-from-right-4" style={{ animationDelay: `${i * 100}ms` }}>
                    {m}
                  </div>
                ))}
              </div>
            </BentoCard>

            {/* Tall Card - Scanning */}
            <BentoCard className="bg-gradient-to-b from-[#1a202c] to-slate-900 md:row-span-2 relative group-hover:border-emerald-500/30">
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
              <div className="p-8 relative z-10 h-full flex flex-col">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4">
                  <ScanLine className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Skaner Paragonów</h3>
                <p className="text-slate-400 text-sm mb-8">Zrób zdjęcie. My zajmiemy się resztą.</p>

                <div className="flex-1 flex items-center justify-center">
                  <div className="w-32 h-44 bg-white rounded-lg shadow-xl rotate-3 transition-transform group-hover:rotate-0 duration-500 flex flex-col items-center justify-center gap-2 p-4">
                    <div className="w-full h-2 bg-slate-200 rounded-full" />
                    <div className="w-3/4 h-2 bg-slate-200 rounded-full" />
                    <div className="w-full h-px bg-slate-200 my-2" />
                    <div className="w-full flex justify-between text-[6px] text-slate-400">
                      <span>Mleko</span>
                      <span>3.50</span>
                    </div>
                  </div>
                </div>
              </div>
            </BentoCard>

            {/* Small Card - Security */}
            <BentoCard className="p-8 flex flex-col justify-center items-center text-center">
              <ShieldCheck className="w-12 h-12 text-emerald-400 mb-4" />
              <h3 className="text-lg font-bold mb-1">Bankowe Bezpieczeństwo</h3>
              <p className="text-xs text-slate-400">Szyfrowanie AES-256 i pełna prywatność danych.</p>
            </BentoCard>

            {/* Small Card - Gamification */}
            <BentoCard className="p-8 bg-gradient-to-br from-orange-900/20 to-slate-900 border-orange-500/20">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-6 h-6 text-orange-400" />
                <div className="text-sm font-bold text-orange-400">Gamifikacja</div>
              </div>
              <h3 className="text-xl font-bold mb-2">Zarabiaj oszczędzając</h3>
              <p className="text-sm text-slate-400">Zdobywaj punkty XP i odznaki za realizację celów.</p>
            </BentoCard>
          </div>
        </div>

        {/* Trust/Footer Section */}
        <div className="text-center py-20 border-t border-slate-800">
          <p className="text-slate-500 mb-6">Zaufali nam użytkownicy, którzy oszczędzili już łącznie ponad 5 mln zł</p>
          <div className="flex justify-center flex-wrap gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Placeholder logos */}
            <span className="text-lg font-bold">TechCrunch</span>
            <span className="text-lg font-bold">Forbes</span>
            <span className="text-lg font-bold">ProductHunt</span>
            <span className="text-lg font-bold">Wired</span>
          </div>

          <div className="mt-20 flex flex-col md:flex-row justify-between items-center text-sm text-slate-600 gap-4">
            <p>© 2026 Savori Inc.</p>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-slate-400">Prywatność</Link>
              <Link href="#" className="hover:text-slate-400">Regulamin</Link>
              <Link href="#" className="hover:text-slate-400">Twitter</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
