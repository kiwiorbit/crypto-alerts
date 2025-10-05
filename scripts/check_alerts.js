// A self-contained Node.js script to check for specific crypto alerts and send them to Discord.
// This runs in a cloud environment (like Render Cron Jobs), independent of the browser app.

import https from 'https';
import { fileURLToPath } from 'url';

// --- CONFIGURATION ---
const SYMBOLS_TO_CHECK = [
    'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'WLDUSDT', 'DOGEUSDT', 'BNBUSDT', 'XRPUSDT', 'AVAXUSDT', 'SUIUSDT', 'ADAUSDT', 'TRXUSDT', 'LINKUSDT', 'ARBUSDT', 'PYTHUSDT', 'ATOMUSDT', 'FILUSDT', 'XLMUSDT',
    'BCHUSDT', 'ETCUSDT', 'VIRTUALUSDT', 'SEIUSDT', 'DOTUSDT', 'UNIUSDT', 'NEARUSDT', 'TAOUSDT', 'HBARUSDT',
    'TIAUSDT', 'ETHFIUSDT', 'FETUSDT', 'APTUSDT', 'LDOUSDT', 'TONUSDT', 'RAYUSDT', 'PENDLEUSDT', 'DIAUSDT',
    'BIOUSDT', 'RENDERUSDT', 'CGPTUSDT', 'CFXUSDT', 'JUPUSDT', 'BERAUSDT', 'GALAUSDT', 'GRTUSDT', 'SFPUSDT','LPTUSDT',
    'ALGOUSDT', 'ROSEUSDT', 'AIXBTUSDT', 'ENSUSDT', 'VETUSDT', 'RUNEUSDT', 'BLURUSDT', 'STRKUSDT', 'PORTALUSDT', 'PIXELUSDT',
    'STXUSDT', 'ZROUSDT', 'QNTUSDT', 'NEOUSDT', 'AXSUSDT', 'HYPERUSDT', 'RSRUSDT', 'SAGAUSDT', 'MOVEUSDT', 'NMRUSDT',
    'SANDUSDT', 'YGGUSDT', 'JTOUSDT', 'XAIUSDT', 'API3USDT', 'FIOUSDT', 'IOTAUSDT', 'TRBUSDT', 'APEUSDT',
    'BEAMXUSDT', 'THETAUSDT', 'CHZUSDT', 'ZECUSDT', 'MANAUSDT', 'FXSUSDT', 'DYMUSDT', 'SUPERUSDT', 'SYSUSDT', 'SUSHIUSDT',
    'BATUSDT', 'CTSIUSDT', 'RAREUSDT', 'FIDAUSDT', 'VANRYUSDT', 'WUSDT', 'EGLDUSDT', 'REZUSDT', 'PHAUSDT', 'SYNUSDT',
    'CHRUSDT', 'AUCTIONUSDT', 'SNXUSDT', 'EDUUSDT', 'TNSRUSDT', 'XVGUSDT', 'GASUSDT', 'BICOUSDT','OGUSDT',
    'KAITOUSDT', 'CRVUSDT', 'TOWNSUSDT', 'CUSDT', 'RESOLVUSDT', 'PENGUUSDT', 'GPSUSDT', 'HEMIUSDT' , 'CAKEUSDT'
];
const TIMEFRAMES_TO_CHECK = ['1h', '4h'];
const { DISCORD_WEBHOOK_URL, JSONBIN_API_KEY, JSONBIN_BIN_ID } = process.env;

const ALERT_COOLDOWN = 3 * 60 * 60 * 1000; // 3 hours

// --- Simple Fetch Implementation for Node.js ---
const fetch = (url, options = {}) => new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: options.headers || {},
    };

    const req = https.request(reqOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            if (res.statusCode < 200 || res.statusCode >= 300) {
                 reject(new Error(`Request Failed. Status Code: ${res.statusCode}. URL: ${url}. Body: ${data}`));
                 return;
            }
            try {
                resolve({ json: () => JSON.parse(data), ok: true, text: () => data });
            } catch (e) {
                resolve({ text: () => data, ok: true });
            }
        });
    });

    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
});


