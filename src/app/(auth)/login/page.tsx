'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Mail, Lock, PiggyBank, ArrowRight, Phone, User, Eye, EyeOff } from 'lucide-react';
import { Button, Input, Card } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

// Animated background orbs
function FloatingOrb({ className, delay = 0 }: { className: string; delay?: number }) {
    return (
        <motion.div
            className={`absolute rounded-full blur-3xl ${className}`}
            animate={{
                y: [0, -20, 0],
                x: [0, 10, 0],
                scale: [1, 1.1, 1],
            }}
            transition={{
                duration: 6 + delay,
                repeat: Infinity,
                ease: "easeInOut",
                delay,
            }}
        />
    );
}

export default function LoginPage() {
    const router = useRouter();
    const { signIn, signInWithGoogle } = useAuth();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [activeTab, setActiveTab] = useState<'email' | 'phone'>('email');
    const [phoneNumber, setPhoneNumber] = useState('');

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error('Please fill in all fields');
            return;
        }

        try {
            setLoading(true);
            await signIn(email, password, rememberMe);
            toast.success('Logged in successfully!');
            router.push('/dashboard');
        } catch (error: unknown) {
            console.error(error);
            toast.error('Login error. Check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            await signInWithGoogle();
            toast.success('Logged in with Google!');
            router.push('/dashboard');
        } catch (error: unknown) {
            console.error(error);
            toast.error('Google login error');
        } finally {
            setLoading(false);
        }
    };

    const handleAppleLogin = async () => {
        toast('Apple Login - coming soon', { icon: '🍎' });
    };

    const handlePhoneLogin = async () => {
        if (!phoneNumber || phoneNumber.length < 9) {
            toast.error('Enter a valid phone number');
            return;
        }
        toast('SMS Verification - coming soon', { icon: '📱' });
    };

    const handleAnonymousLogin = async () => {
        toast('Guest Mode - coming soon', { icon: '👤' });
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 -z-10">
                <FloatingOrb className="top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/15" delay={0} />
                <FloatingOrb className="bottom-1/3 right-1/4 w-[400px] h-[400px] bg-cyan-500/10" delay={2} />
                <FloatingOrb className="top-1/2 right-1/3 w-[300px] h-[300px] bg-violet-500/10" delay={1} />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/0 via-slate-950/80 to-slate-950" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 justify-center mb-8">
                    <motion.div
                        whileHover={{ rotate: 10, scale: 1.1 }}
                        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-xl shadow-emerald-500/30"
                    >
                        <PiggyBank className="w-8 h-8 text-white" />
                    </motion.div>
                    <span className="font-bold text-3xl text-white">Savori</span>
                </Link>

                {/* Main Card */}
                <div className="relative">
                    {/* Glass effect card */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-3xl blur-xl" />
                    <Card className="relative bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold mb-2 text-white">Welcome back!</h1>
                            <p className="text-slate-400">Log in to your account</p>
                        </div>

                        {/* Social Login Buttons */}
                        <div className="space-y-3 mb-6">
                            {/* Google */}
                            <Button
                                variant="outline"
                                className="w-full h-12 bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-white rounded-xl"
                                onClick={handleGoogleLogin}
                                disabled={loading}
                            >
                                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Continue with Google
                            </Button>

                            {/* Apple */}
                            <Button
                                variant="outline"
                                className="w-full h-12 bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-white rounded-xl"
                                onClick={handleAppleLogin}
                                disabled={loading}
                            >
                                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                                </svg>
                                Continue with Apple
                            </Button>

                            {/* Anonymous */}
                            <Button
                                variant="outline"
                                className="w-full h-12 bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-white rounded-xl"
                                onClick={handleAnonymousLogin}
                                disabled={loading}
                            >
                                <User className="w-5 h-5 mr-3" />
                                Continue as Guest
                            </Button>
                        </div>

                        {/* Divider */}
                        <div className="relative mb-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-700/50"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-slate-900/80 text-slate-500">or</span>
                            </div>
                        </div>

                        {/* Tab Switcher */}
                        <div className="flex bg-slate-800/50 rounded-xl p-1 mb-6">
                            <button
                                onClick={() => setActiveTab('email')}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'email'
                                    ? 'bg-emerald-500 text-white shadow-lg'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                <Mail className="w-4 h-4 inline mr-2" />
                                Email
                            </button>
                            <button
                                onClick={() => setActiveTab('phone')}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'phone'
                                    ? 'bg-emerald-500 text-white shadow-lg'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                <Phone className="w-4 h-4 inline mr-2" />
                                Phone
                            </button>
                        </div>

                        {/* Email Login Form */}
                        {activeTab === 'email' && (
                            <motion.form
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                onSubmit={handleEmailLogin}
                                className="space-y-4"
                            >
                                <div className="space-y-2">
                                    <label className="text-sm text-slate-400">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                        <input
                                            type="email"
                                            placeholder="your@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            disabled={loading}
                                            className="w-full h-12 pl-12 pr-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm text-slate-400">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            disabled={loading}
                                            className="w-full h-12 pl-12 pr-12 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    {/* Remember Me */}
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={rememberMe}
                                                onChange={(e) => setRememberMe(e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-5 h-5 rounded-md border border-slate-600 bg-slate-800/50 peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all flex items-center justify-center">
                                                {rememberMe && (
                                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                                            Remember me
                                        </span>
                                    </label>

                                    <Link
                                        href="/forgot-password"
                                        className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 shadow-lg shadow-emerald-500/25 border-0 rounded-xl text-lg font-medium"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            Log In
                                            <ArrowRight className="w-5 h-5 ml-2" />
                                        </>
                                    )}
                                </Button>
                            </motion.form>
                        )}

                        {/* Phone Login Form */}
                        {activeTab === 'phone' && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-4"
                            >
                                <div className="space-y-2">
                                    <label className="text-sm text-slate-400">Phone Number</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-400">
                                            <span className="text-lg">🇵🇱</span>
                                            <span className="text-sm">+48</span>
                                        </div>
                                        <input
                                            type="tel"
                                            placeholder="123 456 789"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            disabled={loading}
                                            className="w-full h-12 pl-24 pr-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                        />
                                    </div>
                                </div>

                                <Button
                                    onClick={handlePhoneLogin}
                                    className="w-full h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 shadow-lg shadow-emerald-500/25 border-0 rounded-xl text-lg font-medium"
                                    disabled={loading}
                                >
                                    Send SMS Code
                                    <Phone className="w-5 h-5 ml-2" />
                                </Button>
                            </motion.div>
                        )}

                        <p className="text-center text-slate-400 text-sm mt-6">
                            Don't have an account?{' '}
                            <Link
                                href="/register"
                                className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                            >
                                Sign Up
                            </Link>
                        </p>
                    </Card>
                </div>

                {/* Trust badges */}
                <div className="flex items-center justify-center gap-4 mt-6 text-slate-500 text-xs">
                    <span className="flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        E2E Encryption
                    </span>
                    <span>•</span>
                    <span>GDPR</span>
                    <span>•</span>
                    <span>Secure Data</span>
                </div>
            </motion.div>
        </div>
    );
}
