
import React, { memo, useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import type { SymbolData, Settings, Timeframe } from '../types';
import FavoriteButton from './FavoriteButton';

interface WaveTrendGridCellProps {
    symbol: string;
    data: SymbolData;
    onSelect: (symbol: string) => void;
    settings: Settings;
    isFavorite: boolean;
    onToggleFavorite: (symbol: string) => void;
    timeframe: Timeframe;
}

const WaveTrendGridCell: React.FC<WaveTrendGridCellProps> = ({ symbol, data, onSelect, settings, isFavorite, onToggleFavorite, timeframe }) => {
    
    const lastWt2 = data?.waveTrend2?.[data.waveTrend2.length - 1]?.value;

    const getWtColor = (wt: number | undefined) => {
        if (wt === undefined) return 'text-medium-text-light dark:text-medium-text';
        if (wt < -45) return 'text-green-400';
        if (wt > 45) return 'text-red-400';
        return 'text-dark-text dark:text-light-text';
    };

    const chartData = useMemo(() => {
        if (!data?.waveTrend1 || !data?.waveTrend2) return [];
        const wt2Map = new Map(data.waveTrend2.map(p => [p.time, p.value]));
        return data.waveTrend1.map(wt1Point => ({
            time: wt1Point.time,
            wt1: wt1Point.value,
            wt2: wt2Map.get(wt1Point.time) ?? null,
        }));
    }, [data?.waveTrend1, data?.waveTrend2]);

    const handleSelect = () => onSelect(symbol);
    
    return (
        <div
            className="group relative flex flex-col items-center justify-center p-2 rounded-xl shadow-lg cursor-pointer transition-all duration-200 ease-in-out h-40"
            onClick={handleSelect}
        >
            <div className="absolute inset-0 bg-light-card dark:bg-dark-card rounded-xl group-hover:shadow-lg group-hover:border-primary group-hover:-translate-y-0.5 group-hover:scale-[1.02] transition-all duration-200 ease-in-out border border-light-border dark:border-dark-border"></div>
            
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
                    <span className={`font-mono font-semibold ${getWtColor(lastWt2)}`}>
                        {lastWt2 ? lastWt2.toFixed(2) : 'N/A'}
                    </span>
                </div>
                <div className="flex-grow w-full h-full">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                                <YAxis domain={['auto', 'auto']} hide={true} />
                                <Line
                                    type="monotone"
                                    dataKey="wt1"
                                    stroke={settings.waveTrend1Color}
                                    strokeWidth={settings.lineWidth}
                                    dot={false}
                                    isAnimationActive={false}
                                />
                                 <Line
                                    type="monotone"
                                    dataKey="wt2"
                                    stroke={settings.waveTrend2Color}
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

export default memo(WaveTrendGridCell);
