'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import {
  Sparkles,
  ArrowRight,
} from 'lucide-react';

// Live Animated Dashboard inside iPhone
function LiveDashboard() {
  const [balance, setBalance] = useState(4481);

  useEffect(() => {
    const timer = setInterval(() => {
      setBalance(prev => prev + Math.random() * 50 - 25);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-full w-full bg-[#0B0E14] p-4 overflow-hidden">
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-[10px] text-slate-400 mb-1">Dostępne środki</div>
        <motion.div
          className="text-2xl font-bold text-white"
          key={Math.floor(balance)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {balance.toFixed(2)} zł
        </motion.div>
      </motion.div>

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

// iPhone 15 Pro Mockup - SIMPLIFIED
function IPhoneMockup() {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/20 to-cyan-500/20 blur-3xl" />

      <div className="relative w-[300px] h-[610px] bg-black rounded-[55px] p-3 shadow-2xl">
        <div className="relative h-full bg-slate-900 rounded-[44px] overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[110px] h-[34px] bg-black rounded-b-[18px] z-10" />
          <div className="absolute inset-0 pt-12">
            <LiveDashboard />
          </div>
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/3 to-white/0 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Minimal Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-emerald-400 to-cyan-500" />
            Savori
          </div>
          <Link href="/login">
            <Button variant="ghost" className="text-sm text-slate-400 hover:text-white">
              Zaloguj się
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero - TRUE APPLE MINIMALISM */}
      <section ref={heroRef} className="min-h-screen flex flex-col items-center justify-center px-6 pt-20">
        <motion.div
          style={{ opacity: heroOpacity }}
          className="text-center max-w-4xl"
        >
          {/* Headline - SIMPLE */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-6xl md:text-8xl font-semibold mb-4 tracking-tight"
          >
            Savori
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 1 }}
            className="text-2xl md:text-3xl text-slate-400 mb-16"
          >
            Oszczędzaj mądrzej.
          </motion.p>

          {/* iPhone */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 1.2, ease: "easeOut" }}
            className="mb-16 flex justify-center"
          >
            <IPhoneMockup />
          </motion.div>

          {/* CTA - MINIMAL */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 1 }}
            className="space-y-4"
          >
            <Link href="/register">
              <Button className="h-12 px-7 text-sm font-medium rounded-full bg-blue-600 hover:bg-blue-500 text-white">
                Zacznij za darmo
              </Button>
            </Link>
            <p className="text-xs text-slate-600">
              Bezpłatne konto. Bez karty kredytowej.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* Simple Features - VERY MINIMAL */}
      <div className="max-w-4xl mx-auto px-6 py-32">
        <div className="text-center space-y-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-semibold mb-4">AI analizuje za Ciebie</h2>
            <p className="text-slate-400 text-lg">Automatyczna kategoryzacja wydatków i inteligentne rekomendacje.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h2 className="text-4xl font-semibold mb-4">Oszczędzaj bez wysiłku</h2>
            <p className="text-slate-400 text-lg">Średnio 847 zł miesięcznie więcej w kieszeni.</p>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-10 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-xs text-slate-600">
          <p>© 2026 Savori</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-slate-400">Prywatność</Link>
            <Link href="#" className="hover:text-slate-400">Regulamin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
