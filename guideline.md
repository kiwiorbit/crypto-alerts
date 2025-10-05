# Guideline: Setting Up Your 24/7 Crypto Alert Bot with GitHub Actions

## Introduction

This guide will walk you through setting up a free, automated "bot" that runs 24/7 in the cloud. This bot will use the Crypto Scanner's logic to watch the market for you and send real-time alerts for your chosen strategies directly to a Discord server.

**The Goal:** To solve the problem of receiving duplicate notifications. By moving the alert logic from your browser to a persistent server (using GitHub Actions), alerts will only be sent **once** when they happen, reliably, 24/7, even when your computer is off.

**Who is this for?** This guide is for anyone, even if you are not a developer. You just need to be able to follow instructions, copy, and paste.

---

## Step 1: Get the Project Files from Google AI Studio

First, you need to download the complete application code.

1.  In Google AI Studio, look for the **"Export"** button or option for this project.
2.  Download the project as a **ZIP file** to your computer.
3.  Find the downloaded ZIP file and **unzip it**. This will create a folder containing all the project files (`index.html`, `App.tsx`, etc.). Keep this folder handy.

---

## Step 2: Create a Free GitHub Account and a New Repository

GitHub is a website that hosts code. We will use it to store our project and run our free 24/7 alert bot.

1.  Go to [github.com](https_//github.com) and sign up for a new, free account.
2.  Once you are logged in, find the **"+"** icon in the top-right corner and click **"New repository"**.
3.  **Repository name:** Give it a simple name, like `crypto-alerts`.
4.  **Description:** (Optional) You can write "My personal crypto alerting bot."
5.  **Privacy:** Make sure **"Public"** is selected.
6.  Click the **"Create repository"** button.

You will be taken to a new, empty repository page.

---

## Step 3: Upload Your Project Files to GitHub

Now we will upload the files you downloaded from AI Studio.

1.  On your new repository page, click the **"uploading an existing file"** link.
2.  Open the folder on your computer where you unzipped the project files.
3.  **Drag and drop ALL the files and folders** from your computer into the GitHub upload window. This includes `index.html`, `App.tsx`, the `components` folder, the new `scripts` folder, and the new `.github` folder.
4.  Wait for all the files to finish uploading.
5.  At the bottom of the page, you'll see a "Commit changes" box. Just click the green **"Commit changes"** button.

Your repository now contains the full application code.

---

## Step 4: Create a Discord Webhook

A webhook is a special URL that allows our bot to send messages to a specific channel in your Discord server.

1.  Open your Discord app or the Discord website.
2.  Choose the server and the specific text channel where you want to receive alerts.
3.  **Right-click** on the channel name and select **"Edit channel"**, or click the **gear icon** next to it.
4.  Go to the **"Integrations"** tab.
5.  Click the **"Webhooks"** button.
6.  Click the **"New Webhook"** button.
7.  Give your new webhook a name (e.g., "Crypto Alerts") and optionally an icon.
8.  Click the **"Copy Webhook URL"** button. **This URL is a secret! Do not share it publicly.**

---

## Step 5: Securely Add the Webhook to GitHub

We need to give our GitHub bot the secret URL without pasting it directly into our code.

1.  Go back to your GitHub repository page.
2.  Click on the **"Settings"** tab near the top right.
3.  On the left-hand menu, click on **"Secrets and variables"**, then select **"Actions"**.
4.  You will be on the "Actions secrets" page. Click the **"New repository secret"** button.
5.  **Name:** Type `DISCORD_WEBHOOK_URL` into this box. It must be spelled *exactly* like that.
6.  **Secret:** Paste the Discord Webhook URL you copied in the previous step into this box.
7.  Click **"Add secret"**.

Your bot now has secure access to your Discord channel.

---

## Step 6: Activate and Check Your Alert Bot

The bot is now ready to run. It is scheduled to run automatically every 15 minutes, but we can run it manually for the first time to make sure it works.

1.  In your GitHub repository, click on the **"Actions"** tab at the top.
2.  On the left, you will see a workflow named **"Crypto Alert Checker"**. Click on it.
3.  You will see a message that says "This workflow has a workflow_dispatch event trigger." To the right, click the **"Run workflow"** button, and then click the green **"Run workflow"** button in the dropdown.
4.  A new workflow run will appear in the list. It will have a yellow circle next to it while it's running. Click on its name to see the details.
5.  Click on the **"check_alerts"** job on the left.
6.  You can now see a live log of what the bot is doing. It will install its tools, and then you will see the output from the `Run Alert Checker` step. It will print messages like "Processing BTCUSDT on 1h..." for all the assets and timeframes.

**You're all done!** The bot will now run automatically every 15 minutes, checking for alerts and only sending a message to your Discord when a **new** alert is found. Your browser-based app will no longer send any notifications, completely solving the duplicate alert problem.

# Guideline: Deploying Your 24/7 Alert Bot on Render (Free Alternative)

## Introduction

# Guideline: Deploying Your 24/7 Alert Bot on Render (Free Alternative)

## Introduction

This guide addresses the "Status Code: 451" error you are seeing in GitHub Actions. This error means GitHub's servers are being blocked by the Binance API, preventing the bot from getting market data.

To fix this, we will use a free service called **Render.com** to run our bot from a different cloud location. Render's free servers don't save files, so we'll also use another free service called **JSONBin.io** to act as the bot's memory. This will remember which alerts have been sent and prevent duplicate notifications.

This combination reliably solves both problems, and this guide will walk you through the entire setup.

---

## Step 1: Create a Free JSONBin.io Account to Store Alert History

This service will act as a private online storage for your bot's memory.

1.  Go to [jsonbin.io](https://jsonbin.io) and sign up for a free account.
2.  On your dashboard, click the **"+ Add New Bin"** button in the top right.
3.  You will be taken to an editor page. JSONBin requires some initial content to create the bin. Delete all the placeholder text and type a single, empty JSON object:
    ```json
    {}
    ```
4.  Click the blue **"Save Bin"** button. This will create the bin.
5.  **Copy the Bin ID:** After saving, look at the URL in your browser's address bar. It will look something like this:
    `https://jsonbin.io/b/667c2a7de41b4d34e40f3a3e`
    The long string of letters and numbers after `/b/` is your **Bin ID**. Copy it and save it in a temporary text file.
6.  **Get your API Key:** In the top right corner of the JSONBin website, click on your account icon/name, then click **"API Keys"**.
7.  You will see a **Master Key** already created for you. Click the "Copy" icon next to it. Save this in your text file as well. **This key is a secret!**

You should now have your Bin ID and Master Key saved.

---

## Step 2: Ensure Your Discord Webhook is Ready

You likely already have this from the previous guide. Make sure you still have your **Discord Webhook URL** saved in your text file. If not, you will need to create a new one in your Discord server settings.

---

## Step 3: Create and Configure Your Render Cron Job

Now we will set up the bot on Render.

1.  Go to [render.com](https://render.com) and sign up for a free account. The easiest way is to **sign up with your GitHub account**.
2.  Once you're on the Render Dashboard, click the **"New +"** button and then select **"Cron Job"**.
3.  **Connect your repository:** Find your `crypto-alerts` repository in the list and click the **"Connect"** button next to it.
4.  Fill out the settings for the Cron Job:
    *   **Name:** `crypto-alert-bot`
    *   **Region:** Choose a region in Europe, such as **Frankfurt (EU Central)**. This is the key step to avoid the block.
    *   **Branch:** `main`
    *   **Build Command:** `npm install`
    *   **Start Command:** `node scripts/check_alerts.js`
    *   **Schedule:** Enter `*/15 * * * *` (This means "run every 15 minutes").
5.  Scroll down and click the blue **"Create Cron Job"** button.

The initial deployment will start. It will likely fail the first time, which is completely normal because we haven't added our secrets yet.

---

## Step 4: Add Your Secrets to Render

This is just like adding secrets to GitHub.

1.  In your new `crypto-alert-bot` service on Render, click the **"Environment"** tab on the left-hand menu.
2.  Scroll down to the **"Environment Variables"** section.
3.  Click **"Add Environment Variable"** multiple times to create rows for all your secrets.
4.  Fill them in *exactly* like this, using the values you saved in your text file:
    *   **Key:** `DISCORD_WEBHOOK_URL`, **Value:** (Paste your Discord Webhook URL here)
    *   **Key:** `JSONBIN_API_KEY`, **Value:** (Paste your JSONBin Master Key here)
    *   **Key:** `JSONBIN_BIN_ID`, **Value:** (Paste your JSONBin Bin ID here)
    *   **Key:** `ALERT_LUXALGO_FLIP_ENABLED`, **Value:** `true`
    *   **Key:** `ALERT_RSI_EXTREMES_ENABLED`, **Value:** `true`
    *   **Key:** `ALERT_RSI_SMA_CROSS_ENABLED`, **Value:** `true`
    *   **Key:** `ALERT_DIVERGENCE_ENABLED`, **Value:** `true`
    *   **Key:** `ALERT_WAVETREND_CONFLUENCE_ENABLED`, **Value:** `true`
    *   **Key:** `ALERT_HIGH_CONVICTION_BUY_ENABLED`, **Value:** `true`
5.  Click **"Save Changes"**. Render will automatically start a new deployment with your secrets.

---

## Step 5: Configure Which Alerts Are Active

Your bot is now controlled by "feature flags" in your Environment Variables. This gives you easy on/off control without changing any code.

*   To receive **Trailing Stop Flip** alerts, make sure `ALERT_LUXALGO_FLIP_ENABLED` is set to `true`.
*   To receive **RSI Extreme** alerts (above 75 / below 25), make sure `ALERT_RSI_EXTREMES_ENABLED` is set to `true`.
*   To receive **RSI/SMA Cross** alerts, make sure `ALERT_RSI_SMA_CROSS_ENABLED` is set to `true`.
*   To receive **Divergence** alerts, make sure `ALERT_DIVERGENCE_ENABLED` is set to `true`.
*   To receive **WaveTrend Confluence Buy** alerts, make sure `ALERT_WAVETREND_CONFLUENCE_ENABLED` is set to `true`.
*   To receive **High-Conviction Buy** alerts, make sure `ALERT_HIGH_CONVICTION_BUY_ENABLED` is set to `true`.

You can set any of these to `false` at any time to disable them. After changing a variable, Render will automatically deploy the update.

---

## Step 6: Test and Verify Your Bot is Live

1.  Wait for the deployment to finish. You should see a "Live" status at the top.
2.  On the main page for your Cron Job, click the **"Trigger Run"** button to run the bot manually for a test.
3.  Click the **"Logs"** tab. After a few seconds, you should see the script start up and print messages like `Processing BTCUSDT on 1h...`. You should not see any `451` errors.
4.  If the bot finds an alert, you will see `ATTEMPTING TO SEND DISCORD NOTIFICATION...` in the logs, and a message will appear in your Discord channel!
5.  You can also go back to your JSONBin.io bin and refresh the page. You should see it now contains data with timestamps for any alerts that were sent, confirming its memory is working.

---

## Step 7: Disable the Old GitHub Action

To prevent the failed workflow from running and sending you error notifications, you should disable it.

1.  Go back to your GitHub repository page.
2.  Click the **"Actions"** tab.
3.  On the left, click on the **"Crypto Alert Checker"** workflow.
4.  Click the **"..."** menu button on the right, and select **"Disable workflow"**.

**Congratulations!** Your bot is now running reliably 24/7 on Render's cloud and will send clean, non-duplicated alerts directly to your Discord.
