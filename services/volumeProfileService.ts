import type { PriceDataPoint, VolumeProfileData } from '../types';

export const calculateVolumeProfile = (klines: PriceDataPoint[], numBuckets: number = 50): VolumeProfileData | null => {
    if (klines.length === 0) return null;

    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let totalVolume = 0;

    klines.forEach(k => {
        if (k.low < minPrice) minPrice = k.low;
        if (k.high > maxPrice) maxPrice = k.high;
        totalVolume += k.volume;
    });

    if (minPrice === Infinity || minPrice === maxPrice) return null; // No data or no price range

    const bucketSize = (maxPrice - minPrice) / numBuckets;
    const buckets = Array.from({ length: numBuckets }, (_, i) => ({
        price: minPrice + i * bucketSize,
        volume: 0,
        buyVolume: 0,
        sellVolume: 0,
    }));

    klines.forEach(kline => {
        const startBucketIndex = Math.max(0, Math.floor((kline.low - minPrice) / bucketSize));
        const endBucketIndex = Math.min(numBuckets - 1, Math.floor((kline.high - minPrice) / bucketSize));
        
        const numBucketsForKline = (endBucketIndex - startBucketIndex) + 1;
        if (numBucketsForKline <= 0 || kline.volume === 0) return;

        const volumePerBucket = kline.volume / numBucketsForKline;
        const buyRatio = kline.takerBuyVolume / kline.volume;
        
        const buyVolumePerBucket = isNaN(buyRatio) ? 0 : volumePerBucket * buyRatio;
        const sellVolumePerBucket = isNaN(buyRatio) ? 0 : volumePerBucket * (1 - buyRatio);

        for (let i = startBucketIndex; i <= endBucketIndex; i++) {
            if(buckets[i]) {
                buckets[i].volume += volumePerBucket;
                buckets[i].buyVolume += buyVolumePerBucket;
                buckets[i].sellVolume += sellVolumePerBucket;
            }
        }
    });

    const maxVolume = Math.max(...buckets.map(b => b.volume), 0);
    
    if (totalVolume === 0) {
         return {
            profile: buckets,
            poc: (minPrice + maxPrice) / 2,
            vah: maxPrice,
            val: minPrice,
            maxVolume,
            minPrice,
            maxPrice,
        };
    }
    
    const pocIndex = buckets.reduce((maxIndex, b, i, arr) => b.volume > arr[maxIndex].volume ? i : maxIndex, 0);
    const poc = buckets[pocIndex].price + bucketSize / 2;
    
    // Calculate Value Area (70% of volume)
    const valueAreaThreshold = totalVolume * 0.7;
    let currentVolume = buckets[pocIndex].volume;
    let topIndex = pocIndex;
    let bottomIndex = pocIndex;
    
    while (currentVolume < valueAreaThreshold && (bottomIndex > 0 || topIndex < numBuckets - 1)) {
        const topVolume = topIndex < numBuckets - 1 ? buckets[topIndex + 1].volume : -1;
        const bottomVolume = bottomIndex > 0 ? buckets[bottomIndex - 1].volume : -1;

        if (topVolume === -1 && bottomVolume === -1) break;

        if (topVolume > bottomVolume) {
            topIndex++;
            currentVolume += topVolume;
        } else {
            bottomIndex--;
            currentVolume += bottomVolume;
        }
    }
    
    const vah = buckets[topIndex].price + bucketSize;
    const val = buckets[bottomIndex].price;

    return {
        profile: buckets,
        poc,
        vah,
        val,
        maxVolume,
        minPrice,
        maxPrice,
    };
};