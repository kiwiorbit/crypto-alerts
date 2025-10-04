
import React, { memo } from 'react';
import StochGridCell from './StochGridCell';
import StochGridCellSkeleton from './StochGridCellSkeleton';
import type { SymbolData, Settings } from '../types';

interface StochGridProps {
    symbols: string[];
    symbolsData: Record<string, SymbolData>;
    onSelectSymbol: (symbol: string) => void;
    settings: Settings;
    favorites: string[];
    onToggleFavorite: (symbol: string) => void;
    loading: boolean;
}

const StochGrid: React.FC<StochGridProps> = ({ symbols, symbolsData, onSelectSymbol, settings, favorites, onToggleFavorite, loading }) => {
    
    return (
        <div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
            role="grid"
            aria-label="Cryptocurrency Stochastic RSI data grid"
        >
            {loading ? (
                 symbols.map((symbol, index) => (
                    <StochGridCellSkeleton 
                        key={symbol} 
                        animationDelay={`${index * 0.03}s`} 
                    />
                ))
            ) : (
                symbols.map(symbol => {
                    const data = symbolsData[symbol];
                    return (
                        <StochGridCell
                            key={symbol}
                            symbol={symbol}
                            data={data}
                            onSelect={onSelectSymbol}
                            settings={settings}
                            isFavorite={favorites.includes(symbol)}
                            onToggleFavorite={onToggleFavorite}
                        />
                    );
                })
            )}
        </div>
    );
};

export default memo(StochGrid);