// A self-contained Node.js script to check for specific crypto alerts and send them to Discord.
// This runs in a cloud environment (like Render Cron Jobs), independent of the browser app.

import https from 'https';
import { fileURLToPath } from 'url';

// --- CONFIGURATION ---
const SYMBOLS_TO_CHECK = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'WLDUSDT', 'DOGEUSDT', 'BNBUSDT', 'XRPUSDT', 'ENAUSDT', 'AVAXUSDT', 'SUIUSDT', 'ADAUSDT', 'TRXUSDT', 'LINKUSDT', 'ARBUSDT','PYTHUSDT', 'ATOMUSDT', 'FILUSDT', 'XLMUSDT',
    'BCHUSDT', 'ETCUSDT', 'VIRTUALUSDT', 'SEIUSDT', 'DOTUSDT', 'UNIUSDT', 'NEARUSDT', 'TAOUSDT', 'HBARUSDT',
    'TIAUSDT', 'ETHFIUSDT', 'FETUSDT', 'APTUSDT', 'LDOUSDT', 'TONUSDT', 'RAYUSDT', 'PENDLEUSDT', 'DIAUSDT',
    'BIOUSDT', 'RENDERUSDT', 'CGPTUSDT', 'CFXUSDT', 'JUPUSDT', 'BERAUSDT', 'GALAUSDT', 'GRTUSDT', 'SFPUSDT','LPTUSDT',
    'ALGOUSDT', 'ROSEUSDT', 'AIXBTUSDT', 'ENSUSDT', 'VETUSDT', 'RUNEUSDT', 'BLURUSDT', 'STRKUSDT', 'PORTALUSDT', 'PIXELUSDT',
    'STXUSDT', 'ZROUSDT', 'QNTUSDT', 'NEOUSDT', 'AXSUSDT', 'HYPERUSDT', 'RSRUSDT', 'SAGAUSDT', 'MOVEUSDT', 'NMRUSDT',
    'SANDUSDT', 'YGGUSDT', 'JTOUSDT', 'XAIUSDT', 'API3USDT', 'FIOUSDT', 'IOTAUSDT', 'TRBUSDT', 'APEUSDT',
    'BEAMXUSDT', 'THETAUSDT', 'CHZUSDT', 'ZECUSDT', 'MANAUSDT', 'FXSUSDT', 'DYMUSDT', 'SUPERUSDT', 'SYSUSDT', 'SUSHIUSDT',
    'BATUSDT', 'CTSIUSDT', 'RAREUSDT', 'FIDAUSDT', 'VANRYUSDT', 'WUSDT', 'EGLDUSDT', 'REZUSDT', 'PHAUSDT', 'SYNUSDT',
    'CHRUSDT', 'AUCTIONUSDT', 'SNXUSDT', 'EDUUSDT', 'TNSRUSDT', 'XVGUSDT', 'GASUSDT', 'BICOUSDT','OGUSDT',
    'KAITOUSDT', 'CRVUSDT', 'TOWNSUSDT', 'CUSDT', 'RESOLVUSDT', 'PENGUUSDT', 'GPSUSDT', 'HEMIUSDT' , 'CAKEUSDT'];
const TIMEFRAMES_TO_CHECK = ['1h', '4h']; // Trailing Stop alerts are best on HTF
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
                const json = JSON.parse(data);
                resolve({ json: () => json, ok: true, text: () => data });
            } catch (e) {
                resolve({ text: () => data, ok: true, json: () => { throw new Error('Invalid JSON') } });
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
        'wavetrend-buy': 3066993,
        'wavetrend-confluence-buy': 3581519,
        'kiwi-hunt-buy': 5763719,
        'kiwi-hunt-crazy-buy': 15844367,
        'kiwi-hunt-buy-trend': 3581519,
        'price-golden-pocket': 16753920,
        'high-conviction-buy': 1420087,
        'significant-bullish-volume-spike': 15844367,
        'bullish-breakout-volume': 3581519,
    };
    const embed = {
        title: notification.title,
        description: notification.body,
        color: colorMap[notification.type] || 10070709,
        timestamp: new Date().toISOString(),
    };
    const payload = JSON.stringify({ embeds: [embed] });
    const payloadByteLength = Buffer.byteLength(payload, 'utf8');

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
const ema = (source, length) => {
    if (source.length === 0) return [];
    const alpha = 2 / (length + 1);
    const emaValues = [source[0]];
    for (let i = 1; i < source.length; i++) {
        emaValues.push(alpha * source[i] + (1 - alpha) * emaValues[i-1]);
    }
    return emaValues;
}

const sma = (source, length) => {
    if (source.length < length) return [];
    const smaValues = [];
    for (let i = length - 1; i < source.length; i++) {
        const sum = source.slice(i - length + 1, i + 1).reduce((acc, val) => acc + val, 0);
        smaValues.push(sum / length);
    }
    return smaValues;
};

