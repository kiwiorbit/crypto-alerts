import React, { memo, useMemo } from 'react';
import { AreaChart, Area, LineChart, Line, ResponsiveContainer, YAxis, ComposedChart } from 'recharts';
import type { SymbolData, Settings } from '../types';
import FavoriteButton from './FavoriteButton';

interface KiwiHuntGridCellProps {
    symbol: string;
    data: SymbolData;
    onSelect: (symbol: string) => void;
    settings: Settings;
    isFavorite: boolean;
    onToggleFavorite: (symbol: string) => void;
}

const KiwiHuntGridCell: React.FC<KiwiHuntGridCellProps> = ({ symbol, data, onSelect, settings, isFavorite, onToggleFavorite }) => {
    
    const chartData = useMemo(() => {
        if (!data?.kiwiHunt) return [];
        const { q1, trigger, q3 } = data.kiwiHunt;
        const triggerMap = new Map(trigger.map(p => [p.time, p.value]));
        const q3Map = new Map(q3.map(p => [p.time, p.value]));
        
        return q1.map(p => ({
            time: p.time,
            q1: p.value,
            trigger: triggerMap.get(p.time) ?? null,
            q3: q3Map.get(p.time) ?? null,
        }));
    }, [data?.kiwiHunt]);
    
    const lastQ1 = chartData[chartData.length - 1]?.q1;

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
                    <span className={`font-mono font-semibold text-dark-text dark:text-light-text`}>
                        {lastQ1 ? lastQ1.toFixed(2) : 'N/A'}
                    </span>
                </div>
                <div className="flex-grow w-full h-full">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                           <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                                <YAxis domain={[-10, 110]} hide={true} />
                                <Area type="monotone" dataKey="q3" stroke={settings.kiwiHuntQ3Color} fill={settings.kiwiHuntQ3Color} fillOpacity={0.2} strokeWidth={0} isAnimationActive={false} />
                                <Line type="monotone" dataKey="q1" stroke={settings.kiwiHuntQ1Color} strokeWidth={settings.lineWidth} dot={false} isAnimationActive={false} />
                                <Line type="monotone" dataKey="trigger" stroke={settings.kiwiHuntTriggerColor} strokeWidth={settings.lineWidth * 0.75} dot={false} isAnimationActive={false} />
                           </ComposedChart>
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

export default memo(KiwiHuntGridCell);