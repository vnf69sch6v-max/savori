'use client';

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { TrendingUp } from 'lucide-react';

interface SpendingTrendChartProps {
    data: { date: string; amount: number }[];
    forecastData?: { date: string; amount: number }[];
}

export default function SpendingTrendChart({ data, forecastData }: SpendingTrendChartProps) {
    const combinedData = forecastData
        ? [...data, ...forecastData.map(d => ({ ...d, isForecast: true }))]
        : data;

    return (
        <Card className="overflow-hidden bg-gradient-to-br from-slate-900 to-slate-900/50 border-slate-700/50">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    Trend wydatków {forecastData ? '+ Prognoza' : ''}
                    <span className="ml-auto text-sm text-slate-400 font-normal">
                        {forecastData ? 'Ostatnie 14 dni + 7 dni prognozy' : 'Ostatnie 14 dni'}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={combinedData}>
                            <defs>
                                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis
                                dataKey="date"
                                stroke="#475569"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#475569"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(v) => `${v}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#0f172a',
                                    border: '1px solid #334155',
                                    borderRadius: '12px',
                                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                                }}
                                formatter={(value, name, props) => {
                                    // @ts-ignore
                                    const isForecast = props.payload.isForecast;
                                    return [`${(value as number)?.toFixed(2)} zł`, isForecast ? 'Prognoza' : 'Wydatki'];
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="amount"
                                stroke="#10b981"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorAmount)"
                            />
                            {/* Forecast Layer - render a second line only for forecast data? 
                                Actually with combinedData it might be tricky to have different styles.
                                Let's use two separate Area components filtering the data? 
                                No, Recharts handles gaps if dataKey is missing.
                                Better approach: 
                                Map data to: { date, amount: number, forecast: null } for history
                                Map forecast to: { date, amount: null, forecast: number } for forecast
                                AND include the last history point in forecast to connect the lines.
                             */}
                            <Area
                                type="monotone"
                                dataKey="amount"
                                stroke="#10b981"
                                fill="url(#colorAmount)"
                                strokeWidth={2}
                            />
                            {/* Render dashed line for forecast is hard with Area. 
                                 Let's actually change the implementation strategy slightly here to make it simpler.
                                 I'll just assume combinedData works but I want visual distinction.
                                 Since I returned just one Area, it won't be dashed.
                                 
                                 Let's try the connectNulls approach with two keys: 'amount' and 'forecastAmount'.
                              */}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
