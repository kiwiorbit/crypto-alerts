# Developer Presentation Notes: The Crypto RSI Scanner

## 1. The Elevator Pitch (The "Why")

**What is it?** It's an institutional-grade, real-time crypto analysis dashboard designed for serious traders. It transforms raw market data into actionable intelligence.

**What problem does it solve?** It cuts through the market noise. Instead of traders manually flipping through dozens of charts, our app automatically scans hundreds of assets across multiple timeframes, flagging high-probability opportunities based on a sophisticated, multi-factor alert system. It's not just a scanner; it's a decision-support system.

**Key Differentiator:** We go beyond simple RSI values. We integrate advanced concepts like Volume Profile, Anchored VWAP, WaveTrend, our proprietary KiwiHunt oscillator, and multi-indicator confluence strategies, presenting them in a highly intuitive and interactive interface. The "Click-to-View" alerts provide immediate context, bridging the gap between notification and analysis.

---

## 2. Core Architecture & Tech Stack

This is a modern, lightweight, and performant Single-Page Application (SPA).

*   **Framework:** React with TypeScript for a robust and type-safe codebase.
*   **Styling:** Tailwind CSS (via CDN) for rapid, consistent, and responsive UI development.
*   **Charting:** Recharts, a powerful and composable charting library.
*   **State Management:** A centralized React Context (`AppContext`) acts as the single source of truth, managing everything from user settings and UI state to real-time market data. This is broken down into custom hooks for clean separation of concerns:
    *   `useUserSettings`: Manages all user preferences (theme, favorites, asset lists, alert settings) and persists them to `localStorage`.
    *   `useSymbolData`: Handles the fetching, caching, and periodic refreshing (every 60s) of all market data via the `binanceService`.
    *   `useNotifications`: Manages the toast notification queue and the persistent notification history.
*   **No Build Step:** Uses a modern `importmap` in `index.html`. This means there's no `npm`, no `node_modules`, and no complex build configuration. It's incredibly simple to run and deploy. All dependencies are loaded directly from a CDN.

---

## 3. Feature Deep Dive (The "What" and "How")

This is the recommended flow for a client presentation.

### 3.1. The Main Dashboard: Your Market Command Center

*   **Core Function:** Provides a high-level, real-time overview of the market.
*   **Timeframe Control:** The master control. Changing the timeframe refetches and recalculates everything on the dashboard.
*   **Multiple Views (Key Feature):**
    *   **RSI & Stochastic RSI Views:** For classic momentum analysis.
    *   **KiwiHunt View:** Our proprietary indicator for spotting high-quality reversals and continuations (on `15m`, `1h`, `4h`, `1d`).
    *   **WaveTrend View:** A powerful oscillator for identifying overbought/oversold conditions (on `15m`, `1h`, `4h`, `1d`).
    *   **Heatmap View:** The ultimate at-a-glance view. Uses a color scale from deep green (oversold) to bright red (overbought) to show market sentiment instantly.
    *   **Price View:** A simple view of recent price action, color-coded by performance.
*   **Filtering & Sorting:** Essential for finding signals. Users can instantly filter by search, show only their "Favorites", and dynamically sort by the most relevant metric for the current view (RSI, Price Change %, Stoch %K, WaveTrend, KiwiHunt Q1).

### 3.2. The Interactive Modal: Drilling Down into the Details

*   **Trigger:** Clicking *any* asset on the grid.
*   **Functionality:** Opens a large, detailed chart for in-depth analysis.
*   **Key Features:**
    *   **Seamless Chart Switching:** Instantly pivot between Price, RSI, Stochastic, WaveTrend, and KiwiHunt charts for the same asset without losing context.
    *   **Visual Signal Overlay:** Both the WaveTrend and KiwiHunt charts now feature built-in visual indicators (dots and triangles) that precisely mark where high-probability alert conditions have been met, providing immediate visual feedback.
    *   **Advanced Indicators (Price Modal - The "Pro" Tools):**
        *   **Volume Profile:** This is a huge selling point. It shows *where* the volume occurred, not just *when*. The POC, VAH, and VAL are automatically calculated and displayed, highlighting key areas of support and resistance.
        *   **Fibonacci Levels:** Automatically calculates and displays the Golden Pocket (0.618-0.65) and 0.786 levels based on the visible chart range.
        *   **Previous Weekly Levels:** For `4h`+ timeframes, it overlays the previous week's high, low, open, and close, which are critical levels for swing traders.
    *   **Interactive Drawing Tools:** A full-featured canvas overlay allows users to draw trendlines and annotations directly on the charts.

