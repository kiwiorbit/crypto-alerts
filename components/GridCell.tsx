
import React, { useState, memo } from 'react';
import { LineChart, Line, ResponsiveContainer, ReferenceLine, YAxis } from 'recharts';
import type { SymbolData, Settings } from '../types';
import FavoriteButton from './FavoriteButton';

interface GridCellProps extends React.HTMLAttributes<HTMLDivElement> {
    symbol: string;
    data: SymbolData;
    onSelectSymbol: (symbol: string) => void;
    settings: Settings;
    isFavorite: boolean;
    onToggleFavorite: (symbol: string) => void;
}

const GridCell: React.FC<GridCellProps> = ({ symbol, data, onSelectSymbol, settings, isFavorite, onToggleFavorite, ...rest }) => {
    const [isHovered, setIsHovered] = useState(false);
    const lastRsi = data?.rsi?.[data.rsi.length - 1]?.value;

    const getRsiColor = (rsi: number) => {
        if (rsi > 70) return 'text-red-400';
        if (rsi < 30) return 'text-green-400';
        return 'text-dark-text dark:text-light-text';
    };

    const rsiDomain = ['dataMin - 5', 'dataMax + 5'];

    return (
        <div
            {...rest}
            className="group relative flex flex-col items-center justify-center p-2 rounded-xl shadow-lg cursor-pointer transition-all duration-200 ease-in-out h-40"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => onSelectSymbol(symbol)}
        >
            <div className="absolute inset-0 bg-light-card dark:bg-dark-card rounded-xl group-hover:shadow-lg group-hover:border-primary group-hover:-translate-y-0.5 group-hover:scale-[1.02] transition-all duration-200 ease-in-out border border-light-border dark:border-dark-border"></div>
            
             <FavoriteButton
                symbol={symbol}
                isFavorite={isFavorite}
                onToggleFavorite={onToggleFavorite}
                className="absolute top-2 right-2 z-10 p-1 text-lg text-medium-text dark:text-medium-text hover:text-yellow-400 transition-colors"
            />

            <div className="relative w-full h-full flex flex-col">
                <div className="flex justify-between items-center px-2 pt-1 text-sm pr-8">
                    <span className="font-bold text-dark-text dark:text-light-text truncate" title={symbol}>
                        {symbol}
                    </span>
                    <span className={`font-mono font-semibold ${lastRsi ? getRsiColor(lastRsi) : 'text-medium-text-light dark:text-medium-text'}`}>
                        {lastRsi ? lastRsi.toFixed(2) : 'N/A'}
                    </span>
                </div>
                <div className="flex-grow w-full h-full">
                    {data && data.rsi.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.rsi} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                                <defs>
                                    <linearGradient id={`colorRsi-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={settings.rsiColor} stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor={settings.rsiColor} stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <YAxis domain={rsiDomain} hide={true} />
                                <ReferenceLine y={50} stroke={settings.rsi50Color} strokeDasharray="3 3" strokeWidth={1.5} />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke={settings.rsiColor}
                                    strokeWidth={settings.lineWidth}
                                    dot={false}
                                    isAnimationActive={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                         <div className="flex items-center justify-center h-full text-xs text-medium-text-light dark:text-medium-text">
                            No Data
                         </div>
                    )}
                </div>
            </div>

            <div className={`absolute bottom-full mb-2 w-max bg-light-card dark:bg-dark-card text-dark-text dark:text-light-text text-xs rounded-md py-1 px-3 shadow-xl z-40 border border-light-border dark:border-dark-border transition-opacity duration-200 ease-in-out ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <p><span className="font-semibold">Price:</span> ${data?.price?.toFixed(4)}</p>
            </div>
        </div>
    );
};

export default memo(GridCell);