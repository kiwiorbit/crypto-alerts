
import type { SymbolData, Timeframe, RsiDataPoint, PriceDataPoint, WeeklyLevels, VolumeProfileData, Settings } from '../types';
import { calculateVolumeProfile } from './volumeProfileService';
import { calculateKiwiHunt } from './kiwiHuntService';
import { calculateStatisticalTrailingStop } from './luxalgoService';

const SPOT_API_BASE_URL = 'https://api.binance.com/api/v3/klines';
const FUTURES_API_BASE_URL = 'https://fapi.binance.com/fapi/v1/klines';

const calculateRSI = (klines: any[][], length: number): RsiDataPoint[] => {
    const closes = klines.map((k: any[]) => parseFloat(k[4]));
    if (closes.length <= length) return [];

    const gains: number[] = [];
    const losses: number[] = [];
    for (let i = 1; i < closes.length; i++) {
        const change = closes[i] - closes[i - 1];
        gains.push(Math.max(0, change));
        losses.push(Math.max(0, -change));
    }

    let avgGain = gains.slice(0, length).reduce((sum, val) => sum + val, 0) / length;
    let avgLoss = losses.slice(0, length).reduce((sum, val) => sum + val, 0) / length;

    const rsiValues: number[] = [];
    for (let i = length; i < gains.length; i++) {
        const rs = avgLoss === 0 ? Infinity : avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));
        rsiValues.push(rsi);

        avgGain = (avgGain * (length - 1) + gains[i]) / length;
        avgLoss = (avgLoss * (length - 1) + losses[i]) / length;
    }
    
    const rsiDataPoints: RsiDataPoint[] = rsiValues.map((value, index) => ({
        time: klines[length + index][0],
        value: value,
    }));

    return rsiDataPoints;
};

const calculateSMA = (data: RsiDataPoint[], length: number): RsiDataPoint[] => {
    if (data.length < length) return [];
    const smaValues: RsiDataPoint[] = [];
    for (let i = length - 1; i < data.length; i++) {
        const sum = data.slice(i - length + 1, i + 1).reduce((acc, point) => acc + point.value, 0);
        smaValues.push({
            time: data[i].time,
            value: sum / length,
        });
    }
    return smaValues;
};

const calculateStochRSI = (rsiData: RsiDataPoint[], rsiLength: number, stochLength: number, kSmooth: number, dSmooth: number) => {
    if (rsiData.length < rsiLength + stochLength) return { stochK: [], stochD: [] };
    
    const stochRsiValues: number[] = [];
    for (let i = stochLength - 1; i < rsiData.length; i++) {
        const rsiWindow = rsiData.slice(i - stochLength + 1, i + 1).map(p => p.value);
        const highestRsi = Math.max(...rsiWindow);
        const lowestRsi = Math.min(...rsiWindow);
        const currentRsi = rsiData[i].value;

        const stochRsi = (highestRsi - lowestRsi) === 0 ? 0 : (currentRsi - lowestRsi) / (highestRsi - lowestRsi) * 100;
        stochRsiValues.push(stochRsi);
    }
    
    const kDataPoints: RsiDataPoint[] = [];
    for(let i = kSmooth - 1; i < stochRsiValues.length; i++) {
        const kWindow = stochRsiValues.slice(i - kSmooth + 1, i + 1);
        const kValue = kWindow.reduce((sum, val) => sum + val, 0) / kSmooth;
        kDataPoints.push({ time: rsiData[stochLength - 1 + i].time, value: kValue });
    }

    const dDataPoints: RsiDataPoint[] = [];
    for(let i = dSmooth - 1; i < kDataPoints.length; i++) {
        const dWindow = kDataPoints.slice(i - dSmooth + 1, i + 1).map(p => p.value);
        const dValue = dWindow.reduce((sum, val) => sum + val, 0) / dSmooth;
        dDataPoints.push({ time: kDataPoints[i].time, value: dValue });
    }

    return { stochK: kDataPoints, stochD: dDataPoints };
};

