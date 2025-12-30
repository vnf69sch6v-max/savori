'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Download,
    FileText,
    FileSpreadsheet,
    Calendar,
    Loader2,
    CheckCircle,
    AlertCircle,
    ArrowLeft
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { exportService } from '@/lib/export/export-service';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function ExportPage() {
    const { userData } = useAuth();
    const [format, setFormat] = useState<'csv' | 'report'>('csv');
    const [dateRange, setDateRange] = useState<'month' | 'quarter' | 'year' | 'custom'>('month');
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(1);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        return new Date().toISOString().split('T')[0];
    });
    const [includeItems, setIncludeItems] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [reportPreview, setReportPreview] = useState<string | null>(null);

    // Calculate date range
    const getDateRange = () => {
        const now = new Date();
        let start: Date, end: Date;

        switch (dateRange) {
            case 'month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                start = new Date(now.getFullYear(), quarter * 3, 1);
                end = new Date(now.getFullYear(), quarter * 3 + 3, 0);
                break;
            case 'year':
                start = new Date(now.getFullYear(), 0, 1);
                end = new Date(now.getFullYear(), 11, 31);
                break;
            case 'custom':
            default:
                start = new Date(startDate);
                end = new Date(endDate);
        }

        return { start, end };
    };

    // Handle export
    const handleExport = async () => {
        if (!userData?.id) return;

        setExporting(true);

        try {
            const { start, end } = getDateRange();

            if (format === 'csv') {
                const result = await exportService.exportToCSV({
                    userId: userData.id,
                    startDate: start,
                    endDate: end,
                    format: 'csv',
                    includeItems
                });

                if (result.success && result.data && result.filename) {
                    exportService.downloadFile(result.data, result.filename);
                    toast.success('Eksport zakończony! 📥');
                } else {
                    toast.error(result.error || 'Błąd eksportu');
                }
            } else {
                // Generate report preview
                const month = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
                const report = await exportService.exportSummaryText(userData.id, month);
                setReportPreview(report);
                toast.success('Raport wygenerowany!');
            }
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Błąd podczas eksportu');
        } finally {
            setExporting(false);
        }
    };

    // Download report as text file
    const downloadReport = () => {
        if (!reportPreview) return;
        const { start } = getDateRange();
        const filename = `savori_raport_${start.toISOString().slice(0, 7)}.txt`;
        exportService.downloadFile(reportPreview, filename, 'text/plain;charset=utf-8');
        toast.success('Raport pobrany!');
    };

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/settings" className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                    <ArrowLeft className="w-5 h-5 text-slate-400" />
                </Link>
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                        <Download className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Eksport danych</h1>
                        <p className="text-slate-400">Pobierz swoje wydatki</p>
                    </div>
                </div>
            </div>

            {/* Format Selection */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-lg">Format eksportu</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setFormat('csv')}
                            className={`p-4 rounded-xl border-2 transition-all ${format === 'csv'
                                    ? 'border-emerald-500 bg-emerald-500/10'
                                    : 'border-slate-700 hover:border-slate-600'
                                }`}
                        >
                            <FileSpreadsheet className={`w-8 h-8 mx-auto mb-2 ${format === 'csv' ? 'text-emerald-400' : 'text-slate-400'
                                }`} />
                            <p className="font-medium">CSV</p>
                            <p className="text-xs text-slate-400">Excel / Arkusze</p>
                        </button>

                        <button
                            onClick={() => setFormat('report')}
                            className={`p-4 rounded-xl border-2 transition-all ${format === 'report'
                                    ? 'border-emerald-500 bg-emerald-500/10'
                                    : 'border-slate-700 hover:border-slate-600'
                                }`}
                        >
                            <FileText className={`w-8 h-8 mx-auto mb-2 ${format === 'report' ? 'text-emerald-400' : 'text-slate-400'
                                }`} />
                            <p className="font-medium">Raport</p>
                            <p className="text-xs text-slate-400">Podsumowanie</p>
                        </button>
                    </div>
                </CardContent>
            </Card>

            {/* Date Range */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Zakres dat
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {(['month', 'quarter', 'year', 'custom'] as const).map((range) => (
                            <button
                                key={range}
                                onClick={() => setDateRange(range)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${dateRange === range
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                    }`}
                            >
                                {range === 'month' && 'Ten miesiąc'}
                                {range === 'quarter' && 'Ten kwartał'}
                                {range === 'year' && 'Ten rok'}
                                {range === 'custom' && 'Własny'}
                            </button>
                        ))}
                    </div>

                    {dateRange === 'custom' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Od</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Do</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* CSV Options */}
            {format === 'csv' && (
                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={includeItems}
                                onChange={(e) => setIncludeItems(e.target.checked)}
                                className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                            />
                            <div>
                                <p className="font-medium">Załącz produkty</p>
                                <p className="text-sm text-slate-400">
                                    Dodaj listę produktów z paragonów
                                </p>
                            </div>
                        </label>
                    </CardContent>
                </Card>
            )}

            {/* Export Button */}
            <Button
                className="w-full py-4 text-lg"
                onClick={handleExport}
                disabled={exporting}
            >
                {exporting ? (
                    <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Eksportowanie...
                    </>
                ) : (
                    <>
                        <Download className="w-5 h-5 mr-2" />
                        {format === 'csv' ? 'Pobierz CSV' : 'Generuj raport'}
                    </>
                )}
            </Button>

            {/* Report Preview */}
            {reportPreview && format === 'report' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6"
                >
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">Podgląd raportu</CardTitle>
                            <Button size="sm" onClick={downloadReport}>
                                <Download className="w-4 h-4 mr-1" />
                                Pobierz
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <pre className="text-xs text-slate-300 bg-slate-800/50 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono">
                                {reportPreview}
                            </pre>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </div>
    );
}