// --- State Management using JSONBin.io ---
const loadState = async () => {
    if (!JSONBIN_API_KEY || !JSONBIN_BIN_ID) return {};
    try {
        const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
            headers: { 'X-Master-Key': JSONBIN_API_KEY }
        });
        const data = await res.json();
        console.log("Successfully loaded alert state from JSONBin.");
        return data.record || {};
    } catch (e) {
        console.error("Could not load state from JSONBin, starting fresh.", e.message);
        return {};
    }
};

const saveState = async (state) => {
    if (!JSONBIN_API_KEY || !JSONBIN_BIN_ID) return;
    try {
        await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_API_KEY
            },
            body: JSON.stringify(state)
        });
        console.log("Successfully saved alert state to JSONBin.");
    } catch (e) {
        console.error("Error saving state to JSONBin:", e.message);
    }
};

// --- Discord Webhook Sender ---
const sendDiscordWebhook = (notification) => {
    console.log(`[!] ATTEMPTING TO SEND DISCORD NOTIFICATION for ${notification.title}`);
    const colorMap = {
        'luxalgo-bullish-flip': 3066993,      // Green
        'luxalgo-bearish-flip': 15158332,     // Red
        'rsi-extreme-overbought': 15158332,  // Red
        'rsi-extreme-oversold': 3066993,      // Green
        'rsi-sma-bullish-cross': 3066993,     // Green
        'rsi-sma-bearish-cross': 15158332,    // Red
        'bullish-divergence': 3066993,        // Green
        'bearish-divergence': 15158332,       // Red
        'wavetrend-confluence-buy': 3581519,  // Sky Blue
        'high-conviction-buy': 1752220,       // Cyan
    };
    const embed = {
        title: notification.title,
        description: notification.body,
        color: colorMap[notification.type] || 10070709,
        timestamp: new Date().toISOString(),
    };
    const payload = JSON.stringify({ embeds: [embed] });

    const payloadByteLength = Buffer.byteLength(payload, 'utf8');

    console.log('[DEBUG] Payload being sent to Discord:', payload);

    const url = new URL(DISCORD_WEBHOOK_URL);
    const options = {
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': payloadByteLength
        }
    };
    const req = https.request(options, res => {
        let responseBody = '';
        res.on('data', chunk => responseBody += chunk);
        res.on('end', () => {
            if (res.statusCode < 200 || res.statusCode >= 300) {
                console.error(`Discord responded with status code: ${res.statusCode}. Body: ${responseBody}`);
            } else {
                console.log(`Discord response: ${res.statusCode} (Success).`);
            }
        });
    });
    req.on('error', e => console.error(`Error sending webhook: ${e.message}`));
    req.write(payload);
    req.end();
};

// --- INDICATOR CALCULATION LOGIC ---

const calculateRSI = (klines, length = 14) => {
    const closes = klines.map(k => k.close);
    if (closes.length <= length) return [];

    const gains = [];
    const losses = [];
    for (let i = 1; i < closes.length; i++) {
        const change = closes[i] - closes[i - 1];
        gains.push(Math.max(0, change));
        losses.push(Math.max(0, -change));
    }

    let avgGain = gains.slice(0, length).reduce((sum, val) => sum + val, 0) / length;
    let avgLoss = losses.slice(0, length).reduce((sum, val) => sum + val, 0) / length;

    const rsiValues = [];
    for (let i = length; i < gains.length; i++) {
        const rs = avgLoss === 0 ? Infinity : avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));
        rsiValues.push(rsi);

        avgGain = (avgGain * (length - 1) + gains[i]) / length;
        avgLoss = (avgLoss * (length - 1) + losses[i]) / length;
    }

    const padding = Array(klines.length - rsiValues.length).fill(null);
    return [...padding, ...rsiValues];
};

const calculateSMA = (data, length) => {
    if (data.length < length) return [];
    const smaValues = [];
    for (let i = length - 1; i < data.length; i++) {
        const window = data.slice(i - length + 1, i + 1);
        const validValues = window.filter(v => v !== null);
        if (validValues.length === 0) {
            smaValues.push(null);
            continue;
        }
        const sum = validValues.reduce((acc, point) => acc + point, 0);
        smaValues.push(sum / validValues.length);
    }
    const padding = Array(data.length - smaValues.length).fill(null);
    return [...padding, ...smaValues];
};

