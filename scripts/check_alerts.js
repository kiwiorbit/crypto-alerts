// A self-contained Node.js script to check for specific crypto alerts and send them to Discord.
// This runs in a cloud environment (like Render Cron Jobs), independent of the browser app.

import https from 'https';
import { fileURLToPath } from 'url';

// --- CONFIGURATION ---
const SYMBOLS_TO_CHECK = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'WLDUSDT', 'DOGEUSDT', 'BNBUSDT', 'XRPUSDT', 'ENAUSDT', 'AVAXUSDT'];
const TIMEFRAMES_TO_CHECK = ['15m', '1h', '4h'];
const { DISCORD_WEBHOOK_URL, JSONBIN_API_KEY, JSONBIN_BIN_ID } = process.env;

const ALERT_COOLDOWN = 3 * 60 * 60 * 1000; // 3 hours

// --- Simple Fetch Implementation for Node.js ---
const fetch = (url, options = {}) => new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search, // FIX: Include query parameters
        method: options.method || 'GET',
        headers: options.headers || {},
    };

    const req = https.request(reqOptions, (res) => {
        // Immediately reject on non-2xx status codes for easier error handling
        if (res.statusCode < 200 || res.statusCode >= 300) {
            let errorData = '';
            res.on('data', chunk => errorData += chunk);
            res.on('end', () => {
                 reject(new Error(`Request Failed. Status Code: ${res.statusCode}. Body: ${errorData}`));
            });
            return;
        }

        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            try {
                // Assume JSON, but fall back to text if parsing fails
                resolve({ json: () => JSON.parse(data), ok: true });
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
        return data.record || {};
    } catch (e) {
        console.error("Could not load state from JSONBin, starting fresh.", e.message);
        return {};
    }
};

const saveState = async (state) => {
    if (!JSONBIN_API_KEY || !JSONBIN_BIN_ID) return;
    try {
        const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_API_KEY
            },
            body: JSON.stringify(state)
        });
        if (!res.ok) {
           console.error("Failed to save state to JSONBin.");
        }
    } catch (e) {
        console.error("Error saving state to JSONBin:", e.message);
    }
};

// --- Discord Webhook Sender ---
const sendDiscordWebhook = (notification) => {
    const colorMap = {
        'wavetrend-buy': 3066993, 'wavetrend-confluence-buy': 3581519,
        'kiwi-hunt-buy': 12745742, 'kiwi-hunt-crazy-buy': 16705372, 'kiwi-hunt-buy-trend': 3447003,
        'price-golden-pocket': 16753920,
        'luxalgo-bullish-flip': 3066993, 'luxalgo-bearish-flip': 15158332,
        'significant-bullish-volume-spike': 15844367,
        'bullish-breakout-volume': 3581519,
        'high-conviction-buy': 2523880,
    };
    const embed = {
        title: `${notification.icon} ${notification.title}`,
        description: notification.body,
        color: colorMap[notification.type] || 10070709,
        timestamp: new Date().toISOString(),
    };
    const payload = JSON.stringify({ embeds: [embed] });
    const url = new URL(DISCORD_WEBHOOK_URL);
    const options = {
        hostname: url.hostname, path: url.pathname, method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': payload.length }
    };
    const req = https.request(options, res => console.log(`Discord response: ${res.statusCode}`));
    req.on('error', e => console.error(`Error sending webhook: ${e.message}`));
    req.write(payload);
    req.end();
    console.log(`Sent Discord notification for ${notification.title}.`);
};

// --- INDICATOR CALCULATION LOGIC (Copied & adapted from the app) ---
const sma = (source, length) => {
    const useLength = Math.min(source.length, length);
    if (useLength === 0) return 0;
    const series = source.slice(-useLength);
    return series.reduce((a, b) => a + b, 0) / useLength;
};

