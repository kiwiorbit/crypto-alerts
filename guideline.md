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