


import React, { useState, useRef, useEffect, memo, useMemo } from 'react';
import type { Timeframe, Notification, Settings } from '../types';
import TimeframeDropdown from './TimeframeDropdown';
import NotificationPanel from './NotificationPanel';

interface CryptoHeaderProps {
    timeframe: Timeframe;
    onTimeframeChange: (timeframe: Timeframe) => void;
    onSettingsToggle: () => void;
    timeframes: { value: Timeframe; label: string }[];
    searchTerm: string;
    onSearchChange: (term: string) => void;
    notifications: Notification[];
    onClearNotifications: () => void;
    onMarkNotificationsRead: () => void;
    settings: Settings;
    // FIX: Add onNotificationClick prop to allow clicking on notifications in the panel.
    onNotificationClick: (notification: Notification) => void;
}

const CryptoHeader: React.FC<CryptoHeaderProps> = ({
    timeframe,
    onTimeframeChange,
    onSettingsToggle,
    timeframes,
    searchTerm,
    onSearchChange,
    notifications,
    onClearNotifications,
    onMarkNotificationsRead,
    settings,
    onNotificationClick,
}) => {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const headerContainerRef = useRef<HTMLDivElement>(null);
    const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);

    const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

    const handleToggleNotificationPanel = () => {
        if (!isNotificationPanelOpen) {
            onMarkNotificationsRead();
        }
        setIsNotificationPanelOpen(prev => !prev);
    };

    const handleToggleSearch = () => {
        if (isSearchOpen) {
            onSearchChange('');
        }
        setIsSearchOpen(!isSearchOpen);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!headerContainerRef.current) return;
        const rect = headerContainerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        headerContainerRef.current.style.setProperty('--mouse-x', `${x}px`);
        headerContainerRef.current.style.setProperty('--mouse-y', `${y}px`);
    };

    useEffect(() => {
        if (isSearchOpen) {
            const timer = setTimeout(() => searchInputRef.current?.focus(), 150);
            return () => clearTimeout(timer);
        }
    }, [isSearchOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isSearchOpen && searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchOpen(false);
                onSearchChange('');
            }
            if (isNotificationPanelOpen && notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setIsNotificationPanelOpen(false);
            }
        };

        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                if (isSearchOpen) {
                    setIsSearchOpen(false);
                    onSearchChange('');
                }
                if (isNotificationPanelOpen) {
                    setIsNotificationPanelOpen(false);
                }
            }
        };

        document.addEventListener('click', handleClickOutside);
        document.addEventListener('keydown', handleEscKey);

        return () => {
            document.removeEventListener('click', handleClickOutside);
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [isSearchOpen, isNotificationPanelOpen, onSearchChange]);

    return (
        <header className="fixed top-0 left-0 right-0 p-4 z-30 header-on-load">
            <div
                ref={headerContainerRef}
                onMouseMove={handleMouseMove}
                className="interactive-header-container relative bg-light-card/30 shadow-xl shadow-slate-400/20 border-primary-light/40 dark:bg-dark-card/30 dark:shadow-none dark:border-dark-border/30 backdrop-blur-xl border rounded-2xl transition-all duration-300 ease-in-out dark:hover:shadow-xl dark:hover:shadow-primary/20 dark:hover:border-primary/80"
            >
                <div className="aurora-container rounded-2xl">
                    <div className="aurora-shape aurora-shape1"></div>
                    <div className="aurora-shape aurora-shape2"></div>
                    <div className="aurora-shape aurora-shape3"></div>
                </div>
                <div className="relative z-10 p-4 flex flex-col md:flex-row items-center md:justify-between gap-4">
                    <div className="text-center md:text-left header-title-group">
                        <div className="flex items-center gap-3 justify-center md:justify-start">
                            <i className="fa-solid fa-chart-line text-primary-light dark:text-primary text-3xl"></i>
                            <div>
                                <h1 className="text-xl font-bold text-dark-text dark:text-light-text tracking-tight">Crypto RSI Scanner</h1>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 sm:gap-4 header-controls-group">
                         <div>
                            <TimeframeDropdown
                                timeframe={timeframe}
                                onTimeframeChange={onTimeframeChange}
                                timeframes={timeframes}
                            />
                         </div>
                        <button
                            onClick={onSettingsToggle}
                            className="bg-light-bg dark:bg-dark-bg rounded-lg p-2 w-[42px] h-[42px] flex items-center justify-center border border-light-border dark:border-dark-border shadow-sm hover:bg-light-border dark:hover:bg-dark-border transition"
                            aria-label="Open settings"
                        >
                            <i className="fa-solid fa-gear text-primary-light dark:text-primary text-[22px]"></i>
                        </button>
                        
                        <div ref={notificationRef} className="relative">
                             <button
                                id="notification-bell-btn"
                                onClick={handleToggleNotificationPanel}
                                className="relative bg-light-bg dark:bg-dark-bg rounded-lg p-2 w-[42px] h-[42px] flex items-center justify-center border border-light-border dark:border-dark-border shadow-sm hover:bg-light-border dark:hover:bg-dark-border transition"
                                aria-label="Open notifications"
                            >
                                <i className="fa-solid fa-bell text-primary-light dark:text-primary text-[22px]"></i>
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse-dot border-2 border-light-card dark:border-dark-card"></span>
                                )}
                            </button>
                            <NotificationPanel
                                isOpen={isNotificationPanelOpen}
                                notifications={notifications}
                                onClear={() => {
                                    onClearNotifications();
                                    setIsNotificationPanelOpen(false);
                                }}
                                onNotificationClick={onNotificationClick}
                            />
                        </div>

                        <div ref={searchRef} className="relative flex items-center justify-end">
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Search symbol..."
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className={`h-[42px] rounded-lg bg-light-bg dark:bg-dark-bg pl-4 pr-12 text-dark-text dark:text-light-text outline-none border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-light dark:focus:ring-primary absolute right-0 top-0 transition-all duration-300 ease-in-out ${isSearchOpen ? 'w-40 sm:w-48 opacity-100' : 'w-10 opacity-0 pointer-events-none'}`}
                            />
                            <button
                                onClick={handleToggleSearch}
                                className="relative z-10 bg-light-bg dark:bg-dark-bg rounded-lg p-2 w-[42px] h-[42px] flex items-center justify-center border border-light-border dark:border-dark-border shadow-sm hover:bg-light-border dark:hover:bg-dark-border transition"
                                aria-label={isSearchOpen ? 'Close search' : 'Open search'}
                            >
                                <i className={`fa-solid ${isSearchOpen ? 'fa-xmark' : 'fa-search'} text-primary-light dark:text-primary text-[20px] transition-transform duration-300 ease-in-out ${isSearchOpen ? 'rotate-180' : 'rotate-0'}`}></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default memo(CryptoHeader);