const stdev = (source, length) => {
    const useLength = Math.min(source.length, length);
    if (useLength < 1) return 0;
    const series = source.slice(-useLength);
    const mean = sma(series, useLength);
    const variance = series.reduce((a, b) => a + (b - mean) ** 2, 0) / useLength;
    return Math.sqrt(variance);
};

const ema = (source, length) => {
    const alpha = 2 / (length + 1);
    const emaValues = [source[0]];
    for (let i = 1; i < source.length; i++) {
        emaValues.push(alpha * source[i] + (1 - alpha) * emaValues[i-1]);
    }
    return emaValues;
};

const calculateWaveTrend = (klines, chlen = 9, avg = 12, malen = 3) => {
    if (klines.length < chlen + avg + malen) return { wt1: [], wt2: [] };
    const hlc3 = klines.map(k => (k.high + k.low + k.close) / 3);
    const esa = ema(hlc3, chlen);
    const de = ema(hlc3.map((p, i) => Math.abs(p - esa[i])), chlen);
    const ci = hlc3.map((p, i) => de[i] !== 0 ? (p - esa[i]) / (0.015 * de[i]) : 0);
    const wt1_raw = ema(ci, avg);
    const wt2_raw = sma(wt1_raw, malen);
    const wt1_offset = ci.length - wt1_raw.length;
    const wt2_offset = wt1_raw.length - wt2_raw.length;
    return {
        wt1: wt1_raw.map((value, index) => ({ time: klines[wt1_offset + index].time, value })),
        wt2: wt2_raw.map((value, index) => ({ time: klines[wt1_offset + wt2_offset + index].time, value })),
    };
};

const calculateKiwiHunt = (klines) => {
    if (klines.length < 50) return null;
    const closes = klines.map(k => k.close);
    const calculateEOT = (src, lpPeriod, k1) => {
        const alpha1 = (Math.cos(0.707 * 2 * Math.PI / 100) + Math.sin(0.707 * 2 * Math.PI / 100) - 1) / Math.cos(0.707 * 2 * Math.PI / 100);
        const a1 = Math.exp(-1.414 * Math.PI / lpPeriod);
        const b1 = 2 * a1 * Math.cos(1.414 * Math.PI / lpPeriod);
        const [c1, c2, c3] = [1 - b1 - (-a1 * a1), b1, -a1 * a1];
        let [hp, filt, peak, quotient] = [[0, 0], [0, 0], [0], []];
        for (let i = 2; i < src.length; i++) {
            const newHp = (1 - alpha1 / 2) ** 2 * (src[i] - 2 * src[i - 1] + src[i - 2]) + 2 * (1 - alpha1) * hp[1] - (1 - alpha1) ** 2 * hp[0];
            hp = [hp[1], newHp];
            const newFilt = c1 * (newHp + hp[0]) / 2 + c2 * filt[1] + c3 * filt[0];
            filt = [filt[1], newFilt];
            let newPeak = Math.abs(newFilt) > 0.991 * peak[0] ? Math.abs(newFilt) : 0.991 * peak[0];
            peak = [newPeak];
            let x = newPeak !== 0 ? newFilt / newPeak : 0;
            quotient.push((x + k1) / (k1 * x + 1));
        }
        return quotient;
    };
    const q1Raw = calculateEOT(closes, 6, 0);
    const triggerRaw = sma(q1Raw, 2);
    const q3Raw = calculateEOT(closes, 27, 0.8);
    const lag = closes.length - q1Raw.length;
    const triggerLag = q1Raw.length - triggerRaw.length;
    return {
        q1: q1Raw.map((v, i) => ({ time: klines[i + lag].time, value: v * 60 + 50 })),
        trigger: triggerRaw.map((v, i) => ({ time: klines[i + lag + triggerLag].time, value: v * 60 + 50 })),
        q3: q3Raw.map((v, i) => ({ time: klines[i + lag].time, value: v * 60 + 50 })),
    };
};

