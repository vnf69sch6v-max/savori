'use client';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  Target,
  Brain,
  Zap,
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
      {/* Balance */}
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

      {/* Chart */}
      <div className="h-24 mb-6 relative">
        <svg className="w-full h-full" preserveAspectRatio="none">
          <motion.path
            d="M0,60 Q40,30 80,35 T160,25 T240,40"
            fill="none"
            stroke="url(#dashboardChartGradient)"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
          />
          <defs>
            <linearGradient id="dashboardChartGradient" x1="0%" y1="0%" x2="100%" y2="0%">
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
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/30 to-blue-500/30 blur-3xl scale-110" />

      {/* Phone frame */}
      <div className="relative w-[300px] h-[610px] bg-black rounded-[55px] p-3 shadow-2xl ring-1 ring-white/10">
        {/* Screen */}
        <div className="relative h-full bg-slate-900 rounded-[44px] overflow-hidden">
          {/* Dynamic Island */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[110px] h-[34px] bg-black rounded-b-[18px] z-10" />

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

// Floating Feature Card
function FloatingCard({ icon: Icon, title, value, color, delay }: {
  icon: React.ElementType;
  title: string;
  value: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      transition={{
        delay,
        duration: 0.5,
        type: "spring",
        stiffness: 100
      }}
      className={`bg-gradient-to-br ${color} backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-2xl`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-xs text-white/70">{title}</p>
          <p className="text-lg font-bold text-white">{value}</p>
        </div>
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
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Minimal Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-emerald-400 to-cyan-500" />
            Savori
          </div>
          <Link href="/login">
            <Button variant="ghost" className="text-slate-300 hover:text-white">
              Zaloguj się
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section - Enhanced */}
      <section ref={heroRef} className="min-h-screen flex items-center justify-center px-6 relative">
        {/* Enhanced background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="text-center relative z-10 max-w-6xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-8"
          >
            <Sparkles className="w-4 h-4" />
            <span>Powered by AI</span>
          </motion.div>

          {/* Improved Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.8 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight leading-[1.1]"
          >
            Przestań się<br />
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              martwić o pieniądze
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-xl md:text-2xl text-slate-400 mb-12 max-w-2xl mx-auto"
          >
            AI automatycznie analizuje wydatki i podpowiada gdzie zaoszczędzić.
            <br className="hidden md:block" />
            <span className="text-emerald-400 font-medium">Średnio 847 zł miesięcznie więcej w kieszeni.</span>
          </motion.p>

          {/* iPhone + Floating Cards - IMPROVED COMPOSITION */}
          <div className="relative mb-12 perspective-[2000px]">
            {/* Center iPhone with 3D effect */}
            <motion.div
              initial={{ opacity: 0, y: 80, rotateX: 20 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ delay: 0.5, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="flex justify-center relative z-20"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <IPhoneMockup />
            </motion.div>

            {/* Floating Cards - better positioning */}
            <div className="absolute top-1/4 -left-8 md:left-4 z-10">
              <FloatingCard
                icon={Brain}
                title="AI Insights"
                value="99% dokładność"
                color="from-purple-600/90 to-purple-500/90"
                delay={1.0}
              />
            </div>
            <div className="absolute top-1/2 -right-8 md:right-4 z-10">
              <FloatingCard
                icon={TrendingUp}
                title="Oszczędności"
                value="+847 zł/msc"
                color="from-emerald-600/90 to-emerald-500/90"
                delay={1.2}
              />
            </div>
            <div className="absolute bottom-1/4 left-4 md:left-16 z-10">
              <FloatingCard
                icon={Target}
                title="Cele osiągnięte"
                value="2,450+"
                color="from-amber-600/90 to-amber-500/90"
                delay={1.4}
              />
            </div>
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link href="/register">
              <Button className="h-14 px-8 text-base font-medium rounded-full bg-white text-black hover:bg-slate-100 transition-all hover:scale-105 shadow-2xl shadow-white/20">
                Zacznij oszczędzać za darmo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <p className="text-sm text-slate-500">
              ✓ Bez karty kredytowej &nbsp;•&nbsp; ✓ 10,000+ użytkowników
            </p>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
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

      {/* Simple Features Section */}
      <div className="max-w-5xl mx-auto px-6 py-32">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Brain, title: 'AI analizuje za Ciebie', desc: 'Automatyczna kategoryzacja i wykrywanie anomalii' },
            { icon: Target, title: 'Osiągnij cele szybciej', desc: 'Inteligentne rekomendacje oszczędności' },
            { icon: Zap, title: 'Skanuj paragony', desc: 'Wystarczy zdjęcie - resztę zrobi AI' },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-slate-400">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-600">
          <p>© 2026 Savori Inc.</p>
          <div className="flex gap-8">
            <Link href="#" className="hover:text-slate-400">Prywatność</Link>
            <Link href="#" className="hover:text-slate-400">Regulamin</Link>
            <Link href="#" className="hover:text-slate-400">Kontakt</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
