
import type { PriceDataPoint, Settings } from '../types';

const BULLISH = 1;
const BEARISH = 0;

// Helper functions for math, handles cases where source is shorter than length
const sma = (source: number[], length: number): number => {
    const useLength = Math.min(source.length, length);
    if (useLength === 0) return 0;
    const series = source.slice(-useLength);
    const sum = series.reduce((a, b) => a + b, 0);
    return sum / useLength;
};

const stdev = (source: number[], length: number): number => {
    const useLength = Math.min(source.length, length);
    if (useLength < 1) return 0;
    const series = source.slice(-useLength);
    const mean = sma(series, useLength);
    const variance = series.reduce((a, b) => a + (b - mean) ** 2, 0) / useLength;
    return Math.sqrt(variance);
};


interface Trail {
    bias: number;
    delta: number;
    level: number;
    extreme: number;
    anchor: number;
}

export const calculateStatisticalTrailingStop = (
    klines: PriceDataPoint[],
    settings: Settings
): { time: number; bias: number; level: number }[] => {
    const { dataLength, distributionLength } = settings.trailingStopSettings;
    const baseLevelMultiplier = 2; // Corresponds to hardcoded LEVEL2 from the Pine Script

    const requiredBars = distributionLength + dataLength + 2;
    if (klines.length < requiredBars) {
        return [];
    }

    // Pre-calculate log of true ranges
    const logTrueRanges: (number | null)[] = [];
    for (let i = 0; i < klines.length; i++) {
        // Pine script's `ta.highest(length)` includes the current bar.
        // `close[length+1]` refers to 11 bars ago if length is 10.
        const requiredHistory = dataLength + 1;
        if (i < requiredHistory) { 
            logTrueRanges.push(null);
            continue;
        }

        const highSeries = klines.slice(i - dataLength + 1, i + 1).map(k => k.high);
        const lowSeries = klines.slice(i - dataLength + 1, i + 1).map(k => k.low);
        
        const h = Math.max(...highSeries);
        const l = Math.min(...lowSeries);
        
        const closePrev = klines[i - requiredHistory].close; 
        
        const tr = Math.max(
            h - l,
            Math.abs(h - closePrev),
            Math.abs(l - closePrev)
        );
        logTrueRanges.push(tr > 0 ? Math.log(tr) : null);
    }
    
    const results: { time: number; bias: number; level: number }[] = [];
    let currentTrail: Trail | null = null;

    for (let i = 0; i < klines.length; i++) {
        const kline = klines[i];
        
        // Skip until we have enough data for the statistical calculations
        if (i < distributionLength -1) {
             results.push({ time: kline.time, bias: BEARISH, level: 0 });
             continue;
        }

        const logTrWindow = logTrueRanges.slice(i - distributionLength + 1, i + 1).filter(v => v !== null) as number[];
        
        let delta: number;

        if (logTrWindow.length > 1) {
            const avg = sma(logTrWindow, distributionLength);
            const std = stdev(logTrWindow, distributionLength);
            delta = Math.exp(avg + baseLevelMultiplier * std);
        } else if (currentTrail) {
            delta = currentTrail.delta; // Carry over if unable to calculate
        } else {
             results.push({ time: kline.time, bias: BEARISH, level: 0 });
             continue;
        }
        
        const hlc3 = (kline.high + kline.low + kline.close) / 3;

        // Initialize trail on first valid calculation
        if (currentTrail === null) {
            currentTrail = {
                bias: BEARISH,
                delta: delta,
                level: hlc3 + delta,
                anchor: kline.close,
                extreme: kline.low,
            };
        }
        
        currentTrail.delta = delta;

        // Determine if the trail has been triggered
        const trailTrigger = (currentTrail.bias === BEARISH && kline.close >= currentTrail.level) || (currentTrail.bias === BULLISH && kline.close <= currentTrail.level);

        if (trailTrigger) {
            // Flip the bias
            currentTrail.bias = currentTrail.bias === BEARISH ? BULLISH : BEARISH;
            currentTrail.level = currentTrail.bias === BEARISH ? hlc3 + delta : Math.max(hlc3 - delta, 0);
            currentTrail.extreme = currentTrail.bias === BEARISH ? kline.low : kline.high;
            currentTrail.anchor = kline.close;
        } else {
            // Update the existing trail
            currentTrail.extreme = currentTrail.bias === BEARISH ? Math.min(currentTrail.extreme, kline.low) : Math.max(currentTrail.extreme, kline.high);
            currentTrail.level = currentTrail.bias === BEARISH ? Math.min(currentTrail.level, hlc3 + delta) : Math.max(currentTrail.level, Math.max(hlc3 - delta, 0));
        }

        results.push({
            time: kline.time,
            bias: currentTrail.bias,
            level: currentTrail.level,
        });
    }

    return results;
};