const ema = (source: number[], length: number): number[] => {
    const alpha = 2 / (length + 1);
    const emaValues: number[] = [source[0]];
    for (let i = 1; i < source.length; i++) {
        emaValues.push(alpha * source[i] + (1 - alpha) * emaValues[i-1]);
    }
    return emaValues;
}

const sma = (source: number[], length: number): number[] => {
    const smaValues: number[] = [];
    for (let i = length - 1; i < source.length; i++) {
        const sum = source.slice(i - length + 1, i + 1).reduce((acc, val) => acc + val, 0);
        smaValues.push(sum / length);
    }
    return smaValues;
};


const calculateWaveTrend = (klines: any[][], chlen: number, avg: number, malen: number): { wt1: RsiDataPoint[], wt2: RsiDataPoint[] } => {
    if (klines.length < chlen + avg + malen) return { wt1: [], wt2: [] };

    const hlc3 = klines.map(k => (parseFloat(k[2]) + parseFloat(k[3]) + parseFloat(k[4])) / 3);
    const esa = ema(hlc3, chlen);
    const de = ema(hlc3.map((p, i) => Math.abs(p - esa[i])), chlen);
    
    const ci = hlc3.map((p, i) => de[i] !== 0 ? (p - esa[i]) / (0.015 * de[i]) : 0);

    const wt1_raw = ema(ci, avg);
    const wt2_raw = sma(wt1_raw, malen);
    
    // Align timestamps
    const wt1_offset = ci.length - wt1_raw.length;
    const wt1: RsiDataPoint[] = wt1_raw.map((value, index) => ({
        time: klines[wt1_offset + index][0],
        value,
    }));
    
    const wt2_offset = wt1_raw.length - wt2_raw.length;
    const wt2: RsiDataPoint[] = wt2_raw.map((value, index) => ({
        time: klines[wt1_offset + wt2_offset + index][0],
        value,
    }));
    
    return { wt1, wt2 };
};

const calculateVWAP = (klines: PriceDataPoint[]): RsiDataPoint[] => {
    if (klines.length === 0) return [];
    let cumulativeTPV = 0;
    let cumulativeVolume = 0;
    const vwapData: RsiDataPoint[] = [];

    for (const kline of klines) {
        const typicalPrice = (kline.high + kline.low + kline.close) / 3;
        const tpv = typicalPrice * kline.volume;
        
        cumulativeTPV += tpv;
        cumulativeVolume += kline.volume;

        const vwap = cumulativeVolume === 0 ? typicalPrice : cumulativeTPV / cumulativeVolume;
        vwapData.push({ time: kline.time, value: vwap });
    }
    return vwapData;
};

const findPivots = (klines: PriceDataPoint[], lookback: number, isHigh: boolean): number | null => {
    // Find the most recent pivot
    for (let i = klines.length - 1 - lookback; i >= lookback; i--) {
        const centerKline = klines[i];
        const pivotValue = isHigh ? centerKline.high : centerKline.low;
        let isPivot = true;
        // Check left and right
        for (let j = 1; j <= lookback; j++) {
            const leftValue = isHigh ? klines[i - j].high : klines[i - j].low;
            const rightValue = isHigh ? klines[i + j].high : klines[i + j].low;
            if ((isHigh && (leftValue > pivotValue || rightValue > pivotValue)) ||
                (!isHigh && (leftValue < pivotValue || rightValue < pivotValue))) {
                isPivot = false;
                break;
            }
        }
        if (isPivot) {
            return i; // Return index of the pivot kline
        }
    }
    return null; // No pivot found
};