const calculateRSI = (klines, length) => {
    const closes = klines.map(k => parseFloat(k[4]));
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
    return rsiValues.map((value, index) => ({ time: klines[length + index][0], value: value }));
};

const calculateSMA = (data, length) => {
    if (data.length < length) return [];
    const smaValues = [];
    for (let i = length - 1; i < data.length; i++) {
        const sum = data.slice(i - length + 1, i + 1).reduce((acc, point) => acc + point.value, 0);
        smaValues.push({ time: data[i].time, value: sum / length });
    }
    return smaValues;
};

const calculateStochRSI = (rsiData, rsiLength, stochLength, kSmooth, dSmooth) => {
    if (rsiData.length < rsiLength + stochLength) return { stochK: [], stochD: [] };
    const stochRsiValues = [];
    for (let i = stochLength - 1; i < rsiData.length; i++) {
        const rsiWindow = rsiData.slice(i - stochLength + 1, i + 1).map(p => p.value);
        const highestRsi = Math.max(...rsiWindow);
        const lowestRsi = Math.min(...rsiWindow);
        const stochRsi = (highestRsi - lowestRsi) === 0 ? 0 : (rsiData[i].value - lowestRsi) / (highestRsi - lowestRsi) * 100;
        stochRsiValues.push(stochRsi);
    }
    const kDataPoints = [];
    for(let i = kSmooth - 1; i < stochRsiValues.length; i++) {
        const kWindow = stochRsiValues.slice(i - kSmooth + 1, i + 1);
        kDataPoints.push({ time: rsiData[stochLength - 1 + i].time, value: kWindow.reduce((s, v) => s + v, 0) / kSmooth });
    }
    const dDataPoints = [];
    for(let i = dSmooth - 1; i < kDataPoints.length; i++) {
        const dWindow = kDataPoints.slice(i - dSmooth + 1, i + 1).map(p => p.value);
        dDataPoints.push({ time: kDataPoints[i].time, value: dWindow.reduce((s, v) => s + v, 0) / dSmooth });
    }
    return { stochK: kDataPoints, stochD: dDataPoints };
};

const calculateWaveTrend = (klines, chlen, avg, malen) => {
    if (klines.length < chlen + avg + malen) return { wt1: [], wt2: [] };
    const hlc3 = klines.map(k => (parseFloat(k[2]) + parseFloat(k[3]) + parseFloat(k[4])) / 3);
    const esa = ema(hlc3, chlen);
    const de = ema(hlc3.map((p, i) => Math.abs(p - esa[i])), chlen);
    const ci = hlc3.map((p, i) => de[i] !== 0 ? (p - esa[i]) / (0.015 * de[i]) : 0);
    const wt1_raw = ema(ci, avg);
    const wt2_raw = sma(wt1_raw, malen);
    const wt1_offset = ci.length - wt1_raw.length;
    const wt1 = wt1_raw.map((v, i) => ({ time: klines[wt1_offset + i][0], value: v }));
    const wt2_offset = wt1_raw.length - wt2_raw.length;
    const wt2 = wt2_raw.map((v, i) => ({ time: klines[wt1_offset + wt2_offset + i][0], value: v }));
    return { wt1, wt2 };
};

const calculateEOT = (closes, lpPeriod, k1) => {
    const alpha1 = (Math.cos(0.707 * 2 * Math.PI / 100) + Math.sin(0.707 * 2 * Math.PI / 100) - 1) / Math.cos(0.707 * 2 * Math.PI / 100);
    const a1 = Math.exp(-1.414 * Math.PI / lpPeriod), b1 = 2 * a1 * Math.cos(1.414 * Math.PI / lpPeriod);
    const c2 = b1, c3 = -a1 * a1, c1 = 1 - c2 - c3;
    let hp = [0, 0], filt = [0, 0], peak = [0];
    const quotient = [];
    for (let i = 2; i < closes.length; i++) {
        const newHp = (1 - alpha1 / 2) ** 2 * (closes[i] - 2 * closes[i - 1] + closes[i - 2]) + 2 * (1 - alpha1) * hp[1] - (1 - alpha1) ** 2 * hp[0];
        hp = [hp[1], newHp];
        const newFilt = c1 * (newHp + hp[0]) / 2 + c2 * filt[1] + c3 * filt[0];
        filt = [filt[1], newFilt];
        let newPeak = 0.991 * peak[0];
        if (Math.abs(newFilt) > newPeak) newPeak = Math.abs(newFilt);
        peak = [newPeak];
        let x = newPeak !== 0 ? newFilt / newPeak : 0;
        quotient.push((x + k1) / (k1 * x + 1));
    }
    return quotient;
};