const sma_legacy = (source, length) => {
    const useLength = Math.min(source.length, length);
    if (useLength === 0) return [0];
    const smaValues = [];
    const series = source.slice(-useLength);
    for (let i = useLength - 1; i < series.length; i++) {
        const sum = series.slice(i - useLength + 1, i + 1).reduce((acc, val) => acc + val, 0);
        smaValues.push(sum / useLength);
    }
    return smaValues;
};

const stdev = (source, length) => {
    const useLength = Math.min(source.length, length);
    if (useLength < 1) return 0;
    const series = source.slice(-useLength);
    const mean = sma_legacy(series, useLength)[0];
    if (isNaN(mean)) return 0;
    const variance = series.reduce((a, b) => a + (b - mean) ** 2, 0) / useLength;
    return Math.sqrt(variance);
};

const calculateStatisticalTrailingStop = (klines, dataLength = 1, distributionLength = 10) => {
    const requiredBars = distributionLength + dataLength + 2;
    if (klines.length < requiredBars) return [];

    const logTrueRanges = [];
    for (let i = 0; i < klines.length; i++) {
        const requiredHistory = dataLength + 1;
        if (i < requiredHistory) { logTrueRanges.push(null); continue; }
        const highSeries = klines.slice(i - dataLength + 1, i + 1).map(k => k.high);
        const lowSeries = klines.slice(i - dataLength + 1, i + 1).map(k => k.low);
        const h = Math.max(...highSeries);
        const l = Math.min(...lowSeries);
        const closePrev = klines[i - requiredHistory].close;
        const tr = Math.max(h - l, Math.abs(h - closePrev), Math.abs(l - closePrev));
        logTrueRanges.push(tr > 0 ? Math.log(tr) : null);
    }
    
    const results = [];
    let currentTrail = null;

    for (let i = 0; i < klines.length; i++) {
        const kline = klines[i];
        if (i < distributionLength - 1) { results.push({ time: kline.time, bias: 0, level: 0 }); continue; }
        const logTrWindow = logTrueRanges.slice(i - distributionLength + 1, i + 1).filter(v => v !== null);
        let delta;
        if (logTrWindow.length > 1) {
            const avg = sma_legacy(logTrWindow, distributionLength)[0];
            const std = stdev(logTrWindow, distributionLength);
            delta = Math.exp(avg + 2 * std);
        } else if (currentTrail) {
            delta = currentTrail.delta;
        } else {
            results.push({ time: kline.time, bias: 0, level: 0 }); continue;
        }
        
        const hlc3 = (kline.high + kline.low + kline.close) / 3;
        if (currentTrail === null) {
            currentTrail = { bias: 0, delta: delta, level: hlc3 + delta };
        }
        
        currentTrail.delta = delta;
        const trailTrigger = (currentTrail.bias === 0 && kline.close >= currentTrail.level) || (currentTrail.bias === 1 && kline.close <= currentTrail.level);
        if (trailTrigger) {
            currentTrail.bias = currentTrail.bias === 0 ? 1 : 0;
            currentTrail.level = currentTrail.bias === 0 ? hlc3 + delta : Math.max(hlc3 - delta, 0);
        } else {
            currentTrail.level = currentTrail.bias === 0 ? Math.min(currentTrail.level, hlc3 + delta) : Math.max(currentTrail.level, Math.max(hlc3 - delta, 0));
        }
        results.push({ time: kline.time, bias: currentTrail.bias, level: currentTrail.level });
    }
    return results;
};

const ema = (source, length) => {
    const alpha = 2 / (length + 1);
    const emaValues = [];
    if (source.length === 0) return [];
    
    let firstValidIndex = source.findIndex(v => v !== null);
    if (firstValidIndex === -1) return Array(source.length).fill(null);

    for (let i = 0; i < firstValidIndex; i++) {
        emaValues.push(null);
    }

    emaValues.push(source[firstValidIndex]); 

    for (let i = firstValidIndex + 1; i < source.length; i++) {
        const sourceVal = source[i];
        const prevEma = emaValues[i-1];
        if (sourceVal === null || prevEma === null) {
            emaValues.push(prevEma);
        } else {
            emaValues.push(alpha * sourceVal + (1 - alpha) * prevEma);
        }
    }
    return emaValues;
};