export const fetchRsiForSymbol = async (symbol: string, timeframe: Timeframe, settings: Settings): Promise<SymbolData> => {
    let apiSymbol = symbol;
    let baseUrl = SPOT_API_BASE_URL;
    const { candlesDisplayed } = settings;

    if (symbol.endsWith('.P')) {
        apiSymbol = symbol.slice(0, -2);
        baseUrl = FUTURES_API_BASE_URL;
    }

    const rsiLength = 14;
    const smaLength = 14;
    const sma50Length = 50;
    const sma100Length = 100;
    const stochLength = 14;
    const kSmooth = 3;
    const dSmooth = 3;
    const wtChannelLen = 9;
    const wtAverageLen = 12;
    const wtMALen = 3;
    const maxLookback = Math.max(rsiLength + stochLength + kSmooth + dSmooth, wtChannelLen + wtAverageLen + wtMALen, sma100Length);
    const fetchLimit = candlesDisplayed + maxLookback + 100; // Extra buffer for LuxAlgo and KiwiHunt
    
    const url = `${baseUrl}?symbol=${apiSymbol}&interval=${timeframe}&limit=${fetchLimit}`;
    const response = await fetch(url);
    if (!response.ok) {
        return { rsi: [], sma: [], priceSma: [], stochK: [], stochD: [], waveTrend1: [], waveTrend2: [], vwap: [], price: 0, volume: 0, quoteVolume: 0, klines: [] };
    }
    const klines: any[][] = await response.json();
    
    if (klines.length === 0) {
        return { rsi: [], sma: [], priceSma: [], stochK: [], stochD: [], waveTrend1: [], waveTrend2: [], vwap: [], price: 0, volume: 0, quoteVolume: 0, klines: [] };
    }

    const priceDataPoints: PriceDataPoint[] = klines.map(k => ({
        time: k[0],
        open: parseFloat(k[1]), high: parseFloat(k[2]), low: parseFloat(k[3]), close: parseFloat(k[4]),
        volume: parseFloat(k[5]),
        quoteVolume: parseFloat(k[7]),
        takerBuyVolume: parseFloat(k[9]),
        takerBuyQuoteVolume: parseFloat(k[10]),
    }));
    
    const priceObjectsForSma = priceDataPoints.map(p => ({ time: p.time, value: p.close }));

    const price = priceDataPoints.length > 0 ? priceDataPoints[priceDataPoints.length - 1].close : 0;
    const volume = priceDataPoints.length > 0 ? priceDataPoints[priceDataPoints.length - 1].volume : 0;
    const quoteVolume = priceDataPoints.length > 0 ? priceDataPoints[priceDataPoints.length - 1].quoteVolume : 0;

    const rsiData = calculateRSI(klines, rsiLength);
    const smaData = calculateSMA(rsiData, smaLength);
    const priceSmaData = calculateSMA(priceObjectsForSma, smaLength);
    const priceSma50Data = calculateSMA(priceObjectsForSma, sma50Length);
    const priceSma100Data = calculateSMA(priceObjectsForSma, sma100Length);
    const { stochK, stochD } = calculateStochRSI(rsiData, rsiLength, stochLength, kSmooth, dSmooth);
    const { wt1, wt2 } = calculateWaveTrend(klines, wtChannelLen, wtAverageLen, wtMALen);
    const vwapData = calculateVWAP(priceDataPoints);
    const volumeProfile = calculateVolumeProfile(priceDataPoints.slice(-candlesDisplayed));
    const kiwiHuntData = calculateKiwiHunt(priceDataPoints);
    const luxalgoTrailData = calculateStatisticalTrailingStop(priceDataPoints, settings);

    let dailyVwapData: RsiDataPoint[] | undefined = undefined;
    if (timeframe === '30m' && klines.length > 0) {
        try {
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);
            const startTime = today.getTime();

            const dailyUrl = `${baseUrl}?symbol=${apiSymbol}&interval=30m&startTime=${startTime}&limit=48`; // limit 48 for a full day
            const dailyResponse = await fetch(dailyUrl);
            const dailyKlinesRaw: any[][] = await dailyResponse.json();
            
            if (dailyKlinesRaw.length > 0) {
                const dailyPriceDataPoints: PriceDataPoint[] = dailyKlinesRaw.map(k => ({
                    time: k[0],
                    open: parseFloat(k[1]), high: parseFloat(k[2]), low: parseFloat(k[3]), close: parseFloat(k[4]),
                    volume: parseFloat(k[5]),
                    quoteVolume: parseFloat(k[7]),
                    takerBuyVolume: parseFloat(k[9]),
                    takerBuyQuoteVolume: parseFloat(k[10]),
                }));
                dailyVwapData = calculateVWAP(dailyPriceDataPoints);
            }
        } catch (error) {
            console.error(`Failed to fetch or calculate daily VWAP for ${symbol}:`, error);
        }
    }

    // --- Anchored VWAP Calculations ---
    let vwapAnchoredHigh: RsiDataPoint[] | undefined = undefined;
    let vwapAnchoredLow: RsiDataPoint[] | undefined = undefined;
    
    const highPivotIndex = findPivots(priceDataPoints, 5, true);
    if (highPivotIndex !== null) {
        const klinesFromHigh = priceDataPoints.slice(highPivotIndex);
        vwapAnchoredHigh = calculateVWAP(klinesFromHigh);
    }
    
    const lowPivotIndex = findPivots(priceDataPoints, 5, false);
    if (lowPivotIndex !== null) {
        const klinesFromLow = priceDataPoints.slice(lowPivotIndex);
        vwapAnchoredLow = calculateVWAP(klinesFromLow);
    }

    const sliceData = <T,>(arr: T[] | undefined): T[] | undefined => arr ? arr.slice(-candlesDisplayed) : undefined;


    return {
        rsi: rsiData.slice(-candlesDisplayed), sma: smaData.slice(-candlesDisplayed), 
        priceSma: priceSmaData.slice(-candlesDisplayed),
        priceSma50: priceSma50Data.slice(-candlesDisplayed),
        priceSma100: priceSma100Data.slice(-candlesDisplayed),
        stochK: stochK.slice(-candlesDisplayed), stochD: stochD.slice(-candlesDisplayed), 
        waveTrend1: wt1.slice(-candlesDisplayed), waveTrend2: wt2.slice(-candlesDisplayed),
        vwap: vwapData.slice(-candlesDisplayed),
        dailyVwap: dailyVwapData,
        vwapAnchoredHigh,
        vwapAnchoredLow,
        kiwiHunt: kiwiHuntData ? {
            q1: sliceData(kiwiHuntData.q1)!,
            trigger: sliceData(kiwiHuntData.trigger)!,
            q3: sliceData(kiwiHuntData.q3)!,
            q5: sliceData(kiwiHuntData.q5)!,
        } : undefined,
        price, volume, quoteVolume, klines: priceDataPoints.slice(-candlesDisplayed),
        volumeProfile: volumeProfile ?? undefined,
        luxalgoTrail: luxalgoTrailData.slice(-candlesDisplayed),
    };
};

