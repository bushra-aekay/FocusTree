# FocusTree Setup Guide

This guide will help you set up FocusTree locally for development or judging purposes.

## Prerequisites

1.  **Node.js**: Version 16.0 or higher.
2.  **Google AI Studio API Key**: You need a valid API key from [Google AI Studio](https://aistudiocdn.google.com/).
3.  **Webcam**: Required for the core feature to work.

## Step-by-Step Installation

### 1. Get the Code
Download the project files to your local machine.

### 2. Install Dependencies
FocusTree uses standard React dependencies. Run:
```bash
npm install
```

### 3. API Key Configuration
The app relies on the Google Gemini API.
1.  Obtain a key from [Google AI Studio](https://aistudiocdn.google.com/).
2.  Ensure you have access to the `gemini-2.5-flash` model.
3.  Set the API key in your environment variables. 
    *   **Parcel/Bundler**: Use a `.env` file: `API_KEY=...`
    *   **Direct Injection**: You can also replace `process.env.API_KEY` in `src/services/aiService.ts` directly for a quick test (do not commit this).

### 4. Running the App
```bash
npm start
```
The app usually runs on port `1234` or `3000`.

## ⚠️ Important Configuration Notes

### Mock Authentication
For this hackathon version, **Authentication is Mocked**.
-   You do not need to set up Firebase Auth.
-   Clicking "Sign in with Google" simulates a login and saves a mock user to `localStorage`.
-   Data persists across reloads but is local to your browser.

### Privacy & Permissions
-   When you start a session, the browser will ask for **Camera** and **Microphone** permissions.
-   **You must click "Allow"** for the app to function.
-   If you get a "Permission Denied" error, check your browser settings (usually the lock icon in the URL bar).

### Audio
-   The app uses the Web Audio API for alarms and notifications.
-   **Browser Autoplay Policies** might block sound until you interact with the page. Click anywhere on the page if sounds aren't playing.

## Troubleshooting

**Issue: "AI Analysis Error" / Rate Limits**
-   FocusTree polls the API every few seconds. If you hit a 429 error, the app will automatically back off and skip a few frames.
-   Check the browser console for logs.

**Issue: "Camera not found"**
-   Ensure no other app (Zoom, Teams) is using the camera.
-   Refresh the page.

**Issue: "White Screen"**
-   Check the console for errors.
-   Clear `localStorage` by running `localStorage.clear()` in the console and refreshing.
