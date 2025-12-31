'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText,
    Copy,
    Download,
    Check,
    Sparkles,
    X,
    Building2,
    Calendar,
    User,
    MessageSquare
} from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';
import toast from 'react-hot-toast';

type LetterType = 'credit_holiday' | 'rate_negotiation' | 'subscription_cancel';

interface LetterTemplate {
    id: LetterType;
    name: string;
    description: string;
    emoji: string;
    fields: Array<{
        id: string;
        label: string;
        placeholder: string;
        type: 'text' | 'date' | 'textarea' | 'number';
        required?: boolean;
    }>;
    generateContent: (data: Record<string, string>) => string;
}

const LETTER_TEMPLATES: LetterTemplate[] = [
    {
        id: 'credit_holiday',
        name: 'Wakacje kredytowe',
        description: 'Wniosek o zawieszenie spłaty rat',
        emoji: '🏖️',
        fields: [
            { id: 'bankName', label: 'Nazwa banku', placeholder: 'np. PKO BP', type: 'text', required: true },
            { id: 'fullName', label: 'Imię i nazwisko', placeholder: 'Jan Kowalski', type: 'text', required: true },
            { id: 'contractNumber', label: 'Nr umowy kredytowej', placeholder: 'np. 123456789', type: 'text', required: true },
            { id: 'suspensionMonths', label: 'Liczba miesięcy zawieszenia', placeholder: '3', type: 'number', required: true },
            { id: 'reason', label: 'Uzasadnienie', placeholder: 'Trudna sytuacja finansowa...', type: 'textarea', required: true },
        ],
        generateContent: (data) => `${data.fullName}
${new Date().toLocaleDateString('pl-PL')}

${data.bankName}
Departament Obsługi Kredytów

WNIOSEK O ZAWIESZENIE SPŁATY RAT KREDYTU
(Wakacje Kredytowe)

Dotyczy umowy kredytowej nr: ${data.contractNumber}

Szanowni Państwo,

Zwracam się z uprzejmą prośbą o zawieszenie spłaty rat mojego kredytu na okres ${data.suspensionMonths} miesięcy, licząc od najbliższego terminu płatności.

Uzasadnienie wniosku:
${data.reason}

Proszę o pozytywne rozpatrzenie mojego wniosku oraz o pisemne potwierdzenie zawieszenia spłaty wraz z nowym harmonogramem.

Jednocześnie deklaruję, że po zakończeniu okresu zawieszenia będę kontynuować regularne spłaty zgodnie z umową.

Z poważaniem,

${data.fullName}

Załączniki:
- Kopia dowodu osobistego
- Dokumenty potwierdzające sytuację finansową`
    },
    {
        id: 'rate_negotiation',
        name: 'Renegocjacja raty',
        description: 'Wniosek o obniżenie raty miesięcznej',
        emoji: '💰',
        fields: [
            { id: 'bankName', label: 'Nazwa banku', placeholder: 'np. mBank', type: 'text', required: true },
            { id: 'fullName', label: 'Imię i nazwisko', placeholder: 'Jan Kowalski', type: 'text', required: true },
            { id: 'contractNumber', label: 'Nr umowy', placeholder: 'np. 123456789', type: 'text', required: true },
            { id: 'currentRate', label: 'Obecna rata (zł)', placeholder: '1500', type: 'number', required: true },
            { id: 'desiredRate', label: 'Proponowana rata (zł)', placeholder: '1200', type: 'number', required: true },
            { id: 'reason', label: 'Uzasadnienie', placeholder: 'Zmiana sytuacji zawodowej...', type: 'textarea', required: true },
        ],
        generateContent: (data) => `${data.fullName}
${new Date().toLocaleDateString('pl-PL')}

${data.bankName}
Departament Restrukturyzacji

WNIOSEK O RENEGOCJACJĘ WARUNKÓW KREDYTU

Dotyczy umowy nr: ${data.contractNumber}

Szanowni Państwo,

Zwracam się z prośbą o renegocjację warunków spłaty kredytu, a w szczególności o obniżenie miesięcznej raty z obecnych ${data.currentRate} zł do ${data.desiredRate} zł.

Uzasadnienie:
${data.reason}

Proponowane rozwiązanie pozwoli mi na terminową realizację zobowiązań i uniknięcie zaległości.

Proszę o kontakt w celu omówienia możliwych opcji.

Z poważaniem,
${data.fullName}`
    },
    {
        id: 'subscription_cancel',
        name: 'Anulowanie subskrypcji',
        description: 'Wypowiedzenie umowy subskrypcyjnej',
        emoji: '✂️',
        fields: [
            { id: 'serviceName', label: 'Nazwa usługi', placeholder: 'np. Netflix, Spotify', type: 'text', required: true },
            { id: 'fullName', label: 'Imię i nazwisko', placeholder: 'Jan Kowalski', type: 'text', required: true },
            { id: 'email', label: 'Email konta', placeholder: 'jan@email.com', type: 'text', required: true },
            { id: 'accountId', label: 'ID konta (opcjonalnie)', placeholder: 'np. 12345', type: 'text' },
        ],
        generateContent: (data) => `Temat: Wypowiedzenie subskrypcji - ${data.serviceName}

Dzień dobry,

Proszę o natychmiastowe anulowanie mojej subskrypcji.

Dane konta:
- Imię i nazwisko: ${data.fullName}
- Email: ${data.email}
${data.accountId ? `- ID konta: ${data.accountId}` : ''}

Proszę o:
1. Potwierdzenie anulowania subskrypcji
2. Informację o dacie zakończenia dostępu
3. Zwrot środków za niewykorzystany okres (jeśli dotyczy)

Dziękuję,
${data.fullName}`
    }
];

