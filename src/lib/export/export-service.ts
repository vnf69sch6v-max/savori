/**
 * Savori Export Service
 * Export expenses to CSV/PDF
 */

import { Expense, ExpenseCategory } from '@/types';
import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { jsPDF } from 'jspdf';

// ============ TYPES ============

export interface ExportOptions {
    userId: string;
    startDate: Date;
    endDate: Date;
    format: 'csv' | 'pdf';
    includeItems?: boolean;
}

export interface ExportResult {
    success: boolean;
    data?: string | Blob;
    filename?: string;
    error?: string;
}

// ============ CATEGORY LABELS ============

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
    groceries: 'Zakupy spozywcze',
    restaurants: 'Restauracje',
    transport: 'Transport',
    utilities: 'Oplaty',
    entertainment: 'Rozrywka',
    shopping: 'Zakupy',
    health: 'Zdrowie',
    education: 'Edukacja',
    subscriptions: 'Subskrypcje',
    other: 'Inne',
};

// ============ EXPORT SERVICE ============

class ExportService {

    /**
     * Export expenses to CSV
     */
    async exportToCSV(options: ExportOptions): Promise<ExportResult> {
        try {
            const expenses = await this.fetchExpenses(options);

            if (expenses.length === 0) {
                return { success: false, error: 'Brak wydatków w wybranym okresie' };
            }

            // CSV Header
            const headers = [
                'Data',
                'Sklep',
                'Kategoria',
                'Kwota (PLN)',
                'Notatki',
                'Tagi'
            ];

            if (options.includeItems) {
                headers.push('Produkty');
            }

            // CSV Rows
            const rows = expenses.map(expense => {
                const date = expense.date?.toDate
                    ? expense.date.toDate()
                    : new Date(expense.date as unknown as string);

                const row = [
                    this.formatDate(date),
                    expense.merchant?.name || 'Nieznany',
                    CATEGORY_LABELS[expense.merchant?.category || 'other'],
                    this.formatAmount(expense.amount),
                    expense.notes || '',
                    (expense.tags || []).join(', ')
                ];

                if (options.includeItems) {
                    const itemsStr = (expense.items || [])
                        .map(item => `${item.name} x${item.quantity}`)
                        .join('; ');
                    row.push(itemsStr);
                }

                return row;
            });

            // Build CSV
            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            ].join('\n');

            // Add BOM for Excel compatibility
            const bom = '\uFEFF';
            const csvWithBom = bom + csvContent;

            const filename = `savori_wydatki_${this.formatDateForFilename(options.startDate)}_${this.formatDateForFilename(options.endDate)}.csv`;

            return {
                success: true,
                data: csvWithBom,
                filename
            };
        } catch (error) {
            console.error('Export to CSV error:', error);
            return { success: false, error: 'Blad podczas eksportu' };
        }
    }

    /**
     * Export expenses to PDF
     */
    async exportToPDF(options: ExportOptions): Promise<ExportResult> {
        try {
            const expenses = await this.fetchExpenses(options);

            if (expenses.length === 0) {
                return { success: false, error: 'Brak wydatkow w wybranym okresie' };
            }

            const doc = new jsPDF();
            let yPos = 20;

            // Title
            doc.setFontSize(18);
            doc.text('SAVORI - Raport Wydatkow', 105, yPos, { align: 'center' });
            yPos += 10;

            // Date range
            doc.setFontSize(10);
            doc.text(
                `${this.formatDate(options.startDate)} - ${this.formatDate(options.endDate)}`,
                105,
                yPos,
                { align: 'center' }
            );
            yPos += 15;

            // Summary
            const total = expenses.reduce((sum, e) => sum + e.amount, 0);
            doc.setFontSize(12);
            doc.text(`Laczne wydatki: ${this.formatAmount(total)} PLN`, 20, yPos);
            yPos += 8;
            doc.text(`Liczba transakcji: ${expenses.length}`, 20, yPos);
            yPos += 15;

            // Category breakdown
            const byCategory: Record<string, number> = {};
            expenses.forEach(e => {
                const cat = e.merchant?.category || 'other';
                byCategory[cat] = (byCategory[cat] || 0) + e.amount;
            });

            doc.setFontSize(14);
            doc.text('Kategorie:', 20, yPos);
            yPos += 8;

            doc.setFontSize(10);
            Object.entries(byCategory)
                .sort((a, b) => b[1] - a[1])
                .forEach(([cat, amount]) => {
                    const label = CATEGORY_LABELS[cat as ExpenseCategory] || cat;
                    const percent = ((amount / total) * 100).toFixed(1);
                    doc.text(`${label}: ${this.formatAmount(amount)} PLN (${percent}%)`, 25, yPos);
                    yPos += 6;
                });

            yPos += 10;

            // Expense table
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }

            doc.setFontSize(14);
            doc.text('Szczegoly transakcji:', 20, yPos);
            yPos += 8;

            doc.setFontSize(9);
            // Table header
            doc.text('Data', 20, yPos);
            doc.text('Sklep', 50, yPos);
            doc.text('Kategoria', 100, yPos);
            doc.text('Kwota', 150, yPos);
            yPos += 5;

            // Table rows
            expenses.slice(0, 50).forEach(expense => { // Limit to 50 for PDF size
                if (yPos > 280) {
                    doc.addPage();
                    yPos = 20;
                }

                const date = expense.date?.toDate?.() || new Date();
                doc.text(this.formatDate(date), 20, yPos);
                doc.text((expense.merchant?.name || 'Nieznany').substring(0, 20), 50, yPos);
                doc.text(CATEGORY_LABELS[expense.merchant?.category || 'other'].substring(0, 15), 100, yPos);
                doc.text(`${this.formatAmount(expense.amount)} PLN`, 150, yPos);
                yPos += 5;
            });

            if (expenses.length > 50) {
                yPos += 5;
                doc.text(`... i ${expenses.length - 50} wiecej transakcji`, 20, yPos);
            }

            // Footer
            doc.setFontSize(8);
            doc.text(
                `Wygenerowano przez Savori - ${new Date().toLocaleDateString('pl-PL')}`,
                105,
                285,
                { align: 'center' }
            );

            const pdfBlob = doc.output('blob');
            const filename = `savori_raport_${this.formatDateForFilename(options.startDate)}_${this.formatDateForFilename(options.endDate)}.pdf`;

            return {
                success: true,
                data: pdfBlob,
                filename
            };
        } catch (error) {
            console.error('Export to PDF error:', error);
            return { success: false, error: 'Blad podczas generowania PDF' };
        }
    }

    /**
     * Generate monthly summary report
     */
    async generateMonthlySummary(userId: string, month: string): Promise<{
        totalSpent: number;
        byCategory: Record<string, { amount: number; count: number }>;
        topMerchants: Array<{ name: string; amount: number; count: number }>;
        expenseCount: number;
        dailyAverage: number;
    }> {
        const [year, monthNum] = month.split('-').map(Number);
        const startDate = new Date(year, monthNum - 1, 1);
        const endDate = new Date(year, monthNum, 0, 23, 59, 59);

        const expenses = await this.fetchExpenses({
            userId,
            startDate,
            endDate,
            format: 'csv'
        });

        const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
        const expenseCount = expenses.length;
        const daysInMonth = endDate.getDate();
        const dailyAverage = expenseCount > 0 ? totalSpent / daysInMonth : 0;

        // By category
        const byCategory: Record<string, { amount: number; count: number }> = {};
        expenses.forEach(e => {
            const cat = e.merchant?.category || 'other';
            if (!byCategory[cat]) byCategory[cat] = { amount: 0, count: 0 };
            byCategory[cat].amount += e.amount;
            byCategory[cat].count++;
        });

        // Top merchants
        const merchantMap: Record<string, { amount: number; count: number }> = {};
        expenses.forEach(e => {
            const name = e.merchant?.name || 'Nieznany';
            if (!merchantMap[name]) merchantMap[name] = { amount: 0, count: 0 };
            merchantMap[name].amount += e.amount;
            merchantMap[name].count++;
        });

        const topMerchants = Object.entries(merchantMap)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 10);

        return {
            totalSpent,
            byCategory,
            topMerchants,
            expenseCount,
            dailyAverage
        };
    }

    /**
     * Export summary as text (for PDF or display)
     */
    async exportSummaryText(userId: string, month: string): Promise<string> {
        const summary = await this.generateMonthlySummary(userId, month);

        const [year, monthNum] = month.split('-').map(Number);
        const monthNames = ['Styczen', 'Luty', 'Marzec', 'Kwiecien', 'Maj', 'Czerwiec',
            'Lipiec', 'Sierpien', 'Wrzesien', 'Pazdziernik', 'Listopad', 'Grudzien'];

        let text = `
╔════════════════════════════════════════╗
║     SAVORI - RAPORT MIESIĘCZNY         ║
╠════════════════════════════════════════╣
║  ${monthNames[monthNum - 1]} ${year}
╚════════════════════════════════════════╝

📊 PODSUMOWANIE
───────────────────────────────────────
Laczne wydatki:    ${this.formatAmount(summary.totalSpent)} PLN
Liczba transakcji: ${summary.expenseCount}
Srednia dzienna:   ${this.formatAmount(summary.dailyAverage)} PLN

📁 WYDATKI WG KATEGORII
───────────────────────────────────────
`;

        Object.entries(summary.byCategory)
            .sort((a, b) => b[1].amount - a[1].amount)
            .forEach(([cat, data]) => {
                const label = CATEGORY_LABELS[cat as ExpenseCategory] || cat;
                const percent = ((data.amount / summary.totalSpent) * 100).toFixed(1);
                text += `${label.padEnd(20)} ${this.formatAmount(data.amount).padStart(10)} PLN  (${percent}%)\n`;
            });

        text += `
🏪 TOP SKLEPY
───────────────────────────────────────
`;

        summary.topMerchants.slice(0, 5).forEach((m, i) => {
            text += `${(i + 1)}. ${m.name.padEnd(20)} ${this.formatAmount(m.amount).padStart(10)} PLN\n`;
        });

        text += `
───────────────────────────────────────
Wygenerowano przez Savori
`;

        return text;
    }

    // ============ HELPERS ============

    private async fetchExpenses(options: ExportOptions): Promise<Expense[]> {
        const expensesRef = collection(db, 'users', options.userId, 'expenses');
        const q = query(
            expensesRef,
            where('date', '>=', Timestamp.fromDate(options.startDate)),
            where('date', '<=', Timestamp.fromDate(options.endDate)),
            orderBy('date', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Expense[];
    }

    private formatAmount(amount: number): string {
        return (amount / 100).toFixed(2).replace('.', ',');
    }

    private formatDate(date: Date): string {
        return date.toLocaleDateString('pl-PL');
    }

    private formatDateForFilename(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    /**
     * Trigger download of export file
     */
    downloadFile(data: string | Blob, filename: string, mimeType = 'text/csv;charset=utf-8') {
        const blob = typeof data === 'string' ? new Blob([data], { type: mimeType }) : data;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// Singleton export
export const exportService = new ExportService();