const calculateWaveTrend = (klines, chlen = 9, avg = 12, malen = 3) => {
    if (klines.length < chlen + avg + malen) return { wt1: [], wt2: [] };

    const hlc3 = klines.map(k => (k.high + k.low + k.close) / 3);
    const esa = ema(hlc3, chlen);
    const absDiff = hlc3.map((p, i) => (esa[i] !== null ? Math.abs(p - esa[i]) : null));
    const de = ema(absDiff, chlen);

    const ci = hlc3.map((p, i) => {
        if (de[i] !== null && de[i] !== 0 && esa[i] !== null) {
            return (p - esa[i]) / (0.015 * de[i]);
        }
        return null;
    });

    const wt1 = ema(ci, avg);
    const wt2 = calculateSMA(wt1, malen);

    return { wt1, wt2 };
};

const calculateStochRSI = (rsiData, stochLength = 14, kSmooth = 3, dSmooth = 3) => {
    const firstRsiIndex = rsiData.findIndex(v => v !== null);
    if (firstRsiIndex === -1) return { stochK: Array(rsiData.length).fill(null), stochD: Array(rsiData.length).fill(null) };
    
    const validRsiData = rsiData.slice(firstRsiIndex);

    if (validRsiData.length < stochLength) return { stochK: Array(rsiData.length).fill(null), stochD: Array(rsiData.length).fill(null) };

    const stochRsiValues = [];
    for (let i = stochLength - 1; i < validRsiData.length; i++) {
        const rsiWindow = validRsiData.slice(i - stochLength + 1, i + 1);
        const highestRsi = Math.max(...rsiWindow);
        const lowestRsi = Math.min(...rsiWindow);
        const currentRsi = validRsiData[i];
        const stochRsi = (highestRsi - lowestRsi) === 0 ? 0 : ((currentRsi - lowestRsi) / (highestRsi - lowestRsi)) * 100;
        stochRsiValues.push(stochRsi);
    }
    
    const kValues = [];
    if (stochRsiValues.length >= kSmooth) {
        for(let i = kSmooth - 1; i < stochRsiValues.length; i++) {
            const kWindow = stochRsiValues.slice(i - kSmooth + 1, i + 1);
            const kValue = kWindow.reduce((sum, val) => sum + val, 0) / kSmooth;
            kValues.push(kValue);
        }
    }

    const dValues = [];
    if (kValues.length >= dSmooth) {
        for(let i = dSmooth - 1; i < kValues.length; i++) {
            const dWindow = kValues.slice(i - dSmooth + 1, i + 1);
            const dValue = dWindow.reduce((sum, val) => sum + val, 0) / dSmooth;
            dValues.push(dValue);
        }
    }

    const stochKPadding = Array(rsiData.length - kValues.length).fill(null);
    const stochDPadding = Array(rsiData.length - dValues.length).fill(null);

    return { 
        stochK: [...stochKPadding, ...kValues], 
        stochD: [...stochDPadding, ...dValues]
    };
};

const getAverageVolume = (klines, period) => {
    if (klines.length < period) return 0;
    const window = klines.slice(-period);
    return window.reduce((sum, k) => sum + k.quoteVolume, 0) / window.length;
};


