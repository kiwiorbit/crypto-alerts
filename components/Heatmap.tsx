
import React, { memo } from 'react';
import HeatmapCell from './HeatmapCell';
import HeatmapCellSkeleton from './HeatmapCellSkeleton';
import type { SymbolData } from '../types';

interface HeatmapProps {
    symbols: string[];
    symbolsData: Record<string, SymbolData>;
    onSelectSymbol: (symbol: string) => void;
    favorites: string[];
    onToggleFavorite: (symbol: string) => void;
    loading: boolean;
}

const Heatmap: React.FC<HeatmapProps> = ({ symbols, symbolsData, onSelectSymbol, favorites, onToggleFavorite, loading }) => {
    return (
        <div
            className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 gap-2"
            role="grid"
            aria-label="Cryptocurrency RSI heatmap"
        >
            {loading ? (
                symbols.map((symbol, index) => (
                    <HeatmapCellSkeleton 
                        key={`${symbol}-skel`} 
                        animationDelay={`${index * 0.02}s`} 
                    />
                ))
            ) : (
                symbols.map(symbol => {
                    const data = symbolsData[symbol];
                    return (
                        <HeatmapCell
                            key={symbol}
                            symbol={symbol}
                            data={data}
                            onSelect={onSelectSymbol}
                            isFavorite={favorites.includes(symbol)}
                            onToggleFavorite={onToggleFavorite}
                        />
                    );
                })
            )}
        </div>
    );
};

export default memo(Heatmap);