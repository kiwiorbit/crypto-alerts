

import React, { memo } from 'react';
import VolumeGridCell from './VolumeGridCell';
import VolumeGridCellSkeleton from './VolumeGridCellSkeleton';
import type { SymbolData, Settings, SortOrder } from '../types';

interface VolumeGridProps {
    symbols: string[];
    symbolsData: Record<string, SymbolData>;
    onSelectSymbol: (symbol: string) => void;
    settings: Settings;
    favorites: string[];
    onToggleFavorite: (symbol: string) => void;
    loading: boolean;
}

const VolumeGrid: React.FC<VolumeGridProps> = ({ symbols, symbolsData, onSelectSymbol, settings, favorites, onToggleFavorite, loading }) => {
    return (
        <div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
            role="grid"
            aria-label="Cryptocurrency volume data grid"
        >
            {loading ? (
                 symbols.map((symbol, index) => (
                    <VolumeGridCellSkeleton
                        key={symbol}
                        animationDelay={`${index * 0.03}s`}
                    />
                ))
            ) : (
                symbols.map(symbol => {
                    const data = symbolsData[symbol];
                    return (
                        <VolumeGridCell
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

export default memo(VolumeGrid);