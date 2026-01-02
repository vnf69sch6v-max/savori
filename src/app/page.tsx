'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import {
  Sparkles,
  Target,
  LineChart,
  Shield,
  ArrowRight,
  Star,
  TrendingUp,
  PieChart,
  Zap,
} from 'lucide-react';

// Animated chart rings
function AnimatedChart() {
  return (
    <div className="relative w-64 h-64 mx-auto mb-8">
      {/* Outer ring */}
      <motion.div
        className="absolute inset-0 rounded-full border-4 border-emerald-500/30"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />

      {/* Progress ring */}
      <svg className="absolute inset-0 w-full h-full -rotate-90">
        <motion.circle
          cx="50%"
          cy="50%"
          r="45%"
          fill="none"
          stroke="url(#gradient)"
          strokeWidth="8"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 0.75 }}
          transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
          style={{ strokeDasharray: '100%', strokeDashoffset: '0' }}
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center"
        >
          <p className="text-4xl font-bold text-white">75%</p>
          <p className="text-sm text-emerald-400">oszczędności</p>
        </motion.div>
      </div>

      {/* Floating elements */}
      <motion.div
        className="absolute -top-2 -right-2 w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: 'spring' }}
      >
        <TrendingUp className="w-6 h-6 text-white" />
      </motion.div>

      <motion.div
        className="absolute -bottom-2 -left-2 w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.2, type: 'spring' }}
      >
        <Zap className="w-5 h-5 text-white" />
      </motion.div>
    </div>
  );
}

// Single testimonial card
function TestimonialCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.5, duration: 0.5 }}
      className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 max-w-sm mx-auto"
    >
      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
        ))}
      </div>
      <p className="text-slate-300 text-sm mb-4">
        "Nareszcie mam kontrolę nad wydatkami. AI podpowiada gdzie oszczędzać - zaoszczędziłem już 2000 zł!"
      </p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold">
          M
        </div>
        <div>
          <p className="font-medium text-white text-sm">Michał K.</p>
          <p className="text-slate-500 text-xs">Użytkownik Pro</p>
        </div>
      </div>
    </motion.div>
  );
}

// Stats counter
function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return <>{count.toLocaleString()}{suffix}</>;
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0B0E14] text-white overflow-x-hidden">
      {/* Background gradient */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Minimal Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-slate-900/50 border-b border-slate-800/50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">Savori</span>
          </Link>
          <Link href="/login">
            <Button variant="primary" size="sm">
              Zaloguj się
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-24 pb-12 px-4">
        <div className="max-w-md mx-auto text-center">

          {/* Animated Chart */}
          <AnimatedChart />

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-2 mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              <span className="block">Kontroluj.</span>
              <span className="block text-emerald-400">Oszczędzaj.</span>
              <span className="block bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Osiągaj.</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-xs mx-auto">
              AI analizuje Twoje wydatki i pomaga osiągnąć cele finansowe.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex gap-3 justify-center mb-12"
          >
            <Link href="/register">
              <Button variant="primary" className="px-6 py-3 text-base">
                Zacznij za darmo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="px-6 py-3 text-base border-slate-700 text-slate-300 hover:bg-slate-800">
                Mam konto
              </Button>
            </Link>
          </motion.div>

          {/* Testimonial */}
          <TestimonialCard />

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="mt-12 flex justify-center gap-8"
          >
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">
                <AnimatedCounter value={10000} suffix="+" />
              </p>
              <p className="text-xs text-slate-500">użytkowników</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">
                <AnimatedCounter value={5} suffix=" mln zł" />
              </p>
              <p className="text-xs text-slate-500">zaoszczędzone</p>
            </div>
          </motion.div>
        </div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto mt-20 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { icon: PieChart, label: 'Analiza AI', color: 'from-emerald-500 to-teal-500' },
            { icon: Target, label: 'Cele', color: 'from-purple-500 to-pink-500' },
            { icon: LineChart, label: 'Prognozy', color: 'from-cyan-500 to-blue-500' },
            { icon: Shield, label: 'Bezpieczeństwo', color: 'from-amber-500 to-orange-500' },
          ].map((feature, i) => (
            <motion.div
              key={feature.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="bg-slate-800/30 backdrop-blur border border-slate-700/30 rounded-xl p-4 text-center hover:border-slate-600/50 transition-colors"
            >
              <div className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-medium text-slate-300">{feature.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>© 2026 Savori. Wszystkie prawa zastrzeżone.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">Prywatność</Link>
            <Link href="/terms" className="hover:text-slate-300 transition-colors">Regulamin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
