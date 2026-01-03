/**
 * Savori Statistics Library
 * Mathematical foundation for AI predictions and anomaly detection
 * 
 * @description Provides robust statistical functions for financial analysis:
 * - Z-Score for anomaly detection
 * - Linear Regression for trend prediction
 * - Weighted Moving Average for smoothing
 * - Volatility calculation for confidence intervals
 */

// ============ TYPES ============

export interface LinearRegressionResult {
    slope: number;           // Rate of change (positive = increasing trend)
    intercept: number;       // Y-intercept
    rSquared: number;        // Goodness of fit (0-1, higher = better)
    predict: (x: number) => number;  // Prediction function
    trend: 'up' | 'down' | 'stable';
    confidence: number;      // Based on R² and sample size
}

export interface TimeSeriesPoint {
    timestamp: number;       // Unix timestamp (ms)
    value: number;
}

export interface StatsSummary {
    mean: number;
    median: number;
    stdDev: number;
    variance: number;
    min: number;
    max: number;
    count: number;
}

// ============ CORE STATISTICS ============

/**
 * Calculate basic statistical summary
 */
export function calculateStats(values: number[]): StatsSummary {
    if (values.length === 0) {
        return { mean: 0, median: 0, stdDev: 0, variance: 0, min: 0, max: 0, count: 0 };
    }

    const n = values.length;
    const sorted = [...values].sort((a, b) => a - b);

    // Mean
    const mean = values.reduce((sum, v) => sum + v, 0) / n;

    // Median
    const mid = Math.floor(n / 2);
    const median = n % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];

    // Variance and StdDev (sample variance with Bessel's correction)
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = n > 1
        ? squaredDiffs.reduce((sum, d) => sum + d, 0) / (n - 1)
        : 0;
    const stdDev = Math.sqrt(variance);

    return {
        mean,
        median,
        stdDev,
        variance,
        min: sorted[0],
        max: sorted[n - 1],
        count: n,
    };
}

/**
 * Calculate Z-Score for a value against a dataset
 * Z-Score > 2.0 indicates a significant anomaly (95th percentile)
 * Z-Score > 3.0 indicates an extreme anomaly (99.7th percentile)
 */
export function calculateZScore(value: number, history: number[]): number {
    if (history.length < 3) {
        // Not enough data for meaningful Z-score
        return 0;
    }

    const stats = calculateStats(history);

    if (stats.stdDev === 0) {
        // All values are the same - any deviation is infinite
        return value === stats.mean ? 0 : (value > stats.mean ? 3 : -3);
    }

    return (value - stats.mean) / stats.stdDev;
}

/**
 * Modified Z-Score using Median Absolute Deviation (MAD)
 * More robust against outliers in the baseline data
 */
export function calculateRobustZScore(value: number, history: number[]): number {
    if (history.length < 3) return 0;

    const sorted = [...history].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];

    // Calculate MAD (Median Absolute Deviation)
    const absoluteDeviations = history.map(v => Math.abs(v - median));
    const sortedDeviations = [...absoluteDeviations].sort((a, b) => a - b);
    const madMid = Math.floor(sortedDeviations.length / 2);
    const mad = sortedDeviations.length % 2 === 0
        ? (sortedDeviations[madMid - 1] + sortedDeviations[madMid]) / 2
        : sortedDeviations[madMid];

    if (mad === 0) {
        return value === median ? 0 : (value > median ? 3 : -3);
    }

    // 0.6745 is constant that makes MAD consistent with standard deviation
    return 0.6745 * (value - median) / mad;
}

// ============ REGRESSION ============

/**
 * Simple Linear Regression
 * Fits y = mx + b to the data points
 */
export function linearRegression(points: TimeSeriesPoint[]): LinearRegressionResult {
    if (points.length < 2) {
        return {
            slope: 0,
            intercept: 0,
            rSquared: 0,
            predict: () => 0,
            trend: 'stable',
            confidence: 0,
        };
    }

    const n = points.length;

    // Normalize timestamps to avoid numerical issues with large numbers
    const minTime = Math.min(...points.map(p => p.timestamp));
    const normalizedPoints = points.map(p => ({
        x: (p.timestamp - minTime) / (1000 * 60 * 60 * 24), // Convert to days
        y: p.value,
    }));

    // Calculate means
    const xMean = normalizedPoints.reduce((sum, p) => sum + p.x, 0) / n;
    const yMean = normalizedPoints.reduce((sum, p) => sum + p.y, 0) / n;

    // Calculate slope and intercept
    let numerator = 0;
    let denominator = 0;
    let ssTotal = 0;

    normalizedPoints.forEach(p => {
        numerator += (p.x - xMean) * (p.y - yMean);
        denominator += Math.pow(p.x - xMean, 2);
        ssTotal += Math.pow(p.y - yMean, 2);
    });

    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = yMean - slope * xMean;

    // Calculate R-squared (coefficient of determination)
    let ssResidual = 0;
    normalizedPoints.forEach(p => {
        const predicted = slope * p.x + intercept;
        ssResidual += Math.pow(p.y - predicted, 2);
    });

    const rSquared = ssTotal !== 0 ? 1 - (ssResidual / ssTotal) : 0;

    // Determine trend with threshold
    // Slope normalized per day; consider "stable" if change is < 1% of mean per day
    const slopeThreshold = Math.abs(yMean) * 0.01;
    const trend: 'up' | 'down' | 'stable' =
        slope > slopeThreshold ? 'up' :
            slope < -slopeThreshold ? 'down' : 'stable';

    // Confidence based on R² and sample size
    const sampleBonus = Math.min(0.3, n / 30 * 0.3); // More samples = more confidence
    const confidence = Math.min(0.95, Math.max(0, rSquared) + sampleBonus);

    return {
        slope,
        intercept,
        rSquared: Math.max(0, rSquared),
        predict: (timestamp: number) => {
            const x = (timestamp - minTime) / (1000 * 60 * 60 * 24);
            return slope * x + intercept;
        },
        trend,
        confidence,
    };
}

