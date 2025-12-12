# FocusTree 🌳

**Focus better. Grow your tree. Transform your productivity.**

FocusTree is an AI-powered productivity web application that gamifies deep work. It uses your webcam and Google's Gemini API to monitor your focus in real-time, gently alerting you when you get distracted and helping you recover your flow with smart, context-aware tasks.

![FocusTree Banner](https://via.placeholder.com/1200x600/10b981/ffffff?text=FocusTree+Demo)

## 🚀 Key Features

-   **👁️ AI Focus Monitoring**: Real-time analysis of webcam feed to detect distractions (phone usage, leaving desk, sleeping) using Google Gemini 2.5 Flash.
-   **🌳 Gamified Growth**: Every focused minute waters your personal digital tree. Distractions wither it. Level up from a Seed to a Mature Oak.
-   **🤖 Context-Aware Recovery**: When you lose focus, the AI generates specific, low-friction cognitive tasks based on your actual work (e.g., "Define the next function you need to write") to pull you back in.
-   **🗣️ AI Voice Coach**: A voice-enabled assistant (using Web Speech API + Gemini) that answers quick questions and aggressively redirects you back to work.
-   **📊 Detailed Analytics**: Track focus percentage, distraction patterns, and weekly growth streaks.
-   **🔒 Privacy First**: All image analysis logic runs client-side triggers to the API; images are processed for detection and immediately discarded.

## 🛠️ Tech Stack

-   **Frontend**: React 19, TypeScript, Tailwind CSS
-   **AI**: Google Gemini API (`@google/genai` SDK)
    -   `gemini-2.5-flash` for vision analysis (low latency)
    -   `gemini-2.5-flash` for chat and recovery task generation
-   **State Management**: React Context API
-   **Persistence**: LocalStorage (Mock Database for Hackathon Demo)
-   **Routing**: React Router v7
-   **Icons**: Lucide React

## 🏁 Quick Start

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/focustree.git
    cd focustree
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    Create a `.env` file in the root directory and add your Google Gemini API Key:
    ```env
    API_KEY=your_google_ai_studio_api_key_here
    ```

4.  **Run the App**
    ```bash
    npm start
    ```
    Open [http://localhost:1234](http://localhost:1234) to view it in the browser.

## 📸 Screenshots

| Dashboard | Active Session |
|:---:|:---:|
| ![Dashboard](https://via.placeholder.com/400x300/e5e7eb/9ca3af?text=Dashboard) | ![Session](https://via.placeholder.com/400x300/e5e7eb/9ca3af?text=Active+Session) |

## 🏆 Hackathon Notes
This project demonstrates the power of **Multimodal AI** (Vision + Text) in a real-time productivity context. It specifically highlights the **low latency** of Gemini 2.5 Flash for continuous monitoring without wrecking user experience.

---
© 2024 FocusTree Team. Built with 💚.
