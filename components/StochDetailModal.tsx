

import React, { useRef, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { SymbolData, Settings, Timeframe } from '../types';

interface StochDetailModalProps {
    symbol: string;
    data: SymbolData;
    onClose: () => void;
    settings: Settings;
    timeframe: Timeframe;
    onSwitchToPriceChart: () => void;
    onSwitchToRsiChart: () => void;
    onSwitchToWaveTrendChart: () => void;
}


const StochDetailModal: React.FC<StochDetailModalProps> = ({ symbol, data, onClose, settings, timeframe, onSwitchToPriceChart, onSwitchToRsiChart, onSwitchToWaveTrendChart }) => {
    const modalRef = useRef<HTMLDivElement>(null);

    const lastK = useMemo(() => data?.stochK?.[data.stochK.length - 1]?.value, [data.stochK]);
    const lastD = useMemo(() => data?.stochD?.[data.stochD.length - 1]?.value, [data.stochD]);

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

    const chartData = useMemo(() => {
        if (!data?.stochK || !data?.stochD) {
            return [];
        }
        const dMap = new Map(data.stochD.map(p => [p.time, p.value]));
        return data.stochK.map(kPoint => ({
            time: kPoint.time,
            k: kPoint.value,
            d: dMap.get(kPoint.time) ?? null,
        }));
    }, [data.stochK, data.stochD]);

    const timeFormatter = (time: number) => {
        const date = new Date(time);
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        
        if (['1d', '3d', '1w'].includes(timeframe)) {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
        }
        return `${hours}:${minutes}`;
    };

    const CustomTooltip: React.FC<any> = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="p-2 bg-light-card/80 dark:bg-dark-card/80 backdrop-blur-lg rounded-lg shadow-xl border border-light-border/50 dark:border-dark-border/50 text-sm">
                    <p className="font-bold">{new Date(payload[0].payload.time).toUTCString()}</p>
                    {payload[0] && <p style={{ color: settings.stochKColor }}>%K: {payload[0].value.toFixed(2)}</p>}
                    {payload[1] && <p style={{ color: settings.stochDColor }}>%D: {payload[1].value.toFixed(2)}</p>}
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
                           <span className="text-base font-normal text-medium-text-light dark:text-medium-text">({timeframe})</span>
                        </h2>
                        <div className="flex items-center gap-4 text-xs">
                            <span className="text-medium-text-light dark:text-medium-text">Price: <span className="font-semibold text-dark-text dark:text-light-text">${data?.price?.toFixed(4) ?? 'N/A'}</span></span>
                             <span style={{ color: settings.stochKColor }}>%K: <span className="font-semibold font-mono">{lastK ? lastK.toFixed(2) : 'N/A'}</span></span>
                             <span style={{ color: settings.stochDColor }}>%D: <span className="font-semibold font-mono">{lastD ? lastD.toFixed(2) : 'N/A'}</span></span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                         {['15m', '1h', '4h', '1d'].includes(timeframe) && (
                            <button 
                                onClick={onSwitchToWaveTrendChart} 
                                className="text-xl w-10 h-10 flex items-center justify-center rounded-lg text-medium-text-light dark:text-medium-text hover:bg-light-border dark:hover:bg-dark-border transition-colors" 
                                aria-label="View WaveTrend chart"
                                title="View WaveTrend Chart"
                            >
                                <i className="fa-solid fa-water"></i>
                            </button>
                        )}
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
                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid stroke={settings.rsi50Color} strokeOpacity={0.2} vertical={false} />
                            <XAxis dataKey="time" tickFormatter={timeFormatter} stroke={settings.textColor} fontSize={12} axisLine={false} tickLine={false} hide={true} />
                            <YAxis orientation="right" domain={[0, 100]} stroke={settings.textColor} fontSize={12} axisLine={false} tickLine={false} width={40} />
                            <Tooltip content={<CustomTooltip />} />
                            <ReferenceLine y={80} stroke="rgba(239, 68, 68, 0.6)" strokeDasharray="3 3" strokeWidth={2} />
                            <ReferenceLine y={20} stroke="rgba(34, 197, 94, 0.6)" strokeDasharray="3 3" strokeWidth={2} />
                            <ReferenceLine y={50} stroke={settings.rsi50Color} strokeDasharray="5 5" strokeWidth={1.5} />
                            <Line type="monotone" dataKey="k" stroke={settings.stochKColor} strokeWidth={settings.lineWidth} dot={false} name="%K" isAnimationActive={false} />
                            <Line type="monotone" dataKey="d" stroke={settings.stochDColor} strokeWidth={settings.lineWidth} dot={false} name="%D" isAnimationActive={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default StochDetailModal;