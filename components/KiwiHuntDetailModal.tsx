

import React, { useRef, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ComposedChart, Area, Scatter } from 'recharts';
import type { SymbolData, Settings, Timeframe } from '../types';

interface KiwiHuntDetailModalProps {
    symbol: string;
    data: SymbolData;
    onClose: () => void;
    settings: Settings;
    timeframe: Timeframe;
    onSwitchToPriceChart: () => void;
}


const KiwiHuntDetailModal: React.FC<KiwiHuntDetailModalProps> = ({ symbol, data, onClose, settings, timeframe, onSwitchToPriceChart }) => {
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

    const chartData = useMemo(() => {
        if (!data?.kiwiHunt) return [];
        const { q1, trigger, q3, q5 } = data.kiwiHunt;
        
        let inPullback = false; // State for Buy Trend signal

        return q1.map((p, index) => {
            if (index === 0) return { time: p.time, q1: null, trigger: null, q3: null, q5: null };

            const prevQ1 = q1[index - 1];
            const currentTrigger = trigger.find(t => t.time === p.time);
            const prevTrigger = trigger.find(t => t.time === prevQ1.time);
            const currentQ3 = q3.find(t => t.time === p.time);
            const currentQ5 = q5.find(t => t.time === p.time);

            if (!prevQ1 || !currentTrigger || !prevTrigger || !currentQ3 || !currentQ5) {
                return { time: p.time, q1: p.value, trigger: currentTrigger?.value, q3: currentQ3?.value, q5: currentQ5?.value };
            }

            const isBullishCross = prevQ1.value <= prevTrigger.value && p.value > currentTrigger.value;
            const isBearishCross = prevQ1.value >= prevTrigger.value && p.value < currentTrigger.value;
            
            // Hunt Signals
            const huntBuy = isBullishCross && p.value <= 20 && currentQ3.value <= -4 && currentQ5.value <= -4;
            const huntSell = isBearishCross && p.value >= 80 && currentQ3.value >= 104 && currentQ5.value >= 104;
            
            // Crazy Signals
            const crazyBuy = isBullishCross && currentQ3.value <= -4;
            const crazySell = isBearishCross && currentQ3.value >= 104;
            
            // Buy Trend Signal Logic
            if (p.value < 40) inPullback = true;
            let buyTrend = false;
            if (inPullback && isBullishCross && p.value > 50) {
                buyTrend = true;
                inPullback = false; // Reset after firing
            }
            if (p.value > 80) inPullback = false; // Reset if it goes overbought

            return {
                time: p.time,
                q1: p.value,
                trigger: currentTrigger.value,
                q3: currentQ3.value,
                q5: currentQ5.value,
                huntBuy: huntBuy ? p.value : null,
                huntSell: huntSell ? p.value : null,
                crazyBuy: crazyBuy ? p.value : null,
                crazySell: crazySell ? p.value : null,
                buyTrend: buyTrend ? -15 : null, // Position at the bottom of the chart
            };
        });
    }, [data?.kiwiHunt]);

    const CustomTooltip: React.FC<any> = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const point = payload[0].payload;
            return (
                <div className="p-2 bg-light-card/80 dark:bg-dark-card/80 backdrop-blur-lg rounded-lg shadow-xl border border-light-border/50 dark:border-dark-border/50 text-sm">
                    <p className="font-bold">{new Date(point.time).toUTCString()}</p>
                    <p style={{ color: settings.kiwiHuntQ1Color }}>Q1: {point.q1?.toFixed(2)}</p>
                    <p style={{ color: settings.kiwiHuntTriggerColor }}>Trigger: {point.trigger?.toFixed(2)}</p>
                    <p style={{ color: settings.kiwiHuntQ3Color }}>Q3: {point.q3?.toFixed(2)}</p>
                    <p style={{ color: settings.kiwiHuntQ5Color }}>Q5: {point.q5?.toFixed(2)}</p>
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
                           <span className="text-base font-normal text-medium-text-light dark:text-medium-text">({timeframe}) - KiwiHunt</span>
                        </h2>
                         <div className="flex items-center gap-4 text-xs">
                            <span className="text-medium-text-light dark:text-medium-text">Price: <span className="font-semibold text-dark-text dark:text-light-text">${data?.price?.toFixed(4) ?? 'N/A'}</span></span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
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
                            <YAxis orientation="right" domain={[-20, 120]} stroke={settings.textColor} fontSize={12} axisLine={false} tickLine={false} width={40} />
                            <Tooltip content={<CustomTooltip />} />
                            <ReferenceLine y={100} stroke="rgba(239, 68, 68, 0.6)" strokeDasharray="3 3" strokeWidth={1} />
                            <ReferenceLine y={80} stroke={settings.rsi50Color} strokeDasharray="2 2" strokeWidth={1} strokeOpacity={0.5} />
                            <ReferenceLine y={20} stroke={settings.rsi50Color} strokeDasharray="2 2" strokeWidth={1} strokeOpacity={0.5} />
                            <ReferenceLine y={0} stroke="rgba(34, 197, 94, 0.6)" strokeDasharray="3 3" strokeWidth={1} />
                            <ReferenceLine y={50} stroke={settings.rsi50Color} strokeDasharray="5 5" strokeWidth={1.5} />

                            <Area type="monotone" dataKey="q3" stroke={settings.kiwiHuntQ3Color} fill={settings.kiwiHuntQ3Color} fillOpacity={0.3} strokeWidth={1} isAnimationActive={false} />
                            <Line type="monotone" dataKey="q5" stroke={settings.kiwiHuntQ5Color} strokeWidth={settings.lineWidth} dot={false} name="Q5" isAnimationActive={false} />
                            <Line type="monotone" dataKey="q1" stroke={settings.kiwiHuntQ1Color} strokeWidth={settings.lineWidth} dot={false} name="Q1" isAnimationActive={false} />
                            <Line type="monotone" dataKey="trigger" stroke={settings.kiwiHuntTriggerColor} strokeWidth={settings.lineWidth * 0.75} dot={false} name="Trigger" isAnimationActive={false} />

                            {/* Signal Dots & Triangles */}
                            {/* FIX: Removed invalid 'zIndex' prop from Scatter components. The zIndex prop is not supported by the recharts Scatter component. */}
                            <Scatter dataKey="huntBuy" fill="#22c55e" shape="circle" r={5} isAnimationActive={false} />
                            <Scatter dataKey="crazyBuy" fill="#facc15" shape="circle" r={5} isAnimationActive={false} />
                            <Scatter dataKey="huntSell" fill="#ef4444" shape="circle" r={5} isAnimationActive={false} />
                            <Scatter dataKey="crazySell" fill="#f97316" shape="circle" r={5} isAnimationActive={false} />
                            <Scatter dataKey="buyTrend" fill="#2dd4bf" shape="triangle" r={6} isAnimationActive={false} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default KiwiHuntDetailModal;