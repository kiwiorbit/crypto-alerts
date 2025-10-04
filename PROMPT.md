# AI Agent Prompts for Building the Crypto RSI Scanner

This document outlines a series of sequential prompts that could be given to a generative AI agent to build the Crypto RSI Scanner application from scratch. Each prompt represents a logical feature implementation step.

---

### Prompt 1: Initial Project Setup

**User Prompt:**
"Create a new single-page web application using React and TypeScript. Use an `importmap` in `index.html` to load React, ReactDOM, and Recharts from a CDN; do not use npm or a build step. Style the application with the Tailwind CSS CDN.

Create the following files:
- `index.html`: The main page with the importmap and a root div.
- `index.tsx`: Mounts the React app.
- `App.tsx`: The main App component.
- `types.ts`: For all TypeScript definitions.
- `constants.ts`: For shared constants.

In `App.tsx`, create a basic layout with a dark background. In `constants.ts`, define a default list of 20 crypto symbols (e.g., 'BTCUSDT', 'ETHUSDT')."

---

### Prompt 2: Core Data Fetching and RSI Grid Display

**User Prompt:**
"Create a service file `services/binanceService.ts`. Implement a function `fetchRsiForSymbol` that takes a symbol and a timeframe (e.g., '15m'), fetches the kline data from the public Binance API (`https://api.binance.com/api/v3/klines`), and calculates the 14-period RSI and its 14-period SMA. The function should return the symbol's latest price and arrays of data points for klines, RSI, and SMA.

In `App.tsx`, fetch this data for all default symbols and store it in state. Create a `components/Grid.tsx` and a `components/GridCell.tsx` component. Display the fetched data in a responsive grid, where each cell shows the symbol, its current RSI value, and a mini sparkline chart of its recent RSI history using Recharts."

---

### Prompt 3: Header, Timeframe Control, and Interactivity

**User Prompt:**
"Create a `components/CryptoHeader.tsx` component. Add a title, a search input, and a `components/TimeframeDropdown.tsx` component. The dropdown should allow the user to select from a list of timeframes (5m, 15m, 1h, 4h, 1d) defined in `constants.ts`.

When a new timeframe is selected, the `App` component should re-fetch all data for that timeframe and update the grid. The search input should filter the symbols displayed in the grid in real-time."

---

### Prompt 4: Advanced Dashboard Views & Sorting

**User Prompt:**
"Enhance the dashboard with multiple view modes. Add buttons to the UI to switch between:
1.  The existing RSI Chart view.
2.  A `components/Heatmap.tsx` view that displays symbols in a grid with background colors corresponding to their RSI value (green for oversold, red for overbought).
3.  A `components/PriceGrid.tsx` view that shows a mini price chart for each symbol.
4.  A `components/StochGrid.tsx` that shows a Stochastic RSI chart. Update `binanceService` to calculate StochRSI (%K and %D).

Also, add a sort button that cycles through sorting the grid by RSI, Price Change %, or Stochastic %K value (depending on the active view)."

---

### Prompt 5: Detailed Chart Modal with Drawing Tools

**User Prompt:**
"When a user clicks on any symbol in the grid, open a large, detailed modal (`components/Modal.tsx`). This modal should display a large, interactive Recharts chart of the symbol's RSI and its 14-period SMA. It should also have buttons to switch to Price and Stochastic RSI chart views.

Implement a `components/DrawingToolbar.tsx` inside the modal. Give the user the ability to draw trendlines and free-form brush strokes directly on an HTML canvas overlaid on the chart. The user should be able to change colors and clear their drawings."

---

### Prompt 6: Price Detail Modal with Advanced Indicators

**User Prompt:**
"Create a new modal, `components/PriceDetailModal.tsx`, for the price chart view.

In the price modal, implement the following features:
1.  **Integrate the interactive drawing canvas and toolbar**.
2.  Create a `services/volumeProfileService.ts` to calculate Volume Profile from the kline data.
3.  Add buttons to toggle the visibility of the Volume Profile (POC, VAH, VAL), a Golden Pocket Fibonacci Retracement overlay, and Higher-Timeframe (HTF) support/resistance levels.
4.  Update `binanceService` to include a `fetchPreviousWeeklyLevels` function to get data for the HTF levels."

---

### Prompt 7: Full Screen Analysis Mode

