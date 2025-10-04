// A self-contained Node.js script to check for specific crypto alerts and send them to Discord.
// This runs in a cloud environment (like Render Cron Jobs), independent of the browser app.

import https from 'https';
import { fileURLToPath } from 'url';

// --- CONFIGURATION ---
const SYMBOLS_TO_CHECK = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'WLDUSDT', 'DOGEUSDT', 'BNBUSDT', 'XRPUSDT', 'ENAUSDT', 'AVAXUSDT', 'SUIUSDT', 'ADAUSDT', 'TRXUSDT', 'LINKUSDT', 'ARBUSDT','PYTHUSDT', 'ATOMUSDT', 'FILUSDT', 'XLMUSDT',
    'BCHUSDT', 'ETCUSDT', 'VIRTUALUSDT', 'SEIUSDT', 'DOTUSDT', 'UNIUSDT', 'NEARUSDT', 'TAOUSDT', 'HBARUSDT', 'LINEAUSDT',
    'TIAUSDT', 'ETHFIUSDT', 'FETUSDT', 'APTUSDT', 'LDOUSDT', 'TONUSDT', 'RAYUSDT', 'PENDLEUSDT', 'SOMIUSDT', 'DIAUSDT',
    'BIOUSDT', 'RENDERUSDT', 'CGPTUSDT', 'CFXUSDT', 'JUPUSDT', 'BERAUSDT', 'GALAUSDT', 'GRTUSDT', 'SFPUSDT','LPTUSDT',
    'ALGOUSDT', 'ROSEUSDT', 'AIXBTUSDT', 'ENSUSDT', 'VETUSDT', 'RUNEUSDT', 'BLURUSDT', 'STRKUSDT', 'PORTALUSDT', 'PIXELUSDT',
    'STXUSDT', 'ZROUSDT', 'QNTUSDT', 'NEOUSDT', 'AXSUSDT', 'HYPERUSDT', 'RSRUSDT', 'SAGAUSDT', 'MOVEUSDT', 'NMRUSDT',
    'SANDUSDT', 'YGGUSDT', 'JTOUSDT', 'XAIUSDT', 'API3USDT', 'FIOUSDT', 'IOTAUSDT', 'TRBUSDT', 'APEUSDT',
    'BEAMXUSDT', 'THETAUSDT', 'CHZUSDT', 'ZECUSDT', 'MANAUSDT', 'FXSUSDT', 'DYMUSDT', 'SUPERUSDT', 'SYSUSDT', 'SUSHIUSDT',
    'BATUSDT', 'CTSIUSDT', 'RAREUSDT', 'FIDAUSDT', 'VANRYUSDT', 'WUSDT', 'EGLDUSDT', 'REZUSDT', 'PHAUSDT', 'SYNUSDT',
    'CHRUSDT', 'AUCTIONUSDT', 'SNXUSDT', 'EDUUSDT', 'TNSRUSDT', 'XVGUSDT', 'GASUSDT', 'BICOUSDT','OGUSDT',
    'KAITOUSDT', 'CRVUSDT', 'TOWNSUSDT', 'CUSDT', 'RESOLVUSDT', 'PENGUUSDT', 'GPSUSDT', 'HEMIUSDT' , 'CAKEUSDT'];
const TIMEFRAMES_TO_CHECK = ['1h', '4h', '1d']; // Trailing Stop alerts are best on HTF
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
        'luxalgo-bullish-flip': 3066993, // Green
        'luxalgo-bearish-flip': 15158332, // Red
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
const sma = (source, length) => {
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
    const mean = sma(series, useLength)[0];
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
            const avg = sma(logTrWindow, distributionLength)[0];
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
    const addAlert = (type, title, body, icon) => {
        console.log(`[ALERT PREPARED] ${title}: ${body}`);
        alerts.push({ type, title, body, icon });
        states[`${symbol}-${timeframe}-${type}`] = now;
    };

    const lastKline = data.klines[data.klines.length - 1];

    // --- ONLY TRAILING STOP ALERTS ARE ACTIVE ---
    if (data.luxalgoTrail && data.luxalgoTrail.length >= 2) {
        const lastTrail = data.luxalgoTrail[data.luxalgoTrail.length - 1];
        const prevTrail = data.luxalgoTrail[data.luxalgoTrail.length - 2];
        const BULLISH = 1;
        const BEARISH = 0;

        if (prevTrail.bias === BEARISH && lastTrail.bias === BULLISH && canFire('luxalgo-bullish-flip')) {
            addAlert('luxalgo-bullish-flip',
                `${symbol} Bullish Flip (${timeframe})`,
                `Trailing stop flipped to Bullish at $${lastKline.close.toFixed(4)}`,
                '🔄');
        }

        if (prevTrail.bias === BULLISH && lastTrail.bias === BEARISH && canFire('luxalgo-bearish-flip')) {
             addAlert('luxalgo-bearish-flip',
                `${symbol} Bearish Flip (${timeframe})`,
                `Trailing stop flipped to Bearish at $${lastKline.close.toFixed(4)}`,
                '🔄');
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

                if (klines.length < 50) {
                    console.log(`Skipping ${symbol} on ${timeframe} due to insufficient kline data (${klines.length}).`);
                    continue;
                }
                
                const data = {
                    klines,
                    luxalgoTrail: calculateStatisticalTrailingStop(klines),
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
