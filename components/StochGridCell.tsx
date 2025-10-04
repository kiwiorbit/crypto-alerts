
import React, { memo, useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer, ReferenceLine, YAxis } from 'recharts';
import type { SymbolData, Settings } from '../types';
import FavoriteButton from './FavoriteButton';

interface StochGridCellProps {
    symbol: string;
    data: SymbolData;
    onSelect: (symbol: string) => void;
    settings: Settings;
    isFavorite: boolean;
    onToggleFavorite: (symbol: string) => void;
}

const StochGridCell: React.FC<StochGridCellProps> = ({ symbol, data, onSelect, settings, isFavorite, onToggleFavorite }) => {
    const chartData = useMemo(() => {
        if (!data?.stochK || !data?.stochD) {
            return [];
        }
        const dMap = new Map(data.stochD.map(p => [p.time, p.value]));
        return data.stochK.map(kPoint => ({
            time: kPoint.time,
            k: kPoint.value,
            d: dMap.get(kPoint.time) ?? null,
        }));
    }, [data?.stochK, data?.stochD]);

    const handleSelect = () => {
        onSelect(symbol);
    };

    return (
        <div
            className="group relative flex flex-col items-center justify-center p-2 rounded-xl shadow-lg cursor-pointer transition-all duration-200 ease-in-out h-40"
            onClick={handleSelect}
        >
            <div className={`absolute inset-0 bg-light-card dark:bg-dark-card rounded-xl group-hover:shadow-lg group-hover:border-primary group-hover:-translate-y-0.5 group-hover:scale-[1.02] transition-all duration-200 ease-in-out border border-light-border dark:border-dark-border`}></div>
            
            <FavoriteButton
                symbol={symbol}
                isFavorite={isFavorite}
                onToggleFavorite={onToggleFavorite}
                className="absolute top-2 right-2 z-10 p-1 text-lg text-medium-text dark:text-medium-text hover:text-yellow-400 transition-colors"
            />

            <div className="relative w-full h-full flex flex-col">
                <div className="flex justify-between items-center px-2 pt-1 text-sm pr-8">
                     <span className="font-bold text-dark-text dark:text-light-text truncate" title={symbol}>
                        {symbol}
                    </span>
                </div>
                <div className="flex-grow w-full h-full">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                                <YAxis domain={[0, 100]} hide={true} />
                                <ReferenceLine y={80} stroke={settings.rsi50Color} strokeDasharray="3 3" strokeWidth={1.5} />
                                <ReferenceLine y={20} stroke={settings.rsi50Color} strokeDasharray="3 3" strokeWidth={1.5} />
                                <Line
                                    type="monotone"
                                    dataKey="k"
                                    stroke={settings.stochKColor}
                                    strokeWidth={settings.lineWidth}
                                    dot={false}
                                    isAnimationActive={false}
                                />
                                 <Line
                                    type="monotone"
                                    dataKey="d"
                                    stroke={settings.stochDColor}
                                    strokeWidth={settings.lineWidth}
                                    dot={false}
                                    isAnimationActive={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                         <div className="flex items-center justify-center h-full text-xs text-medium-text-light dark:text-medium-text">
                            No Data
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default memo(StochGridCell);