# How to Build and Run the Crypto RSI Scanner

This document provides a step-by-step guide for developers to set up and run the Crypto RSI Scanner application locally.

## Tech Stack

-   **Framework:** React with TypeScript
-   **Styling:** Tailwind CSS (via CDN)
-   **Charting:** Recharts
-   **Icons:** Font Awesome
-   **Dependencies:** Loaded via an `importmap` in `index.html`. No `npm` or `yarn` is required.

## Prerequisites

-   A modern web browser (e.g., Chrome, Firefox, Edge).
-   A code editor (e.g., Visual Studio Code).
-   A local web server. If you don't have one, we recommend using the **Live Server** extension for VS Code or Python's built-in server.

## Step-by-Step Instructions

### 1. Obtain the Project Files

First, you need to get a copy of the project files on your local machine. If this were a Git repository, you would clone it:

```bash
git clone <repository-url>
cd crypto-rsi-scanner
```

If you just have the files, simply place them all in a single project folder.

### 2. Understand the Dependency Model (No `npm install`!)

This project uses a modern web feature called **`importmap`** (defined in `index.html`) to manage its JavaScript dependencies.

```html
<script type="importmap">
{
  "imports": {
    "react-dom/": "https://aistudiocdn.com/react-dom@^19.1.1/",
    "recharts": "https://aistudiocdn.com/recharts@^3.1.2",
    "react/": "https://aistudiocdn.com/react@^19.1.1/",
    "react": "https://aistudiocdn.com/react@^19.1.1",
    "html-to-image": "https://aistudiocdn.com/html-to-image@^1.11.13"
  }
}
</script>
```

This means:
-   You **do not need to run `npm install` or `yarn install`**.
-   There is no `node_modules` folder.
-   All dependencies (React, Recharts, etc.) are fetched directly from a CDN by the browser at runtime.
-   This simplifies the setup process immensely, as there is no build step required.

### 3. Run a Local Web Server

Because the application uses ES Modules (`import` statements in JavaScript), you cannot simply open the `index.html` file directly in your browser from the file system (e.g., `file:///...`). It must be served by a web server.

Here are two easy ways to do this:

#### Option A: Using VS Code's Live Server Extension (Recommended)

1.  Open the project folder in Visual Studio Code.
2.  Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension from the VS Code Marketplace.
3.  Right-click on the `index.html` file in the VS Code explorer.
4.  Select **"Open with Live Server"**.

A new browser tab will open automatically, and the application will be running (e.g., at `http://127.0.0.1:5500`). The server will also auto-reload the page whenever you save a file.

#### Option B: Using Python's Built-in HTTP Server

If you have Python installed, you can use its simple built-in web server.

1.  Open your terminal or command prompt.
2.  Navigate to the root directory of the project (where `index.html` is located).
3.  Run the following command:

    ```bash
    # For Python 3
    python -m http.server

    # For Python 2
    python -m SimpleHTTPServer
    ```
4.  The terminal will output a message indicating the server is running, usually at `http://localhost:8000`.
5.  Open this address in your web browser.

### 4. Application is Running!

That's it! The application should now be fully functional in your browser. You can start editing the code, and as long as your local server is running, you can refresh the page to see your changes.

## File Structure Overview

-   `index.html`: The main entry point. Loads Tailwind CSS, fonts, and the main JavaScript module via the importmap.
-   `index.tsx`: Mounts the main React application to the DOM.
-   `App.tsx`: The root component of the application. Manages all state, data fetching, and renders all other components.
-   `/components`: Contains all the reusable React components that make up the UI.
-   `/services`: Contains modules responsible for external API calls (e.g., `binanceService.ts`) and complex business logic (e.g., `divergenceService.ts`).
-   `types.ts`: Defines all TypeScript interfaces and types used throughout the application.
-   `constants.ts`: Stores shared constants like default symbols, timeframe lists, and theme settings.
