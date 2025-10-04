

import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { SymbolData, Settings, Timeframe, Drawing, DrawingTool } from '../types';
import DrawingToolbar from './DrawingToolbar';

interface ModalProps {
    symbol: string;
    data: SymbolData;
    onClose: () => void;
    settings: Settings;
    timeframe: Timeframe;
    onSwitchToPriceChart: () => void;
    onNavigateToFullView: () => void;
    onSwitchToStochChart: () => void;
}

const BRUSH_SIZE = 3;

// Helper function to get accurate canvas coordinates from mouse or touch events
const getEventCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): { x: number; y: number } | null => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();

    let clientX, clientY;

    if ('touches' in e) { // Touch event
        const touch = e.touches[0] || e.changedTouches[0];
        if (!touch) return null;
        clientX = touch.clientX;
        clientY = touch.clientY;
    } else { // Mouse event
        clientX = e.clientX;
        clientY = e.clientY;
    }

    // Calculate the scale between the canvas's display size (rect.width) and its internal drawing buffer size (canvas.width).
    // This is necessary because CSS might stretch the canvas and for HiDPI displays.
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
    };
};

const Modal: React.FC<ModalProps> = ({ symbol, data, onClose, settings, timeframe, onSwitchToPriceChart, onNavigateToFullView, onSwitchToStochChart }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    // Drawing state
    const [drawings, setDrawings] = useState<Drawing[]>([]);
    const [activeTool, setActiveTool] = useState<DrawingTool>('trendline');
    const [brushColor, setBrushColor] = useState(settings.textColor);

    const isDrawingRef = useRef(false);
    const currentPathRef = useRef<Drawing | null>(null);
    const canvasSnapshotRef = useRef<ImageData | null>(null);

    const lastRsi = useMemo(() => data?.rsi?.[data.rsi.length - 1]?.value, [data.rsi]);

    const getRsiColor = (rsi: number) => {
        if (rsi > 70) return 'text-red-400';
        if (rsi < 30) return 'text-green-400';
        return 'text-dark-text dark:text-light-text';
    };

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

    // Reset brush color if theme changes
    useEffect(() => {
        setBrushColor(settings.textColor);
    }, [settings.textColor]);

    const chartData = useMemo(() => {
        if (!data || !data.rsi) return [];
        return data.rsi.map(rsiPoint => {
            const smaPoint = data.sma?.find(sma => sma.time === rsiPoint.time);
            return {
                time: rsiPoint.time,
                rsi: rsiPoint.value,
                sma: smaPoint ? smaPoint.value : null,
            };
        });
    }, [data]);
    
    const redrawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawings.forEach(drawing => {
            ctx.beginPath();
            ctx.strokeStyle = drawing.color;
            ctx.lineWidth = drawing.size;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            drawing.points.forEach((point, index) => {
                if (index === 0) {
                    ctx.moveTo(point.x, point.y);
                } else {
                    ctx.lineTo(point.x, point.y);
                }
            });
            ctx.stroke();
        });
    }, [drawings]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = chartContainerRef.current;
        if (!canvas || !container) return;

        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                canvas.width = width;
                canvas.height = height;
                redrawCanvas();
            }
        });

        resizeObserver.observe(container);

        return () => resizeObserver.disconnect();
    }, [redrawCanvas]);
    
    useEffect(() => {
        redrawCanvas();
    }, [drawings, redrawCanvas]);

    const handleDrawStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        if ('touches' in e) e.preventDefault(); // Prevent scrolling on touch devices
        
        isDrawingRef.current = true;
        const coords = getEventCoordinates(e);
        if (!coords) return;
        const { x, y } = coords;

        currentPathRef.current = {
            tool: activeTool,
            points: [{ x, y }],
            color: brushColor,
            size: BRUSH_SIZE,
        };

        if (activeTool === 'trendline') {
            canvasSnapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
        }
    };
    
    const handleDrawMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawingRef.current || !currentPathRef.current) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if ('touches' in e) e.preventDefault();
        
        const coords = getEventCoordinates(e);
        if (!coords) return;
        const { x, y } = coords;

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (activeTool === 'brush') {
            const currentPath = currentPathRef.current;
            currentPath.points.push({ x, y });

            const p1 = currentPath.points[currentPath.points.length - 2];
            const p2 = currentPath.points[currentPath.points.length - 1];

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = currentPath.color;
            ctx.lineWidth = currentPath.size;
            ctx.stroke();
        } else if (activeTool === 'trendline') {
            if (canvasSnapshotRef.current) {
                ctx.putImageData(canvasSnapshotRef.current, 0, 0);
            } else {
                 ctx.clearRect(0, 0, canvas.width, canvas.height);
                 redrawCanvas();
            }

            const startPoint = currentPathRef.current.points[0];
            ctx.beginPath();
            ctx.moveTo(startPoint.x, startPoint.y);
            ctx.lineTo(x, y);
            ctx.strokeStyle = currentPathRef.current.color;
            ctx.lineWidth = currentPathRef.current.size;
            ctx.stroke();
        }
    };

    const handleDrawEnd = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawingRef.current || !currentPathRef.current) return;
        
        if ('touches' in e) e.preventDefault();
        isDrawingRef.current = false;
        const coords = getEventCoordinates(e);

        if (activeTool === 'trendline' && coords) {
             currentPathRef.current.points.push({ x: coords.x, y: coords.y });
        }
        
        setDrawings(prev => [...prev, currentPathRef.current!]);
        
        currentPathRef.current = null;
        canvasSnapshotRef.current = null;
    };

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
                    <p style={{ color: settings.rsiColor }}>RSI: {payload[0].value.toFixed(2)}</p>
                    {payload[1] && <p style={{ color: settings.smaColor }}>SMA: {payload[1].value.toFixed(2)}</p>}
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
                        <div className="flex items-center gap-4 text-xs text-medium-text-light dark:text-medium-text">
                            <span>Price: <span className="font-semibold text-dark-text dark:text-light-text">${data?.price?.toFixed(4) ?? 'N/A'}</span></span>
                             <span>RSI: <span className={`font-semibold font-mono ${lastRsi ? getRsiColor(lastRsi) : 'text-medium-text-light dark:text-medium-text'}`}>{lastRsi ? lastRsi.toFixed(2) : 'N/A'}</span></span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                         <button 
                            onClick={onNavigateToFullView} 
                            className="text-xl w-10 h-10 flex items-center justify-center rounded-lg text-medium-text-light dark:text-medium-text hover:bg-light-border dark:hover:bg-dark-border transition-colors" 
                            aria-label="Full view"
                            title="Full View"
                        >
                            <i className="fa-solid fa-expand"></i>
                        </button>
                        <button 
                            onClick={onSwitchToStochChart} 
                            className="text-xl w-10 h-10 flex items-center justify-center rounded-lg text-medium-text-light dark:text-medium-text hover:bg-light-border dark:hover:bg-dark-border transition-colors" 
                            aria-label="View Stochastic RSI chart"
                            title="View Stochastic RSI Chart"
                        >
                            <i className="fa-solid fa-tornado"></i>
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
                
                <div className="px-4 py-2 border-b border-light-border dark:border-dark-border bg-light-bg/50 dark:bg-dark-bg/50">
                    <DrawingToolbar 
                        activeTool={activeTool}
                        onToolChange={setActiveTool}
                        brushColor={brushColor}
                        onColorChange={setBrushColor}
                        onClear={() => setDrawings([])}
                        textColor={settings.textColor}
                    />
                </div>
                
                <div ref={chartContainerRef} className="relative flex-grow p-4 dark:bg-black rounded-b-2xl">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid stroke={settings.rsi50Color} strokeOpacity={0.2} vertical={false} />
                            <XAxis dataKey="time" tickFormatter={timeFormatter} stroke={settings.textColor} fontSize={12} axisLine={false} tickLine={false} hide={true} />
                            <YAxis orientation="right" domain={[0, 100]} stroke={settings.textColor} fontSize={12} axisLine={false} tickLine={false} width={40} />
                            <Tooltip content={<CustomTooltip />} />
                            <ReferenceLine y={70} stroke="red" strokeDasharray="3 3" strokeOpacity={0.5} strokeWidth={2} />
                            <ReferenceLine y={30} stroke="green" strokeDasharray="3 3" strokeOpacity={0.5} strokeWidth={2} />
                            <ReferenceLine y={50} stroke={settings.rsi50Color} strokeDasharray="5 5" strokeWidth={2} />
                            <Line type="monotone" dataKey="rsi" stroke={settings.rsiColor} strokeWidth={settings.lineWidth} dot={false} name="RSI (14)" isAnimationActive={false} />
                            <Line type="monotone" dataKey="sma" stroke={settings.smaColor} strokeWidth={settings.lineWidth} dot={false} name="SMA (14)" isAnimationActive={false} />
                        </LineChart>
                    </ResponsiveContainer>
                     <canvas
                        ref={canvasRef}
                        className="absolute top-0 left-0 w-full h-full pointer-events-auto"
                        onMouseDown={handleDrawStart}
                        onMouseMove={handleDrawMove}
                        onMouseUp={handleDrawEnd}
                        onMouseLeave={handleDrawEnd}
                        onTouchStart={handleDrawStart}
                        onTouchMove={handleDrawMove}
                        onTouchEnd={handleDrawEnd}
                        onTouchCancel={handleDrawEnd}
                        style={{ zIndex: 10, cursor: 'crosshair' }}
                    />
                </div>
            </div>
        </div>
    );
};

export default Modal;