const calculateKiwiHunt = (klines) => {
    if (klines.length < 50) return null;
    const closes = klines.map(k => k.close);
    const q1Raw = calculateEOT(closes, 6, 0);
    const triggerRaw = sma(q1Raw, 2);
    const q3Raw = calculateEOT(closes, 27, 0.8);
    const lag = closes.length - q1Raw.length;
    const q1 = q1Raw.map((v, i) => ({ time: klines[i + lag].time, value: v * 60 + 50 }));
    const triggerLag = q1Raw.length - triggerRaw.length;
    const trigger = triggerRaw.map((v, i) => ({ time: klines[i + lag + triggerLag].time, value: v * 60 + 50 }));
    const q3 = q3Raw.map((v, i) => ({ time: klines[i + lag].time, value: v * 60 + 50 }));
    return { q1, trigger, q3 };
};

const calculateFibLevels = (chartData) => {
    if (!chartData || chartData.length < 2) return { gp: null };
    let highestHigh = -Infinity, lowestLow = Infinity, highestHighIndex = -1, lowestLowIndex = -1;
    chartData.forEach((k, i) => {
        if (k.high > highestHigh) { highestHigh = k.high; highestHighIndex = i; }
        if (k.low < lowestLow) { lowestLow = k.low; lowestLowIndex = i; }
    });
    const range = highestHigh - lowestLow;
    if (range === 0) return { gp: null };
    let gpTop, gpBottom;
    if (lowestLowIndex < highestHighIndex) { // Uptrend
        gpTop = highestHigh - (range * 0.618);
        gpBottom = highestHigh - (range * 0.65);
    } else { // Downtrend
        gpTop = lowestLow + (range * 0.65);
        gpBottom = lowestLow + (range * 0.618);
    }
    return { gp: { top: Math.max(gpTop, gpBottom), bottom: Math.min(gpTop, gpBottom) }};
};

