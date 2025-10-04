
import type { SymbolData, Settings, Timeframe, Notification, PriceDataPoint } from '../types';
import { detectBullishDivergence, detectBearishDivergence } from './divergenceService';

type SetStateAction<S> = S | ((prevState: S) => S);
type Dispatch<A> = (value: A) => void;

const ALERT_COOLDOWN = 3600000; // 1 hour to prevent spam

const calculateFibLevels = (chartData: PriceDataPoint[]) => {
    if (!chartData || chartData.length < 2) return { gp: null, fib786: null };

    let highestHigh = -Infinity;
    let lowestLow = Infinity;
    let highestHighIndex = -1;
    let lowestLowIndex = -1;

    chartData.forEach((k, index) => {
        if (k.high > highestHigh) {
            highestHigh = k.high;
            highestHighIndex = index;
        }
        if (k.low < lowestLow) {
            lowestLow = k.low;
            lowestLowIndex = index;
        }
    });
    
    const range = highestHigh - lowestLow;
    if (range === 0) return { gp: null, fib786: null };

    let gpTop, gpBottom, fib786;
    
    // An uptrend is when the low happens before the high
    if (lowestLowIndex < highestHighIndex) {
        // Retracement down from high
        gpTop = highestHigh - (range * 0.618);
        gpBottom = highestHigh - (range * 0.65);
        fib786 = highestHigh - (range * 0.786);
    } else { // A downtrend is when the high happens before the low
        // Retracement up from low
        gpTop = lowestLow + (range * 0.65);
        gpBottom = lowestLow + (range * 0.618);
        fib786 = lowestLow + (range * 0.786);
    }

    return { gp: { top: Math.max(gpTop, gpBottom), bottom: Math.min(gpTop, gpBottom) }, fib786 };
};

const getAverageVolume = (klines: PriceDataPoint[], period: number): number => {
    if (klines.length < period) return 0;
    const window = klines.slice(-period);
    return window.reduce((sum, k) => sum + k.quoteVolume, 0) / window.length;
};

interface PricePivot {
    index: number;
    value: number; // high or low price
    time: number;
    kline: PriceDataPoint;
}

const findPricePivots = (klines: PriceDataPoint[], lookbackLeft: number, lookbackRight: number, isHigh: boolean): PricePivot[] => {
    const pivots: PricePivot[] = [];
    if (klines.length < lookbackLeft + lookbackRight + 1) {
        return [];
    }
    
    for (let i = lookbackLeft; i < klines.length - lookbackRight; i++) {
        const centerKline = klines[i];
        const pivotValue = isHigh ? centerKline.high : centerKline.low;
        
        let isPivot = true;
        // Check left
        for (let j = 1; j <= lookbackLeft; j++) {
            const compareValue = isHigh ? klines[i - j].high : klines[i - j].low;
            if (isHigh ? compareValue > pivotValue : compareValue < pivotValue) {
                isPivot = false;
                break;
            }
        }
        if (!isPivot) continue;

        // Check right
        for (let j = 1; j <= lookbackRight; j++) {
            const compareValue = isHigh ? klines[i + j].high : klines[i + j].low;
            if (isHigh ? compareValue >= pivotValue : compareValue <= pivotValue) { // Use >= to avoid multiple pivots for same peak
                isPivot = false;
                break;
            }
        }

        if (isPivot) {
            pivots.push({ index: i, value: pivotValue, time: centerKline.time, kline: centerKline });
        }
    }
    return pivots;
};


