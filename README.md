# Crypto RSI Scanner & Advanced Trading Tool

Crypto RSI Scanner is a comprehensive, real-time dashboard and analysis tool designed for cryptocurrency traders. It provides a powerful interface to monitor the Relative Strength Index (RSI), Stochastic RSI, WaveTrend, the proprietary KiwiHunt oscillator, and key volume metrics for hundreds of trading pairs from the Binance exchange.

What began as a simple RSI scanner has evolved into an advanced charting platform, complete with institutional-grade indicators like Volume Profile and advanced, strategy-based alerts, all within a sleek, customizable, and responsive web interface.

## Core Features

### 1. Multi-View Dashboard

Instantly get a market overview with six distinct and switchable dashboard views:

-   **📈 RSI Chart View (Default):** A grid of mini RSI charts, each showing the RSI line and its 14-period Simple Moving Average (SMA).
-   **➿ Stochastic RSI View:** A grid displaying mini Stochastic RSI charts, visualizing the %K and %D lines to pinpoint overbought/oversold conditions with greater sensitivity.
-   **🚀 KiwiHunt View:** A grid for the proprietary KiwiHunt momentum oscillator, designed to spot high-probability reversals and continuations. Available on `15m`, `1h`, `4h`, and `1d` timeframes.
-   **🌊 WaveTrend View:** A grid displaying the powerful WaveTrend oscillator to identify overbought and oversold conditions based on wave analysis. Available on `15m`, `1h`, `4h`, and `1d` timeframes.
-   **♨️ Heatmap View:** A color-coded grid that provides an immediate, at-a-glance understanding of market sentiment. Cells range from deep green (extremely oversold) to bright red (extremely overbought).
-   **💹 Price View:** A grid of mini price charts that visualize the recent price action for each symbol, color-coded based on the period's price change.

### 2. Advanced Interactive Charting Modal

Clicking on any symbol opens a powerful modal with in-depth analysis tools:

-   **Multi-Indicator Chart Panes:** Seamlessly switch between a detailed Price Chart, RSI Chart, Stochastic RSI, WaveTrend, and KiwiHunt chart.
-   **Visual Signal Indicators:** Indicator charts are enhanced with visual signals (dots and triangles) that pinpoint exactly where high-probability alert conditions are met, providing immediate context.
-   **Interactive Drawing Tools:** Draw trendlines or make free-form annotations directly on the charts to mark areas of interest.
-   **Sophisticated Technical Indicators:**
    -   📊 **Volume Profile:** A vertical histogram on the price chart showing the volume traded at different price levels, clearly visualizing the Point of Control (POC), Value Area High (VAH), and Value Area Low (VAL).
    -   **Golden Pocket:** Toggle a visual overlay that highlights the key Fibonacci Retracement zone (between 0.618 and 0.65).
    -   **Higher-Timeframe (HTF) Levels:** Overlay crucial support and resistance levels from the *previous week*.

### 3. Full Screen Analysis Mode

For an even more focused analysis, expand the modal into a dedicated **Full View Page**. This mode features:
-   A large, two-pane layout with the Price Chart on top and the RSI or Stochastic RSI Chart below.
-   Synchronized crosshairs and data tooltips across both charts.
-   **Chart Capture:** Copy a clean, high-resolution image of the entire chart view (including your drawings) directly to your clipboard to share your analysis.

### 4. Advanced Alerts & Notifications

Stay ahead of market moves with a powerful, customizable alert system managed from a dedicated **"Configure Alerts" modal**:
-   **Indicator-Based Alerts:**
    -   **KiwiHunt Alerts:** Get notified for "Hunt," "Crazy," and "Buy Trend" signals, which identify high-quality reversals and trend continuations.
    -   **WaveTrend Alerts:** Receive alerts for extreme oversold/overbought conditions and high-conviction confluence signals.
    -   **RSI & Stochastics:** Get notified for Extreme levels, RSI/SMA crosses, divergences, and Stoch RSI recovery patterns.
-   **Advanced Strategy Alerts:**
    -   **VWAP & Volume Profile:** Get alerts for bounces and rejections from key levels like the Daily VWAP, Anchored VWAPs, Point of Control (POC), and Value Area edges.
    -   **Price-Based Alerts:** Be notified when the price enters or reverses from critical Fibonacci retracement zones.
-   **Notification Center:** A persistent panel accessible from the header that stores a history of all recent alerts.

### 5. Powerful Filtering & Sorting

Quickly find the assets that matter most:

-   **Symbol Search:** A quick-access search bar to instantly filter for any symbol.
-   **Favorites System:** Star your most-watched assets and toggle a "favorites-only" view.
-   **Dynamic Sorting:** Sort all symbols by RSI value, by 24-hour price change, by Stochastic %K value, by WaveTrend value, or by KiwiHunt Q1 value (depending on the active view).

### 6. Deep Customization

Tailor the application to your exact preferences:

-   **Full Asset Management:** Add, remove, and select exactly which symbols you want to actively monitor on the dashboard.
-   **Theme Engine:** Switch between a sleek **Dark Mode** and a clean **Light Mode**.
-   **Dedicated Alert Modal:** Configure all alert settings in a clean, dedicated modal.
-   **Reset to Default:** A one-click option to restore all settings and assets to their original state.

## Tech Stack

-   **Frontend:** Built with **React** and **TypeScript** for a robust, scalable, and maintainable codebase.
-   **Styling:** Styled with **Tailwind CSS**, a utility-first framework for rapid and consistent UI development.
-   **Charting:** Powered by **Recharts**, a composable charting library for React.
-   **Data Source:** Fetches real-time K-line (candlestick) data directly from the public **Binance API**.
-   **Image Generation:** Uses the **`html-to-image`** library to capture DOM elements as images for the "Copy to Clipboard" feature.