export const fetchPreviousWeeklyLevels = async (symbol: string): Promise<WeeklyLevels> => {
    let apiSymbol = symbol;
    let baseUrl = SPOT_API_BASE_URL;

    if (symbol.endsWith('.P')) {
        apiSymbol = symbol.slice(0, -2);
        baseUrl = FUTURES_API_BASE_URL;
    }

    const url = `${baseUrl}?symbol=${apiSymbol}&interval=1w&limit=3`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch weekly klines for ${symbol}`);
        const klines: any[][] = await response.json();

        if (klines.length < 3) {
            console.warn(`Not enough weekly data for ${symbol} to calculate levels.`);
            return { pwh: null, pwl: null, unsweptHigh: null, unsweptLow: null, pwo: null, pwc: null };
        }

        const lastLastWeekHigh = parseFloat(klines[0][2]);
        const lastLastWeekLow = parseFloat(klines[0][3]);
        const prevWeekOpen = parseFloat(klines[1][1]);
        const prevWeekHigh = parseFloat(klines[1][2]);
        const prevWeekLow = parseFloat(klines[1][3]);
        const prevWeekClose = parseFloat(klines[1][4]);
        const unsweptHigh = prevWeekHigh < lastLastWeekHigh ? lastLastWeekHigh : null;
        const unsweptLow = prevWeekLow > lastLastWeekLow ? lastLastWeekLow : null;

        return {
            pwo: prevWeekOpen, pwh: prevWeekHigh, pwl: prevWeekLow, pwc: prevWeekClose,
            unsweptHigh: unsweptHigh, unsweptLow: unsweptLow,
        };
    } catch (error) {
        console.error(`Error in fetchPreviousWeeklyLevels for ${symbol}:`, error);
        return { pwh: null, pwl: null, unsweptHigh: null, unsweptLow: null, pwo: null, pwc: null };
    }
};