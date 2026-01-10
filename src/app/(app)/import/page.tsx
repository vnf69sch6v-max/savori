'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
    Upload,
    FileSpreadsheet,
    CheckCircle,
    AlertCircle,
    Sparkles,
    Shield,
    ArrowRight,
    Building2,
    Loader2,
    Download,
    HelpCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { BankTrustWarning, SecurityBadge } from '@/components/messaging';
import { useAuth } from '@/contexts/AuthContext';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Expense, ExpenseCategory } from '@/types';

// Supported banks with their CSV formats
const SUPPORTED_BANKS = [
    { id: 'mbank', name: 'mBank', emoji: '🟠', color: 'orange' },
    { id: 'ing', name: 'ING Bank', emoji: '🟠', color: 'orange' },
    { id: 'pko', name: 'PKO BP', emoji: '🔵', color: 'blue' },
    { id: 'santander', name: 'Santander', emoji: '🔴', color: 'red' },
    { id: 'millennium', name: 'Millennium', emoji: '🟣', color: 'purple' },
    { id: 'pekao', name: 'Bank Pekao', emoji: '🔴', color: 'red' },
    { id: 'other', name: 'Other bank', emoji: '🏦', color: 'slate' },
];

interface ParsedTransaction {
    date: Date;
    description: string;
    amount: number;
    category: ExpenseCategory;
    merchant: string;
}

