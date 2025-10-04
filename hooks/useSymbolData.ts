import { useState, useEffect, useCallback, useRef } from 'react';
import type { SymbolData, Timeframe, Settings } from '../types';
import { fetchRsiForSymbol, fetchPreviousWeeklyLevels } from '../services/binanceService';

const DATA_FETCH_INTERVAL = 60000; // 1 minute

const useSymbolData = ({ userSymbols, timeframe, settings }: { userSymbols: string[], timeframe: Timeframe, settings: Settings }) => {
    const [symbolsData, setSymbolsData] = useState<Record<string, SymbolData>>({});
    const [loading, setLoading] = useState(true);
    const [lastDataFetch, setLastDataFetch] = useState<Date | null>(null);
    const fetchControllerRef = useRef<AbortController | null>(null);
    
    // Use a ref to hold the latest symbolsData to avoid dependency issues in useCallback
    const symbolsDataRef = useRef(symbolsData);
    useEffect(() => {
        symbolsDataRef.current = symbolsData;
    }, [symbolsData]);

    const fetchWeeklyLevelsForSymbol = useCallback(async (symbol: string) => {
        try {
            const weeklyLevels = await fetchPreviousWeeklyLevels(symbol);
            setSymbolsData(prevData => {
                // Ensure the symbol data exists before trying to update it
                if (!prevData[symbol]) return prevData;
                
                return {
                    ...prevData,
                    [symbol]: {
                        ...prevData[symbol],
                        weeklyLevels,
                    }
                };
            });
        } catch (error) {
            console.error(`Failed to fetch weekly levels for ${symbol}:`, error);
        }
    }, []);


    const fetchData = useCallback(async (isInitialLoad: boolean = false) => {
        if (fetchControllerRef.current) {
            fetchControllerRef.current.abort();
        }
        fetchControllerRef.current = new AbortController();
        const { signal } = fetchControllerRef.current;
        
        if (isInitialLoad) {
            setLoading(true);
        }

        try {
            // Only fetch the core RSI data in the main loop. Weekly levels are now on-demand.
            const promises = userSymbols.map(symbol => fetchRsiForSymbol(symbol, timeframe, settings));

            const results = await Promise.all(promises);
            
            if (signal.aborted) return;

            const newData: Record<string, SymbolData> = {};
            results.forEach((rsiData, index) => {
                const symbol = userSymbols[index];
                if (symbol) {
                    const existingData = symbolsDataRef.current[symbol];
                    newData[symbol] = {
                        ...rsiData,
                        // Preserve existing weekly levels if they were fetched on-demand previously
                        weeklyLevels: existingData?.weeklyLevels 
                    };
                }
            });
            
            setSymbolsData(newData);
            setLastDataFetch(new Date());

        } catch (error) {
            if (error instanceof Error && error.name !== 'AbortError') {
                console.error("Failed to fetch symbol data:", error);
            }
        } finally {
             if (!signal.aborted && isInitialLoad) {
                setLoading(false);
            }
        }
    }, [userSymbols, timeframe, settings]);

    useEffect(() => {
        fetchData(true);
    }, [timeframe, userSymbols, fetchData]);

    useEffect(() => {
        const interval = setInterval(() => fetchData(false), DATA_FETCH_INTERVAL);
        return () => clearInterval(interval);
    }, [fetchData]);
    
    return { symbolsData, loading, lastDataFetch, fetchWeeklyLevelsForSymbol };
};

export default useSymbolData;