'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { formatMoney } from '@/lib/utils';

interface CategoryRingProps {
    data: any[];
    onSelect: (cat: string) => void;
}

export default function CategoryRing({ data, onSelect }: CategoryRingProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const total = data.reduce((sum, d) => sum + d.amount, 0);

    return (
        <div className="relative">
            <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={hoveredIndex !== null ? 85 : 80}
                            paddingAngle={3}
                            dataKey="amount"
                            onMouseEnter={(_, index) => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            onClick={(_, index) => onSelect(data[index].category)}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                    stroke="transparent"
                                    style={{
                                        filter: hoveredIndex === index ? 'drop-shadow(0 0 8px rgba(255,255,255,0.3))' : 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                    }}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#0f172a',
                                border: '1px solid #334155',
                                borderRadius: '12px',
                                padding: '12px',
                            }}
                            formatter={(value) => [formatMoney(value as number), 'Kwota']}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Center stats */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <motion.p
                    key={hoveredIndex}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-2xl font-bold"
                >
                    {hoveredIndex !== null
                        ? `${Math.round((data[hoveredIndex].amount / total) * 100)}%`
                        : formatMoney(total)
                    }
                </motion.p>
                <p className="text-xs text-slate-400">
                    {hoveredIndex !== null ? data[hoveredIndex].name : 'Suma'}
                </p>
            </div>
        </div>
    );
}
