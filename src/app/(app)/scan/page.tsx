'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
    Camera,
    Upload,
    X,
    Check,
    Loader2,
    Sparkles,
    RefreshCw,
    Edit3,
    ArrowRight,
    AlertTriangle,
    Lock,
} from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { formatMoney, CATEGORY_LABELS, CATEGORY_ICONS, parseMoneyToCents } from '@/lib/utils';
import { ReceiptExtractionResult } from '@/lib/gemini';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { checkForDuplicate, FraudCheckResult } from '@/lib/fraud-detection';
import { logSecurityEvent, SecurityEvents } from '@/lib/security';
import { useSubscription } from '@/hooks/useSubscription';
import { subscriptionService } from '@/lib/subscription-service';
import UpgradeModal from '@/components/UpgradeModal';

type Step = 'capture' | 'processing' | 'review' | 'saving';

export default function ScanPage() {
    const router = useRouter();
    const { userData } = useAuth();
    const { remainingScans, checkCanScan, incrementScan, isFree, openUpgrade, showUpgradeModal, closeUpgrade, upgradeReason } = useSubscription();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [step, setStep] = useState<Step>('capture');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [extractedData, setExtractedData] = useState<ReceiptExtractionResult['data'] | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [editedData, setEditedData] = useState<{
        merchant: string;
        amount: string;
        category: string;
        date: string;
    } | null>(null);
    const [fraudWarning, setFraudWarning] = useState<FraudCheckResult | null>(null);

    // Handle file selection
    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check scan limit for free users
        if (isFree) {
            const canScan = await checkCanScan();
            if (!canScan) {
                openUpgrade(`Wykorzystałeś limit ${remainingScans} skanów w tym miesiącu. Przejdź na Pro po nielimitowane skany!`);
                return;
            }
        }

        if (!file.type.startsWith('image/')) {
            toast.error('Wybierz plik obrazu');
            return;
        }

        // Check size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast.error('Plik jest za duży (max 10MB)');
            return;
        }

        setImageFile(file);

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        // Start processing
        processReceipt(file);
    }, [isFree, checkCanScan, remainingScans, openUpgrade]);

    // Process receipt with AI
    const processReceipt = async (file: File) => {
        setStep('processing');

        try {
            // Convert to base64
            const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const result = reader.result as string;
                    // Remove data:image/...;base64, prefix
                    resolve(result.split(',')[1]);
                };
                reader.readAsDataURL(file);
            });

            // Call API
            const response = await fetch('/api/scan-receipt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: base64,
                    mimeType: file.type,
                }),
            });

            const result: ReceiptExtractionResult = await response.json();

            if (result.success && result.data) {
                setExtractedData(result.data);
                setEditedData({
                    merchant: result.data.merchant.name,
                    amount: (result.data.totalAmount / 100).toFixed(2),
                    category: result.data.category,
                    date: result.data.date.split('T')[0],
                });
                setStep('review');
                toast.success('Paragon przeanalizowany!');
            } else {
                throw new Error(result.error || 'Nie udało się przetworzyć paragonu');
            }
        } catch (error) {
            console.error('Błąd przetwarzania:', error);
            toast.error('Nie udało się przeanalizować paragonu. Spróbuj ponownie.');
            setStep('capture');
        }
    };

    // Save expense to Firestore
    const saveExpense = async (skipFraudCheck = false) => {
        if (!userData?.id || !editedData || !imageFile) return;

        // Check for duplicates first
        if (!skipFraudCheck) {
            const fraudCheck = await checkForDuplicate(userData.id, {
                merchantName: editedData.merchant,
                amount: parseMoneyToCents(editedData.amount),
                date: new Date(editedData.date),
                itemsCount: extractedData?.items?.length,
            });

            if (fraudCheck.isDuplicate && !fraudCheck.shouldProceed) {
                setFraudWarning(fraudCheck);
                return; // Stop and show warning
            }

            if (fraudCheck.confidence > 50 && !fraudCheck.isDuplicate) {
                // Low confidence warning - show but allow
                toast(fraudCheck.reason || 'Sprawdź czy to nie duplikat', { icon: '⚠️' });
            }
        }

        setStep('saving');
        setFraudWarning(null);

        try {
            // Upload image to Storage
            let receiptUrl = '';
            const storageRef = ref(storage, `users/${userData.id}/receipts/${Date.now()}_${imageFile.name}`);
            await uploadBytes(storageRef, imageFile);
            receiptUrl = await getDownloadURL(storageRef);

            // Prepare expense data
            const expenseData = {
                userId: userData.id,
                createdAt: Timestamp.now(),
                date: Timestamp.fromDate(new Date(editedData.date)),
                merchant: {
                    name: editedData.merchant,
                    nip: extractedData?.merchant.nip || null,
                    address: extractedData?.merchant.address || null,
                    category: editedData.category,
                },
                amount: parseMoneyToCents(editedData.amount),
                currency: extractedData?.currency || 'PLN',
                items: extractedData?.items || [],
                tags: [],
                metadata: {
                    source: 'scan',
                    receiptUrl,
                    aiConfidence: extractedData?.confidence || 0,
                    verified: true,
                },
            };

            // Save to Firestore
            const expensesRef = collection(db, 'users', userData.id, 'expenses');
            await addDoc(expensesRef, expenseData);

            // Increment scan counter for users using the subscription service
            // Note: useSubscription hook's incrementScan might be a wrapper around this, 
            // but for safety/directness we ensure it updates the usage subcollection structure we defined.
            // If incrementScan comes from the hook, it likely uses the service. Let's verify.

            // Actually, we should just use incrementScan() from the useSubscription hook if it is correctly implemented
            // OR use subscriptionService directly if we want to be sure it matches our new logic.
            // Looking at the imports: `import { useSubscription } from '@/hooks/useSubscription';`
            // Let's assume the hook is a wrapper. We'll use the hook's method but if we need to ensure the NEW logic (UserUsage vs Usage subcollection)
            // we might need to update the hook later. For now, let's assume the component code is correct in intent.

            // Wait, I updated subscriptionService to use `usage` field in User doc OR subcollection?
            // I updated `incrementScanCount` in `subscriptionService.ts` to use `usage` map in User doc (UserUsage type).
            // But `useSubscription` hook probably still uses the old logic if I haven't updated it yet.
            // To be safe, let's use subscriptionService DIRECTLY here to ensure the new `UserUsage` schema is respecting.
            // Actually, I can just update the hook later. 
            // BUT this file `ScanPage` already imports `useSubscription`.

            // Let's stick with `incrementScan()` from the hook for now, BUT I need to make sure I update the hook next to use the new service method.
            // OR I can use `subscriptionService.incrementScanCount(userData.id, userData.usage)` here.

            // Let's use subscriptionService explicitly to be safe and remove ambiguity.
            await subscriptionService.incrementScanCount(userData.id, userData.usage);

            // Log security event
            await logSecurityEvent(userData.id, SecurityEvents.receiptScan(editedData.merchant, expenseData.amount));

            toast.success('Wydatek zapisany!');
            router.push('/expenses');
        } catch (error) {
            console.error('Błąd zapisywania:', error);
            toast.error('Nie udało się zapisać wydatku');
            setStep('review');
        }
    };

    // Reset scanner
    const reset = () => {
        setStep('capture');
        setImageFile(null);
        setImagePreview(null);
        setExtractedData(null);
        setEditedData(null);
        setEditMode(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            {/* Upgrade Modal */}
            <UpgradeModal isOpen={showUpgradeModal} onClose={closeUpgrade} reason={upgradeReason} />

            {/* Remaining scans for free users */}
            {isFree && (
                <div className="flex justify-center mb-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
                        <Lock className="w-3 h-3" />
                        Pozostało {remainingScans} skanów w tym miesiącu
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-4">
                    <Sparkles className="w-4 h-4" />
                    Powered by Gemini AI
                </div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Skanuj paragon</h1>
                <p className="text-slate-400">
                    Zrób zdjęcie lub wybierz plik - AI automatycznie wyciągnie dane
                </p>
            </div>

            {/* Step: Capture */}
            <AnimatePresence mode="wait">
                {step === 'capture' && (
                    <motion.div
                        key="capture"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <Card className="p-8">
                            <div
                                className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-2xl p-12 text-center cursor-pointer transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                                    <Camera className="w-10 h-10 text-emerald-400" />
                                </div>
                                <p className="text-lg font-medium mb-2">
                                    Kliknij lub upuść zdjęcie paragonu
                                </p>
                                <p className="text-slate-400 text-sm mb-6">
                                    Obsługiwane formaty: JPG, PNG, WebP (max 10MB)
                                </p>
                                <Button icon={<Upload className="w-5 h-5" />}>
                                    Wybierz plik
                                </Button>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </Card>

                        {/* Tips */}
                        <div className="mt-6 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                            <p className="text-sm text-slate-400">
                                <span className="text-white font-medium">Wskazówka:</span> Dla najlepszych wyników
                                upewnij się, że paragon jest dobrze oświetlony i tekst jest czytelny.
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* Step: Processing */}
                {step === 'processing' && (
                    <motion.div
                        key="processing"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <Card className="p-8 text-center">
                            {imagePreview && (
                                <div className="relative w-48 h-64 mx-auto mb-6 rounded-xl overflow-hidden">
                                    <img
                                        src={imagePreview}
                                        alt="Receipt"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
                                        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
                                <span className="text-lg font-medium">AI analizuje paragon...</span>
                            </div>
                            <p className="text-slate-400 text-sm">
                                Może to potrwać kilka sekund
                            </p>
                        </Card>
                    </motion.div>
                )}

                {/* Step: Review */}
                {step === 'review' && extractedData && editedData && (
                    <motion.div
                        key="review"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold">Sprawdź dane</h2>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" onClick={reset}>
                                        <RefreshCw className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant={editMode ? 'primary' : 'outline'}
                                        size="sm"
                                        onClick={() => setEditMode(!editMode)}
                                    >
                                        <Edit3 className="w-4 h-4 mr-1" />
                                        {editMode ? 'Gotowe' : 'Edytuj'}
                                    </Button>
                                </div>
                            </div>

                            {/* Preview & Data */}
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Image Preview */}
                                {imagePreview && (
                                    <div className="relative rounded-xl overflow-hidden bg-slate-800/50">
                                        <img
                                            src={imagePreview}
                                            alt="Receipt"
                                            className="w-full h-auto"
                                        />
                                        <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-emerald-500/90 text-xs text-white flex items-center gap-1">
                                            <Check className="w-3 h-3" />
                                            {Math.round((extractedData.confidence || 0) * 100)}% pewności
                                        </div>
                                    </div>
                                )}

                                {/* Extracted Data */}
                                <div className="space-y-4">
                                    {editMode ? (
                                        <>
                                            <Input
                                                label="Nazwa sklepu"
                                                value={editedData.merchant}
                                                onChange={(e) => setEditedData({ ...editedData, merchant: e.target.value })}
                                            />
                                            <Input
                                                label="Kwota (PLN)"
                                                type="number"
                                                step="0.01"
                                                value={editedData.amount}
                                                onChange={(e) => setEditedData({ ...editedData, amount: e.target.value })}
                                            />
                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                                    Kategoria
                                                </label>
                                                <select
                                                    value={editedData.category}
                                                    onChange={(e) => setEditedData({ ...editedData, category: e.target.value })}
                                                    className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                                >
                                                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                                                        <option key={key} value={key}>
                                                            {CATEGORY_ICONS[key]} {label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <Input
                                                label="Data"
                                                type="date"
                                                value={editedData.date}
                                                onChange={(e) => setEditedData({ ...editedData, date: e.target.value })}
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <div className="p-4 rounded-xl bg-slate-800/30">
                                                <p className="text-sm text-slate-400 mb-1">Sklep</p>
                                                <p className="font-medium text-lg">{editedData.merchant}</p>
                                                {extractedData.merchant.nip && (
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        NIP: {extractedData.merchant.nip}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="p-4 rounded-xl bg-slate-800/30">
                                                <p className="text-sm text-slate-400 mb-1">Kwota</p>
                                                <p className="font-bold text-2xl text-emerald-400">
                                                    {formatMoney(parseMoneyToCents(editedData.amount))}
                                                </p>
                                            </div>
                                            <div className="p-4 rounded-xl bg-slate-800/30">
                                                <p className="text-sm text-slate-400 mb-1">Kategoria</p>
                                                <p className="font-medium">
                                                    {CATEGORY_ICONS[editedData.category]} {CATEGORY_LABELS[editedData.category]}
                                                </p>
                                            </div>
                                            <div className="p-4 rounded-xl bg-slate-800/30">
                                                <p className="text-sm text-slate-400 mb-1">Data</p>
                                                <p className="font-medium">{editedData.date}</p>
                                            </div>
                                        </>
                                    )}

                                    {/* Items preview */}
                                    {extractedData.items && extractedData.items.length > 0 && (
                                        <div className="p-4 rounded-xl bg-slate-800/30">
                                            <p className="text-sm text-slate-400 mb-2">
                                                Produkty ({extractedData.items.length})
                                            </p>
                                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                                {extractedData.items.slice(0, 5).map((item, i) => (
                                                    <div key={i} className="flex justify-between text-sm">
                                                        <span className="text-slate-300 truncate">{item.name}</span>
                                                        <span className="text-slate-400">{formatMoney(item.totalPrice)}</span>
                                                    </div>
                                                ))}
                                                {extractedData.items.length > 5 && (
                                                    <p className="text-xs text-slate-500">
                                                        +{extractedData.items.length - 5} więcej...
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 mt-6 pt-6 border-t border-slate-700/50">
                                <Button variant="outline" className="flex-1" onClick={reset}>
                                    <X className="w-4 h-4 mr-2" />
                                    Anuluj
                                </Button>
                                <Button className="flex-1" onClick={() => saveExpense()}>
                                    <Check className="w-4 h-4 mr-2" />
                                    Zapisz wydatek
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* Step: Saving */}
                {step === 'saving' && (
                    <motion.div
                        key="saving"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <Card className="p-8 text-center">
                            <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mx-auto mb-4" />
                            <p className="text-lg font-medium">Zapisywanie wydatku...</p>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Fraud Warning Modal */}
            {fraudWarning && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setFraudWarning(null)}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative w-full max-w-md bg-slate-900 border border-red-500/30 rounded-2xl shadow-2xl p-6"
                    >
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="w-8 h-8 text-red-400" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Możliwy duplikat!</h3>
                            <p className="text-slate-400 mb-4">{fraudWarning.reason}</p>
                            <p className="text-sm text-slate-500 mb-6">
                                Pewność: {fraudWarning.confidence}%
                            </p>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setFraudWarning(null)}
                                >
                                    Anuluj
                                </Button>
                                <Button
                                    variant="danger"
                                    className="flex-1"
                                    onClick={() => saveExpense(true)}
                                >
                                    Zapisz mimo to
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

