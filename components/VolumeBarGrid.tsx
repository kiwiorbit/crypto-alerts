import React, { memo } from 'react';
import VolumeBarGridCell from './VolumeBarGridCell';
import VolumeGridCellSkeleton from './VolumeGridCellSkeleton'; // Re-use the existing skeleton
import type { SymbolData, Settings, SortOrder } from '../types';

interface VolumeBarGridProps {
    symbols: string[];
    symbolsData: Record<string, SymbolData>;
    onSelectSymbol: (symbol: string) => void;
    settings: Settings;
    favorites: string[];
    onToggleFavorite: (symbol: string) => void;
    loading: boolean;
    sortOrder: SortOrder;
}

const VolumeBarGrid: React.FC<VolumeBarGridProps> = ({ symbols, symbolsData, onSelectSymbol, settings, favorites, onToggleFavorite, loading, sortOrder }) => {
    return (
        <div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
            role="grid"
            aria-label="Cryptocurrency volume bar chart grid"
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
                        <VolumeBarGridCell
                            key={symbol}
                            symbol={symbol}
                            data={data}
                            onSelect={onSelectSymbol}
                            settings={settings}
                            isFavorite={favorites.includes(symbol)}
                            onToggleFavorite={onToggleFavorite}
                            sortOrder={sortOrder}
                        />
                    );
                })
            )}
        </div>
    );
};

export default memo(VolumeBarGrid);