'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import {
  Sparkles,
  ArrowRight,
  Play,
} from 'lucide-react';

// Live Animated Dashboard inside iPhone
function LiveDashboard() {
  const [balance, setBalance] = useState(4250);

  useEffect(() => {
    const timer = setInterval(() => {
      setBalance(prev => prev + Math.random() * 50 - 25);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-full w-full bg-[#0B0E14] p-4 overflow-hidden">
      {/* Balance */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-[10px] text-slate-400 mb-1">Dostępne środki</div>
        <motion.div
          className="text-2xl font-bold text-white"
          key={balance}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {balance.toFixed(2)} zł
        </motion.div>
      </motion.div>

      {/* Chart */}
      <div className="h-24 mb-6 relative">
        <svg className="w-full h-full" preserveAspectRatio="none">
          <motion.path
            d="M0,60 Q40,30 80,35 T160,25 T240,40"
            fill="none"
            stroke="url(#chartGradient)"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
          />
          <defs>
            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-emerald-500/10 to-transparent" />
      </div>

      {/* Transactions */}
      <div className="space-y-2">
        {[
          { name: 'Netflix', amount: '-19.99', icon: '🎬' },
          { name: 'Żabka', amount: '-23.10', icon: '🛒' },
          { name: 'Uber', amount: '-45.00', icon: '🚗' },
        ].map((tx, i) => (
          <motion.div
            key={tx.name}
            className="flex items-center gap-2 bg-slate-800/30 p-2 rounded-xl"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.1 }}
          >
            <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center text-sm">
              {tx.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-medium text-white truncate">{tx.name}</div>
              <div className="text-[8px] text-slate-500">Dzisiaj</div>
            </div>
            <div className="text-[10px] font-medium text-white">{tx.amount} zł</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// iPhone 15 Pro Mockup
function IPhoneMockup() {
  return (
    <div className="relative">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/20 to-blue-500/20 blur-3xl scale-110" />

      {/* Phone frame */}
      <div className="relative w-[320px] h-[650px] bg-black rounded-[60px] p-3 shadow-2xl ring-1 ring-white/10">
        {/* Screen */}
        <div className="relative h-full bg-slate-900 rounded-[48px] overflow-hidden">
          {/* Dynamic Island */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[37px] bg-black rounded-b-[20px] z-10" />

          {/* Screen Content */}
          <div className="absolute inset-0 pt-12">
            <LiveDashboard />
          </div>

          {/* Reflection */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}

// Feature Section (scroll-triggered)
function FeatureSection({ title, description, visual, reverse = false }: {
  title: string;
  description: string;
  visual: React.ReactNode;
  reverse?: boolean;
}) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [100, 0, 0, -100]);

  return (
    <motion.div
      ref={ref}
      style={{ opacity, y }}
      className={`flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-16 my-40`}
    >
      <div className="flex-1 text-center md:text-left">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
          {title}
        </h2>
        <p className="text-xl text-slate-400 leading-relaxed max-w-md">
          {description}
        </p>
      </div>
      <div className="flex-1 flex justify-center">
        {visual}
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Minimal Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-emerald-400 to-cyan-500" />
            Savori
          </div>
          <Link href="/login">
            <Button variant="ghost" className="text-slate-300 hover:text-white">
              Sign in
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section - Full Screen */}
      <section ref={heroRef} className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="text-center"
        >
          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight"
          >
            Savori.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-2xl md:text-3xl text-slate-400 mb-12"
          >
            Oszczędzaj mądrzej.
          </motion.p>

          {/* iPhone Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="mb-12 flex justify-center"
          >
            <IPhoneMockup />
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            <Link href="/register">
              <Button className="h-14 px-8 text-base font-medium rounded-full bg-white text-black hover:bg-slate-100 transition-all hover:scale-105">
                Start saving
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <p className="text-sm text-slate-500 mt-4">Free to start. No credit card required.</p>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center pt-2"
          >
            <div className="w-1 h-2 bg-white/50 rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* Features - Scrollytelling */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <FeatureSection
          title="AI that understands you"
          description="Automatically categorizes transactions, detects patterns, and gives you personalized insights to save more."
          visual={
            <div className="w-72 h-72 rounded-3xl bg-gradient-to-br from-purple-900/50 to-slate-900 border border-purple-500/20 flex items-center justify-center">
              <Sparkles className="w-24 h-24 text-purple-400" />
            </div>
          }
        />

        <FeatureSection
          title="Scan any receipt"
          description="Just point your camera. Our AI extracts every detail in seconds."
          visual={
            <div className="w-72 h-72 rounded-3xl bg-gradient-to-br from-emerald-900/50 to-slate-900 border border-emerald-500/20 flex items-center justify-center">
              <div className="text-6xl">📸</div>
            </div>
          }
          reverse
        />

        <FeatureSection
          title="Reach your goals"
          description="Set targets. Track progress. Get there faster with smart recommendations."
          visual={
            <div className="w-72 h-72 rounded-3xl bg-gradient-to-br from-amber-900/50 to-slate-900 border border-amber-500/20 flex items-center justify-center">
              <div className="text-6xl">🎯</div>
            </div>
          }
        />
      </div>

      {/* Final CTA */}
      <div className="text-center py-32 px-6">
        <h2 className="text-4xl md:text-6xl font-bold mb-8">
          Ready to save smarter?
        </h2>
        <Link href="/register">
          <Button className="h-14 px-8 text-base font-medium rounded-full bg-white text-black hover:bg-slate-100">
            Get started for free
          </Button>
        </Link>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-600">
          <p>© 2026 Savori Inc.</p>
          <div className="flex gap-8">
            <Link href="#" className="hover:text-slate-400">Privacy</Link>
            <Link href="#" className="hover:text-slate-400">Terms</Link>
            <Link href="#" className="hover:text-slate-400">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