**User Prompt:**
"Create a dedicated 'Full View Page' (`components/FullViewPage.tsx` and `components/StochFullViewPage.tsx`). When a user clicks an 'expand' icon in the RSI or Stoch modal, navigate to this new page. It should feature a large, two-pane layout with the Price Chart on top and the corresponding indicator chart below, with synchronized crosshairs. **Ensure the drawing tools are fully functional in this view, with separate canvases for the price and indicator panes.** Implement a 'Copy to Clipboard' feature using the `html-to-image` library to capture a clean image of the charts, including drawings."

---

### Prompt 8: Settings Panel, Themes, and Asset Management

**User Prompt:**
"Create a slide-out `components/SettingsPanel.tsx`, accessible via a gear icon in the header. Inside the panel, add the following functionality:
1.  A theme toggle to switch between a predefined dark and light theme. The theme choice should be saved to local storage.
2.  A button to open an `components/AssetListModal.tsx`. This modal should allow users to view the master list of symbols, add new symbols, and select which ones are active on the dashboard. These preferences must be saved to local storage.
3.  Add a button labeled 'Configure Alerts' which will later open a dedicated modal.
4.  Add toggles to show/hide the Heatmap, Price, and Stochastic view buttons on the main dashboard."

---

### Prompt 9: Advanced Alert System & Configuration Modal

**User Prompt:**
"Implement an advanced, configurable alert system.
1.  Create a new `components/AlertsModal.tsx`. This modal should be opened by the 'Configure Alerts' button in the settings panel.
2.  Inside the modal, add toggles for various alert conditions like Extreme RSI, RSI/SMA Cross, Divergence, Stoch Recovery, Price in Golden Pocket, VWAP strategies, and Volume Profile strategies.
3.  Implement the logic in a new `services/alertingService.ts` to trigger these alerts based on the user's settings.
4.  Display these alerts as temporary 'toast' notifications and log them in a `components/NotificationPanel.tsx` accessible from a bell icon in the header. Implement a 'Click-to-View' feature on the toasts that takes the user directly to the relevant chart."

---

### Prompt 10: WaveTrend Integration

**User Prompt:**
"Integrate the WaveTrend oscillator.
1.  Update `binanceService` to calculate WaveTrend (wt1 and wt2 lines).
2.  Create a new `WaveTrendGrid.tsx` and `WaveTrendDetailModal.tsx` to visualize the indicator.
3.  Add a view mode button to the header to switch to the WaveTrend grid, available only on '15m', '1h', '4h', and '1d'.
4.  Update sorting logic to include sorting by WaveTrend value.
5.  Add WaveTrend alert conditions ('Extreme' and 'Confluence Buy') to the `alertingService` and the `AlertsModal`."

---

### Prompt 11: KiwiHunt Integration

**User Prompt:**
"Integrate a new proprietary indicator called 'KiwiHunt'.
1.  Create a `services/kiwiHuntService.ts` to house its complex calculation logic based on the provided Pine Script. Integrate this into `binanceService`.
2.  Create a new `KiwiHuntGrid.tsx` and `KiwiHuntDetailModal.tsx`. Add a view mode button for it, restricted to '15m', '1h', '4h', '1d'.
3.  Implement sorting by the KiwiHunt Q1 value.
4.  Add three new KiwiHunt alert types ('Hunt Signals', 'Crazy Signals', 'Buy Trend') to the `alertingService` and create a dedicated 'KiwiHunt' tab in the `AlertsModal`."

---

### Prompt 12: Chart Visual Enhancements

**User Prompt:**
"Enhance the detail charts with visual signals.
1.  In `KiwiHuntDetailModal.tsx`, add colored dots and triangles directly onto the chart to visually represent where Hunt, Crazy, and Buy Trend alerts are triggered.
2.  In `WaveTrendDetailModal.tsx`, add green and red dots to the chart to show where high-conviction buy and sell signals (crossovers in extreme zones) occur."

---

### Prompt 13: Finalization and Documentation

**User Prompt:**
"Finalize the project.
1.  Review all UI components for accessibility.
2.  Update the `<title>` and `<meta>` tags in `index.html` for better SEO.
3.  Create comprehensive documentation: `README.md`, `QUICK_GUIDE.md`, `alerts.md`, `DEVELOPER_NOTES.md`, and `TOUR_GUIDE.md`, ensuring all new features like WaveTrend and KiwiHunt are fully documented."