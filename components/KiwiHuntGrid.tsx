import React, { memo } from 'react';
import KiwiHuntGridCell from './KiwiHuntGridCell';
import KiwiHuntGridCellSkeleton from './KiwiHuntGridCellSkeleton';
import type { SymbolData, Settings } from '../types';

interface KiwiHuntGridProps {
    symbols: string[];
    symbolsData: Record<string, SymbolData>;
    onSelectSymbol: (symbol: string) => void;
    settings: Settings;
    favorites: string[];
    onToggleFavorite: (symbol: string) => void;
    loading: boolean;
}

const KiwiHuntGrid: React.FC<KiwiHuntGridProps> = ({ symbols, symbolsData, onSelectSymbol, settings, favorites, onToggleFavorite, loading }) => {
    
    return (
        <div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
            role="grid"
            aria-label="Cryptocurrency KiwiHunt data grid"
        >
            {loading ? (
                 symbols.map((symbol, index) => (
                    <KiwiHuntGridCellSkeleton 
                        key={symbol} 
                        animationDelay={`${index * 0.03}s`} 
                    />
                ))
            ) : (
                symbols.map(symbol => {
                    const data = symbolsData[symbol];
                    return (
                        <KiwiHuntGridCell
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

export default memo(KiwiHuntGrid);