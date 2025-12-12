# FocusTree - Demo Script 🎬

**Target Audience:** Hackathon Judges
**Duration:** 3 Minutes
**Theme:** "Saving your focus, one tree at a time."

---

### 0:00 - The Hook (Problem)
*"We all know the struggle. You sit down to work, and 5 minutes later... you're on your phone. Focus is broken. We built **FocusTree** to fix this using Multimodal AI."*

### 0:30 - The Setup (User Flow)
*(Screen: Landing Page -> Login -> Dashboard)*
1.  **Login**: *"I sign in (mocked for demo). Here is my dashboard."*
2.  **Gamification**: *"Meet my Tree. It's currently a sapling (Level 2). The more I focus, the bigger it grows."*
3.  **Start Session**: *"Let's start a session. I choose 'Focused Mode' - balanced friction."*
4.  **Configuration**: *"I tell the AI I'm working on 'Hackathon Demo Script'. This context is crucial."*
5.  **Permissions**: *"Permissions granted. Let's go."*

### 1:00 - The Core (AI Monitoring)
*(Screen: Active Session)*
1.  **Webcam Feed**: *"You see me working. The AI is analyzing frames in the background using Gemini 2.5 Flash."*
2.  **Distraction Test**: *"Watch what happens when I pick up my phone."*
    *   *(Action: Pick up phone and look at it)*
    *   *(Wait 3-5 seconds)*
    *   *(App triggers Warning Overlay + Voice Alert)*
3.  **The Intervention**: *"I got caught! The app detected a 'Phone Distraction'. Now, instead of just beeping, it helps me recover."*

### 1:45 - Smart Recovery (GenAI)
*(Screen: Distraction Overlay)*
1.  **Context Aware**: *"Because I told it I was writing a script, the AI generates a relevant micro-task to pull me back."*
    *   *(Show Task: "List the next 3 scenes for your script.")*
2.  **Validation**: *"I type the answer. Gemini validates it to ensure I'm actually back in the zone. Success! I'm back."*

### 2:15 - AI Assistant & Voice
*(Screen: Active Session Chat)*
1.  **Voice Interaction**: *"I have a quick question but don't want to open a new tab and get distracted."*
    *   *(Action: Hold Mic)*
    *   *(Say: "What is the Pomodoro technique?")*
2.  **Response**: *"The AI answers briefly via TTS and immediately tells me to get back to work. No rabbit holes."*

### 2:45 - Summary & Closing
*(Screen: Session Summary)*
1.  **End Session**: *"Let's wrap up."*
2.  **Growth**: *"Look! My tree grew because I recovered successfully."*
3.  **Insights**: *"The AI analyzes my session: 'You struggle with phone distractions 10 minutes in.'"*
4.  **Closing**: *"FocusTree isn't just a timer. It's an active, intelligent partner in your productivity. Thank you!"*

---

**Potential Judge Questions:**
*   **Q: Is video sent to the server?**
    *   A: Frames are sent to the Gemini API for analysis but are stateless and not stored by us.
*   **Q: What if I cover the camera?**
    *   A: The AI detects "Person not found" or "Camera blocked" and can pause the session (configurable).