const getAverageVolume = (klines, period) => {
    if (klines.length < period) return 0;
    const window = klines.slice(-period);
    return window.reduce((sum, k) => sum + k.quoteVolume, 0) / window.length;
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

    // WaveTrend Alerts
    if (data.waveTrend1 && data.waveTrend1.length >= 2 && data.waveTrend2 && data.waveTrend2.length >= 2) {
        const lastWt1 = data.waveTrend1[data.waveTrend1.length - 1], prevWt1 = data.waveTrend1[data.waveTrend1.length - 2];
        const lastWt2 = data.waveTrend2[data.waveTrend2.length - 1], prevWt2 = data.waveTrend2[data.waveTrend2.length - 2];
        const isBullishCross = lastWt1.value > lastWt2.value && prevWt1.value <= prevWt2.value;
        if (isBullishCross && lastWt2.value < -53 && canFire('wavetrend-confluence-buy')) {
            addAlert('wavetrend-confluence-buy', `${symbol} WaveTrend Confluence Buy (${timeframe})`, `Bullish cross while WT is oversold at ${lastWt2.value.toFixed(2)}.`);
        }
        let buyThreshold = timeframe === '1h' ? -50 : -45;
        if (lastWt2.value < buyThreshold && prevWt2.value >= buyThreshold && canFire('wavetrend-buy')) {
            addAlert('wavetrend-buy', `${symbol} WaveTrend Buy (${timeframe})`, `WaveTrend entered extreme oversold at ${lastWt2.value.toFixed(2)}.`);
        }
    }

    // KiwiHunt Alerts
    if (data.kiwiHunt?.q1?.length >= 2 && data.kiwiHunt?.trigger?.length >= 2) {
        const { q1, trigger, q3 } = data.kiwiHunt;
        const lastQ1 = q1[q1.length - 1], prevQ1 = q1[q1.length - 2];
        const lastTrigger = trigger.find(p => p.time === lastQ1.time), prevTrigger = trigger.find(p => p.time === prevQ1.time);
        const lastQ3 = q3.find(p => p.time === lastQ1.time);
        if (lastTrigger && prevTrigger && lastQ3) {
            const isBullishCross = prevQ1.value <= prevTrigger.value && lastQ1.value > currentTrigger.value;
            if (isBullishCross && lastQ1.value <= 20 && lastQ3.value <= -4 && canFire('kiwi-hunt-buy')) {
                addAlert('kiwi-hunt-buy', `${symbol} KiwiHunt: Hunt Buy (${timeframe})`, 'Highest quality buy signal detected.');
            }
            if (isBullishCross && lastQ3.value <= -4 && canFire('kiwi-hunt-crazy-buy')) {
                addAlert('kiwi-hunt-crazy-buy', `${symbol} KiwiHunt: Crazy Buy (${timeframe})`, 'Strength from weakness signal detected.');
            }
            const stateKey = `${symbol}-${timeframe}-kh-cont-state`;
            let inPullback = states[stateKey] || false;
            if (lastQ1.value < 40) inPullback = true;
            if (inPullback && isBullishCross && lastQ1.value > 50 && canFire('kiwi-hunt-buy-trend')) {
                addAlert('kiwi-hunt-buy-trend', `${symbol} KiwiHunt: Buy Trend (${timeframe})`, 'Trend continuation signal detected.');
                inPullback = false;
            }
            if (lastQ1.value > 80) inPullback = false;
            states[stateKey] = inPullback;
        }
    }
    
    // Price in Golden Pocket
    const { gp } = calculateFibLevels(data.klines);
    if (gp) {
        const isInGp = lastKline.close >= gp.bottom && lastKline.close <= gp.top;
        const key = `${symbol}-${timeframe}-in-gp`;
        if (isInGp && !states[key] && canFire('price-golden-pocket')) {
            addAlert('price-golden-pocket', `${symbol} Price in Golden Pocket (${timeframe})`, `Price ${lastKline.close.toFixed(4)} entered GP ($${gp.bottom.toFixed(4)} - $${gp.top.toFixed(4)}).`);
        }
        states[key] = isInGp;
    }

    // Volume Alerts
    const lookbackKlines = data.klines.slice(0, -1);
    const avgVolume = getAverageVolume(lookbackKlines, 20);
    if (avgVolume > 0) {
        if (lastKline.quoteVolume > avgVolume * 2.5 && canFire('significant-volume-spike')) {
            if (lastKline.close > lastKline.open) {
                addAlert('significant-bullish-volume-spike', `${symbol} Bullish Volume Spike (${timeframe})`, `Volume ${formatUsdValue(lastKline.quoteVolume)} is >250% of 20-period average.`);
            }
        }
        if (lookbackKlines.length >= 20) {
            const rangeKlines = lookbackKlines.slice(-20);
            const highestHigh = Math.max(...rangeKlines.map(k => k.high));
            if (lastKline.quoteVolume > avgVolume * 1.5 && lastKline.close > highestHigh && canFire('bullish-breakout-volume')) {
                addAlert('bullish-breakout-volume', `${symbol} Bullish Breakout Confirmation (${timeframe})`, `Broke ${settings.candlesDisplayed}-candle range on high volume.`);
            }
        }
    }
    
    // High Conviction Buy (simplified for script)
    if (data.priceSma50 && data.stochK?.length > 0 && data.waveTrend2?.length > 0) {
        const isStochOversold = data.stochK[data.stochK.length - 1].value < 25;
        const lastWt2 = data.waveTrend2[data.waveTrend2.length - 1].value;
        const lastSma50 = data.priceSma50[data.priceSma50.length - 1]?.value;
        if (isStochOversold && lastWt2 < -55 && lastSma50 && lastKline.close > lastSma50 && canFire('high-conviction-buy')) {
             addAlert('high-conviction-buy', `${symbol} High-Conviction Buy (${timeframe})`, `Deep reversal signal with Stoch/WT/SMA confirmation at $${lastKline.close.toFixed(4)}.`);
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
        console.warn("JSONBIN credentials not set. State will not be saved.");
    }

    const alertStates = await loadState();
    const now = Date.now();

    for (const symbol of SYMBOLS_TO_CHECK) {
        for (const timeframe of TIMEFRAMES_TO_CHECK) {
            try {
                console.log(`--------------------------------\nProcessing ${symbol} on ${timeframe}...`);
                const klinesRaw = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${timeframe}&limit=300`).then(res => res.json());
                if (!Array.isArray(klinesRaw) || klinesRaw.length < 100) {
                    console.log(`Skipping ${symbol} on ${timeframe} due to insufficient kline data (${klinesRaw.length || 0}).`);
                    continue;
                }

                const klines = klinesRaw.map(k => ({ time: k[0], open: parseFloat(k[1]), high: parseFloat(k[2]), low: parseFloat(k[3]), close: parseFloat(k[4]), volume: parseFloat(k[5]), quoteVolume: parseFloat(k[7]), takerBuyVolume: parseFloat(k[9]), takerBuyQuoteVolume: parseFloat(k[10]) }));
                const rsiData = calculateRSI(klinesRaw, 14);
                const priceObjectsForSma = klines.map(p => ({ time: p.time, value: p.close }));

                const data = {
                    klines,
                    rsi: rsiData,
                    stochK: calculateStochRSI(rsiData, 14, 14, 3, 3).stochK,
                    waveTrend1: calculateWaveTrend(klinesRaw, 9, 12, 3).wt1,
                    waveTrend2: calculateWaveTrend(klinesRaw, 9, 12, 3).wt2,
                    priceSma50: calculateSMA(priceObjectsForSma, 50),
                    kiwiHunt: calculateKiwiHunt(klines)
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
