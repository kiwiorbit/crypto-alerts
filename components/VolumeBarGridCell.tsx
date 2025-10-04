
import React, { memo, useMemo } from 'react';
import { BarChart, Bar, ResponsiveContainer, Cell } from 'recharts';
import type { SymbolData, Settings, SortOrder } from '../types';
import FavoriteButton from './FavoriteButton';

interface VolumeBarGridCellProps {
    symbol: string;
    data: SymbolData;
    onSelect: (symbol: string) => void;
    settings: Settings;
    isFavorite: boolean;
    onToggleFavorite: (symbol: string) => void;
    sortOrder: SortOrder;
}

const formatUsdValue = (volume: number): string => {
    if (volume >= 1_000_000_000) return `$${(volume / 1_000_000_000).toFixed(2)}B`;
    if (volume >= 1_000_000) return `$${(volume / 1_000_000).toFixed(2)}M`;
    if (volume >= 1_000) return `$${(volume / 1_000).toFixed(1)}K`;
    return `$${volume.toFixed(2)}`;
};

const VolumeBarGridCell: React.FC<VolumeBarGridCellProps> = ({ symbol, data, onSelect, settings, isFavorite, onToggleFavorite, sortOrder }) => {
    const chartData = useMemo(() => {
        if (!data?.klines) return [];
        return data.klines.map(k => ({
            time: k.time,
            volume: k.quoteVolume,
            fill: k.takerBuyQuoteVolume > k.quoteVolume / 2 ? '#29ffb8' : '#ef4444',
        }));
    }, [data?.klines]);

    const displayedVolume = useMemo(() => {
        if (!data?.klines) return 0;

        switch (sortOrder) {
            case 'green-volume-desc':
                return data.klines.reduce((sum, k) => sum + k.takerBuyQuoteVolume, 0);
            case 'red-volume-desc':
                return data.klines.reduce((sum, k) => sum + (k.quoteVolume - k.takerBuyQuoteVolume), 0);
            default: // 'total-volume-desc', 'net-volume-desc', 'net-volume-asc', 'default', etc.
                return data.klines.reduce((sum, k) => sum + k.quoteVolume, 0);
        }
    }, [data?.klines, sortOrder]);

    const handleSelect = () => onSelect(symbol);

    return (
        <div
            className="group relative flex flex-col p-2 rounded-xl shadow-lg cursor-pointer transition-all duration-200 ease-in-out h-40 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border"
            onClick={handleSelect}
        >
            <div className="absolute inset-0 bg-light-card dark:bg-dark-card rounded-xl group-hover:shadow-lg group-hover:border-primary group-hover:-translate-y-0.5 group-hover:scale-[1.02] transition-all duration-200 ease-in-out"></div>
            
            <FavoriteButton
                symbol={symbol}
                isFavorite={isFavorite}
                onToggleFavorite={onToggleFavorite}
                className="absolute top-2 right-2 z-10 p-1 text-lg text-medium-text dark:text-medium-text hover:text-yellow-400 transition-colors"
            />

            <div className="relative w-full h-full flex flex-col">
                <div className="flex justify-between items-center px-2 pt-1 pr-8">
                     <span className="font-bold text-base text-dark-text dark:text-light-text truncate" title={symbol}>
                        {symbol}
                    </span>
                    <span className="font-mono font-semibold text-sm text-dark-text dark:text-light-text">
                        {formatUsdValue(displayedVolume)}
                    </span>
                </div>
                <div className="flex-grow w-full h-full">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 5, left: 5, bottom: 5 }}>
                                <Bar dataKey="volume" isAnimationActive={false}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} fillOpacity={0.7} />
                                    ))}
                                </Bar>
                            </BarChart>
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

export default memo(VolumeBarGridCell);