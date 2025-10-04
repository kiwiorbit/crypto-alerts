import type { PriceDataPoint, RsiDataPoint } from '../types';

interface Pivot {
    index: number;
    value: number;
    time: number;
}

// Finds pivot points (lows or highs) in a data series.
const findPivots = (data: (PriceDataPoint | RsiDataPoint)[], dataKey: 'low' | 'high' | 'value', lookbackLeft: number, lookbackRight: number, isHigh: boolean): Pivot[] => {
    const pivots: Pivot[] = [];
    if (data.length < lookbackLeft + lookbackRight + 1) {
        return [];
    }
    
    // We can't check pivots at the very start or end of the series
    for (let i = lookbackLeft; i < data.length - lookbackRight; i++) {
        const currentValue = (data[i] as any)[dataKey];
        
        let isPivot = true;
        // Check left
        for (let j = 1; j <= lookbackLeft; j++) {
            const compareValue = (data[i - j] as any)[dataKey];
            if (isHigh ? compareValue > currentValue : compareValue < currentValue) {
                isPivot = false;
                break;
            }
        }
        if (!isPivot) continue;

        // Check right
        for (let j = 1; j <= lookbackRight; j++) {
            const compareValue = (data[i + j] as any)[dataKey];
             // Use >= or <= for the right to avoid multiple pivots for the same peak/trough
            if (isHigh ? compareValue >= currentValue : compareValue <= currentValue) {
                isPivot = false;
                break;
            }
        }

        if (isPivot) {
            pivots.push({ index: i, value: currentValue, time: data[i].time });
        }
    }
    return pivots;
};

// Helper to find the closest pivot in time within a max distance
const findClosestPivot = (pivot: Pivot, candidatePivots: Pivot[], maxBarsApart: number): Pivot | null => {
    let closest: Pivot | null = null;
    let smallestDiff = Infinity;

    for (const candidate of candidatePivots) {
        const diff = Math.abs(pivot.index - candidate.index);
        if (diff <= maxBarsApart && diff < smallestDiff) {
            smallestDiff = diff;
            closest = candidate;
        }
    }
    return closest;
};


export const detectBullishDivergence = (klines: PriceDataPoint[], rsiData: RsiDataPoint[]): { pivotTime: number, rsiValue: number } | null => {
    const lookback = 5;
    const rangeMin = 5;
    const rangeMax = 60;
    const pivotMatchMaxBars = 3; // How many bars apart can price/rsi pivots be?

    if (klines.length < rangeMax || rsiData.length < rangeMax) {
        return null;
    }

    const pricePivots = findPivots(klines, 'low', lookback, lookback, false);
    const rsiPivots = findPivots(rsiData, 'value', lookback, lookback, false);

    if (pricePivots.length < 2) {
        return null;
    }
    
    // We check from the second to last price pivot to find a divergence
    for (let i = pricePivots.length - 2; i >= 0; i--) {
        const pricePivot1 = pricePivots[i];
        const pricePivot2 = pricePivots[pricePivots.length - 1]; // Always the most recent price pivot

        // Condition: Price makes a lower low
        if (pricePivot2.value >= pricePivot1.value) continue;

        const rsiPivot1 = findClosestPivot(pricePivot1, rsiPivots, pivotMatchMaxBars);
        const rsiPivot2 = findClosestPivot(pricePivot2, rsiPivots, pivotMatchMaxBars);

        if (!rsiPivot1 || !rsiPivot2 || rsiPivot1.time === rsiPivot2.time) continue;

        // **NEW** Condition: Both RSI pivots must be in oversold territory (< 40)
        if (rsiPivot1.value > 40 || rsiPivot2.value > 40) continue;
        
        // Condition: RSI makes a higher low
        if (rsiPivot2.value <= rsiPivot1.value) continue;

        // Condition: Pivots are within the allowed range
        const barDifference = pricePivot2.index - pricePivot1.index;
        if (barDifference < rangeMin || barDifference > rangeMax) continue;

        // If all conditions are met, we found a bullish divergence
        // Return the time of the most recent RSI pivot involved in the divergence
        return {
            pivotTime: rsiPivot2.time,
            rsiValue: rsiPivot2.value
        };
    }
    
    return null;
};

export const detectBearishDivergence = (klines: PriceDataPoint[], rsiData: RsiDataPoint[]): { pivotTime: number, rsiValue: number } | null => {
    const lookback = 5;
    const rangeMin = 5;
    const rangeMax = 60;
    const pivotMatchMaxBars = 3;

    if (klines.length < rangeMax || rsiData.length < rangeMax) {
        return null;
    }

    const pricePivots = findPivots(klines, 'high', lookback, lookback, true);
    const rsiPivots = findPivots(rsiData, 'value', lookback, lookback, true);

    if (pricePivots.length < 2) {
        return null;
    }
    
    for (let i = pricePivots.length - 2; i >= 0; i--) {
        const pricePivot1 = pricePivots[i];
        const pricePivot2 = pricePivots[pricePivots.length - 1];

        // Condition: Price makes a higher high
        if (pricePivot2.value <= pricePivot1.value) continue;

        const rsiPivot1 = findClosestPivot(pricePivot1, rsiPivots, pivotMatchMaxBars);
        const rsiPivot2 = findClosestPivot(pricePivot2, rsiPivots, pivotMatchMaxBars);

        if (!rsiPivot1 || !rsiPivot2 || rsiPivot1.time === rsiPivot2.time) continue;

        // **NEW** Condition: Both RSI pivots must be in overbought territory (> 60)
        if (rsiPivot1.value < 60 || rsiPivot2.value < 60) continue;

        // Condition: RSI makes a lower high
        if (rsiPivot2.value >= rsiPivot1.value) continue;
        
        const barDifference = pricePivot2.index - pricePivot1.index;
        if (barDifference < rangeMin || barDifference > rangeMax) continue;
        
        return {
            pivotTime: rsiPivot2.time,
            rsiValue: rsiPivot2.value
        };
    }
    
    return null;
};