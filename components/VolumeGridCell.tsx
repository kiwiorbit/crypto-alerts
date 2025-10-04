
import React, { memo, useMemo } from 'react';
import type { SymbolData, Settings } from '../types';
import FavoriteButton from './FavoriteButton';

interface VolumeGridCellProps {
    symbol: string;
    data: SymbolData;
    onSelect: (symbol: string) => void;
    settings: Settings;
    isFavorite: boolean;
    onToggleFavorite: (symbol: string) => void;
}

const formatUsdValue = (volume: number, showSign = false): string => {
    const sign = volume < 0 ? '-' : showSign ? '+' : '';
    const absVolume = Math.abs(volume);
    
    if (absVolume >= 1_000_000_000) {
        return `${sign}$${(absVolume / 1_000_000_000).toFixed(2)}B`;
    }
    if (absVolume >= 1_000_000) {
        return `${sign}$${(absVolume / 1_000_000).toFixed(2)}M`;
    }
    if (absVolume >= 1_000) {
        return `${sign}$${(absVolume / 1_000).toFixed(2)}K`;
    }
    return `${sign}$${absVolume.toFixed(2)}`;
};


const VolumeGridCell: React.FC<VolumeGridCellProps> = ({ symbol, data, onSelect, settings, isFavorite, onToggleFavorite }) => {
    
    const volumeData = useMemo(() => {
        if (!data?.klines || data.klines.length === 0) {
            return { buyVolume: 0, sellVolume: 0, netVolume: 0, buyCount: 0, sellCount: 0, totalVolume: 1 };
        }
        
        let buyVolume = 0;
        let sellVolume = 0;
        let buyCount = 0;
        let sellCount = 0;
        
        data.klines.forEach(k => {
            const isBuyCandle = k.takerBuyQuoteVolume >= (k.quoteVolume / 2);
            if (isBuyCandle) {
                buyCount++;
            } else {
                sellCount++;
            }
            buyVolume += k.takerBuyQuoteVolume;
            sellVolume += (k.quoteVolume - k.takerBuyQuoteVolume);
        });
        
        const totalVolume = buyVolume + sellVolume;
        const netVolume = buyVolume - sellVolume;
        
        return { buyVolume, sellVolume, netVolume, buyCount, sellCount, totalVolume: totalVolume > 0 ? totalVolume : 1 };
    }, [data?.klines]);

    const { buyVolume, sellVolume, netVolume, buyCount, sellCount, totalVolume } = volumeData;
    
    const buyPercent = (buyVolume / totalVolume) * 100;
    const netColor = netVolume >= 0 ? 'text-primary' : 'text-red-500';

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
                </div>
                
                <div className="flex-grow w-full flex flex-col justify-around px-2 pb-1">
                    <div className="flex justify-between text-center">
                        <div>
                            <span className="text-xs text-medium-text-light dark:text-medium-text">Buys</span>
                            <p className="font-semibold text-sm text-primary">
                                {buyCount}<span className="text-medium-text-light dark:text-medium-text text-xs"> / </span>{formatUsdValue(buyVolume)}
                            </p>
                        </div>
                         <div>
                            <span className="text-xs text-medium-text-light dark:text-medium-text">Sells</span>
                            <p className="font-semibold text-sm text-red-500">
                                {sellCount}<span className="text-medium-text-light dark:text-medium-text text-xs"> / </span>{formatUsdValue(sellVolume)}
                            </p>
                        </div>
                         <div>
                            <span className="text-xs text-medium-text-light dark:text-medium-text">Net Vol.</span>
                            <p className={`font-semibold text-sm ${netColor}`}>
                                {formatUsdValue(netVolume)}
                            </p>
                        </div>
                    </div>

                    <div className="w-full h-2 rounded-full flex overflow-hidden bg-dark-border mt-1">
                        <div style={{ width: `${buyPercent}%` }} className="h-full bg-primary/80 transition-all duration-300 ease-out"></div>
                        <div style={{ width: `${100 - buyPercent}%` }} className="h-full bg-red-500/80 transition-all duration-300 ease-out"></div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default memo(VolumeGridCell);