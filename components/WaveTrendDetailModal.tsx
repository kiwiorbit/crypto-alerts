import React, { useRef, useEffect, useMemo } from 'react';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Scatter } from 'recharts';
import type { SymbolData, Settings, Timeframe } from '../types';

interface WaveTrendDetailModalProps {
    symbol: string;
    data: SymbolData;
    onClose: () => void;
    settings: Settings;
    timeframe: Timeframe;
    onSwitchToPriceChart: () => void;
    onSwitchToRsiChart: () => void;
    onSwitchToStochChart: () => void;
}

const WaveTrendDetailModal: React.FC<WaveTrendDetailModalProps> = ({ symbol, data, onClose, settings, timeframe, onSwitchToPriceChart, onSwitchToRsiChart, onSwitchToStochChart }) => {
    const modalRef = useRef<HTMLDivElement>(null);

    const lastWt1 = useMemo(() => data?.waveTrend1?.[data.waveTrend1.length - 1]?.value, [data.waveTrend1]);
    const lastWt2 = useMemo(() => data?.waveTrend2?.[data.waveTrend2.length - 1]?.value, [data.waveTrend2]);

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
        if (!data?.waveTrend1 || data.waveTrend1.length < 2 || !data?.waveTrend2 || data.waveTrend2.length < 2) return [];

        const processedData = data.waveTrend1.map((wt1Point) => {
            const wt2Point = data.waveTrend2.find(p => p.time === wt1Point.time);
            if (!wt2Point) return { time: wt1Point.time, wt1: wt1Point.value, wt2: null };
            return { time: wt1Point.time, wt1: wt1Point.value, wt2: wt2Point.value };
        });

        return processedData.map((point, index) => {
            if (index === 0) return { ...point, buySignal: null, sellSignal: null };

            const prevPoint = processedData[index - 1];
            if (!point.wt1 || !point.wt2 || !prevPoint.wt1 || !prevPoint.wt2) {
                return { ...point, buySignal: null, sellSignal: null };
            }
            
            const isBullishCross = prevPoint.wt1 <= prevPoint.wt2 && point.wt1 > point.wt2;
            const isBearishCross = prevPoint.wt1 >= prevPoint.wt2 && point.wt1 < point.wt2;
            
            // High-quality signal: Cross occurs while in extreme territory.
            const buySignal = isBullishCross && point.wt2 <= -53 ? point.wt1 : null;
            const sellSignal = isBearishCross && point.wt2 >= 53 ? point.wt1 : null;
            
            return {
                ...point,
                buySignal,
                sellSignal,
            };
        });
    }, [data.waveTrend1, data.waveTrend2]);
    
    const CustomTooltip: React.FC<any> = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="p-2 bg-light-card/80 dark:bg-dark-card/80 backdrop-blur-lg rounded-lg shadow-xl border border-light-border/50 dark:border-dark-border/50 text-sm">
                    <p className="font-bold">{new Date(payload[0].payload.time).toUTCString()}</p>
                    {payload[0] && <p style={{ color: settings.waveTrend1Color }}>WT1: {payload[0].value.toFixed(2)}</p>}
                    {payload[1] && <p style={{ color: settings.waveTrend2Color }}>WT2: {payload[1].value.toFixed(2)}</p>}
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
                             <span style={{ color: settings.waveTrend1Color }}>WT1: <span className="font-semibold font-mono">{lastWt1 ? lastWt1.toFixed(2) : 'N/A'}</span></span>
                             <span style={{ color: settings.waveTrend2Color }}>WT2: <span className="font-semibold font-mono">{lastWt2 ? lastWt2.toFixed(2) : 'N/A'}</span></span>
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
                            <XAxis dataKey="time" hide={true} />
                            <YAxis orientation="right" domain={['auto', 'auto']} stroke={settings.textColor} fontSize={12} axisLine={false} tickLine={false} width={40} />
                            <Tooltip content={<CustomTooltip />} />
                            <ReferenceLine y={53} stroke="rgba(239, 68, 68, 0.6)" strokeDasharray="3 3" strokeWidth={2} />
                            <ReferenceLine y={-53} stroke="rgba(34, 197, 94, 0.6)" strokeDasharray="3 3" strokeWidth={2} />
                            <ReferenceLine y={0} stroke={settings.rsi50Color} strokeDasharray="5 5" strokeWidth={1.5} />
                            <Line type="monotone" dataKey="wt1" stroke={settings.waveTrend1Color} strokeWidth={settings.lineWidth} dot={false} name="WT1" isAnimationActive={false} />
                            <Line type="monotone" dataKey="wt2" stroke={settings.waveTrend2Color} strokeWidth={settings.lineWidth} dot={false} name="WT2" isAnimationActive={false} />
                            
                            <Scatter dataKey="buySignal" fill="#22c55e" shape="circle" r={5} isAnimationActive={false} />
                            <Scatter dataKey="sellSignal" fill="#ef4444" shape="circle" r={5} isAnimationActive={false} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default WaveTrendDetailModal;