interface LetterGeneratorProps {
    isOpen: boolean;
    onClose: () => void;
    defaultType?: LetterType;
}

export default function LetterGenerator({ isOpen, onClose, defaultType }: LetterGeneratorProps) {
    const [selectedTemplate, setSelectedTemplate] = useState<LetterTemplate | null>(
        defaultType ? LETTER_TEMPLATES.find(t => t.id === defaultType) || null : null
    );
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [generatedLetter, setGeneratedLetter] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleFieldChange = (fieldId: string, value: string) => {
        setFormData(prev => ({ ...prev, [fieldId]: value }));
    };

    const handleGenerate = () => {
        if (!selectedTemplate) return;

        // Check required fields
        const missingFields = selectedTemplate.fields
            .filter(f => f.required && !formData[f.id])
            .map(f => f.label);

        if (missingFields.length > 0) {
            toast.error(`Wypełnij: ${missingFields.join(', ')}`);
            return;
        }

        const letter = selectedTemplate.generateContent(formData);
        setGeneratedLetter(letter);
    };

    const handleCopy = async () => {
        if (!generatedLetter) return;

        await navigator.clipboard.writeText(generatedLetter);
        setCopied(true);
        toast.success('Skopiowano do schowka!');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        if (!generatedLetter || !selectedTemplate) return;

        const blob = new Blob([generatedLetter], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedTemplate.id}_${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Pobrano plik!');
    };

    const handleBack = () => {
        setGeneratedLetter(null);
        setSelectedTemplate(null);
        setFormData({});
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-2xl max-h-[90vh] overflow-auto bg-slate-900 border border-slate-700 rounded-2xl"
                >
                    {/* Header */}
                    <div className="sticky top-0 z-10 p-4 bg-slate-900/95 backdrop-blur border-b border-slate-700 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <h2 className="font-bold">Generator pism</h2>
                                <p className="text-xs text-slate-400">AI tworzy pisma za Ciebie</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6">
                        {/* Step 1: Select template */}
                        {!selectedTemplate && !generatedLetter && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-purple-400" />
                                    Wybierz rodzaj pisma
                                </h3>
                                {LETTER_TEMPLATES.map((template) => (
                                    <motion.button
                                        key={template.id}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        onClick={() => setSelectedTemplate(template)}
                                        className="w-full p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-xl text-left transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{template.emoji}</span>
                                            <div>
                                                <h4 className="font-semibold">{template.name}</h4>
                                                <p className="text-sm text-slate-400">{template.description}</p>
                                            </div>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        )}

                        {/* Step 2: Fill form */}
                        {selectedTemplate && !generatedLetter && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="text-3xl">{selectedTemplate.emoji}</span>
                                    <div>
                                        <h3 className="text-lg font-semibold">{selectedTemplate.name}</h3>
                                        <p className="text-sm text-slate-400">{selectedTemplate.description}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {selectedTemplate.fields.map((field) => (
                                        <div key={field.id}>
                                            <label className="block text-sm font-medium text-slate-300 mb-1">
                                                {field.label} {field.required && <span className="text-red-400">*</span>}
                                            </label>
                                            {field.type === 'textarea' ? (
                                                <textarea
                                                    value={formData[field.id] || ''}
                                                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                                    placeholder={field.placeholder}
                                                    rows={4}
                                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                                                />
                                            ) : (
                                                <input
                                                    type={field.type}
                                                    value={formData[field.id] || ''}
                                                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                                    placeholder={field.placeholder}
                                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button variant="outline" onClick={handleBack} className="flex-1">
                                        Wróć
                                    </Button>
                                    <Button onClick={handleGenerate} className="flex-1">
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Generuj pismo
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Generated letter */}
                        {generatedLetter && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Check className="w-5 h-5 text-emerald-400" />
                                    Pismo gotowe!
                                </h3>

                                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 max-h-80 overflow-auto">
                                    <pre className="whitespace-pre-wrap text-sm text-slate-300 font-mono">
                                        {generatedLetter}
                                    </pre>
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={handleCopy}
                                        className="flex-1"
                                    >
                                        {copied ? (
                                            <>
                                                <Check className="w-4 h-4 mr-2" />
                                                Skopiowano!
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-4 h-4 mr-2" />
                                                Kopiuj
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        onClick={handleDownload}
                                        className="flex-1"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Pobierz .txt
                                    </Button>
                                </div>

                                <Button
                                    variant="ghost"
                                    onClick={handleBack}
                                    className="w-full"
                                >
                                    Stwórz nowe pismo
                                </Button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
