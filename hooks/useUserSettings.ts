import { useState, useEffect, useCallback } from 'react';
import type { Theme, Settings, SortOrder, ViewMode, Timeframe, AlertConditions, TrailingStopSettings } from '../types';
import { LIGHT_THEME_SETTINGS, DARK_THEME_SETTINGS, DEFAULT_SYMBOLS } from '../constants';

const getInitialState = <T,>(key: string, defaultValue: T): T => {
    try {
        const storedValue = localStorage.getItem(key);
        if (storedValue) {
            return JSON.parse(storedValue);
        }
    } catch (error) {
        console.error(`Error reading from localStorage for key "${key}":`, error);
    }
    return defaultValue;
};

// Helper for deep merging objects, useful for settings. Saved values override defaults.
const deepMerge = <T extends object>(defaults: T, saved: Partial<T>): T => {
    const merged = { ...defaults };
    for (const key in saved) {
        if (Object.prototype.hasOwnProperty.call(saved, key)) {
            const savedValue = saved[key as keyof T];
            const defaultValue = defaults[key as keyof T];

            if (
                typeof savedValue === 'object' && savedValue !== null && !Array.isArray(savedValue) &&
                typeof defaultValue === 'object' && defaultValue !== null && !Array.isArray(defaultValue)
            ) {
                // It's a nested object, recurse
                merged[key as keyof T] = deepMerge(defaultValue as object, savedValue as object) as T[keyof T];
            } else if (savedValue !== undefined) {
                // It's a primitive or array, or one of them is not an object, so just overwrite
                merged[key as keyof T] = savedValue;
            }
        }
    }
    return merged;
};

