# FocusTree Architecture 🏗️

FocusTree is a client-side Heavy Single Page Application (SPA). For this hackathon version, it uses a "Serverless" approach where the client communicates directly with the Google Gemini API, and data persistence is handled locally.

## System Diagram

```mermaid
graph TD
    User[User] -->|Webcam & Mic| Client[React Client]
    
    subgraph "Frontend Application"
        Client --> Auth[Auth Context]
        Client --> Session[Session Context]
        Client --> Detector[Distraction Detector Hook]
        Client --> Storage[LocalStorage (Mock DB)]
    end
    
    subgraph "External Services"
        Detector -->|Base64 Frames| Gemini[Google Gemini API]
        Client -->|Chat/Context| Gemini
        Client -->|TTS/STT| WebSpeech[Browser Web Speech API]
    end
    
    Gemini -->|JSON Analysis| Detector
    Gemini -->|Recovery Tasks| Client
```

## Core Components

### 1. Distraction Detection Loop (`useDistractionDetection.ts`)
This is the heartbeat of the application.
1.  **Capture**: Captures a frame from the `<video>` element to an off-screen `<canvas>`.
2.  **Compress**: Converts canvas to low-quality JPEG Base64 (to save bandwidth/latency).
3.  **Analyze**: Sends prompt + image to `gemini-2.5-flash`.
    *   *Prompt*: "Analyze this image... output JSON: { isDistracted, type, confidence... }"
4.  **Score**: Calculates a "Distraction Score" based on confidence and history (smoothing).
5.  **Trigger**: If score > threshold, triggers `useIntervention`.

### 2. Intervention Engine (`useIntervention.ts`)
Manages the state machine when a user is distracted.
*   **States**: `IDLE` -> `WARNING` -> `ALARM` -> `RECOVERY`.
*   **Recovery**: Generates dynamic tasks based on `session.workingOn` context.

### 3. Data Persistence (`userService.ts`)
*   Uses `localStorage` to emulate a NoSQL database (like Firestore).
*   **User Object**: Stores stats, tree level, and session history.
*   **Optimistic UI**: Updates UI immediately while saving to storage.

## Data Models

### User
```typescript
interface User {
  userId: string;
  totalFocusHours: number;
  treeLevel: number; // 1-5
  treeProgress: number; // 0-100%
  sessions: SessionRecord[];
  achievements: Achievement[];
}
```

### Session Record
```typescript
interface SessionRecord {
  id: string;
  duration: number;
  focusPercentage: number;
  distractionCount: number;
  distractionBreakdown: { phone: number, ... };
  insights: { positive: string, improvement: string };
}
```

## Performance Optimizations
1.  **Adaptive Polling**: Detection runs every 12s normally, but speeds up to 6s if a distraction is suspected.
2.  **Visibility API**: Detection pauses when the tab is not in focus (to save API quota).
3.  **Lazy Loading**: Routes are code-split using `React.lazy`.
