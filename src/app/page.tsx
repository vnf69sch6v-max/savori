'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import {
  Sparkles,
  Mic,
  Target,
  LineChart,
  Shield,
  Zap,
  ArrowRight,
  Check,
  PiggyBank,
  Star,
  TrendingUp,
  Lock,
  Award,
} from 'lucide-react';

// Animated gradient orb component
function FloatingOrb({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl ${className}`}
      animate={{
        y: [0, -30, 0],
        x: [0, 15, 0],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 8 + delay,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    />
  );
}

// Animated mesh gradient background
function MeshBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      {/* Animated orbs */}
      <FloatingOrb className="top-1/4 left-1/4 w-[600px] h-[600px] bg-emerald-500/20" delay={0} />
      <FloatingOrb className="bottom-1/3 right-1/4 w-[500px] h-[500px] bg-cyan-500/15" delay={2} />
      <FloatingOrb className="top-1/2 right-1/3 w-[400px] h-[400px] bg-violet-500/10" delay={4} />
      <FloatingOrb className="bottom-1/4 left-1/3 w-[350px] h-[350px] bg-amber-500/10" delay={1} />

      {/* Mesh gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/0 via-slate-900/50 to-slate-900" />

      {/* Noise texture */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }} />
    </div>
  );
}

// Typewriter effect hook
function useTypewriter(text: string, speed: number = 50) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed]);

  return displayText;
}

// Stats counter animation
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

// Feature card with glass effect
function FeatureCard({ icon: Icon, title, description, delay }: {
  icon: React.ElementType;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      viewport={{ once: true }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative p-6 rounded-2xl overflow-hidden"
    >
      {/* Glass background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl border border-white/10 rounded-2xl" />

      {/* Hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 rounded-2xl" />
      </div>

      {/* Content */}
      <div className="relative">
        <motion.div
          className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20"
          whileHover={{ rotate: 5, scale: 1.1 }}
        >
          <Icon className="w-7 h-7" />
        </motion.div>
        <h3 className="font-bold text-lg mb-2 text-white">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

const features = [
  {
    icon: Mic,
    title: 'Głosowe Dodawanie',
    description: 'Powiedz "Wydałem 50 zł w Żabce" - AI doda wydatek automatycznie.',
  },
  {
    icon: Target,
    title: 'Inteligentne Cele',
    description: 'Zaokrąglanie, procent od wydatków, trigery - oszczędzaj automatycznie.',
  },
  {
    icon: LineChart,
    title: 'Głęboka Analityka',
    description: 'Raporty dzienne, tygodniowe, miesięczne z AI insights.',
  },
  {
    icon: Shield,
    title: 'Szyfrowanie E2E',
    description: 'Twoje dane są szyfrowane AES-256 i bezpieczne. Zgodność z RODO.',
  },
];

const plans = [
  {
    name: 'Free',
    price: '0',
    period: '/zawsze',
    description: 'Idealny na start',
    features: [
      '1 cel oszczędnościowy',
      '10 skanów/miesiąc',
      'Podstawowe statystyki',
      'Śledzenie wydatków',
    ],
    cta: 'Zacznij za darmo',
  },
  {
    name: 'Pro',
    price: '25',
    period: '/miesiąc',
    description: 'Dla regularnych oszczędzaczy',
    decoy: true,
    features: [
      'Wszystko z Free',
      '5 celów oszczędnościowych',
      '50 skanów/miesiąc',
      'Automatyczne reguły',
      'Tygodniowe raporty',
    ],
    cta: 'Wybierz Pro',
  },
  {
    name: 'Ultimate',
    price: '30',
    period: '/miesiąc',
    description: 'Pełna kontrola finansów',
    bestValue: true,
    popular: true,
    savings: 'Tylko 5 zł więcej!',
    features: [
      'Wszystko z Pro',
      'Nieograniczone cele',
      'Nieograniczone skany',
      'AI Financial Coach',
      'Predykcje wydatków',
      'Eksport danych',
      'Priority support',
    ],
    cta: 'Wybierz Ultimate',
  },
];

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      <MeshBackground />

      {/* Navigation with glassmorphism */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 px-4 py-4"
      >
        <div className="container mx-auto">
          <div className="flex items-center justify-between px-6 py-3 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/5">
            <Link href="/" className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: 10, scale: 1.1 }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30"
              >
                <PiggyBank className="w-5 h-5 text-white" />
              </motion.div>
              <span className="font-bold text-xl">Savori</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" className="text-slate-300 hover:text-white">
                  Zaloguj się
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 shadow-lg shadow-emerald-500/25 border-0">
                  Rozpocznij
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex items-center justify-center pt-24"
      >
        <div className="container mx-auto px-4 text-center relative z-10">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 mb-8"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Powered by AI • Szyfrowanie E2E
            </span>
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-[1.1] tracking-tight"
          >
            Oszczędzaj{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent bg-[size:200%_auto] animate-gradient">
                mądrzej
              </span>
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full origin-left"
              />
            </span>
            <br />
            nie trudniej
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Skanuj paragony, automatyzuj oszczędzanie, osiągaj cele finansowe.
            <br className="hidden sm:block" />
            <span className="text-slate-300">Savori wykorzystuje AI, by pomóc Ci być bogatszym.</span>
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <Link href="/register">
              <Button
                size="lg"
                className="group relative overflow-hidden bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 shadow-2xl shadow-emerald-500/30 border-0 px-8 h-14 text-lg"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Zacznij za darmo
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-slate-700 hover:border-slate-600 hover:bg-slate-800/50 h-14 px-8 text-lg"
            >
              Zobacz demo
            </Button>
          </motion.div>

          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="flex items-center gap-4">
              {/* Avatars */}
              <div className="flex -space-x-3">
                {['🧑', '👩', '👨', '👩‍🦰', '🧔'].map((emoji, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-slate-900 flex items-center justify-center text-lg"
                  >
                    {emoji}
                  </motion.div>
                ))}
              </div>
              <div className="text-left">
                <p className="font-bold text-lg">
                  <span className="text-emerald-400"><AnimatedCounter value={10000} suffix="+" /></span>{' '}
                  użytkowników
                </p>
                <p className="text-sm text-slate-400">oszczędza z Savori</p>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-slate-500 text-sm">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>Zgodność z RODO</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50">
                <Lock className="w-4 h-4 text-cyan-500" />
                <span>Szyfrowanie AES-256</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Darmowy start</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-slate-700 flex items-start justify-center p-2"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-3 bg-emerald-500 rounded-full"
            />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <section className="py-32 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Dlaczego <span className="text-emerald-400">Savori</span>?
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-lg">
              Wyróżnij się od bankowych trybów oszczędzania.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={i * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: 10000, suffix: '+', label: 'Użytkowników', icon: Star },
              { value: 2500000, suffix: ' zł', label: 'Oszczędności', icon: TrendingUp },
              { value: 150000, suffix: '+', label: 'Wydatków', icon: Mic },
              { value: 99, suffix: '%', label: 'Bezpieczeństwa', icon: Shield },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <stat.icon className="w-8 h-8 text-emerald-400 mx-auto mb-4" />
                <div className="text-3xl md:text-4xl font-bold mb-2">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-slate-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-32 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Savori vs Banki
            </h2>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-3 gap-4 mb-4 text-center">
              <div className="font-medium text-slate-400">Funkcja</div>
              <div className="font-medium text-slate-400">Banki</div>
              <div className="font-medium text-emerald-400">Savori</div>
            </div>
            {[
              ['Skanowanie paragonów AI', false, true],
              ['Automatyczne zaokrąglanie', true, true],
              ['Trigger rules', false, true],
              ['Analiza produktów', false, true],
              ['Predykcje AI', false, true],
              ['Szyfrowanie E2E', false, true],
            ].map(([feature, bank, smart], i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 mb-2"
              >
                <div className="text-slate-300">{feature as string}</div>
                <div className="text-center">
                  {bank ? (
                    <Check className="w-5 h-5 text-slate-400 mx-auto" />
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </div>
                <div className="text-center">
                  <Check className="w-5 h-5 text-emerald-400 mx-auto" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-32 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Wybierz plan
            </h2>
            <p className="text-slate-400 text-lg">
              Zacznij za darmo, rozwijaj się gdy potrzebujesz więcej.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -8 }}
                className={`relative p-8 rounded-3xl border transition-all duration-300 ${plan.bestValue
                  ? 'bg-gradient-to-b from-emerald-500/20 via-emerald-500/5 to-transparent border-emerald-500/50 shadow-xl shadow-emerald-500/20 scale-105 md:-mt-4'
                  : plan.decoy
                    ? 'bg-slate-900/50 border-slate-700/50 opacity-90'
                    : 'bg-slate-900/50 border-slate-700/50'
                  }`}
              >
                {/* Best Value Badge */}
                {plan.bestValue && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-sm font-bold shadow-lg flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    NAJLEPSZA WARTOŚĆ
                  </div>
                )}

                {/* Savings callout */}
                {plan.savings && (
                  <div className="absolute -top-2 right-4 px-3 py-1 rounded-full bg-amber-500 text-xs font-bold text-black">
                    {plan.savings}
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className={`font-bold text-xl mb-1 ${plan.bestValue ? 'text-emerald-400' : ''}`}>
                    {plan.name}
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className={`text-5xl font-bold ${plan.bestValue ? 'text-white' : ''}`}>
                      {plan.price}
                    </span>
                    <span className="text-xl text-slate-400 font-normal">zł</span>
                    <span className="text-sm text-slate-500">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm">
                      <Check className={`w-5 h-5 flex-shrink-0 ${plan.bestValue ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <span className={plan.bestValue ? 'text-white' : 'text-slate-300'}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/register">
                  <Button
                    className={`w-full h-12 ${plan.bestValue
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 shadow-lg shadow-emerald-500/25 border-0'
                      : 'bg-slate-800 hover:bg-slate-700 border border-slate-700'
                      }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Trust indicator */}
          <p className="text-center text-slate-500 text-sm mt-12">
            💳 Bez karty kredytowej • Anuluj w każdej chwili
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <motion.div
              animate={{
                boxShadow: ['0 0 60px 20px rgba(16, 185, 129, 0.3)', '0 0 80px 30px rgba(16, 185, 129, 0.5)', '0 0 60px 20px rgba(16, 185, 129, 0.3)']
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center mx-auto mb-8"
            >
              <Zap className="w-12 h-12 text-white" />
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Gotowy by zacząć oszczędzać?
            </h2>
            <p className="text-slate-400 text-lg mb-10">
              Dołącz do tysięcy użytkowników, którzy osiągają swoje cele finansowe z Savori.
            </p>
            <Link href="/register">
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 shadow-2xl shadow-emerald-500/30 border-0 h-14 px-10 text-lg"
              >
                Utwórz darmowe konto
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-800/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                <PiggyBank className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">Savori</span>
            </div>
            <p className="text-slate-500 text-sm">
              © 2024 Savori. Wszystkie prawa zastrzeżone.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