// --- DIVERGENCE LOGIC ---
const findPivots = (data, dataKey, lookbackLeft, lookbackRight, isHigh) => {
    const pivots = [];
    if (data.length < lookbackLeft + lookbackRight + 1) {
        return [];
    }
    for (let i = lookbackLeft; i < data.length - lookbackRight; i++) {
        const point = data[i];
        if (point === null || point[dataKey] === null || point[dataKey] === undefined) continue;

        const currentValue = point[dataKey];
        let isPivot = true;

        for (let j = 1; j <= lookbackLeft; j++) {
            const comparePoint = data[i - j];
            if (comparePoint === null || comparePoint[dataKey] === null || comparePoint[dataKey] === undefined) { isPivot = false; break; }
            const compareValue = comparePoint[dataKey];
            if (isHigh ? compareValue > currentValue : compareValue < currentValue) { isPivot = false; break; }
        }
        if (!isPivot) continue;

        for (let j = 1; j <= lookbackRight; j++) {
            const comparePoint = data[i + j];
            if (comparePoint === null || comparePoint[dataKey] === null || comparePoint[dataKey] === undefined) { isPivot = false; break; }
            const compareValue = comparePoint[dataKey];
            if (isHigh ? compareValue >= currentValue : compareValue <= currentValue) { isPivot = false; break; }
        }

        if (isPivot) {
            pivots.push({ index: i, value: currentValue, time: point.time });
        }
    }
    return pivots;
};