const useUserSettings = () => {
    const [theme, setTheme] = useState<Theme>(() => getInitialState<Theme>('theme', 'dark'));
    
    const [settings, setSettings] = useState<Settings>(() => {
        const defaultSettings = theme === 'dark' ? DARK_THEME_SETTINGS : LIGHT_THEME_SETTINGS;
        try {
            const storedValue = localStorage.getItem('settings');
            if (storedValue) {
                const savedSettings = JSON.parse(storedValue);
                // Perform a deep merge to ensure new settings keys are included from default,
                // while preserving the user's saved values.
                return deepMerge(defaultSettings, savedSettings);
            }
        } catch (error) {
            console.error(`Error reading settings from localStorage:`, error);
        }
        return defaultSettings;
    });

    const [favorites, setFavorites] = useState<string[]>(() => getInitialState<string[]>('favorites', []));
    const [allSymbols, setAllSymbols] = useState<string[]>(() => getInitialState<string[]>('allSymbols', DEFAULT_SYMBOLS));
    const [userSymbols, setUserSymbols] = useState<string[]>(() => getInitialState<string[]>('userSymbols', DEFAULT_SYMBOLS));
    
    // UI State persistence
    const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(() => getInitialState<boolean>('showFavoritesOnly', false));
    const [sortOrder, setSortOrder] = useState<SortOrder>(() => getInitialState<SortOrder>('sortOrder', 'default'));
    const [viewMode, setViewMode] = useState<ViewMode>('chart');
    const [timeframe, setTimeframe] = useState<Timeframe>('15m');
    
    const [page, setPage] = useState('dashboard');

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('theme', JSON.stringify(theme));
        // On theme change, merge the NEW theme defaults with the user's existing settings
        setSettings(prevSettings => {
            const newDefaultSettings = theme === 'dark' ? DARK_THEME_SETTINGS : LIGHT_THEME_SETTINGS;
            // We pass the new defaults and the previous state to merge
            // This preserves settings like `showHeatmapView` across theme changes
            return deepMerge(newDefaultSettings, prevSettings);
        });
    }, [theme]);
    
    useEffect(() => { localStorage.setItem('settings', JSON.stringify(settings)); }, [settings]);
    useEffect(() => { localStorage.setItem('favorites', JSON.stringify(favorites)); }, [favorites]);
    useEffect(() => { localStorage.setItem('userSymbols', JSON.stringify(userSymbols)); }, [userSymbols]);
    useEffect(() => { localStorage.setItem('allSymbols', JSON.stringify(allSymbols)); }, [allSymbols]);
    
    // Save UI state to localStorage
    useEffect(() => { localStorage.setItem('showFavoritesOnly', JSON.stringify(showFavoritesOnly)); }, [showFavoritesOnly]);
    useEffect(() => { localStorage.setItem('sortOrder', JSON.stringify(sortOrder)); }, [sortOrder]);


    const handleThemeToggle = useCallback(() => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    }, []);
    
    const handleSettingChange = useCallback((key: keyof Settings, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    }, []);
    
    const handleAlertConditionChange = useCallback((key: keyof AlertConditions, value: boolean) => {
        setSettings(prev => ({
            ...prev,
            alertConditions: {
                ...prev.alertConditions,
                [key]: value
            }
        }));
    }, []);

    const handleTrailingStopSettingChange = useCallback((key: keyof TrailingStopSettings, value: any) => {
        setSettings(prev => ({
            ...prev,
            trailingStopSettings: {
                ...prev.trailingStopSettings,
                [key]: value
            }
        }));
    }, []);

    const toggleFavorite = useCallback((symbol: string) => {
        setFavorites(prev => 
            prev.includes(symbol) ? prev.filter(f => f !== symbol) : [...prev, symbol]
        );
    }, []);
    
    const handleShowFavoritesOnlyToggle = useCallback(() => setShowFavoritesOnly(prev => !prev), []);

    const handleSortChange = useCallback(() => {
        setSortOrder(prev => {
            const currentView = viewMode;
            if (currentView === 'price') {
                if (prev === 'default') return 'chg-desc';
                if (prev === 'chg-desc') return 'chg-asc';
                return 'default';
            }
            if (currentView === 'stoch') {
                if (prev === 'default') return 'stoch-desc';
                if (prev === 'stoch-desc') return 'stoch-asc';
                return 'default';
            }
            if (currentView === 'waveTrend') {
                if (prev === 'default') return 'waveTrend-desc';
                if (prev === 'waveTrend-desc') return 'waveTrend-asc';
                return 'default';
            }
            if (currentView === 'kiwiHunt') {
                if (prev === 'default') return 'kiwiHunt-desc';
                if (prev === 'kiwiHunt-desc') return 'kiwiHunt-asc';
                return 'default';
            }
            if (currentView === 'volume') {
                if (prev === 'default') return 'buy-count-desc';
                if (prev === 'buy-count-desc') return 'sell-count-desc';
                if (prev === 'sell-count-desc') return 'net-volume-desc';
                if (prev === 'net-volume-desc') return 'net-volume-asc';
                return 'default';
            }
            if (currentView === 'volume-bar') {
                if (prev === 'default') return 'green-volume-desc';
                if (prev === 'green-volume-desc') return 'red-volume-desc';
                if (prev === 'red-volume-desc') return 'total-volume-desc';
                if (prev === 'total-volume-desc') return 'total-volume-asc';
                return 'default';
            }
            // Default to RSI/Heatmap sort
            if (prev === 'default') return 'rsi-desc';
            if (prev === 'rsi-desc') return 'rsi-asc';
            return 'default';
        });
    }, [viewMode]);
    
    const handleViewModeChange = useCallback((mode: ViewMode) => {
        setViewMode(mode);
        // Reset sort order when changing views because sort options are view-specific
        setSortOrder('default');
    }, []);
    
    const handleTimeframeChange = useCallback((tf: Timeframe) => setTimeframe(tf), []);

    const handleSaveAssetList = useCallback((data: { allSymbols: string[], selectedSymbols: string[] }) => {
        setAllSymbols(data.allSymbols);
        setUserSymbols(data.selectedSymbols);
    }, []);
    
    const handleNavigateToFullView = useCallback(() => setPage('full-view'), []);
    const handleNavigateBack = useCallback(() => setPage('dashboard'), []);
    
    const handleResetSettings = useCallback(() => {
        localStorage.clear();
        window.location.reload();
    }, []);
    
    return {
        settings, theme, favorites, userSymbols, allSymbols, showFavoritesOnly, sortOrder, viewMode, page, timeframe,
        handleThemeToggle, handleSettingChange,
        handleAlertConditionChange, handleTrailingStopSettingChange, toggleFavorite, handleShowFavoritesOnlyToggle, handleSortChange, handleViewModeChange,
        handleSaveAssetList, handleNavigateToFullView, handleNavigateBack, handleResetSettings, handleTimeframeChange
    };
};

export default useUserSettings;