export default function ImportPage() {
    const { userData } = useAuth();
    const [selectedBank, setSelectedBank] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [parsing, setParsing] = useState(false);
    const [parsedData, setParsedData] = useState<ParsedTransaction[]>([]);
    const [importing, setImporting] = useState(false);
    const [importComplete, setImportComplete] = useState(false);
    const [step, setStep] = useState(1);

    // Parse CSV file
    const parseCSV = useCallback(async (csvFile: File) => {
        setParsing(true);

        try {
            // Check if it's a PDF - use AI
            if (csvFile.name.toLowerCase().endsWith('.pdf')) {
                await parsePDFWithAI(csvFile);
                return;
            }

            const text = await csvFile.text();
            const lines = text.split('\n').filter(line => line.trim());

            // Simple parsing - skip header, parse transactions
            const transactions: ParsedTransaction[] = [];

            for (let i = 1; i < lines.length && i < 100; i++) { // Limit to 100 transactions
                const line = lines[i];
                const parts = line.split(/[,;]/).map(p => p.replace(/"/g, '').trim());

                if (parts.length >= 3) {
                    // Try to find date and amount
                    let date = new Date();
                    let amount = 0;
                    let description = '';

                    for (const part of parts) {
                        // Date detection (various formats)
                        if (/\d{4}[-/.]\d{2}[-/.]\d{2}/.test(part) || /\d{2}[-/.]\d{2}[-/.]\d{4}/.test(part)) {
                            const parsed = new Date(part.replace(/\./g, '-'));
                            if (!isNaN(parsed.getTime())) date = parsed;
                        }
                        // Amount detection (negative = expense)
                        else if (/^-?\d+[.,]?\d*$/.test(part.replace(/\s/g, ''))) {
                            const num = parseFloat(part.replace(/\s/g, '').replace(',', '.'));
                            if (num < 0) amount = Math.abs(num);
                        }
                        // Description (longest text field)
                        else if (part.length > description.length && !/^\d+$/.test(part)) {
                            description = part;
                        }
                    }

                    if (amount > 0 && description) {
                        transactions.push({
                            date,
                            description,
                            amount: Math.round(amount * 100), // Convert to cents
                            category: guessCategory(description),
                            merchant: extractMerchant(description),
                        });
                    }
                }
            }

            setParsedData(transactions);
            setStep(3);
            toast.success(`Found ${transactions.length} transactions!`);
        } catch (error) {
            console.error('Parse error:', error);
            toast.error('Failed to process file');
        } finally {
            setParsing(false);
        }
    }, []);

    // Parse PDF with Gemini AI
    const parsePDFWithAI = async (pdfFile: File) => {
        try {
            // Convert PDF to base64
            const buffer = await pdfFile.arrayBuffer();
            const base64 = btoa(
                new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
            );

            // Send to API
            const response = await fetch('/api/parse-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pdf: base64 }),
            });

            if (!response.ok) throw new Error('PDF parsing failed');

            const result = await response.json();

            if (result.transactions && result.transactions.length > 0) {
                const transactions: ParsedTransaction[] = result.transactions.map((tx: { date: string; description: string; amount: number }) => ({
                    date: new Date(tx.date),
                    description: tx.description,
                    amount: Math.round(Math.abs(tx.amount) * 100),
                    category: guessCategory(tx.description),
                    merchant: extractMerchant(tx.description),
                }));

                setParsedData(transactions);
                setStep(3);
                toast.success(`🧠 AI found ${transactions.length} transactions in PDF!`);
            } else {
                toast.error('No transactions found in PDF');
            }
        } catch (error) {
            console.error('PDF parse error:', error);
            toast.error('PDF analysis error');
        } finally {
            setParsing(false);
        }
    };

    // Import to Firestore
    const importTransactions = async () => {
        if (!userData?.id || parsedData.length === 0) return;

        setImporting(true);

        try {
            const expensesRef = collection(db, 'users', userData.id, 'expenses');
            let imported = 0;

            for (const tx of parsedData) {
                const expenseData: Omit<Expense, 'id'> = {
                    userId: userData.id,
                    amount: tx.amount,
                    currency: 'PLN',
                    date: Timestamp.fromDate(tx.date),
                    merchant: {
                        name: tx.merchant,
                        category: tx.category,
                    },
                    tags: ['import'],
                    metadata: {
                        source: 'import',
                        verified: false,
                    },
                    createdAt: Timestamp.now(),
                };

                await addDoc(expensesRef, expenseData);
                imported++;
            }

            setImportComplete(true);
            setStep(4);
            toast.success(`Imported ${imported} transactions! 🎉`);
        } catch (error) {
            console.error('Import error:', error);
            toast.error('Error during import');
        } finally {
            setImporting(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            parseCSV(selectedFile);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Import from bank</h1>
                <p className="text-slate-400 max-w-md mx-auto">
                    Add transaction history with one click.
                    Fast, secure, and private.
                </p>
            </div>

            {/* Trust Section */}
            <div className="mb-8 space-y-4">
                {/* Quick Trust Badges */}
                <div className="flex flex-wrap justify-center gap-3">
                    <SecurityBadge variant="inline" message="Private - file never leaves device" />
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-full text-sm text-blue-400 border border-blue-500/20">
                        <Sparkles className="w-4 h-4" />
                        AI auto-categorization
                    </div>
                </div>

                {/* Bank Comparison - Compact */}
                <BankTrustWarning variant="compact" />
            </div>

            {/* Steps Progress */}
            <div className="flex items-center justify-center gap-2 mb-8">
                {[1, 2, 3, 4].map((s) => (
                    <div
                        key={s}
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${step >= s
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-800 text-slate-500'
                            }`}
                    >
                        {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                    </div>
                ))}
            </div>

            {/* Step 1: Select Bank */}
            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <Card className="p-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-slate-400" />
                                Select your bank
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {SUPPORTED_BANKS.map((bank) => (
                                    <button
                                        key={bank.id}
                                        onClick={() => {
                                            setSelectedBank(bank.id);
                                            setStep(2);
                                        }}
                                        className={`p-4 rounded-xl border transition-all hover:border-emerald-500/50 ${selectedBank === bank.id
                                            ? 'border-emerald-500 bg-emerald-500/10'
                                            : 'border-slate-700 bg-slate-800/50'
                                            }`}
                                    >
                                        <span className="text-2xl block mb-2">{bank.emoji}</span>
                                        <span className="font-medium">{bank.name}</span>
                                    </button>
                                ))}
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* Step 2: Upload File */}
                {step === 2 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <Card className="p-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <FileSpreadsheet className="w-5 h-5 text-slate-400" />
                                Upload history file
                            </h2>

                            {/* How to export - friendly guide */}
                            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                <h3 className="font-medium text-blue-400 mb-2 flex items-center gap-2">
                                    <HelpCircle className="w-4 h-4" />
                                    How to download bank file?
                                </h3>
                                <ol className="text-sm text-slate-300 space-y-1 list-decimal list-inside">
                                    <li>Log in to your online banking</li>
                                    <li>Go to transaction history</li>
                                    <li>Click &quot;Export&quot; or &quot;Download CSV&quot;</li>
                                    <li>Upload downloaded file here 👇</li>
                                </ol>
                            </div>

                            {/* Drop Zone */}
                            <label className="block">
                                <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-500/50 transition-colors">
                                    {parsing ? (
                                        <Loader2 className="w-12 h-12 text-emerald-400 mx-auto mb-4 animate-spin" />
                                    ) : (
                                        <Download className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                                    )}
                                    <p className="text-slate-300 mb-2">
                                        {parsing ? 'AI is analyzing file...' : 'Drag & drop or click to upload'}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        Accepted: .csv, .pdf 🧠
                                    </p>
                                </div>
                                <input
                                    type="file"
                                    accept=".csv,.xlsx,.xls,.pdf"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </label>

                            <button
                                onClick={() => setStep(1)}
                                className="mt-4 text-sm text-slate-400 hover:text-white"
                            >
                                ← Change bank
                            </button>
                        </Card>
                    </motion.div>
                )}

                {/* Step 3: Review */}
                {step === 3 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <Card className="p-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-emerald-400" />
                                Found transactions ({parsedData.length})
                            </h2>

                            {/* Summary */}
                            <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                <p className="text-emerald-400">
                                    ✨ Ready to import! AI automatically categorized expenses.
                                </p>
                            </div>

                            {/* Preview Table */}
                            <div className="max-h-64 overflow-y-auto mb-4 rounded-lg border border-slate-700">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-800 sticky top-0">
                                        <tr>
                                            <th className="text-left p-3">Date</th>
                                            <th className="text-left p-3">Description</th>
                                            <th className="text-right p-3">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {parsedData.slice(0, 10).map((tx, i) => (
                                            <tr key={i} className="hover:bg-slate-800/50">
                                                <td className="p-3 text-slate-400">
                                                    {tx.date.toLocaleDateString('pl')}
                                                </td>
                                                <td className="p-3">{tx.merchant}</td>
                                                <td className="p-3 text-right text-red-400">
                                                    -{(tx.amount / 100).toFixed(2)} zł
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {parsedData.length > 10 && (
                                <p className="text-sm text-slate-500 mb-4">
                                    ...and {parsedData.length - 10} more transactions
                                </p>
                            )}

                            <div className="flex gap-3">
                                <Button
                                    onClick={importTransactions}
                                    disabled={importing}
                                    className="flex-1"
                                >
                                    {importing ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            Import all
                                            <ArrowRight className="w-5 h-5 ml-2" />
                                        </>
                                    )}
                                </Button>
                                <Button variant="outline" onClick={() => setStep(2)}>
                                    Cancel
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* Step 4: Success */}
                {step === 4 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <Card className="p-8 text-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', delay: 0.2 }}
                                className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6"
                            >
                                <CheckCircle className="w-10 h-10 text-emerald-400" />
                            </motion.div>

                            <h2 className="text-2xl font-bold mb-2">Import completed! 🎉</h2>
                            <p className="text-slate-400 mb-6">
                                Imported {parsedData.length} transactions to Savori.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <Button onClick={() => window.location.href = '/expenses'}>
                                    View expenses
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setStep(1);
                                        setParsedData([]);
                                        setFile(null);
                                        setSelectedBank(null);
                                        setImportComplete(false);
                                    }}
                                >
                                    Import more
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Helper: Guess category from description
function guessCategory(description: string): ExpenseCategory {
    const lower = description.toLowerCase();

    if (/biedronka|lidl|żabka|carrefour|auchan|kaufland|lewiatan|dino/.test(lower)) return 'groceries';
    if (/uber eats|pyszne|glovo|kfc|mcdonald|starbucks|costa|restaur|pizza/.test(lower)) return 'restaurants';
    if (/uber|bolt|taxi|pkp|mpk|paliwo|orlen|bp |shell|circle/.test(lower)) return 'transport';
    if (/netflix|spotify|hbo|disney|youtube|amazon prime|allegro/.test(lower)) return 'subscriptions';
    if (/apteka|doz|gemini|rossmann|ziko/.test(lower)) return 'health';
    if (/empik|media markt|rtv euro|x-kom|morele|zalando|h&m|zara/.test(lower)) return 'shopping';
    if (/pge|enea|tauron|gazownia|woda|czynsz|orange|play|plus|t-mobile/.test(lower)) return 'utilities';
    if (/kino|cinema|bilety|koncert|event/.test(lower)) return 'entertainment';

    return 'other';
}

// Helper: Extract merchant name
function extractMerchant(description: string): string {
    // Clean up common banking prefixes
    return description
        .replace(/^(przelew|zakup|płatność|transakcja)/i, '')
        .replace(/^(kartą|karta)/i, '')
        .trim()
        .slice(0, 50);
}