export const checkAllAlerts = (
    symbol: string,
    timeframe: Timeframe,
    data: SymbolData,
    settings: Settings,
    alertStates: Record<string, any>,
    setAlertStates: Dispatch<SetStateAction<Record<string, any>>>
): Omit<Notification, 'id' | 'read' | 'timestamp'>[] => {
    const alertsToFire: Omit<Notification, 'id' | 'read' | 'timestamp'>[] = [];
    
    if (
        !data.rsi || data.rsi.length < 2 ||
        !data.sma || data.sma.length < 2 ||
        !data.stochK || data.stochK.length < 2 ||
        !data.stochD || data.stochD.length < 2 ||
        !data.klines || data.klines.length < 2
    ) {
        return alertsToFire;
    }


    const { alertConditions } = settings;
    const now = Date.now();
    
    const lastRsi = data.rsi[data.rsi.length - 1];
    const prevRsi = data.rsi[data.rsi.length - 2];
    const lastSma = data.sma[data.sma.length - 1];
    const prevSma = data.sma[data.sma.length - 2];
    const lastStochK = data.stochK[data.stochK.length - 1];
    const prevStochK = data.stochK[data.stochK.length - 2];
    const lastStochD = data.stochD[data.stochD.length - 1];
    const prevStochD = data.stochD[data.stochD.length - 2];
    const lastKline = data.klines[data.klines.length - 1];
    const prevKline = data.klines[data.klines.length - 2];

    const canFire = (type: string) => {
        const key = `${symbol}-${timeframe}-${type}`;
        const lastFired = alertStates[key];
        return !lastFired || now - lastFired > ALERT_COOLDOWN;
    };

    const setFired = (type: string) => {
        setAlertStates(prev => ({ ...prev, [`${symbol}-${timeframe}-${type}`]: now }));
    };

    // 1. Extreme Alerts
    if (alertConditions.extreme && ['15m', '1h', '2h', '4h', '8h', '1d', '1w'].includes(timeframe)) {
        if (lastRsi.value > 70 && prevRsi.value <= 70 && canFire('overbought')) {
            alertsToFire.push({ symbol, timeframe, rsi: lastRsi.value, type: 'overbought' });
            setFired('overbought');
        }
        if (lastRsi.value < 30 && prevRsi.value >= 30 && canFire('oversold')) {
            alertsToFire.push({ symbol, timeframe, rsi: lastRsi.value, type: 'oversold' });
            setFired('oversold');
        }
    }

    // 2. RSI/SMA Cross Alerts
    if (alertConditions.rsiSmaCross && ['15m', '1h', '2h', '4h', '8h', '1d', '3d'].includes(timeframe)) {
        if (lastRsi.value > lastSma.value && prevRsi.value <= prevSma.value && canFire('bullish-cross')) {
            alertsToFire.push({ symbol, timeframe, rsi: lastRsi.value, type: 'bullish-cross' });
            setFired('bullish-cross');
        }
        if (lastRsi.value < lastSma.value && prevRsi.value >= prevSma.value && canFire('death-cross')) {
            alertsToFire.push({ symbol, timeframe, rsi: lastRsi.value, type: 'death-cross' });
            setFired('death-cross');
        }
    }
    
    // 3. Divergence Alerts
    if (alertConditions.divergence && ['1h', '4h', '8h', '1d', '3d'].includes(timeframe)) {
        const bullishDivergence = detectBullishDivergence(data.klines, data.rsi);
        if (bullishDivergence && canFire(`bullish-divergence-${bullishDivergence.pivotTime}`)) {
            alertsToFire.push({ symbol, timeframe, rsi: bullishDivergence.rsiValue, type: 'bullish-divergence' });
            setFired(`bullish-divergence-${bullishDivergence.pivotTime}`);
        }
        const bearishDivergence = detectBearishDivergence(data.klines, data.rsi);
        if (bearishDivergence && canFire(`bearish-divergence-${bearishDivergence.pivotTime}`)) {
            alertsToFire.push({ symbol, timeframe, rsi: bearishDivergence.rsiValue, type: 'bearish-divergence' });
            setFired(`bearish-divergence-${bearishDivergence.pivotTime}`);
        }
    }
    
    // 4. Stoch Recovery
    if (alertConditions.stochRecovery && ['1h', '2h', '4h', '8h', '1d', '3d'].includes(timeframe)) {
        const key = `${symbol}-${timeframe}-stoch-recovery-armed`;
        if (lastStochK.value > 0 && lastStochK.value < 5 && prevStochK.value === 0) {
            if (canFire('stoch-recovery')) {
                alertsToFire.push({ symbol, timeframe, type: 'stoch-recovery' });
                setFired('stoch-recovery');
                setAlertStates(prev => ({ ...prev, [key]: true }));
            }
        }
    }

    // 5. Stoch Cross after Recovery
    if (alertConditions.stochCross && ['1h', '2h', '4h', '8h', '1d', '3d'].includes(timeframe)) {
        const isArmedKey = `${symbol}-${timeframe}-stoch-recovery-armed`;
        if (alertStates[isArmedKey] && lastStochK.value > lastStochD.value && prevStochK.value <= prevStochD.value) {
            if (canFire('stoch-bullish-cross')) {
                alertsToFire.push({ symbol, timeframe, type: 'stoch-bullish-cross' });
                setFired('stoch-bullish-cross');
                setAlertStates(prev => ({ ...prev, [isArmedKey]: false }));
            }
        }
    }

    // VWAP Strategy Alerts (30m only)
    if (timeframe === '30m' && data.dailyVwap && data.dailyVwap.length > 0) {
        const lastDailyVwapPoint = data.dailyVwap.find(p => p.time === lastKline.time);

        if (lastDailyVwapPoint) {
            // Stoch Cross Above Daily VWAP
            if (alertConditions.stochCrossAboveDailyVwap) {
                const isBullishCross = lastStochK.value > lastStochD.value && prevStochK.value <= prevStochD.value;
                if (isBullishCross && lastKline.close > lastDailyVwapPoint.value && canFire('stoch-cross-above-daily-vwap')) {
                    alertsToFire.push({ symbol, timeframe, type: 'stoch-cross-above-daily-vwap', price: lastKline.close, value: lastStochK.value });
                    setFired('stoch-cross-above-daily-vwap');
                }
            }

            // VWAP Tap/Reversal with Stoch Confirmation
            if (alertConditions.vwapReversalStochConfirmation) {
                const didTapVwap = lastKline.low <= lastDailyVwapPoint.value && lastKline.close > lastDailyVwapPoint.value;
                const stochConfirmed = 
                    lastStochK.value < 10 ||
                    (lastStochK.value > lastStochD.value && prevStochK.value <= prevStochD.value) ||
                    (lastStochK.value > prevStochK.value && lastStochK.value < 30);
                
                if (didTapVwap && stochConfirmed && canFire('vwap-reversal-stoch-confirmation')) {
                    alertsToFire.push({ symbol, timeframe, type: 'vwap-reversal-stoch-confirmation', price: lastKline.close, value: lastStochK.value });
                    setFired('vwap-reversal-stoch-confirmation');
                }
            }
        }
    }

    // Anchored VWAP Alerts
    const anchoredVwapTimeframes: Timeframe[] = ['30m', '1h', '4h'];
    if (anchoredVwapTimeframes.includes(timeframe)) {
        // Bounce from VWAP anchored to Low
        if (alertConditions.priceBounceAnchoredVwapLow && data.vwapAnchoredLow && data.vwapAnchoredLow.length > 0) {
            const lastAnchoredVwapPoint = data.vwapAnchoredLow.find(p => p.time === lastKline.time);
            if (lastAnchoredVwapPoint) {
                const didTapVwap = lastKline.low <= lastAnchoredVwapPoint.value && lastKline.close > lastAnchoredVwapPoint.value;
                const stochConfirmed = lastStochK.value < 30 || (lastStochK.value > lastStochD.value && prevStochK.value <= prevStochD.value);
                if (didTapVwap && stochConfirmed && canFire('price-bounce-vwap-low')) {
                    alertsToFire.push({ symbol, timeframe, type: 'price-bounce-vwap-low', price: lastKline.close });
                    setFired('price-bounce-vwap-low');
                }
            }
        }
        // Rejection from VWAP anchored to High
        if (alertConditions.priceRejectionAnchoredVwapHigh && data.vwapAnchoredHigh && data.vwapAnchoredHigh.length > 0) {
            const lastAnchoredVwapPoint = data.vwapAnchoredHigh.find(p => p.time === lastKline.time);
            if (lastAnchoredVwapPoint) {
                const didRejectVwap = lastKline.high >= lastAnchoredVwapPoint.value && lastKline.close < lastAnchoredVwapPoint.value;
                const stochConfirmed = lastStochK.value > 70 || (lastStochK.value < lastStochD.value && prevStochK.value >= prevStochD.value);
                 if (didRejectVwap && stochConfirmed && canFire('price-rejection-vwap-high')) {
                    alertsToFire.push({ symbol, timeframe, type: 'price-rejection-vwap-high', price: lastKline.close });
                    setFired('price-rejection-vwap-high');
                }
            }
        }
    }
    
    // Wavetrend Alerts
    if (data.waveTrend1 && data.waveTrend1.length >= 2 && data.waveTrend2 && data.waveTrend2.length >= 2 && ['1h', '4h', '1d'].includes(timeframe)) {
        const lastWt1 = data.waveTrend1[data.waveTrend1.length - 1];
        const prevWt1 = data.waveTrend1[data.waveTrend1.length - 2];
        const lastWt2 = data.waveTrend2[data.waveTrend2.length - 1];
        const prevWt2 = data.waveTrend2[data.waveTrend2.length - 2];
        const isBullishCross = lastWt1.value > lastWt2.value && prevWt1.value <= prevWt2.value;

        // WaveTrend Confluence Buy ("Green Circle")
        if (alertConditions.waveTrendConfluenceBuy) {
            if (isBullishCross && lastWt2.value < -53 && canFire('wavetrend-confluence-buy')) {
                alertsToFire.push({ symbol, timeframe, type: 'wavetrend-confluence-buy', value: lastWt2.value });
                setFired('wavetrend-confluence-buy');
            }
        }

        // Wavetrend Extreme Alerts
        if (alertConditions.waveTrendExtreme) {
            let buyThreshold = 0, sellThreshold = 0;
            switch (timeframe) {
                case '1h': buyThreshold = -50; sellThreshold = 50; break;
                case '4h': buyThreshold = -45; sellThreshold = 45; break;
                case '1d': buyThreshold = -45; sellThreshold = 50; break;
            }

            if (lastWt2.value < buyThreshold && prevWt2.value >= buyThreshold && canFire('wavetrend-buy')) {
                alertsToFire.push({ symbol, timeframe, type: 'wavetrend-buy', value: lastWt2.value });
                setFired('wavetrend-buy');
            }
            if (lastWt2.value > sellThreshold && prevWt2.value <= sellThreshold && canFire('wavetrend-sell')) {
                alertsToFire.push({ symbol, timeframe, type: 'wavetrend-sell', value: lastWt2.value });
                setFired('wavetrend-sell');
            }
        }
    }

    // High-Conviction Confluence Alerts
    const highConvictionTimeframes: Timeframe[] = ['1h', '4h', '1d'];
    if ((alertConditions.highConvictionBuy || alertConditions.highConvictionSell || alertConditions.highConvictionBuyNoVolume) && highConvictionTimeframes.includes(timeframe)) {
        if (data.waveTrend1 && data.waveTrend1.length >= 2 && data.waveTrend2 && data.waveTrend2.length >= 2 && data.stochK.length >= 1 && data.priceSma50 && data.priceSma50.length > 1 && data.priceSma100 && data.priceSma100.length > 1 && data.klines.length > 21) {
            
            const avgVolume = getAverageVolume(data.klines.slice(-21, -1), 20);
            const lastWt1 = data.waveTrend1[data.waveTrend1.length - 1];
            const prevWt1 = data.waveTrend1[data.waveTrend1.length - 2];
            const lastWt2 = data.waveTrend2[data.waveTrend2.length - 1];
            const prevWt2 = data.waveTrend2[data.waveTrend2.length - 2];
            const lastSma50 = data.priceSma50.find(p => p.time === lastKline.time)?.value;
            const prevSma50 = data.priceSma50.find(p => p.time === prevKline.time)?.value;
            const lastSma100 = data.priceSma100.find(p => p.time === lastKline.time)?.value;
            const prevSma100 = data.priceSma100.find(p => p.time === prevKline.time)?.value;

            // --- BUY LOGIC ---
            if (alertConditions.highConvictionBuy || alertConditions.highConvictionBuyNoVolume) {
                const isStochOversold = lastStochK.value < 25;
                const isVolumeConfirmed = lastKline.volume > (avgVolume * 0.9);
                
                const foundationMet = alertConditions.highConvictionBuy ? isStochOversold && isVolumeConfirmed : isStochOversold;
                const alertType = alertConditions.highConvictionBuy ? 'high-conviction-buy' : 'high-conviction-buy-no-volume';

                if (foundationMet) {
                    let scenarioMet = false;

                    if(lastSma50 && lastSma100){
                        // Scenario 1: Deep Reversal
                        if (lastWt2.value < -55 && (lastKline.close > lastSma50 || lastKline.close > lastSma100)) {
                            scenarioMet = true;
                        }
                        
                        const isBullishCross = lastWt1.value > lastWt2.value && prevWt1.value <= prevWt2.value;
                        if (isBullishCross && lastWt2.value < -40) {
                            // Scenario 2: Confirmed Bounce
                            const didTapSma50 = lastKline.low <= lastSma50 && lastKline.close > lastSma50;
                            const didTapSma100 = lastKline.low <= lastSma100 && lastKline.close > lastSma100;
                            if (didTapSma50 || didTapSma100) {
                                scenarioMet = true;
                            }
                            
                            // Scenario 3: SMA Reclamation
                            if(prevSma50 && prevSma100){
                                const reclaimedSma50 = prevKline.close < prevSma50 && lastKline.close > lastSma50;
                                const reclaimedSma100 = prevKline.close < prevSma100 && lastKline.close > lastSma100;
                                if (reclaimedSma50 || reclaimedSma100) {
                                    scenarioMet = true;
                                }
                            }
                        }
                    }
                    
                    if (scenarioMet && canFire(alertType)) {
                        if (alertConditions.highConvictionBuy && alertType === 'high-conviction-buy') {
                            alertsToFire.push({ symbol, timeframe, type: 'high-conviction-buy' });
                            setFired('high-conviction-buy');
                        } else if (alertConditions.highConvictionBuyNoVolume && alertType === 'high-conviction-buy-no-volume') {
                            alertsToFire.push({ symbol, timeframe, type: 'high-conviction-buy-no-volume' });
                            setFired('high-conviction-buy-no-volume');
                        }
                    }
                }
            }

            // --- SELL LOGIC ---
            if (alertConditions.highConvictionSell) {
                const isStochOverbought = lastStochK.value > 75;
                const isVolumeConfirmed = lastKline.volume > (avgVolume * 0.9);

                if (isStochOverbought && isVolumeConfirmed) {
                    let scenarioMet = false;

                    if (lastSma50 && lastSma100) {
                        // Scenario 1: Deep Exhaustion
                        if (lastWt2.value > 55 && (lastKline.close < lastSma50 || lastKline.close < lastSma100)) {
                            scenarioMet = true;
                        }

                        const isBearishCross = lastWt1.value < lastWt2.value && prevWt1.value >= prevWt2.value;
                        if (isBearishCross && lastWt2.value > 40) {
                            // Scenario 2: Confirmed Rejection
                            const didRejectSma50 = lastKline.high >= lastSma50 && lastKline.close < lastSma50;
                            const didRejectSma100 = lastKline.high >= lastSma100 && lastKline.close < lastSma100;
                            if (didRejectSma50 || didRejectSma100) {
                                scenarioMet = true;
                            }

                            // Scenario 3: SMA Reclamation (Bearish)
                            if (prevSma50 && prevSma100) {
                                const reclaimedSma50 = prevKline.close > prevSma50 && lastKline.close < lastSma50;
                                const reclaimedSma100 = prevKline.close > prevSma100 && lastKline.close < lastSma100;
                                if (reclaimedSma50 || reclaimedSma100) {
                                    scenarioMet = true;
                                }
                            }
                        }
                    }

                    if (scenarioMet && canFire('high-conviction-sell')) {
                        alertsToFire.push({ symbol, timeframe, type: 'high-conviction-sell' });
                        setFired('high-conviction-sell');
                    }
                }
            }
        }
    }
    
    // Volume Profile Alerts
    const vpTimeframes: Timeframe[] = ['30m', '1h', '4h'];
    if (vpTimeframes.includes(timeframe) && data.volumeProfile) {
        const { poc, vah, val } = data.volumeProfile;
        const isBullishStochCross = lastStochK.value > lastStochD.value && prevStochK.value <= prevStochD.value;
        const isBearishStochCross = lastStochK.value < lastStochD.value && prevStochK.value >= prevStochD.value;

        // POC Bounce/Rejection
        if (alertConditions.pocRejection) {
            const isBullishBounce = lastKline.low <= poc && lastKline.close > poc;
            const isBearishRejection = lastKline.high >= poc && lastKline.close < poc;
            
            if (isBullishBounce && (lastStochK.value < 30 || isBullishStochCross) && canFire('poc-rejection-bullish')) {
                alertsToFire.push({ symbol, timeframe, type: 'poc-rejection-bullish', price: lastKline.close });
                setFired('poc-rejection-bullish');
            }
            if (isBearishRejection && (lastStochK.value > 70 || isBearishStochCross) && canFire('poc-rejection-bearish')) {
                alertsToFire.push({ symbol, timeframe, type: 'poc-rejection-bearish', price: lastKline.close });
                setFired('poc-rejection-bearish');
            }
        }
        
        // Value Area Edge Rejection
        if (alertConditions.valueAreaEdgeRejection) {
            const isBullishFade = lastKline.low <= val && lastKline.close > val;
            const isBearishFade = lastKline.high >= vah && lastKline.close < vah;

            if (isBullishFade && (lastStochK.value < 30 || isBullishStochCross) && canFire('value-area-rejection-bullish')) {
                alertsToFire.push({ symbol, timeframe, type: 'value-area-rejection-bullish', price: lastKline.close });
                setFired('value-area-rejection-bullish');
            }
            if (isBearishFade && (lastStochK.value > 70 || isBearishStochCross) && canFire('value-area-rejection-bearish')) {
                alertsToFire.push({ symbol, timeframe, type: 'value-area-rejection-bearish', price: lastKline.close });
                setFired('value-area-rejection-bearish');
            }
        }
        
        // Value Area Breakout
        if (alertConditions.valueAreaBreakout) {
            const avgVolume = getAverageVolume(data.klines.slice(0, -1), 20);
            const isHighVolume = lastKline.volume > (avgVolume * 1.5);
            
            if (lastKline.close > vah && isHighVolume && canFire('value-area-breakout-bullish')) {
                alertsToFire.push({ symbol, timeframe, type: 'value-area-breakout-bullish', price: lastKline.close });
                setFired('value-area-breakout-bullish');
            }
            if (lastKline.close < val && isHighVolume && canFire('value-area-breakout-bearish')) {
                alertsToFire.push({ symbol, timeframe, type: 'value-area-breakout-bearish', price: lastKline.close });
                setFired('value-area-breakout-bearish');
            }
        }
    }

    // --- New Volume Based Alerts ---
    const volumeAlertTimeframes: Timeframe[] = ['15m', '1h', '4h'];
    if (volumeAlertTimeframes.includes(timeframe)) {
        const lookbackKlines = data.klines.slice(0, -1);
        const avgVolume = getAverageVolume(lookbackKlines, 20);

        // 1. Significant Volume Spike
        if (alertConditions.significantVolumeSpike && avgVolume > 0) {
            if (lastKline.quoteVolume > avgVolume * 2.5 && canFire('significant-volume-spike')) {
                const isBullish = lastKline.close > lastKline.open;
                alertsToFire.push({
                    symbol,
                    timeframe,
                    type: isBullish ? 'significant-bullish-volume-spike' : 'significant-bearish-volume-spike',
                    price: lastKline.close
                });
                setFired('significant-volume-spike');
            }
        }

        // 2. Volume Absorption
        if (alertConditions.volumeAbsorption && avgVolume > 0) {
            const totalRange = lastKline.high - lastKline.low;
            if (totalRange > 0 && lastKline.quoteVolume > avgVolume * 2.0) {
                const bodySize = Math.abs(lastKline.close - lastKline.open);
                if (bodySize < totalRange * 0.3) { // Small body
                    const upperWick = lastKline.high - Math.max(lastKline.open, lastKline.close);
                    const lowerWick = Math.min(lastKline.open, lastKline.close) - lastKline.low;
                    
                    if (lowerWick > totalRange * 0.5 && canFire('bullish-volume-absorption')) {
                        alertsToFire.push({ symbol, timeframe, type: 'bullish-volume-absorption', price: lastKline.close });
                        setFired('bullish-volume-absorption');
                    }
                    if (upperWick > totalRange * 0.5 && canFire('bearish-volume-absorption')) {
                        alertsToFire.push({ symbol, timeframe, type: 'bearish-volume-absorption', price: lastKline.close });
                        setFired('bearish-volume-absorption');
                    }
                }
            }
        }

        // 3. Breakout Volume Confirmation
        if (alertConditions.breakoutVolumeConfirmation && lookbackKlines.length >= 20) {
            const rangeKlines = lookbackKlines.slice(-20);
            const highestHigh = Math.max(...rangeKlines.map(k => k.high));
            const lowestLow = Math.min(...rangeKlines.map(k => k.low));

            if (lastKline.quoteVolume > avgVolume * 1.5) {
                if (lastKline.close > highestHigh && canFire('bullish-breakout-volume')) {
                    alertsToFire.push({ symbol, timeframe, type: 'bullish-breakout-volume', price: lastKline.close });
                    setFired('bullish-breakout-volume');
                }
                if (lastKline.close < lowestLow && canFire('bearish-breakout-volume')) {
                    alertsToFire.push({ symbol, timeframe, type: 'bearish-breakout-volume', price: lastKline.close });
                    setFired('bearish-breakout-volume');
                }
            }
        }
        
        // 4. Exhaustion Volume (Divergence)
        if (alertConditions.exhaustionVolumeDivergence && data.klines.length > 20) {
            const priceHighs = findPricePivots(data.klines, 5, 3, true).slice(-2);
            const priceLows = findPricePivots(data.klines, 5, 3, false).slice(-2);
            
            if (priceHighs.length === 2) {
                const [p1, p2] = priceHighs;
                if (p2.value > p1.value && p2.kline.quoteVolume < p1.kline.quoteVolume && canFire(`bearish-exhaustion-${p2.time}`)) {
                    alertsToFire.push({ symbol, timeframe, type: 'bearish-exhaustion-divergence', price: p2.kline.close });
                    setFired(`bearish-exhaustion-${p2.time}`);
                }
            }
            if (priceLows.length === 2) {
                const [p1, p2] = priceLows;
                 if (p2.value < p1.value && p2.kline.quoteVolume < p1.kline.quoteVolume && canFire(`bullish-exhaustion-${p2.time}`)) {
                    alertsToFire.push({ symbol, timeframe, type: 'bullish-exhaustion-divergence', price: p2.kline.close });
                    setFired(`bullish-exhaustion-${p2.time}`);
                }
            }
        }
        
        // 5. Extreme Net Volume Skew
        if (alertConditions.extremeNetVolumeSkew && data.klines.length > 0) {
            const totalBuyVolume = data.klines.reduce((sum, k) => sum + k.takerBuyQuoteVolume, 0);
            const totalQuoteVolume = data.klines.reduce((sum, k) => sum + k.quoteVolume, 0);
            if(totalQuoteVolume > 0) {
                const buyPercentage = (totalBuyVolume / totalQuoteVolume) * 100;
                if (buyPercentage > 70 && canFire('extreme-buying-pressure')) {
                    alertsToFire.push({ symbol, timeframe, type: 'extreme-buying-pressure', price: lastKline.close });
                    setFired('extreme-buying-pressure');
                }
                if (buyPercentage < 30 && canFire('extreme-selling-pressure')) {
                    alertsToFire.push({ symbol, timeframe, type: 'extreme-selling-pressure', price: lastKline.close });
                    setFired('extreme-selling-pressure');
                }
            }
        }
    }


    // --- KiwiHunt Alerts ---
    const kiwiHuntTimeframes: Timeframe[] = ['15m', '1h', '4h', '1d'];
    if (kiwiHuntTimeframes.includes(timeframe) && data.kiwiHunt) {
        const { q1, trigger, q3 } = data.kiwiHunt;

        if (q1.length >= 2 && trigger.length >= 2 && q3.length >= 1) {
            const lastQ1 = q1[q1.length - 1];
            const prevQ1 = q1[q1.length - 2];
            const lastTrigger = trigger.find(p => p.time === lastQ1.time);
            const prevTrigger = trigger.find(p => p.time === prevQ1.time);
            const lastQ3 = q3.find(p => p.time === lastQ1.time);

            if (lastTrigger && prevTrigger && lastQ3) {
                const isBullishCross = prevQ1.value <= prevTrigger.value && lastQ1.value > lastTrigger.value;
                const isBearishCross = prevQ1.value >= prevTrigger.value && lastQ1.value < lastTrigger.value;

                // 1. Hunt Signal (Highest Quality)
                if (alertConditions.kiwiHuntHuntBuy) {
                    const huntBuyCondition = isBullishCross && lastQ1.value <= 20 && lastQ3.value <= -4;
                    if (huntBuyCondition && canFire('kiwi-hunt-buy')) {
                        alertsToFire.push({ symbol, timeframe, type: 'kiwi-hunt-buy' });
                        setFired('kiwi-hunt-buy');
                    }
                }
                if (alertConditions.kiwiHuntHuntSell) {
                    const huntSellCondition = isBearishCross && lastQ1.value >= 80 && lastQ3.value >= 104;
                    if (huntSellCondition && canFire('kiwi-hunt-sell')) {
                        alertsToFire.push({ symbol, timeframe, type: 'kiwi-hunt-sell' });
                        setFired('kiwi-hunt-sell');
                    }
                }

                // 2. Crazy Signal (Strength from Weakness)
                if (alertConditions.kiwiHuntCrazyBuy) {
                    const crazyBuyCondition = isBullishCross && lastQ3.value <= -4;
                    if (crazyBuyCondition && canFire('kiwi-hunt-crazy-buy')) {
                        alertsToFire.push({ symbol, timeframe, type: 'kiwi-hunt-crazy-buy' });
                        setFired('kiwi-hunt-crazy-buy');
                    }
                }
                if (alertConditions.kiwiHuntCrazySell) {
                    const crazySellCondition = isBearishCross && lastQ3.value >= 104;
                    if (crazySellCondition && canFire('kiwi-hunt-crazy-sell')) {
                        alertsToFire.push({ symbol, timeframe, type: 'kiwi-hunt-crazy-sell' });
                        setFired('kiwi-hunt-crazy-sell');
                    }
                }

                // 3. Buy Trend Signal
                if (alertConditions.kiwiHuntBuyTrend) {
                    const stateKey = `${symbol}-${timeframe}-kh-cont-state`;
                    const currentState = alertStates[stateKey] || { inPullback: false };
                    let newState = { ...currentState };

                    if (lastQ1.value < 40) {
                        newState.inPullback = true;
                    }

                    if (newState.inPullback && isBullishCross && lastQ1.value > 50) {
                        if (canFire('kiwi-hunt-buy-trend')) {
                            alertsToFire.push({ symbol, timeframe, type: 'kiwi-hunt-buy-trend' });
                            setFired('kiwi-hunt-buy-trend');
                        }
                        newState.inPullback = false;
                    }

                    if (lastQ1.value > 80) {
                        newState.inPullback = false;
                    }
                    
                    if (newState.inPullback !== currentState.inPullback) {
                        setAlertStates(prev => ({ ...prev, [stateKey]: newState }));
                    }
                }
            }
        }
    }
    
    // --- LuxAlgo Statistical Trailing Stop Flip ---
    if (['1h', '4h', '1d'].includes(timeframe) && data.luxalgoTrail && data.luxalgoTrail.length >= 2) {
        const lastTrail = data.luxalgoTrail[data.luxalgoTrail.length - 1];
        const prevTrail = data.luxalgoTrail[data.luxalgoTrail.length - 2];
        const BULLISH = 1;
        const BEARISH = 0;

        if (alertConditions.luxalgoBullishFlip) {
            if (prevTrail.bias === BEARISH && lastTrail.bias === BULLISH && canFire('luxalgo-bullish-flip')) {
                alertsToFire.push({
                    symbol,
                    timeframe,
                    type: 'luxalgo-bullish-flip',
                    price: lastKline.close,
                    body: `Trailing stop flipped to Bullish at $${lastKline.close.toFixed(4)}`
                });
                setFired('luxalgo-bullish-flip');
            }
        }

        if (alertConditions.luxalgoBearishFlip) {
            if (prevTrail.bias === BULLISH && lastTrail.bias === BEARISH && canFire('luxalgo-bearish-flip')) {
                alertsToFire.push({
                    symbol,
                    timeframe,
                    type: 'luxalgo-bearish-flip',
                    price: lastKline.close,
                    body: `Trailing stop flipped to Bearish at $${lastKline.close.toFixed(4)}`
                });
                setFired('luxalgo-bearish-flip');
            }
        }
    }

    return alertsToFire;
};