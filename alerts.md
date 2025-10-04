# Crypto Scanner Alerts Guide

This document provides a detailed overview of all the configurable alerts available in the Crypto RSI Scanner application. All alerts can be individually enabled or disabled in the **Settings > Configure Alerts** modal.

## Timeframe Applicability Summary

Here is a quick reference for which timeframes each alert is active on:

-   **KiwiHunt Alerts (All types):** `15m, 1h, 4h, 1d`
-   **WaveTrend Confluence Buy:** `1h, 4h, 1d`
-   **WaveTrend Extreme:** `1h, 4h, 1d`
-   **Divergence Alerts:** `1h, 4h, 8h, 1d, 3d`
-   **Stochastic RSI Recovery:** `1h, 2h, 4h, 8h, 1d, 3d`
-   **Stochastic RSI Bullish Cross:** `1h, 2h, 4h, 8h, 1d, 3d`
-   **High-Conviction Strategies:** `1h, 4h, 1d`
-   **Anchored Profile Alerts:** `1h, 4h, 1d`
-   **Price in Golden Pocket:** `1h, 4h, 1d, 3d`
-   **VWAP & Volume Profile Alerts:** `30m, 1h, 4h`
-   **RSI/SMA Cross Alerts:** `15m, 1h, 2h, 4h, 8h, 1d, 3d`
-   **Extreme RSI Alerts:** `15m, 1h, 2h, 4h, 8h, 1d, 1w`

## Available Alerts

-   **KiwiHunt Alerts** (Hunt, Crazy, Buy Trend)
-   **WaveTrend Alerts** (Extreme, Confluence)
-   **RSI Extreme Alerts** (Overbought / Oversold)
-   **RSI/SMA Cross Alerts**
-   **Divergence Alerts**
-   **Stochastic RSI Recovery & Cross**
-   **VWAP & Volume Profile Strategies**
-   **Price-Based Fibonacci & Volume Alerts**
-   **High-Conviction Confluence Strategies**

---

## Explanation of Each Alert

### 1. KiwiHunt Alerts

These alerts are based on the proprietary KiwiHunt oscillator and are designed to identify high-probability reversals and trend continuations.

-   **Hunt Signals (Buy & Sell):** This is the highest quality signal, firing only when a perfect confluence of events occurs. It identifies a momentum crossover happening in a deeply overbought/oversold state, with confirmation from multiple internal oscillators, indicating the market is stretched to its limit and ripe for a reversal.
-   **Crazy Signals (Buy & Sell):** A strong signal that identifies strength emerging from an environment of maximum weakness (Crazy Buy), or weakness emerging from maximum strength (Crazy Sell).
-   **Buy Trend Signal:** This is a trend continuation signal. It appears when the indicator detects that a shallow pullback in an uptrend is likely over and the original bullish trend is resuming.

-   **Timeframe Applicability:** `15m, 1h, 4h, 1d`

### 2. WaveTrend Alerts

These alerts leverage the WaveTrend oscillator to spot momentum shifts.

-   **WaveTrend Confluence Buy:** Triggers when a bullish crossover of the WaveTrend lines occurs while the main oscillator is in a deeply oversold area (below -53). This confluence provides higher conviction than a simple crossover.
-   **WaveTrend Extreme (Buy/Sell):** Triggers when the WaveTrend oscillator crosses into its extreme overbought (>50) or oversold (<-50) zones, signaling potential momentum exhaustion.

-   **Timeframe Applicability:** `1h, 4h, 1d`

### 3. Extreme RSI Alerts

These are the most fundamental alerts, designed to notify you when an asset's price momentum is reaching a potential point of exhaustion or reversal.

-   **Overbought Alert:** Triggers when a symbol's RSI (Relative Strength Index) crosses **above 70**.
-   **Oversold Alert:** Triggers when a symbol's RSI crosses **below 30**.

*Note: The system is designed to avoid spam. It will only notify you once when an asset enters an extreme state. It will not generate another "overbought" alert for the same asset until its RSI first drops back into the neutral zone (below 70) and then crosses above 70 again.*

-   **Timeframe Applicability:** `15m, 1h, 2h, 4h, 8h, 1d, 1w`

### 4. RSI/SMA Cross Alerts

This alert notifies you of a direct change in momentum as indicated by the relationship between the RSI and its moving average.

-   **Bullish Cross:** Triggers when the RSI line crosses *above* its 14-period Simple Moving Average (SMA).
-   **Death Cross:** Triggers when the RSI line crosses *below* its 14-period SMA.

-   **Timeframe Applicability:** `15m, 1h, 2h, 4h, 8h, 1d, 3d`

### 5. Divergence Alerts

This alert spots discrepancies between price action and momentum, which are often powerful leading indicators of a trend reversal.

-   **Bullish Divergence:** An alert is triggered when the price makes a new low, but the RSI makes a *higher* low.
-   **Bearish Divergence:** An alert is triggered when the price makes a new high, but the RSI makes a *lower* high.

-   **Timeframe Applicability:** `1h, 4h, 8h, 1d, 3d`

*The following sections detail other advanced alerts available in the app, covering VWAP, Volume Profile, and multi-factor strategies. Please refer to the **"Configure Alerts"** modal for a full list and descriptions.*
