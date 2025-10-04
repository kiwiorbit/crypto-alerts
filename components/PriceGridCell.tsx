
import React, { useState, memo, useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import type { SymbolData, Settings } from '../types';
import FavoriteButton from './FavoriteButton';

interface PriceGridCellProps {
    symbol: string;
    data: SymbolData;
    onSelect: (symbol: string) => void;
    settings: Settings;
    isFavorite: boolean;
    onToggleFavorite: (symbol: string) => void;
}

const formatPrice = (price: number): string => {
    if (price >= 1000) {
        return price.toFixed(2);
    }
    if (price >= 1) {
        return price.toFixed(4);
    }
    return price.toPrecision(4);
};

const PriceGridCell: React.FC<PriceGridCellProps> = ({ symbol, data, onSelect, settings, isFavorite, onToggleFavorite }) => {
    const lastPrice = data?.price;

    const priceChange = useMemo(() => {
        if (!data?.klines || data.klines.length < 2) return { change: 0, percentage: 0, isPositive: true };
        const currentPrice = data.klines[data.klines.length - 1].close;
        const previousPrice = data.klines[0].close;
        const change = currentPrice - previousPrice;
        const percentage = previousPrice === 0 ? 0 : (change / previousPrice) * 100;
        return { change, percentage, isPositive: change >= 0 };
    }, [data?.klines]);

    const priceColorClass = priceChange.isPositive ? 'text-green-500' : 'text-red-500';

    const handleSelect = () => onSelect(symbol);

    return (
        <div
            className="group relative flex flex-col items-center justify-center p-2 rounded-xl shadow-lg cursor-pointer transition-all duration-200 ease-in-out h-40 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border"
            onClick={handleSelect}
        >
            <div className={`absolute inset-0 bg-light-card dark:bg-dark-card rounded-xl group-hover:shadow-lg group-hover:border-primary group-hover:-translate-y-0.5 group-hover:scale-[1.02] transition-all duration-200 ease-in-out`}></div>
            
             <FavoriteButton
                symbol={symbol}
                isFavorite={isFavorite}
                onToggleFavorite={onToggleFavorite}
                className="absolute top-2 right-2 z-10 p-1 text-lg text-medium-text dark:text-medium-text hover:text-yellow-400 transition-colors"
            />

            <div className="relative w-full h-full flex flex-col">
                <div className="flex flex-col px-2 pt-1 pr-8">
                    <div className="flex justify-between items-baseline">
                         <span className="font-bold text-base text-dark-text dark:text-light-text truncate" title={symbol}>
                            {symbol}
                        </span>
                        <span className={`font-mono font-bold text-sm ${priceColorClass}`}>
                            {priceChange.percentage >= 0 ? '+' : ''}{priceChange.percentage.toFixed(2)}%
                        </span>
                    </div>
                    <div>
                        <p className={`font-mono font-semibold text-sm text-dark-text dark:text-light-text`}>
                            {lastPrice ? formatPrice(lastPrice) : 'N/A'}
                        </p>
                    </div>
                </div>
                <div className="flex-grow w-full h-full">
                    {data && data.klines && data.klines.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.klines} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                                <YAxis domain={['dataMin', 'dataMax']} hide={true} />
                                <Line
                                    type="monotone"
                                    dataKey="close"
                                    stroke={priceChange.isPositive ? '#22c55e' : '#ef4444'}
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

export default memo(PriceGridCell);