// ============ MOVING AVERAGES ============

/**
 * Simple Moving Average
 */
export function simpleMovingAverage(values: number[], period: number): number[] {
    if (values.length < period) return [];

    const result: number[] = [];
    for (let i = period - 1; i < values.length; i++) {
        const window = values.slice(i - period + 1, i + 1);
        const avg = window.reduce((sum, v) => sum + v, 0) / period;
        result.push(avg);
    }
    return result;
}

/**
 * Weighted Moving Average
 * More recent values have higher weight
 * 
 * @param values - Array of values (oldest first)
 * @param weights - Optional custom weights (must sum to 1)
 */
export function weightedMovingAverage(values: number[], weights?: number[]): number {
    if (values.length === 0) return 0;

    // Generate default linear weights if not provided
    const n = values.length;
    const w = weights || generateLinearWeights(n);

    if (w.length !== n) {
        throw new Error('Weights array must match values array length');
    }

    return values.reduce((sum, val, i) => sum + val * w[i], 0);
}

/**
 * Generate linearly increasing weights (newer = higher weight)
 */
export function generateLinearWeights(n: number): number[] {
    if (n === 0) return [];

    const raw = Array.from({ length: n }, (_, i) => i + 1);
    const sum = raw.reduce((a, b) => a + b, 0);
    return raw.map(w => w / sum);
}

/**
 * Exponential Moving Average
 * Classic EMA with smoothing factor
 */
export function exponentialMovingAverage(values: number[], smoothing: number = 0.2): number {
    if (values.length === 0) return 0;

    let ema = values[0];
    for (let i = 1; i < values.length; i++) {
        ema = smoothing * values[i] + (1 - smoothing) * ema;
    }
    return ema;
}

// ============ VOLATILITY & CONFIDENCE ============

/**
 * Calculate volatility (coefficient of variation)
 * Returns a value between 0 and 1+ where higher = more volatile
 */
export function calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;

    const stats = calculateStats(values);

    if (stats.mean === 0) return 0;

    // Coefficient of Variation = StdDev / Mean
    return Math.abs(stats.stdDev / stats.mean);
}

/**
 * Calculate confidence interval given volatility
 * Returns [lower, upper] bounds for a prediction
 */
export function calculateConfidenceInterval(
    prediction: number,
    volatility: number,
    confidenceLevel: number = 0.95
): [number, number] {
    // Use Z-score for confidence level (1.96 for 95%, 2.576 for 99%)
    const zScores: Record<number, number> = {
        0.90: 1.645,
        0.95: 1.960,
        0.99: 2.576,
    };

    const z = zScores[confidenceLevel] || 1.96;
    const margin = prediction * volatility * z;

    return [
        Math.max(0, prediction - margin),
        prediction + margin,
    ];
}

// ============ FINANCIAL UTILITIES ============

/**
 * Separate expenses into Fixed (recurring) and Variable (discretionary)
 * Fixed: low volatility, regular intervals
 * Variable: high volatility, irregular
 */
export function categorizeSpendingType(
    amounts: number[],
    dates: Date[]
): 'fixed' | 'variable' | 'mixed' {
    if (amounts.length < 3) return 'variable';

    const amountVolatility = calculateVolatility(amounts);

    // Check interval regularity
    const intervals: number[] = [];
    const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());
    for (let i = 1; i < sortedDates.length; i++) {
        intervals.push(sortedDates[i].getTime() - sortedDates[i - 1].getTime());
    }
    const intervalVolatility = intervals.length > 0 ? calculateVolatility(intervals) : 1;

    // Fixed: low amount volatility (<20%) AND regular intervals (<30% volatility)
    if (amountVolatility < 0.2 && intervalVolatility < 0.3) {
        return 'fixed';
    }

    // Mixed: somewhat regular
    if (amountVolatility < 0.5 || intervalVolatility < 0.5) {
        return 'mixed';
    }

    return 'variable';
}

/**
 * Detect day-of-week seasonality pattern
 * Returns multipliers for each day (0=Sunday, 6=Saturday)
 */
export function detectDayOfWeekSeasonality(
    expenses: Array<{ date: Date; amount: number }>
): Record<number, number> {
    const dayTotals: Record<number, number[]> = {
        0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [],
    };

    expenses.forEach(e => {
        const day = e.date.getDay();
        dayTotals[day].push(e.amount);
    });

    // Calculate average per day
    const dayAverages: Record<number, number> = {};
    let overallTotal = 0;
    let overallCount = 0;

    Object.entries(dayTotals).forEach(([day, amounts]) => {
        if (amounts.length > 0) {
            dayAverages[Number(day)] = amounts.reduce((a, b) => a + b, 0) / amounts.length;
            overallTotal += amounts.reduce((a, b) => a + b, 0);
            overallCount += amounts.length;
        } else {
            dayAverages[Number(day)] = 0;
        }
    });

    const overallAverage = overallCount > 0 ? overallTotal / overallCount : 1;

    // Calculate multipliers relative to overall average
    const multipliers: Record<number, number> = {};
    for (let i = 0; i <= 6; i++) {
        multipliers[i] = overallAverage > 0
            ? dayAverages[i] / overallAverage
            : 1;
    }

    return multipliers;
}
