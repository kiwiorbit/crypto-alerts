

import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, LineChart, ReferenceLine, Scatter } from 'recharts';
import * as htmlToImage from 'html-to-image';
import type { SymbolData, Settings, Timeframe, Drawing, DrawingTool } from '../types';
import DrawingToolbar from './DrawingToolbar';

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
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
    };
};

const embedFontsInCss = async (url: string): Promise<string> => {
    try {
        const cssText = await fetch(url).then(res => res.text());
        const fontUrls = cssText.match(/url\(https?:\/\/[^)]+\)/g) || [];

        const fontPromises = fontUrls.map(async (fontUrlMatch) => {
            const fontUrl = fontUrlMatch.replace(/url\((['"])?(.*?)\1\)/, '$2');
            const response = await fetch(fontUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch font: ${response.statusText}`);
            }
            const blob = await response.blob();
            return new Promise<[string, string]>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    resolve([fontUrlMatch, reader.result as string]);
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        });

        const fontData = await Promise.all(fontPromises);
        let newCssText = cssText;
        fontData.forEach(([url, dataUrl]) => {
            newCssText = newCssText.replace(url, `url(${dataUrl})`);
        });

        return newCssText;
    } catch (error) {
        console.error('Failed to embed fonts:', error);
        return '';
    }
};

const Candlestick = (props: any) => {
    const { x, y, width, height, payload } = props;
    const { open, close, high, low } = payload;
    const isUp = close > open;
    const color = isUp ? '#22c55e' : '#ef4444';
    
    const priceRange = Math.abs(open - close);
    // Handle case where open and close are the same to avoid division by zero
    const pixelPerPrice = priceRange > 0 ? Math.abs(height) / priceRange : 0;
  
    // y is the coordinate of the top of the body
    const bodyTop = y;
    const wickHigh = bodyTop - (high - Math.max(open, close)) * pixelPerPrice;
    const wickLow = bodyTop + Math.abs(height) + (Math.min(open, close) - low) * pixelPerPrice;
  
    return (
      <g>
        <path d={`M ${x + width / 2},${wickHigh} L ${x + width / 2},${wickLow}`} stroke={color} strokeWidth={1}/>
        <rect x={x} y={bodyTop} width={width} height={Math.max(1, Math.abs(height))} fill={color} />
      </g>
    );
};

interface StochFullViewPageProps {
    symbol: string;
    data: SymbolData;
    onBack: () => void;
    settings: Settings;
    timeframe: Timeframe;
}

const StochFullViewPage: React.FC<StochFullViewPageProps> = ({ symbol, data, onBack, settings, timeframe }) => {
    const fullChartRef = useRef<HTMLElement>(null);
    const [isCopied, setIsCopied] = useState(false);
    const [captureTimestamp, setCaptureTimestamp] = useState<string | null>(null);

    const [priceDrawings, setPriceDrawings] = useState<Drawing[]>([]);
    const [stochDrawings, setStochDrawings] = useState<Drawing[]>([]);

    const [activeTool, setActiveTool] = useState<DrawingTool>('trendline');
    const [brushColor, setBrushColor] = useState(settings.textColor);
    const [showTrail, setShowTrail] = useState(true);
    
    useEffect(() => { setBrushColor(settings.textColor) }, [settings.textColor]);

    const priceCanvasRef = useRef<HTMLCanvasElement>(null);
    const stochCanvasRef = useRef<HTMLCanvasElement>(null);
    const priceContainerRef = useRef<HTMLDivElement>(null);
    const stochContainerRef = useRef<HTMLDivElement>(null);
    
    const isDrawingRef = useRef(false);
    const currentPathRef = useRef<Drawing | null>(null);
    const canvasSnapshotRef = useRef<ImageData | null>(null);
    const activeCanvasInfoRef = useRef<{
        canvas: HTMLCanvasElement;
        setDrawings: React.Dispatch<React.SetStateAction<Drawing[]>>;
        redraw: () => void;
    } | null>(null);

    const priceChartData = useMemo(() => {
        if (!data?.klines) return [];
        
        const vwapSource = data.dailyVwap && data.dailyVwap.length > 0 ? data.dailyVwap : data.vwap;
        const vwapMap = new Map(vwapSource?.map(p => [p.time, p.value]));
        const trailMap = new Map(data.luxalgoTrail?.map(p => [p.time, { bias: p.bias, level: p.level }]));
    
        return data.klines.map((k, index, arr) => {
            const trailPoint = trailMap.get(k.time);
            const prevTrailPoint = index > 0 ? trailMap.get(arr[index - 1].time) : undefined;
            
            let bullishFlipMark = null;
            let bearishFlipMark = null;
    
            if (trailPoint && prevTrailPoint && prevTrailPoint.bias !== trailPoint.bias) {
                if (trailPoint.bias === 1) { // BULLISH
                    bullishFlipMark = trailPoint.level;
                } else { // BEARISH
                    bearishFlipMark = trailPoint.level;
                }
            }
            
            return {
              ...k,
              body: [k.open, k.close],
              vwap: vwapMap.get(k.time) ?? null,
              bullishTrail: trailPoint?.bias === 1 ? trailPoint.level : null,
              bearishTrail: trailPoint?.bias === 0 ? trailPoint.level : null,
              bullishFlipMark,
              bearishFlipMark,
            };
        });
    }, [data]);
      
    const stochChartData = useMemo(() => {
        if (!data?.stochK || !data?.stochD) return [];
        const dMap = new Map(data.stochD.map(p => [p.time, p.value]));
        return data.stochK.map(kPoint => ({
            time: kPoint.time,
            k: kPoint.value,
            d: dMap.get(kPoint.time) ?? null,
        }));
    }, [data.stochK, data.stochD]);

    const redrawCanvas = useCallback((canvas: HTMLCanvasElement | null, drawings: Drawing[]) => {
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
                if (index === 0) ctx.moveTo(point.x, point.y);
                else ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();
        });
    }, []);

    const redrawPriceCanvas = useCallback(() => redrawCanvas(priceCanvasRef.current, priceDrawings), [priceDrawings, redrawCanvas]);
    const redrawStochCanvas = useCallback(() => redrawCanvas(stochCanvasRef.current, stochDrawings), [stochDrawings, redrawCanvas]);

    const useCanvasResize = (containerRef: React.RefObject<HTMLDivElement>, canvasRef: React.RefObject<HTMLCanvasElement>, redraw: () => void) => {
        useEffect(() => {
            const canvas = canvasRef.current;
            const container = containerRef.current;
            if (!canvas || !container) return;
            const resizeObserver = new ResizeObserver(entries => {
                for (let entry of entries) {
                    const { width, height } = entry.contentRect;
                    canvas.width = width;
                    canvas.height = height;
                    redraw();
                }
            });
            resizeObserver.observe(container);
            return () => resizeObserver.disconnect();
        }, [containerRef, canvasRef, redraw]);
    };
    
    useCanvasResize(priceContainerRef, priceCanvasRef, redrawPriceCanvas);
    useCanvasResize(stochContainerRef, stochCanvasRef, redrawStochCanvas);

    useEffect(redrawPriceCanvas, [priceDrawings, redrawPriceCanvas]);
    useEffect(redrawStochCanvas, [stochDrawings, redrawStochCanvas]);

    const handleDrawStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!activeCanvasInfoRef.current) return;
        const { canvas } = activeCanvasInfoRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        if ('touches' in e) e.preventDefault();
        isDrawingRef.current = true;
        const coords = getEventCoordinates(e);
        if (!coords) return;
        const { x, y } = coords;
        currentPathRef.current = { tool: activeTool, points: [{ x, y }], color: brushColor, size: BRUSH_SIZE };
        if (activeTool === 'trendline') {
            canvasSnapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
        }
    };
    
    const handleDrawMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawingRef.current || !currentPathRef.current || !activeCanvasInfoRef.current) return;
        const { canvas, redraw } = activeCanvasInfoRef.current;
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
            if (canvasSnapshotRef.current) ctx.putImageData(canvasSnapshotRef.current, 0, 0);
            else { ctx.clearRect(0, 0, canvas.width, canvas.height); redraw(); }
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
        if (!isDrawingRef.current || !currentPathRef.current || !activeCanvasInfoRef.current) return;
        const { setDrawings } = activeCanvasInfoRef.current;
        if ('touches' in e) e.preventDefault();
        isDrawingRef.current = false;
        const coords = getEventCoordinates(e);
        if (activeTool === 'trendline' && coords) {
             currentPathRef.current.points.push({ x: coords.x, y: coords.y });
        }
        setDrawings(prev => [...prev, currentPathRef.current!]);
        currentPathRef.current = null;
        canvasSnapshotRef.current = null;
        activeCanvasInfoRef.current = null;
    };

    const handleCapture = useCallback(async () => {
        if (!fullChartRef.current || isCopied) return;
        setCaptureTimestamp(new Date().toUTCString());
        await new Promise(resolve => setTimeout(resolve, 100));
        const style = document.createElement('style');
        document.head.appendChild(style);
        try {
            const fontAwesomeCss = await embedFontsInCss('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css');
            const googleFontsCss = await embedFontsInCss('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            style.appendChild(document.createTextNode(fontAwesomeCss + googleFontsCss));
            const blobOptions = {
                backgroundColor: document.documentElement.classList.contains('dark') ? '#000000' : '#ffffff',
                filter: (node: Node): boolean => !(node instanceof HTMLLinkElement && (node.href.includes('fonts.googleapis.com') || node.href.includes('cdnjs.cloudflare.com'))),
            };
            const blob = await htmlToImage.toBlob(fullChartRef.current, blobOptions);
            if (!blob) throw new Error('Failed to generate image blob.');
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (error) {
            console.error(`Failed to copy image:`, error);
            alert(`Could not copy chart image.`);
        } finally {
            if (document.head.contains(style)) document.head.removeChild(style);
            setCaptureTimestamp(null);
        }
    }, [isCopied]);

    const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const pricePoint = priceChartData.find(p => p.time === label);
            const stochPoint = stochChartData.find(p => p.time === label);
            return (
                <div className="p-2 bg-light-card/80 dark:bg-dark-card/80 backdrop-blur-lg rounded-lg shadow-xl border border-light-border/50 dark:border-dark-border/50 text-sm">
                    <p className="font-bold text-dark-text dark:text-light-text">{new Date(label).toUTCString()}</p>
                    {pricePoint && <>
                        <p>O: <span style={{ color: settings.textColor }}>{pricePoint.open.toFixed(4)}</span> H: <span className="text-green-500">{pricePoint.high.toFixed(4)}</span></p>
                        <p>L: <span className="text-red-500">{pricePoint.low.toFixed(4)}</span> C: <span style={{ color: settings.textColor }}>{pricePoint.close.toFixed(4)}</span></p>
                        {pricePoint.vwap && <p style={{ color: '#a78bfa' }}>VWAP: {pricePoint.vwap.toFixed(4)}</p>}
                    </>}
                    {stochPoint && <>
                        <p style={{ color: settings.stochKColor }}>%K: {stochPoint.k?.toFixed(2)}</p>
                        {stochPoint.d && <p style={{ color: settings.stochDColor }}>%D: {stochPoint.d.toFixed(2)}</p>}
                    </>}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="flex flex-col h-screen bg-light-bg dark:bg-dark-bg text-dark-text dark:text-light-text font-sans">
            <header className="flex-shrink-0 p-2 md:p-3 border-b border-light-border dark:border-dark-border flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-3">
                <div className="flex items-center gap-3 md:gap-4">
                    <button onClick={onBack} className="text-lg md:text-xl w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg hover:bg-light-border dark:hover:bg-dark-border transition-colors" aria-label="Go back">
                        <i className="fa-solid fa-arrow-left"></i>
                    </button>
                    <div>
                        <h1 className="text-lg md:text-xl font-bold">{symbol}</h1>
                        <p className="text-xs md:text-sm text-medium-text-light dark:text-medium-text">{timeframe} | Price: ${data.price.toFixed(4)}</p>
                    </div>
                </div>
                <div className="flex items-center flex-wrap gap-x-2 gap-y-1 justify-end">
                    <DrawingToolbar activeTool={activeTool} onToolChange={setActiveTool} brushColor={brushColor} onColorChange={setBrushColor} onClear={() => { setPriceDrawings([]); setStochDrawings([]); }} textColor={settings.textColor} onCopy={handleCapture} isCopied={isCopied} />
                     <div className="h-6 md:h-8 w-px bg-light-border dark:bg-dark-border mx-1 md:mx-2"></div>
                    <button 
                        onClick={() => setShowTrail(prev => !prev)}
                        className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg text-lg md:text-xl transition-colors ${showTrail ? 'bg-light-border dark:bg-dark-border text-primary-light dark:text-primary' : 'text-medium-text-light dark:text-medium-text hover:bg-light-border dark:hover:bg-dark-border'}`}
                        aria-label="Toggle Trailing Stop"
                        title="Toggle Statistical Trailing Stop"
                    >
                        <i className="fa-solid fa-shoe-prints"></i>
                    </button>
                </div>
            </header>

            <main ref={fullChartRef} className="relative flex-grow flex flex-col p-2 md:p-4 gap-0.5 bg-white dark:bg-black">
                {captureTimestamp && (
                    <div className="absolute top-0 left-0 w-full p-4 z-[1] bg-white dark:bg-black pointer-events-none">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold text-dark-text dark:text-light-text">{symbol} ({timeframe})</h2>
                                <p className="text-sm text-medium-text-light dark:text-medium-text">Price: ${data.price.toFixed(4)}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-dark-text dark:text-light-text">Crypto RSI Scanner</p>
                                <p className="text-xs text-medium-text-light dark:text-medium-text">{captureTimestamp}</p>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={priceContainerRef} className="relative flex-grow basis-3/4 border-b border-light-border dark:border-dark-border">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={priceChartData} syncId="stochFullViewSync" margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                            <CartesianGrid stroke={settings.rsi50Color} strokeOpacity={0.1} />
                            <XAxis dataKey="time" hide={true} />
                            <YAxis orientation="right" domain={['auto', 'auto']} stroke={settings.textColor} fontSize={12} axisLine={false} tickLine={false} width={50} />
                            <Tooltip content={<CustomTooltip />} isAnimationActive={false} position={{ y: 10 }} />
                            <Bar dataKey="body" shape={<Candlestick />} isAnimationActive={false} />
                            <Line type="monotone" dataKey="vwap" stroke="#a78bfa" strokeWidth={1.5} dot={false} isAnimationActive={false} name="VWAP" />
                            {showTrail && (
                                <>
                                    <Line type="monotone" dataKey="bullishTrail" stroke="#089981" strokeWidth={2} dot={false} name="Bullish Trail" isAnimationActive={false} connectNulls={false} strokeDasharray="3 3" />
                                    <Line type="monotone" dataKey="bearishTrail" stroke="#F23645" strokeWidth={2} dot={false} name="Bearish Trail" isAnimationActive={false} connectNulls={false} strokeDasharray="3 3" />
                                    <Scatter dataKey="bullishFlipMark" fill="#089981" shape="circle" r={5} isAnimationActive={false} />
                                    <Scatter dataKey="bearishFlipMark" fill="#F23645" shape="circle" r={5} isAnimationActive={false} />
                                </>
                            )}
                        </ComposedChart>
                    </ResponsiveContainer>
                    <canvas ref={priceCanvasRef} className="absolute top-0 left-0 w-full h-full cursor-crosshair" 
                        onMouseDown={(e) => { activeCanvasInfoRef.current = { canvas: e.currentTarget, setDrawings: setPriceDrawings, redraw: redrawPriceCanvas }; handleDrawStart(e); }}
                        onMouseMove={handleDrawMove} onMouseUp={handleDrawEnd} onMouseLeave={handleDrawEnd} onTouchStart={(e) => { activeCanvasInfoRef.current = { canvas: e.currentTarget, setDrawings: setPriceDrawings, redraw: redrawPriceCanvas }; handleDrawStart(e); }} onTouchMove={handleDrawMove} onTouchEnd={handleDrawEnd} onTouchCancel={handleDrawEnd} />
                </div>
                <div ref={stochContainerRef} className="relative flex-grow basis-1/4">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stochChartData} syncId="stochFullViewSync" margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                             <CartesianGrid stroke={settings.rsi50Color} strokeOpacity={0.1} />
                            <XAxis dataKey="time" hide={true} />
                            <YAxis orientation="right" domain={[0, 100]} stroke={settings.textColor} fontSize={12} axisLine={false} tickLine={false} width={50} />
                            <Tooltip content={<CustomTooltip />} isAnimationActive={false} position={{ y: 10 }} />
                            <ReferenceLine y={80} stroke="red" strokeDasharray="3 3" strokeOpacity={0.5} />
                            <ReferenceLine y={20} stroke="green" strokeDasharray="3 3" strokeOpacity={0.5} />
                            <ReferenceLine y={50} stroke={settings.rsi50Color} strokeDasharray="5 5" />
                            <Line type="monotone" dataKey="k" stroke={settings.stochKColor} strokeWidth={settings.lineWidth} dot={false} isAnimationActive={false} />
                            <Line type="monotone" dataKey="d" stroke={settings.stochDColor} strokeWidth={settings.lineWidth} dot={false} isAnimationActive={false} />
                        </LineChart>
                    </ResponsiveContainer>
                    <canvas ref={stochCanvasRef} className="absolute top-0 left-0 w-full h-full cursor-crosshair"
                        onMouseDown={(e) => { activeCanvasInfoRef.current = { canvas: e.currentTarget, setDrawings: setStochDrawings, redraw: redrawStochCanvas }; handleDrawStart(e); }}
                        onMouseMove={handleDrawMove} onMouseUp={handleDrawEnd} onMouseLeave={handleDrawEnd} onTouchStart={(e) => { activeCanvasInfoRef.current = { canvas: e.currentTarget, setDrawings: setStochDrawings, redraw: redrawStochCanvas }; handleDrawStart(e); }} onTouchMove={handleDrawMove} onTouchEnd={handleDrawEnd} onTouchCancel={handleDrawEnd} />
                </div>
            </main>
        </div>
    );
};

export default StochFullViewPage;