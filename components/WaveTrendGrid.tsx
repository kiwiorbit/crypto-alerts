
import React, { memo } from 'react';
import WaveTrendGridCell from './WaveTrendGridCell';
import WaveTrendGridCellSkeleton from './WaveTrendGridCellSkeleton';
import type { SymbolData, Settings, Timeframe } from '../types';

interface WaveTrendGridProps {
    symbols: string[];
    symbolsData: Record<string, SymbolData>;
    onSelectSymbol: (symbol: string) => void;
    settings: Settings;
    favorites: string[];
    onToggleFavorite: (symbol: string) => void;
    loading: boolean;
    timeframe: Timeframe;
}

const WaveTrendGrid: React.FC<WaveTrendGridProps> = ({ symbols, symbolsData, onSelectSymbol, settings, favorites, onToggleFavorite, loading, timeframe }) => {
    
    return (
        <div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
            role="grid"
            aria-label="Cryptocurrency WaveTrend data grid"
        >
            {loading ? (
                 symbols.map((symbol, index) => (
                    <WaveTrendGridCellSkeleton 
                        key={symbol} 
                        animationDelay={`${index * 0.03}s`} 
                    />
                ))
            ) : (
                symbols.map(symbol => {
                    const data = symbolsData[symbol];
                    return (
                        <WaveTrendGridCell
                            key={symbol}
                            symbol={symbol}
                            data={data}
                            onSelect={onSelectSymbol}
                            settings={settings}
                            isFavorite={favorites.includes(symbol)}
                            onToggleFavorite={onToggleFavorite}
                            timeframe={timeframe}
                        />
                    );
                })
            )}
        </div>
    );
};

export default memo(WaveTrendGrid);
