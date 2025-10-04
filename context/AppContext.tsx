
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Settings, SymbolData, Timeframe, Theme, Notification, SortOrder, ViewMode, ActiveModal, AlertConditions, TrailingStopSettings } from '../types';
import useUserSettings from '../hooks/useUserSettings';
import useNotifications from '../hooks/useNotifications';
import useSymbolData from '../hooks/useSymbolData';
import { checkAllAlerts } from '../services/alertingService';

interface AppContextType {
    isInitializing: boolean;
    // User Settings
    settings: Settings;
    theme: Theme;
    favorites: string[];
    userSymbols: string[];
    allSymbols: string[];
    showFavoritesOnly: boolean;
    sortOrder: SortOrder;
    viewMode: ViewMode;
    page: string;
    handleThemeToggle: () => void;
    handleSettingChange: (key: keyof Settings, value: any) => void;
    handleAlertConditionChange: (key: keyof AlertConditions, value: boolean) => void;
    handleTrailingStopSettingChange: (key: keyof TrailingStopSettings, value: any) => void;
    toggleFavorite: (symbol: string) => void;
    handleShowFavoritesOnlyToggle: () => void;
    handleSortChange: () => void;
    handleViewModeChange: (mode: ViewMode) => void;
    handleSaveAssetList: (data: { allSymbols: string[]; selectedSymbols: string[]; }) => void;
    handleNavigateToFullView: () => void;
    handleNavigateBack: () => void;
    handleResetSettings: () => void;
    // Symbol Data
    symbolsData: Record<string, SymbolData>;
    loading: boolean;
    timeframe: Timeframe;
    lastDataFetch: Date | null;
    handleTimeframeChange: (tf: Timeframe) => void;
    // Notifications
    activeToast: Notification | null;
    notifications: Notification[];
    addNotification: (notification: Omit<Notification, 'id' | 'read' | 'timestamp'>, showToast?: boolean) => void;
    handleToastFinished: () => void;
    markNotificationsAsRead: () => void;
    clearNotifications: () => void;
    ToastContainer: React.FC<{ toast: Notification | null; onFinish: () => void; onClick?: (notification: Notification) => void; }>;
    handleNotificationClick: (notification: Notification) => void;
    // UI State
    activeSymbol: string | null;
    activeModal: ActiveModal;
    modalInitialState: Record<string, boolean>;
    isSettingsOpen: boolean;
    isAssetModalOpen: boolean;
    isAlertsModalOpen: boolean;
    handleSelectRsiSymbol: (symbol: string) => void;
    handleSelectStochSymbol: (symbol: string) => void;
    handleSelectPriceSymbol: (symbol: string) => void;
    handleSelectWaveTrendSymbol: (symbol: string) => void;
    handleSelectKiwiHuntSymbol: (symbol: string) => void;
    handleSelectVolumeSymbol: (symbol: string) => void;
    handleCloseModal: () => void;
    handleSettingsToggle: () => void;
    setIsSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setIsAssetModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setIsAlertsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    searchTerm: string;
    handleSearchChange: (term: string) => void;
    handleSwitchToPriceChart: () => void;
    handleSwitchToRsiChart: () => void;
    handleSwitchToStochChart: () => void;
    handleSwitchToWaveTrendChart: () => void;
    handleSwitchToKiwiHuntChart: () => void;
    displayedSymbols: string[];
    // Lock State
    isLocked: boolean;
    unlockApp: () => void;
}