const calculateStatisticalTrailingStop = (klines, dataLength = 1, distributionLength = 10) => {
    if (klines.length < distributionLength + dataLength + 2) return [];
    const logTrueRanges = [];
    for (let i = 0; i < klines.length; i++) {
        if (i < dataLength + 1) { logTrueRanges.push(null); continue; }
        const highSeries = klines.slice(i - dataLength + 1, i + 1).map(k => k.high);
        const lowSeries = klines.slice(i - dataLength + 1, i + 1).map(k => k.low);
        const tr = Math.max(Math.max(...highSeries) - Math.min(...lowSeries), Math.abs(Math.max(...highSeries) - klines[i - dataLength - 1].close), Math.abs(Math.min(...lowSeries) - klines[i - dataLength - 1].close));
        logTrueRanges.push(tr > 0 ? Math.log(tr) : null);
    }
    const results = [];
    let currentTrail = null;
    for (let i = 0; i < klines.length; i++) {
        if (i < distributionLength -1) { results.push({ time: klines[i].time, bias: 0, level: 0 }); continue; }
        const logTrWindow = logTrueRanges.slice(i - distributionLength + 1, i + 1).filter(v => v !== null);
        let delta;
        if (logTrWindow.length > 1) {
            delta = Math.exp(sma(logTrWindow, distributionLength) + 2 * stdev(logTrWindow, distributionLength));
        } else if (currentTrail) {
            delta = currentTrail.delta;
        } else {
            results.push({ time: klines[i].time, bias: 0, level: 0 }); continue;
        }
        const kline = klines[i];
        const hlc3 = (kline.high + kline.low + kline.close) / 3;
        if (currentTrail === null) {
            currentTrail = { bias: 0, delta, level: hlc3 + delta };
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

// --- Main Alert Checking Logic ---
const checkAlerts = (symbol, timeframe, data, states, now) => {
    const alerts = [];
    const canFire = (type) => !states[`${symbol}-${timeframe}-${type}`] || now - states[`${symbol}-${timeframe}-${type}`] > ALERT_COOLDOWN;
    const addAlert = (type, title, body, icon) => {
        alerts.push({ type, title, body, icon });
        states[`${symbol}-${timeframe}-${type}`] = now;
    };

    const klines = data.klines;
    const lastKline = klines[klines.length - 1];

    // WaveTrend Alerts
    if (data.waveTrend1 && data.waveTrend1.length >= 2 && data.waveTrend2 && data.waveTrend2.length >= 2) {
        const lastWt1 = data.waveTrend1[data.waveTrend1.length - 1];
        const prevWt1 = data.waveTrend1[data.waveTrend1.length - 2];
        const lastWt2 = data.waveTrend2[data.waveTrend2.length - 1];
        const prevWt2 = data.waveTrend2[data.waveTrend2.length - 2];
        if (isFinite(lastWt1.value) && isFinite(prevWt1.value) && isFinite(lastWt2.value) && isFinite(prevWt2.value)) {
            const isBullishCross = lastWt1.value > lastWt2.value && prevWt1.value <= prevWt2.value;
            if (isBullishCross && lastWt2.value < -53 && canFire('wavetrend-confluence-buy')) {
                addAlert('wavetrend-confluence-buy', `WaveTrend Confluence Buy`, `${symbol} (${timeframe}) crossed up from oversold.`, '✅');
            }
            let buyThreshold = timeframe === '1h' ? -50 : -45;
            if (lastWt2.value < buyThreshold && prevWt2.value >= buyThreshold && canFire('wavetrend-buy')) {
                addAlert('wavetrend-buy', `WaveTrend Buy`, `${symbol} (${timeframe}) entered extreme oversold.`, '💧');
            }
        }
    }

    // KiwiHunt Alerts
    if (data.kiwiHunt) {
        const { q1, trigger, q3 } = data.kiwiHunt;
        if (q1.length >= 2 && trigger.length >= 2 && q3.length >= 1) {
            const lastQ1 = q1[q1.length - 1], prevQ1 = q1[q1.length - 2];
            const lastTrigger = trigger.find(p => p.time === lastQ1.time), prevTrigger = trigger.find(p => p.time === prevQ1.time);
            const lastQ3 = q3.find(p => p.time === lastQ1.time);
            if (lastTrigger && prevTrigger && lastQ3) {
                const isBullishCross = prevQ1.value <= prevTrigger.value && lastQ1.value > lastTrigger.value;
                if (isBullishCross && lastQ1.value <= 20 && lastQ3.value <= -4 && canFire('kiwi-hunt-buy')) {
                    addAlert('kiwi-hunt-buy', 'KiwiHunt: Hunt Buy', `${symbol} (${timeframe}) Hunt signal detected.`, '🚀');
                }
                if (isBullishCross && lastQ3.value <= -4 && canFire('kiwi-hunt-crazy-buy')) {
                    addAlert('kiwi-hunt-crazy-buy', 'KiwiHunt: Crazy Buy', `${symbol} (${timeframe}) Crazy signal detected.`, '⚡️');
                }
                const stateKey = `${symbol}-${timeframe}-kh-cont-state`;
                let inPullback = states[stateKey] || false;
                if (lastQ1.value < 40) inPullback = true;
                if (inPullback && isBullishCross && lastQ1.value > 50 && canFire('kiwi-hunt-buy-trend')) {
                    addAlert('kiwi-hunt-buy-trend', 'KiwiHunt: Buy Trend', `${symbol} (${timeframe}) Buy trend signal detected.`, '▶️');
                    inPullback = false;
                }
                if (lastQ1.value > 80) inPullback = false;
                states[stateKey] = inPullback;
            }
        }
    }

    // Golden Pocket Alert
    let highestHigh = -Infinity, lowestLow = Infinity, highestHighIndex = -1, lowestLowIndex = -1;
    klines.forEach((k, index) => {
        if (k.high > highestHigh) { highestHigh = k.high; highestHighIndex = index; }
        if (k.low < lowestLow) { lowestLow = k.low; lowestLowIndex = index; }
    });
    const range = highestHigh - lowestLow;
    if (range > 0) {
        const isUptrend = lowestLowIndex < highestHighIndex;
        const gpTop = isUptrend ? highestHigh - (range * 0.618) : lowestLow + (range * 0.65);
        const gpBottom = isUptrend ? highestHigh - (range * 0.65) : lowestLow + (range * 0.618);
        const stateKey = `${symbol}-${timeframe}-gp-state`;
        const wasInGp = states[stateKey] || false;
        const isInGp = lastKline.close >= Math.min(gpTop, gpBottom) && lastKline.close <= Math.max(gpTop, gpBottom);
        if (isInGp && !wasInGp && canFire('price-golden-pocket')) {
            addAlert('price-golden-pocket', 'Price in Golden Pocket', `${symbol} (${timeframe}) has entered the GP.`, '🧲');
        }
        states[stateKey] = isInGp;
    }

    // Trailing Stop Flips
    if (data.luxalgoTrail && data.luxalgoTrail.length >= 2) {
        const lastTrail = data.luxalgoTrail[data.luxalgoTrail.length - 1];
        const prevTrail = data.luxalgoTrail[data.luxalgoTrail.length - 2];
        if (prevTrail.bias === 0 && lastTrail.bias === 1 && canFire('luxalgo-bullish-flip')) {
            addAlert('luxalgo-bullish-flip', `${symbol} Bullish Flip (${timeframe})`, `Trailing stop flipped to Bullish.`, '🔄');
        }
        if (prevTrail.bias === 1 && lastTrail.bias === 0 && canFire('luxalgo-bearish-flip')) {
            addAlert('luxalgo-bearish-flip', `${symbol} Bearish Flip (${timeframe})`, `Trailing stop flipped to Bearish.`, '🔄');
        }
    }
    
    // Volume Alerts
    const avgVolume = sma(klines.slice(0, -1).map(k=>k.quoteVolume), 20);
    if (avgVolume > 0) {
        if (lastKline.quoteVolume > avgVolume * 2.5 && canFire('significant-volume-spike')) {
            addAlert('significant-bullish-volume-spike', `Volume Spike`, `${symbol} (${timeframe}) saw a significant volume spike.`, '⚡️');
        }
        const rangeKlines = klines.slice(-21, -1);
        if (rangeKlines.length >= 20) {
            const highestHigh = Math.max(...rangeKlines.map(k => k.high));
            if (lastKline.quoteVolume > avgVolume * 1.5 && lastKline.close > highestHigh && canFire('bullish-breakout-volume')) {
                addAlert('bullish-breakout-volume', `Bullish Breakout`, `${symbol} (${timeframe}) broke resistance on high volume.`, '🚀');
            }
        }
    }
    
    // High-Conviction Buy (simplified for server-side)
    if (data.waveTrend1 && data.stochK && data.priceSma50) {
        const lastStochK = data.stochK[data.stochK.length - 1];
        if (lastStochK.value < 25) {
            const lastWt2 = data.waveTrend2[data.waveTrend2.length-1];
            const lastSma50 = data.priceSma50.find(p=>p.time === lastKline.time)?.value;
            if (lastWt2 && lastSma50 && lastWt2.value < -55 && lastKline.close > lastSma50 && canFire('high-conviction-buy')) {
                 addAlert('high-conviction-buy', 'High-Conviction Buy', `${symbol} (${timeframe}) meets deep reversal criteria.`, '💎');
            }
        }
    }

    return alerts;
};

// --- Main Execution ---
const main = async () => {
    if (!DISCORD_WEBHOOK_URL) {
        console.error("DISCORD_WEBHOOK_URL is not set! Please add it as an environment variable.");
        return;
    }
    if (!JSONBIN_API_KEY || !JSONBIN_BIN_ID) {
        console.error("JSONBIN_API_KEY or JSONBIN_BIN_ID is not set! Please add them as environment variables.");
        return;
    }

    const alertStates = await loadState();
    const now = Date.now();

    for (const symbol of SYMBOLS_TO_CHECK) {
        for (const timeframe of TIMEFRAMES_TO_CHECK) {
            try {
                console.log(`Processing ${symbol} on ${timeframe}...`);
                const klinesRaw = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${timeframe}&limit=300`).then(res => res.json());
                const klines = klinesRaw.map(k => ({ time: k[0], open: parseFloat(k[1]), high: parseFloat(k[2]), low: parseFloat(k[3]), close: parseFloat(k[4]), volume: parseFloat(k[5]), quoteVolume: parseFloat(k[7]), takerBuyQuoteVolume: parseFloat(k[10]) }));

                if (klines.length < 50) continue;

                const priceObjectsForSma = klines.map(p => ({ time: p.time, value: p.close }));

                // Calculate all necessary indicators
                const data = {
                    klines,
                    waveTrend1: calculateWaveTrend(klines).wt1,
                    waveTrend2: calculateWaveTrend(klines).wt2,
                    kiwiHunt: calculateKiwiHunt(klines),
                    luxalgoTrail: calculateStatisticalTrailingStop(klines),
                    stochK: [], // Add stoch/sma if needed by alerts
                    priceSma50: sma(priceObjectsForSma.map(p=>p.value), 50).map((v, i) => ({time: priceObjectsForSma[i+49].time, value: v})),
                };

                const firedAlerts = checkAlerts(symbol, timeframe, data, alertStates, now);
                firedAlerts.forEach(sendDiscordWebhook);

            } catch (error) {
                console.error(`Error processing ${symbol} on ${timeframe}:`, error.message);
            }
        }
    }
 
    await saveState(alertStates);
    console.log("All checks complete.");
};

main();
