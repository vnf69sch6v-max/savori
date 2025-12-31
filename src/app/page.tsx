'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui';
import {
  Sparkles,
  Camera,
  Target,
  LineChart,
  Shield,
  Zap,
  ArrowRight,
  Check,
  PiggyBank,
} from 'lucide-react';

const features = [
  {
    icon: Camera,
    title: 'Skanowanie AI',
    description: 'Zrób zdjęcie paragonu - AI wyciągnie wszystkie dane w sekundę.',
  },
  {
    icon: Target,
    title: 'Inteligentne Cele',
    description: 'Zaokrąglanie, procent od wydatków, trigery - oszczędzaj automatycznie.',
  },
  {
    icon: LineChart,
    title: 'Głęboka Analityka',
    description: 'Raporty dzienne, tygodniowe, miesięczne. Dowiedz się gdzie idą Twoje pieniądze.',
  },
  {
    icon: Shield,
    title: 'Bezpieczeństwo',
    description: 'Twoje dane są szyfrowane i bezpieczne. Zgodność z RODO.',
  },
];

const plans = [
  {
    name: 'Free',
    price: '0',
    features: ['1 cel oszczędnościowy', '10 skanów/miesiąc', 'Podstawowe statystyki'],
  },
  {
    name: 'Pro',
    price: '19.99',
    popular: true,
    features: ['Nieograniczone cele', '100 skanów/miesiąc', 'Automatyczne reguły', 'Weekly reports'],
  },
  {
    name: 'Premium',
    price: '39.99',
    features: ['Wszystko z Pro', 'Nieograniczone skany', 'AI Insights', 'Priority support'],
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px]" />
        </div>

        {/* Navigation */}
        <nav className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <PiggyBank className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl">Savori</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Zaloguj się</Button>
            </Link>
            <Link href="/register">
              <Button>Rozpocznij</Button>
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="container mx-auto px-4 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-8">
              <Sparkles className="w-4 h-4" />
              Powered by AI
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
          >
            Oszczędzaj <span className="gradient-text">mądrzej</span>,
            <br />
            nie trudniej
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-slate-400 max-w-2xl mx-auto mb-12"
          >
            Skanuj paragony, automatyzuj oszczędzanie, osiągaj cele finansowe.
            Savori wykorzystuje AI, by pomóc Ci być bogatszym.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Zacznij za darmo
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              Zobacz demo
            </Button>
          </motion.div>

          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-12 flex flex-col items-center gap-4"
          >
            <div className="flex items-center gap-3">
              {/* Avatars */}
              <div className="flex -space-x-3">
                {['🧑', '👩', '👨', '👩‍🦰', '🧔'].map((emoji, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-slate-900 flex items-center justify-center text-lg"
                  >
                    {emoji}
                  </div>
                ))}
              </div>
              <div className="text-left">
                <p className="font-bold text-lg">
                  <span className="text-emerald-400">10 000+</span> użytkowników
                </p>
                <p className="text-sm text-slate-400">oszczędza z Savori</p>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center gap-6 text-slate-500 text-sm">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>Zgodność z RODO</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Darmowy start</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Dlaczego Savori?
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Wyróżnij się od bankowych trybów oszczędzania.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-emerald-500/50 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Savori vs Banki
            </h2>
          </div>

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
              ['Multi-cel równoczesny', false, true],
            ].map(([feature, bank, smart], i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 mb-2"
              >
                <div className="text-slate-300">{feature}</div>
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
      <section className="py-24 bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Wybierz plan
            </h2>
            <p className="text-slate-400">
              Zacznij za darmo, rozwijaj się gdy potrzebujesz więcej.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`relative p-6 rounded-2xl border ${plan.popular
                  ? 'bg-gradient-to-b from-emerald-500/10 to-transparent border-emerald-500/50'
                  : 'bg-slate-800/50 border-slate-700/50'
                  }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500 text-xs font-medium">
                    Najpopularniejszy
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="font-semibold text-lg mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold">
                    {plan.price}
                    <span className="text-lg text-slate-400 font-normal"> zł/msc</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span className="text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <Button
                    variant={plan.popular ? 'primary' : 'outline'}
                    className="w-full"
                  >
                    {plan.price === '0' ? 'Zacznij za darmo' : 'Wybierz plan'}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto mb-8 animate-pulse-glow">
              <Zap className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Gotowy by zacząć oszczędzać?
            </h2>
            <p className="text-slate-400 mb-8">
              Dołącz do tysięcy użytkowników, którzy osiągają swoje cele finansowe z Savori.
            </p>
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Utwórz darmowe konto
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
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
