
import React, { useState, useRef, useEffect } from 'react';
import type { Timeframe } from '../types';

interface TimeframeDropdownProps {
    timeframe: Timeframe;
    onTimeframeChange: (timeframe: Timeframe) => void;
    timeframes: { value: Timeframe; label: string }[];
}

const TimeframeDropdown: React.FC<TimeframeDropdownProps> = ({ timeframe, onTimeframeChange, timeframes }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleSelect = (selectedTimeframe: Timeframe) => {
        onTimeframeChange(selectedTimeframe);
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    
    return (
        <div ref={dropdownRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-light-bg dark:bg-dark-bg rounded-lg px-4 py-2 w-full h-[42px] flex items-center justify-between gap-2 border border-light-border dark:border-dark-border shadow-sm hover:bg-light-border dark:hover:bg-dark-border transition"
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                <span className="text-base font-semibold text-dark-text dark:text-light-text">{timeframe}</span>
                <i className={`fa-solid fa-chevron-down text-xs text-medium-text-light dark:text-medium-text transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}></i>
            </button>

            {isOpen && (
                <div
                    className="absolute top-full mt-2 w-48 bg-light-card/95 dark:bg-dark-bg/95 backdrop-blur-lg border border-light-border/50 dark:border-dark-border/50 rounded-xl shadow-2xl p-2 z-50 origin-top animate-dropdown-in"
                    role="menu"
                    aria-orientation="vertical"
                >
                    <div className="grid grid-cols-3 gap-1">
                        {timeframes.map(tf => (
                            <button
                                key={tf.value}
                                onClick={() => handleSelect(tf.value)}
                                className={`w-full text-center p-2 rounded-md font-semibold text-sm transition-colors ${
                                    timeframe === tf.value
                                        ? 'bg-primary-light dark:bg-primary text-white dark:text-dark-bg'
                                        : 'text-dark-text dark:text-light-text hover:bg-light-border dark:hover:bg-dark-border'
                                }`}
                                role="menuitem"
                            >
                                {tf.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimeframeDropdown;