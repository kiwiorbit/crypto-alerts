
import React, { memo } from 'react';
import PriceGridCell from './PriceGridCell';
import PriceGridCellSkeleton from './PriceGridCellSkeleton';
import type { SymbolData, Settings } from '../types';

interface PriceGridProps {
    symbols: string[];
    symbolsData: Record<string, SymbolData>;
    onSelectSymbol: (symbol: string) => void;
    settings: Settings;
    favorites: string[];
    onToggleFavorite: (symbol: string) => void;
    loading: boolean;
}

const PriceGrid: React.FC<PriceGridProps> = ({ symbols, symbolsData, onSelectSymbol, settings, favorites, onToggleFavorite, loading }) => {
    return (
        <div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
            role="grid"
            aria-label="Cryptocurrency price data grid"
        >
            {loading ? (
                 symbols.map((symbol, index) => (
                    <PriceGridCellSkeleton
                        key={symbol}
                        animationDelay={`${index * 0.03}s`}
                    />
                ))
            ) : (
                symbols.map(symbol => {
                    const data = symbolsData[symbol];
                    return (
                        <PriceGridCell
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

export default memo(PriceGrid);