const findClosestPivot = (pivot, candidatePivots, maxBarsApart) => {
    let closest = null;
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

const detectBullishDivergence = (klines, rsiData) => {
    const lookback = 5, rangeMin = 5, rangeMax = 60, pivotMatchMaxBars = 3;
    if (klines.length < rangeMax) return null;

    const pricePivots = findPivots(klines, 'low', lookback, lookback, false);
    const rsiPivots = findPivots(rsiData, 'value', lookback, lookback, false);

    if (pricePivots.length < 2) return null;

    for (let i = pricePivots.length - 2; i >= 0; i--) {
        const pricePivot1 = pricePivots[i];
        const pricePivot2 = pricePivots[pricePivots.length - 1];

        if (pricePivot2.value >= pricePivot1.value) continue;
        const rsiPivot1 = findClosestPivot(pricePivot1, rsiPivots, pivotMatchMaxBars);
        const rsiPivot2 = findClosestPivot(pricePivot2, rsiPivots, pivotMatchMaxBars);
        if (!rsiPivot1 || !rsiPivot2 || rsiPivot1.time === rsiPivot2.time) continue;
        if (rsiPivot1.value > 45 || rsiPivot2.value > 45) continue;
        if (rsiPivot2.value <= rsiPivot1.value) continue;
        const barDifference = pricePivot2.index - pricePivot1.index;
        if (barDifference < rangeMin || barDifference > rangeMax) continue;

        return { pivotTime: rsiPivot2.time, rsiValue: rsiPivot2.value };
    }
    return null;
};

const detectBearishDivergence = (klines, rsiData) => {
    const lookback = 5, rangeMin = 5, rangeMax = 60, pivotMatchMaxBars = 3;
    if (klines.length < rangeMax) return null;

    const pricePivots = findPivots(klines, 'high', lookback, lookback, true);
    const rsiPivots = findPivots(rsiData, 'value', lookback, lookback, true);

    if (pricePivots.length < 2) return null;

    for (let i = pricePivots.length - 2; i >= 0; i--) {
        const pricePivot1 = pricePivots[i];
        const pricePivot2 = pricePivots[pricePivots.length - 1];

        if (pricePivot2.value <= pricePivot1.value) continue;
        const rsiPivot1 = findClosestPivot(pricePivot1, rsiPivots, pivotMatchMaxBars);
        const rsiPivot2 = findClosestPivot(pricePivot2, rsiPivots, pivotMatchMaxBars);
        if (!rsiPivot1 || !rsiPivot2 || rsiPivot1.time === rsiPivot2.time) continue;
        if (rsiPivot1.value < 55 || rsiPivot2.value < 55) continue;
        if (rsiPivot2.value >= rsiPivot1.value) continue;
        const barDifference = pricePivot2.index - pricePivot1.index;
        if (barDifference < rangeMin || barDifference > rangeMax) continue;

        return { pivotTime: rsiPivot2.time, rsiValue: rsiPivot2.value };
    }
    return null;
};

// --- Main Alert Checking Logic ---
const checkAlerts = (symbol, timeframe, data, states, now) => {
    const alerts = [];
    const canFire = (type) => {
        const key = `${symbol}-${timeframe}-${type}`;
        const lastFired = states[key];
        const can = !lastFired || now - lastFired > ALERT_COOLDOWN;
        if (!can) console.log(`[COOLDOWN] Alert for ${key} is on cooldown.`);
        return can;
    };
    const addAlert = (type, title, body) => {
        console.log(`[ALERT PREPARED] ${title}: ${body}`);
        alerts.push({ type, title, body });
        states[`${symbol}-${timeframe}-${type}`] = now;
    };

    const lastKline = data.klines[data.klines.length - 1];

    // --- TRAILING STOP ALERTS ---
    const isLuxAlgoEnabled = process.env.ALERT_LUXALGO_FLIP_ENABLED === 'true';
    if (isLuxAlgoEnabled && data.luxalgoTrail && data.luxalgoTrail.length >= 2) {
        const lastTrail = data.luxalgoTrail[data.luxalgoTrail.length - 1];
        const prevTrail = data.luxalgoTrail[data.luxalgoTrail.length - 2];
        const BULLISH = 1;
        const BEARISH = 0;

        if (prevTrail.bias === BEARISH && lastTrail.bias === BULLISH && canFire('luxalgo-bullish-flip')) {
            addAlert('luxalgo-bullish-flip',
                `${symbol} Bot Buys (${timeframe})`,
                `Trailing stop flipped to Bullish at $${lastKline.close.toFixed(4)}`);
        }

        if (prevTrail.bias === BULLISH && lastTrail.bias === BEARISH && canFire('luxalgo-bearish-flip')) {
             addAlert('luxalgo-bearish-flip',
                `${symbol} Bot Sells (${timeframe})`,
                `Trailing stop flipped to Bearish at $${lastKline.close.toFixed(4)}`);
        }
    }
    
    // --- RSI EXTREME ALERTS ---
    const isRsiEnabled = process.env.ALERT_RSI_EXTREMES_ENABLED === 'true';
    if (isRsiEnabled && data.rsi && data.rsi.length >= 2) {
        const lastRsi = data.rsi[data.rsi.length - 1];
        const prevRsi = data.rsi[data.rsi.length - 2];

        if (lastRsi !== null && prevRsi !== null) {
            // Extreme Overbought
            if (lastRsi > 75 && prevRsi <= 75 && canFire('rsi-extreme-overbought')) {
                addAlert(
                    'rsi-extreme-overbought',
                    `${symbol} Extreme Overbought (${timeframe})`,
                    `RSI is now ${lastRsi.toFixed(2)}, crossing above 75.`
                );
            }
            // Extreme Oversold
            if (lastRsi < 25 && prevRsi >= 25 && canFire('rsi-extreme-oversold')) {
                addAlert(
                    'rsi-extreme-oversold',
                    `${symbol} Extreme Oversold (${timeframe})`,
                    `RSI is now ${lastRsi.toFixed(2)}, crossing below 25.`
                );
            }
        }
    }

    // --- RSI/SMA CROSS ALERTS ---
    const isRsiSmaCrossEnabled = process.env.ALERT_RSI_SMA_CROSS_ENABLED === 'true';
    if (isRsiSmaCrossEnabled && data.rsi && data.rsi.length >= 2 && data.sma && data.sma.length >= 2) {
        const lastRsi = data.rsi[data.rsi.length - 1];
        const prevRsi = data.rsi[data.rsi.length - 2];
        const lastSma = data.sma[data.sma.length - 1];
        const prevSma = data.sma[data.sma.length - 2];
        
        if (lastRsi !== null && prevRsi !== null && lastSma !== null && prevSma !== null) {
            // Bullish Cross
            if (prevRsi <= prevSma && lastRsi > lastSma && canFire('rsi-sma-bullish-cross')) {
                addAlert(
                    'rsi-sma-bullish-cross',
                    `${symbol} RSI/SMA Bullish Cross (${timeframe})`,
                    `RSI (14) has crossed above its SMA (14). RSI is now ${lastRsi.toFixed(2)}.`
                );
            }
            // Bearish Cross
            if (prevRsi >= prevSma && lastRsi < lastSma && canFire('rsi-sma-bearish-cross')) {
                addAlert(
                    'rsi-sma-bearish-cross',
                    `${symbol} RSI/SMA Bearish Cross (${timeframe})`,
                    `RSI (14) has crossed below its SMA (14). RSI is now ${lastRsi.toFixed(2)}.`
                );
            }
        }
    }
    
    // --- DIVERGENCE ALERTS ---
    const isDivergenceEnabled = process.env.ALERT_DIVERGENCE_ENABLED === 'true';
    if (isDivergenceEnabled) {
        const bullishDivergence = detectBullishDivergence(data.klines, data.rsiForDiv);
        if (bullishDivergence && canFire(`bullish-divergence-${bullishDivergence.pivotTime}`)) {
            addAlert(
                'bullish-divergence',
                `${symbol} Bullish Divergence (${timeframe})`,
                `A bullish divergence has been detected. RSI is at ${bullishDivergence.rsiValue.toFixed(2)}.`
            );
        }

        const bearishDivergence = detectBearishDivergence(data.klines, data.rsiForDiv);
        if (bearishDivergence && canFire(`bearish-divergence-${bearishDivergence.pivotTime}`)) {
            addAlert(
                'bearish-divergence',
                `${symbol} Bearish Divergence (${timeframe})`,
                `A bearish divergence has been detected. RSI is at ${bearishDivergence.rsiValue.toFixed(2)}.`
            );
        }
    }
    
    // --- WAVETREND CONFLUENCE BUY ---
    const isWaveTrendEnabled = process.env.ALERT_WAVETREND_CONFLUENCE_ENABLED === 'true';
    if (isWaveTrendEnabled && data.wt1 && data.wt1.length >= 2 && data.wt2 && data.wt2.length >= 2) {
        const lastWt1 = data.wt1[data.wt1.length - 1];
        const prevWt1 = data.wt1[data.wt1.length - 2];
        const lastWt2 = data.wt2[data.wt2.length - 1];
        const prevWt2 = data.wt2[data.wt2.length - 2];

        if (lastWt1 !== null && prevWt1 !== null && lastWt2 !== null && prevWt2 !== null) {
            const isBullishCross = prevWt1 <= prevWt2 && lastWt1 > lastWt2;
            const isOversold = lastWt2 < -53;

            if (isBullishCross && isOversold && canFire('wavetrend-confluence-buy')) {
                addAlert(
                    'wavetrend-confluence-buy',
                    `${symbol} Cipher Buy Signal (${timeframe})`,
                    `Bullish cross detected while WaveTrend is oversold (${lastWt2.toFixed(2)}).`
                );
            }
        }
    }

    // --- HIGH-CONVICTION BUY ALERTS ---
    const isHighConvictionBuyEnabled = process.env.ALERT_HIGH_CONVICTION_BUY_ENABLED === 'true';
    if (isHighConvictionBuyEnabled && ['1h', '4h'].includes(timeframe)) {
        const requiredLength = 101;
        if (
            data.klines.length >= requiredLength &&
            data.stochK && data.stochK.length >= 2 &&
            data.priceSma50 && data.priceSma50.length >= 2 &&
            data.priceSma100 && data.priceSma100.length >= 2 &&
            data.wt1 && data.wt1.length >= 2 &&
            data.wt2 && data.wt2.length >= 2
        ) {
            const lastKline = data.klines[data.klines.length - 1];
            const prevKline = data.klines[data.klines.length - 2];
            const lastStochK = data.stochK[data.stochK.length - 1];
            const lastWt1 = data.wt1[data.wt1.length - 1];
            const prevWt1 = data.wt1[data.wt1.length - 2];
            const lastWt2 = data.wt2[data.wt2.length - 1];
            const prevWt2 = data.wt2[data.wt2.length - 2];
            const lastSma50 = data.priceSma50[data.priceSma50.length - 1];
            const prevSma50 = data.priceSma50[data.priceSma50.length - 2];
            const lastSma100 = data.priceSma100[data.priceSma100.length - 1];
            const prevSma100 = data.priceSma100[data.priceSma100.length - 2];

            const allDataValid = [lastKline, prevKline, lastStochK, lastWt1, prevWt1, lastWt2, prevWt2, lastSma50, prevSma50, lastSma100, prevSma100].every(p => p !== null && p !== undefined);

            if (allDataValid) {
                const avgVolume = getAverageVolume(data.klines.slice(-21, -1), 20);
                const isStochOversold = lastStochK < 25;
                const isVolumeConfirmed = lastKline.quoteVolume > (avgVolume * 0.9);

                if (isStochOversold && isVolumeConfirmed) {
                    let scenarioMet = false;
                    
                    if (lastWt2 < -55 && (lastKline.close > lastSma50 || lastKline.close > lastSma100)) {
                        scenarioMet = true;
                    }

                    const isBullishCross = prevWt1 <= prevWt2 && lastWt1 > lastWt2;
                    if (isBullishCross && lastWt2 < -40) {
                        const didTapSma50 = lastKline.low <= lastSma50 && lastKline.close > lastSma50;
                        const didTapSma100 = lastKline.low <= lastSma100 && lastKline.close > lastSma100;
                        if (didTapSma50 || didTapSma100) {
                            scenarioMet = true;
                        }

                        const reclaimedSma50 = prevKline.close < prevSma50 && lastKline.close > lastSma50;
                        const reclaimedSma100 = prevKline.close < prevSma100 && lastKline.close > lastSma100;
                        if (reclaimedSma50 || reclaimedSma100) {
                            scenarioMet = true;
                        }
                    }

                    if (scenarioMet && canFire('high-conviction-buy')) {
                        addAlert(
                            'high-conviction-buy',
                            `${symbol} High-Conviction Buy (${timeframe})`,
                            `Multiple bullish confluence factors detected.`
                        );
                    }
                }
            }
        }
    }


    return alerts;
};

// --- Main Execution ---
const main = async () => {
    console.log("Starting alert check script...");
    if (!DISCORD_WEBHOOK_URL || !DISCORD_WEBHOOK_URL.includes('discord.com/api/webhooks')) {
        console.error("DISCORD_WEBHOOK_URL is missing or invalid! Halting.");
        return;
    }
    if (!JSONBIN_API_KEY || !JSONBIN_BIN_ID) {
        console.error("JSONBIN_API_KEY or JSONBIN_BIN_ID is not set! Halting.");
        return;
    }

    const alertStates = await loadState();
    const now = Date.now();

    for (const symbol of SYMBOLS_TO_CHECK) {
        for (const timeframe of TIMEFRAMES_TO_CHECK) {
            try {
                console.log(`--------------------------------\nProcessing ${symbol} on ${timeframe}...`);
                const klinesRaw = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${timeframe}&limit=300`).then(res => res.json());
                const klines = klinesRaw.map(k => ({ time: k[0], open: parseFloat(k[1]), high: parseFloat(k[2]), low: parseFloat(k[3]), close: parseFloat(k[4]), volume: parseFloat(k[5]), quoteVolume: parseFloat(k[7]), takerBuyQuoteVolume: parseFloat(k[10]) }));

                if (klines.length < 101) {
                    console.log(`Skipping ${symbol} on ${timeframe} due to insufficient kline data (${klines.length}).`);
                    continue;
                }
                
                const rsiNumbers = calculateRSI(klines);
                const { stochK, stochD } = calculateStochRSI(rsiNumbers);
                const priceCloses = klines.map(k => k.close);
                const { wt1, wt2 } = calculateWaveTrend(klines);

                const data = {
                    klines,
                    luxalgoTrail: calculateStatisticalTrailingStop(klines),
                    rsi: rsiNumbers,
                    sma: calculateSMA(rsiNumbers, 14),
                    rsiForDiv: klines.map((k, i) => ({ time: k.time, value: rsiNumbers[i] })),
                    stochK,
                    stochD,
                    priceSma50: calculateSMA(priceCloses, 50),
                    priceSma100: calculateSMA(priceCloses, 100),
                    wt1,
                    wt2,
                };

                const firedAlerts = checkAlerts(symbol, timeframe, data, alertStates, now);
                firedAlerts.forEach(sendDiscordWebhook);

            } catch (error) {
                console.error(`Error processing ${symbol} on ${timeframe}:`, error.message);
            }
        }
    }
 
    await saveState(alertStates);
    console.log("--------------------------------\nAll checks complete.");
};

main();
