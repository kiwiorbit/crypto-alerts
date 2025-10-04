
import React, { useRef, useEffect, useMemo } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { SymbolData, Settings, Timeframe } from '../types';

// Helper function to format large USD values
const formatUsdValue = (volume: number, showSign = false): string => {
    const sign = volume < 0 ? '-' : showSign ? '+' : '';
    const absVolume = Math.abs(volume);
    
    if (absVolume >= 1_000_000_000) {
        return `${sign}${(absVolume / 1_000_000_000).toFixed(2)}B`;
    }
    if (absVolume >= 1_000_000) {
        return `${sign}${(absVolume / 1_000_000).toFixed(2)}M`;
    }
    if (absVolume >= 1_000) {
        return `${sign}${(absVolume / 1_000).toFixed(2)}K`;
    }
    return `${sign}$${absVolume.toFixed(2)}`;
};


interface VolumeDetailModalProps {
    symbol: string;
    data: SymbolData;
    onClose: () => void;
    settings: Settings;
    timeframe: Timeframe;
    onSwitchToPriceChart: () => void;
    onSwitchToRsiChart: () => void;
    onSwitchToStochChart: () => void;
}


const VolumeDetailModal: React.FC<VolumeDetailModalProps> = ({ symbol, data, onClose, settings, timeframe, onSwitchToPriceChart, onSwitchToRsiChart, onSwitchToStochChart }) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscKey);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [onClose]);

    const headerStats = useMemo(() => {
        if (!data?.klines || data.klines.length === 0) {
            return { buyVolume: 0, sellVolume: 0, netVolume: 0, totalVolume: 0 };
        }
        
        let buyVolume = 0;
        let sellVolume = 0;
        
        data.klines.forEach(k => {
            buyVolume += k.takerBuyQuoteVolume;
            sellVolume += (k.quoteVolume - k.takerBuyQuoteVolume);
        });
        
        const totalVolume = buyVolume + sellVolume;
        const netVolume = buyVolume - sellVolume;
        
        return { buyVolume, sellVolume, netVolume, totalVolume };
    }, [data?.klines]);

    const chartData = useMemo(() => {
        if (!data?.klines) return [];

        const volumes = data.klines.map(k => k.quoteVolume);
        const sma20: (number | null)[] = [];
        for (let i = 0; i < volumes.length; i++) {
            if (i < 19) {
                sma20.push(null);
            } else {
                const sum = volumes.slice(i - 19, i + 1).reduce((a, b) => a + b, 0);
                sma20.push(sum / 20);
            }
        }

        return data.klines.map((k, index) => ({
            time: k.time,
            volume: k.quoteVolume,
            volumeSma: sma20[index],
            fill: k.takerBuyQuoteVolume > k.quoteVolume / 2 ? 'rgba(41, 255, 184, 0.7)' : 'rgba(239, 68, 68, 0.7)',
            buyVol: k.takerBuyQuoteVolume,
            sellVol: k.quoteVolume - k.takerBuyQuoteVolume,
        }));
    }, [data?.klines]);


    const timeFormatter = (time: number) => {
        const date = new Date(time);
        if (['1d', '3d', '1w'].includes(timeframe)) {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
        }
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
    };

    const CustomTooltip: React.FC<any> = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const point = payload[0].payload;
            return (
                <div className="p-2 bg-light-card/80 dark:bg-dark-card/80 backdrop-blur-lg rounded-lg shadow-xl border border-light-border/50 dark:border-dark-border/50 text-sm">
                    <p className="font-bold">{new Date(point.time).toUTCString()}</p>
                    <p>Total Vol: <span className="font-mono">{formatUsdValue(point.volume)}</span></p>
                    <p style={{ color: '#29ffb8' }}>Buy Vol: <span className="font-mono">{formatUsdValue(point.buyVol)}</span></p>
                    <p style={{ color: '#ef4444' }}>Sell Vol: <span className="font-mono">{formatUsdValue(point.sellVol)}</span></p>
                    {point.volumeSma && <p style={{ color: '#f59e0b' }}>Vol SMA(20): <span className="font-mono">{formatUsdValue(point.volumeSma)}</span></p>}
                </div>
            );
        }
        return null;
    };
    
    return (
        <div className="fixed inset-0 bg-dark-bg/80 dark:bg-dark-bg/90 backdrop-blur-sm flex justify-center items-center z-40 p-4">
            <div ref={modalRef} className="relative w-full max-w-4xl h-[60vh] md:h-[70vh] lg:h-[85vh] max-h-[800px] bg-light-card dark:bg-dark-card rounded-2xl shadow-2xl flex flex-col border border-light-border/50 dark:border-dark-border/50">
                <div className="flex justify-between items-center p-4 border-b border-light-border dark:border-dark-border">
                    <div>
                        <h2 className="text-2xl font-bold text-dark-text dark:text-light-text">
                           {symbol}
                           <span className="text-base font-normal text-medium-text-light dark:text-medium-text">({timeframe}) - Volume</span>
                        </h2>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs mt-1">
                            <span className="text-medium-text-light dark:text-medium-text">Price: <span className="font-semibold text-dark-text dark:text-light-text">${data?.price?.toFixed(4) ?? 'N/A'}</span></span>
                            <span className="text-medium-text-light dark:text-medium-text">Total Vol: <span className="font-semibold font-mono text-dark-text dark:text-light-text">{formatUsdValue(headerStats.totalVolume)}</span></span>
                            <span className="text-primary">Buy Vol: <span className="font-semibold font-mono">{formatUsdValue(headerStats.buyVolume)}</span></span>
                            <span className="text-red-500">Sell Vol: <span className="font-semibold font-mono">{formatUsdValue(headerStats.sellVolume)}</span></span>
                            <span className={headerStats.netVolume >= 0 ? 'text-primary' : 'text-red-500'}>Net Vol: <span className="font-semibold font-mono">{formatUsdValue(headerStats.netVolume, true)}</span></span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={onSwitchToStochChart} 
                            className="text-xl w-10 h-10 flex items-center justify-center rounded-lg text-medium-text-light dark:text-medium-text hover:bg-light-border dark:hover:bg-dark-border transition-colors" 
                            aria-label="View Stochastic RSI chart"
                            title="View Stochastic RSI Chart"
                        >
                            <i className="fa-solid fa-tornado"></i>
                        </button>
                        <button 
                            onClick={onSwitchToRsiChart} 
                            className="text-xl w-10 h-10 flex items-center justify-center rounded-lg text-medium-text-light dark:text-medium-text hover:bg-light-border dark:hover:bg-dark-border transition-colors" 
                            aria-label="View RSI chart"
                            title="View RSI Chart"
                        >
                            <i className="fa-solid fa-chart-line"></i>
                        </button>
                        <button 
                            onClick={onSwitchToPriceChart} 
                            className="text-xl w-10 h-10 flex items-center justify-center rounded-lg text-medium-text-light dark:text-medium-text hover:bg-light-border dark:hover:bg-dark-border transition-colors" 
                            aria-label="View price chart"
                            title="View Price Chart"
                        >
                            <i className="fa-solid fa-chart-area"></i>
                        </button>
                        <button onClick={onClose} className="text-2xl w-10 h-10 flex items-center justify-center rounded-lg text-medium-text-light dark:text-medium-text hover:text-dark-text dark:hover:text-light-text transition-colors" aria-label="Close chart">
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                </div>
                
                <div className="relative flex-grow p-4 dark:bg-black rounded-b-2xl">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid stroke={settings.rsi50Color} strokeOpacity={0.2} vertical={false} />
                            <XAxis dataKey="time" tickFormatter={timeFormatter} stroke={settings.textColor} fontSize={12} axisLine={false} tickLine={false} hide={true} />
                            <YAxis orientation="right" domain={['auto', 'dataMax * 1.5']} stroke={settings.textColor} fontSize={12} axisLine={false} tickLine={false} width={80} tickFormatter={(value) => formatUsdValue(Number(value))} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="volume" isAnimationActive={false}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Bar>
                             <Line type="monotone" dataKey="volumeSma" stroke="#f59e0b" strokeWidth={2} dot={false} name="Volume SMA(20)" isAnimationActive={false} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default VolumeDetailModal;