const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // --- UI State ---
    const [activeSymbol, setActiveSymbol] = useState<string | null>(null);
    const [activeModal, setActiveModal] = useState<ActiveModal>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
    const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isInitializing, setIsInitializing] = useState(() => !sessionStorage.getItem('hasSeenSplash'));
    const [isLocked, setIsLocked] = useState(() => !sessionStorage.getItem('appIsUnlocked'));
    const [modalInitialState, setModalInitialState] = useState<Record<string, boolean>>({});
    
    // --- Custom Hooks ---
    const { 
        settings, theme, favorites, userSymbols, allSymbols, showFavoritesOnly, 
        sortOrder, viewMode, page, timeframe, handleTimeframeChange, 
        handleTrailingStopSettingChange,
        ...userSettingsHandlers 
    } = useUserSettings();
    const { symbolsData, loading, lastDataFetch, fetchWeeklyLevelsForSymbol } = useSymbolData({ userSymbols, timeframe, settings });
    const { notifications, activeToast, addNotification, handleToastFinished, markNotificationsAsRead, clearNotifications, ToastContainer } = useNotifications({ currentTimeframe: timeframe });
    
    // --- Alert State ---
    const [alertStates, setAlertStates] = useState<Record<string, any>>(() => {
        try {
            const savedStates = localStorage.getItem('alertStates');
            return savedStates ? JSON.parse(savedStates) : {};
        } catch (error) { return {}; }
    });

    useEffect(() => { localStorage.setItem('alertStates', JSON.stringify(alertStates)); }, [alertStates]);
    
    // --- Effects ---
     useEffect(() => {
        if (isInitializing) {
            const timer = setTimeout(() => {
                setIsInitializing(false);
                sessionStorage.setItem('hasSeenSplash', 'true');
            }, 4500);
            return () => clearTimeout(timer);
        }
    }, [isInitializing]);
    
    // Client-side alert check for toast notifications
    useEffect(() => {
        if (isInitializing || loading || Object.keys(symbolsData).length === 0) {
            return;
        }

        const allAlertsDisabled = Object.values(settings.alertConditions).every(value => value === false);
        if (allAlertsDisabled) {
            return;
        }

        for (const symbol in symbolsData) {
            const data = symbolsData[symbol];
            if (data && data.klines.length > 0) {
                const alerts = checkAllAlerts(symbol, timeframe, data, settings, alertStates, setAlertStates);
                alerts.forEach(alert => {
                    addNotification(alert, true);
                });
            }
        }
    }, [symbolsData, timeframe, settings, alertStates, addNotification, setAlertStates, isInitializing, loading]);


    // --- Derived State & Memos ---
    const displayedSymbols = useMemo(() => {
        let symbols = showFavoritesOnly ? favorites : userSymbols;
        if (searchTerm) {
            symbols = symbols.filter(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        
        const getSortValue = (symbol: string) => {
            const data = symbolsData[symbol];
            if (!data) return -Infinity;
            switch (sortOrder) {
                case 'rsi-asc':
                case 'rsi-desc':
                    return data.rsi?.[data.rsi.length - 1]?.value ?? -Infinity;
                case 'chg-asc':
                case 'chg-desc':
                    if (!data.klines || data.klines.length < 2) return -Infinity;
                    const change = data.klines[data.klines.length - 1].close - data.klines[0].close;
                    return data.klines[0].close === 0 ? 0 : (change / data.klines[0].close) * 100;
                case 'stoch-asc':
                case 'stoch-desc':
                    return data.stochK?.[data.stochK.length - 1]?.value ?? -Infinity;
                case 'waveTrend-asc':
                case 'waveTrend-desc':
                    return data.waveTrend2?.[data.waveTrend2.length - 1]?.value ?? -Infinity;
                case 'kiwiHunt-asc':
                case 'kiwiHunt-desc':
                    return data.kiwiHunt?.q1?.[data.kiwiHunt.q1.length - 1]?.value ?? -Infinity;
                case 'green-volume-desc':
                    if (!data.klines || data.klines.length === 0) return -Infinity;
                    return data.klines.reduce((sum, kline) => sum + kline.takerBuyQuoteVolume, 0);
                case 'red-volume-desc':
                    if (!data.klines || data.klines.length === 0) return -Infinity;
                    return data.klines.reduce((sum, kline) => sum + (kline.quoteVolume - kline.takerBuyQuoteVolume), 0);
                case 'buy-count-desc':
                    if (!data.klines || data.klines.length === 0) return -Infinity;
                    return data.klines.reduce((count, kline) => kline.takerBuyQuoteVolume >= (kline.quoteVolume / 2) ? count + 1 : count, 0);
                case 'sell-count-desc':
                     if (!data.klines || data.klines.length === 0) return -Infinity;
                    return data.klines.reduce((count, kline) => kline.takerBuyQuoteVolume < (kline.quoteVolume / 2) ? count + 1 : count, 0);
                case 'total-volume-desc':
                case 'total-volume-asc':
                    if (!data.klines || data.klines.length === 0) return -Infinity;
                    return data.klines.reduce((sum, kline) => sum + kline.quoteVolume, 0);
                case 'net-volume-desc':
                case 'net-volume-asc':
                    if (!data.klines || data.klines.length === 0) return -Infinity;
                    const buyVol = data.klines.reduce((sum, kline) => sum + kline.takerBuyQuoteVolume, 0);
                    const sellVol = data.klines.reduce((sum, kline) => sum + (kline.quoteVolume - kline.takerBuyQuoteVolume), 0);
                    return buyVol - sellVol;
                default:
                    return 0;
            }
        };

        if (sortOrder === 'default') {
            return symbols;
        }

        // Create a shallow copy before sorting to avoid mutating the original array
        const sortedSymbols = [...symbols];

        const isAsc = sortOrder.endsWith('-asc');
        sortedSymbols.sort((a, b) => {
            const valA = getSortValue(a);
            const valB = getSortValue(b);
            return isAsc ? valA - valB : valB - valA;
        });

        return sortedSymbols;
    }, [showFavoritesOnly, favorites, userSymbols, searchTerm, sortOrder, symbolsData]);

    // --- Lock Handlers ---
    const unlockApp = useCallback(() => {
        sessionStorage.setItem('appIsUnlocked', 'true');
        setIsLocked(false);
    }, []);

    // --- UI Handlers ---
    const handleCloseModal = useCallback(() => {
        setActiveModal(null);
        setModalInitialState({}); // Clear initial state when any modal closes
    }, []);
    
    const handleSelectSymbol = (symbol: string, modalType: ActiveModal) => {
        setActiveSymbol(symbol);
        setActiveModal(modalType);
    };

    const handleSelectRsiSymbol = (symbol: string) => handleSelectSymbol(symbol, 'rsi');
    const handleSelectStochSymbol = (symbol: string) => handleSelectSymbol(symbol, 'stoch');
    
    const handleSelectPriceSymbol = (symbol: string) => {
        const applicableTimeframes: Timeframe[] = ['4h', '1d', '3d', '1w'];
        if (applicableTimeframes.includes(timeframe)) {
            // Only fetch if not already present to avoid redundant API calls
            if (!symbolsData[symbol]?.weeklyLevels) {
                fetchWeeklyLevelsForSymbol(symbol);
            }
        }
        handleSelectSymbol(symbol, 'price');
    };

    const handleSelectWaveTrendSymbol = (symbol: string) => handleSelectSymbol(symbol, 'waveTrend');
    const handleSelectKiwiHuntSymbol = (symbol: string) => handleSelectSymbol(symbol, 'kiwiHunt');
    const handleSelectVolumeSymbol = (symbol: string) => handleSelectSymbol(symbol, 'volume');
    const handleSettingsToggle = () => setIsSettingsOpen(prev => !prev);
    const handleSearchChange = (term: string) => setSearchTerm(term);
    
    const handleSwitchToPriceChart = () => setActiveModal('price');
    const handleSwitchToRsiChart = () => setActiveModal('rsi');
    const handleSwitchToStochChart = () => setActiveModal('stoch');
    const handleSwitchToWaveTrendChart = () => setActiveModal('waveTrend');
    const handleSwitchToKiwiHuntChart = () => setActiveModal('kiwiHunt');

    
    const handleNavigateToFullView = () => {
        handleCloseModal();
        userSettingsHandlers.handleNavigateToFullView();
    };
    
    const handleSaveAndNotify = useCallback((data: { allSymbols: string[]; selectedSymbols: string[]; }) => {
        userSettingsHandlers.handleSaveAssetList(data);
        addNotification({
            symbol: 'System',
            timeframe: 'N/A' as Timeframe,
            type: 'accumulation-volume', // Re-use an existing style for success
            body: 'Asset list updated successfully.'
        }, true);
    }, [userSettingsHandlers, addNotification]);
    
    const handleNotificationClick = useCallback((notification: Notification) => {
        const initialState: Record<string, boolean> = {};
        const weeklyLevelTypes: Notification['type'][] = ['liquidity-sweep-reversal-bullish', 'liquidity-sweep-reversal-bearish'];
        const fibLevelTypes: Notification['type'][] = ['price-golden-pocket', 'gp-reversal-volume', 'fib-786-reversal'];

        if (weeklyLevelTypes.includes(notification.type)) {
            initialState.showWeeklyLevels = true;
        }
        if (fibLevelTypes.includes(notification.type) || notification.type.includes('divergence')) {
            initialState.showFibLevels = true;
        }

        handleCloseModal();
        handleToastFinished(); // Close the active toast immediately
        setModalInitialState(initialState);
        handleTimeframeChange(notification.timeframe);
        setActiveSymbol(notification.symbol);
        
        if(notification.type.includes('kiwi-hunt')) {
            setActiveModal('kiwiHunt');
        } else {
            setActiveModal('price');
        }
    }, [handleTimeframeChange, handleCloseModal, handleToastFinished]);


    const value: AppContextType = {
        isInitializing,
        settings, theme, favorites, userSymbols, allSymbols, showFavoritesOnly, sortOrder, viewMode, page, 
        ...userSettingsHandlers, 
        handleTimeframeChange,
        handleTrailingStopSettingChange,
        handleSaveAssetList: handleSaveAndNotify,
        handleNavigateToFullView,
        symbolsData, loading, timeframe, lastDataFetch,
        notifications, activeToast, addNotification, handleToastFinished, markNotificationsAsRead, clearNotifications, ToastContainer,
        handleNotificationClick,
        activeSymbol, activeModal, modalInitialState, isSettingsOpen, isAssetModalOpen, isAlertsModalOpen,
        handleSelectRsiSymbol, handleSelectStochSymbol, handleSelectPriceSymbol, handleSelectWaveTrendSymbol, handleSelectKiwiHuntSymbol, handleSelectVolumeSymbol, handleCloseModal,
        handleSettingsToggle,
        setIsSettingsOpen, setIsAssetModalOpen, setIsAlertsModalOpen,
        searchTerm, handleSearchChange,
        handleSwitchToPriceChart, handleSwitchToRsiChart, handleSwitchToStochChart, handleSwitchToWaveTrendChart, handleSwitchToKiwiHuntChart,
        displayedSymbols,
        isLocked, unlockApp,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === null) {
        throw new Error("useAppContext must be used within an AppProvider");
    }
    return context;
};