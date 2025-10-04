
import React, { memo } from 'react';
import GridCell from './GridCell';
import GridCellSkeleton from './GridCellSkeleton';
import type { SymbolData, Settings } from '../types';

interface GridProps {
    symbols: string[];
    symbolsData: Record<string, SymbolData>;
    onSelectSymbol: (symbol: string) => void;
    settings: Settings;
    favorites: string[];
    onToggleFavorite: (symbol: string) => void;
    loading: boolean;
}

const Grid: React.FC<GridProps> = ({ symbols, symbolsData, onSelectSymbol, settings, favorites, onToggleFavorite, loading }) => {
    
    return (
        <div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
            role="grid"
            aria-label="Cryptocurrency RSI data grid"
        >
            {loading ? (
                 symbols.map((symbol, index) => (
                    <GridCellSkeleton 
                        key={symbol} 
                        animationDelay={`${index * 0.03}s`} 
                    />
                ))
            ) : (
                symbols.map((symbol) => {
                    const data = symbolsData[symbol];
                    return (
                        <GridCell
                            key={symbol}
                            symbol={symbol}
                            data={data}
                            onSelectSymbol={onSelectSymbol}
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

export default memo(Grid);