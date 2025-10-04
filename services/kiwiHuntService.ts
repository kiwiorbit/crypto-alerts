import type { PriceDataPoint, KiwiHuntResult, RsiDataPoint } from '../types';

// Helper to handle Pine Script's nz() function
const nz = (value: number | undefined, replacement = 0) => (value === undefined || isNaN(value) ? replacement : value);

const sma = (source: number[], length: number): number[] => {
    if (source.length < length) return [];
    const smaValues: number[] = [];
    for (let i = length - 1; i < source.length; i++) {
        const sum = source.slice(i - length + 1, i + 1).reduce((acc, val) => acc + val, 0);
        smaValues.push(sum / length);
    }
    return smaValues;
};

// Main calculation function for a single EOT oscillator
const calculateEOT = (closes: number[], lpPeriod: number, k1: number) => {
    const alpha1 = (Math.cos(0.707 * 2 * Math.PI / 100) + Math.sin(0.707 * 2 * Math.PI / 100) - 1) / Math.cos(0.707 * 2 * Math.PI / 100);
    const a1 = Math.exp(-1.414 * Math.PI / lpPeriod);
    const b1 = 2 * a1 * Math.cos(1.414 * Math.PI / lpPeriod);
    const c2 = b1;
    const c3 = -a1 * a1;
    const c1 = 1 - c2 - c3;
    
    let hp: number[] = [0, 0];
    let filt: number[] = [0, 0];
    let peak: number[] = [0];
    const quotient: number[] = [];

    for (let i = 2; i < closes.length; i++) {
        const newHp = (1 - alpha1 / 2) ** 2 * (closes[i] - 2 * closes[i - 1] + closes[i - 2]) + 2 * (1 - alpha1) * hp[1] - (1 - alpha1) ** 2 * hp[0];
        hp = [hp[1], newHp];
        
        const newFilt = c1 * (newHp + hp[0]) / 2 + c2 * filt[1] + c3 * filt[0];
        filt = [filt[1], newFilt];

        let newPeak = 0.991 * peak[0];
        if (Math.abs(newFilt) > newPeak) {
            newPeak = Math.abs(newFilt);
        }
        peak = [newPeak];

        let x = 0;
        if (newPeak !== 0) {
            x = newFilt / newPeak;
        }
        
        quotient.push((x + k1) / (k1 * x + 1));
    }
    return quotient;
};

export const calculateKiwiHunt = (klines: PriceDataPoint[]): KiwiHuntResult | null => {
    if (klines.length < 50) return null; // Need enough data for calculations
    const closes = klines.map(k => k.close);

    // EOT 1 (Main Oscillator)
    const q1Raw = calculateEOT(closes, 6, 0);
    const triggerRaw = sma(q1Raw, 2);

    // EOT 2 (Red Wave)
    const q3Raw = calculateEOT(closes, 27, 0.8);

    // EOT 3 (Yellow Line)
    const q5Raw = calculateEOT(closes, 11, 0.99);

    // Align data with timestamps. All calculations introduce lag.
    const lag = closes.length - q1Raw.length;
    const q1: RsiDataPoint[] = q1Raw.map((value, index) => ({ time: klines[index + lag].time, value: value * 60 + 50 }));
    
    const triggerLag = q1Raw.length - triggerRaw.length;
    const trigger: RsiDataPoint[] = triggerRaw.map((value, index) => ({ time: klines[index + lag + triggerLag].time, value: value * 60 + 50 }));
    
    const q3: RsiDataPoint[] = q3Raw.map((value, index) => ({ time: klines[index + lag].time, value: value * 60 + 50 }));
    const q5: RsiDataPoint[] = q5Raw.map((value, index) => ({ time: klines[index + lag].time, value: value * 60 + 50 }));
    
    return { q1, trigger, q3, q5 };
};