### 3.3. Full-Screen Mode: For Deep, Focused Analysis

*   **Trigger:** The "expand" icon in the RSI or Stochastics modal.
*   **Layout:** A dedicated, two-pane view with the Price Chart on top and the corresponding indicator chart below.
*   **Synchronized Crosshairs:** Moving the mouse on one chart mirrors the crosshair on the other, allowing for precise correlation between price and indicator action.
*   **"Copy to Clipboard" (Showcase this!):** Uses the `html-to-image` library to capture a clean, high-resolution image of the entire chart view, *including drawings and a professional-looking timestamp watermark*. This is perfect for sharing analysis with a trading group or on social media.

### 3.4. The Alerting Engine: The App's Proactive Brain

This is the most powerful feature. The app isn't just showing data; it's actively looking for specific, high-probability trade setups.

*   **Logic:** The `alertingService.ts` file contains the logic for all alerts. It runs every 60 seconds when new data arrives. It uses a state management and cooldown system (`alertStates`) to prevent spamming the user with the same alert repeatedly.
*   **Alert Categories (Demonstrate the `AlertsModal`):**
    *   **Proprietary Alerts:** A dedicated tab for our high-conviction **KiwiHunt** signals (Hunt, Crazy, Buy Trend).
    *   **Indicator Alerts:** Standard signals like RSI extremes, divergences, and WaveTrend crosses.
    *   **VWAP & Volume Profile Alerts:** This is institutional-grade analysis. It alerts on bounces/rejections from the Daily VWAP, Anchored VWAPs, Point of Control (POC), and Value Area edges.
    *   **Confluence Strategy Alerts:** Multi-condition alerts that combine indicators for higher-probability signals.

### 3.5. Notifications: Actionable & Intelligent

*   **Toast System:** Alerts appear as non-intrusive "toast" notifications.
*   **Notification Center:** A history of the last 50 alerts is stored in the bell icon panel.
*   **"Click-to-View" (Key Selling Point):** When a user receives a toast for a supported timeframe, they can **click it**. This action instantly:
    1.  Closes any open modals.
    2.  Switches the dashboard to the correct timeframe.
    3.  Opens the detailed chart for that specific asset.
    4.  **Opens the correct chart view and automatically enables relevant overlays.** (e.g., a "KiwiHunt: Hunt Buy" alert will open the chart directly to the KiwiHunt view for that asset). This provides immediate visual context and validation for the alert.

### 3.6. Full Customization: Tailored to the Trader

*   **Settings Panel:** The central hub for personalization.
*   **Asset Management:** Users have full control. They can add any Binance symbol, remove defaults, and curate the exact list of assets they want to scan.
*   **Theme Engine:** Seamlessly switch between a polished Dark and Light mode.
*   **Alert & View Toggles:** Users can completely customize the UI and the alert engine to match their specific trading style.

---

## 4. Presentation Flow Suggestion

1.  **Start Broad:** Begin on the main dashboard. Explain the core concept of scanning multiple assets.
2.  **Show the Views:** Quickly cycle through the RSI, Heatmap, and **KiwiHunt** views to demonstrate the different ways to absorb market data.
3.  **Drill Down:** Click on an interesting asset (e.g., one that is overbought/oversold on the heatmap) to open the detailed modal.
4.  **Showcase the "Pro" Tools:** In the Price Modal, toggle on the Volume Profile. Then switch to the **KiwiHunt chart** and point out the **visual signal dots/triangles**, explaining they match the alerts.
5.  **Demonstrate Full-Screen Mode:** Expand the Stochastics chart and showcase the synchronized crosshairs and the "Copy to Clipboard" feature.
6.  **Introduce the Brain:** Open the Settings -> Configure Alerts modal. Briefly walk through the different categories of alerts, emphasizing the new **KiwiHunt** tab and the advanced VWAP/Volume Profile strategies.
7.  **The Payoff - "Click-to-View":** Trigger a test alert (or use a recent one from the notification panel) for a **KiwiHunt signal**. Demonstrate the click-to-view functionality. Emphasize how it takes you from alert to the precise visual setup in a single click.
8.  **Wrap with Customization:** Briefly show the Asset Management and Theme toggles to highlight the app's flexibility.
9.  **Conclude:** Reiterate the core value proposition: "This app automates the tedious work of scanning and analysis, allowing you to focus on executing high-probability trades."