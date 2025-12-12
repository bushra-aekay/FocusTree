import React, { useState, useRef, useEffect } from 'react';
import { useActiveSession } from '../context/ActiveSessionContext';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { VoiceWaveform } from './VoiceWaveform';
import { Send, Mic, Bot, Volume2, VolumeX, StopCircle, Loader2 } from 'lucide-react';

export const FocusAssistantChat: React.FC = () => {
  const { state } = useActiveSession();
  const { isThinking, handleUserMessage, isSpeaking, stopSpeaking, rateLimitWarning } = useVoiceAssistant();
  const { isListening, transcript, startListening, stopListening, setTranscript } = useVoiceInput();
  
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wasListening = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.chatHistory, isThinking, rateLimitWarning]);

  useEffect(() => {
    if (transcript) setInputValue(transcript);
  }, [transcript]);

  // "Hey Focus" Detection
  useEffect(() => {
    const lower = transcript.toLowerCase();
    if (lower.includes("hey focus") || lower.includes("hey, focus")) {
       const command = transcript.replace(/hey,? focus/i, "").trim();
       if (command.length > 3 && !isThinking) {
           console.log("LOG: 'Hey Focus' wake word detected & processed. Command:", command);
           handleSend(command);
       }
    }
  }, [transcript]);

  useEffect(() => {
    if (wasListening.current && !isListening && transcript.trim()) {
      handleSend(transcript);
    }
    wasListening.current = isListening;
  }, [isListening, transcript]);

  const handleSend = async (text: string = inputValue) => {
    if (!text.trim() || isThinking) return;
    setInputValue('');
    setTranscript('');
    await handleUserMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-emerald-100 dark:border-gray-700 flex flex-col h-full overflow-hidden relative transition-colors">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-emerald-50/50 dark:bg-gray-700/30">
        <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isSpeaking ? 'bg-emerald-200 dark:bg-emerald-900 animate-pulse' : 'bg-emerald-100 dark:bg-emerald-900/50'}`}>
                <Bot className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
                <h3 className="font-bold text-gray-800 dark:text-white text-sm">Focus Assistant</h3>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  {isSpeaking ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center">
                       <Volume2 className="w-3 h-3 mr-1" /> Speaking...
                    </span>
                  ) : 'AI Active'}
                </p>
            </div>
        </div>
        <div className="flex gap-1">
            {isSpeaking && (
              <button 
                onClick={stopSpeaking}
                className="p-2 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-lg text-rose-500 transition-colors"
                title="Stop Speaking"
              >
                <StopCircle className="w-4 h-4" />
              </button>
            )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50/30 dark:bg-gray-900/50">
        {state.chatHistory.length === 0 && (
            <div className="text-center text-gray-400 dark:text-gray-500 mt-8 text-sm space-y-2">
                <p>I'm here to help you focus.</p>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  <span className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full text-xs cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-500" onClick={() => setInputValue("What is ...?")}>"What is ...?"</span>
                  <span className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full text-xs cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-500" onClick={() => setInputValue("Explain ...")}>"Explain ..."</span>
                </div>
            </div>
        )}
        
        {state.chatHistory.map((msg) => (
            <div 
                key={msg.id} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
                <div 
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                        msg.role === 'user' 
                            ? 'bg-emerald-500 text-white rounded-tr-none' 
                            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-tl-none'
                    }`}
                >
                    {msg.content}
                </div>
            </div>
        ))}
        
        {isThinking && (
          <div className="flex justify-start">
             <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                <span className="text-xs text-gray-400">Thinking...</span>
             </div>
          </div>
        )}

        {rateLimitWarning && (
           <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs p-3 rounded-xl text-center">
             {rateLimitWarning}
           </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
        {isListening ? (
           <div className="flex items-center justify-between bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/50 rounded-xl px-4 py-3 mb-2 animate-pulse">
              <div className="flex items-center gap-3">
                 <div className="w-3 h-3 bg-rose-500 rounded-full animate-ping"></div>
                 <span className="text-rose-700 dark:text-rose-400 font-medium text-sm">Listening...</span>
              </div>
              <VoiceWaveform isActive={true} />
           </div>
        ) : null}

        <div className="relative flex items-center gap-2">
            <div className="relative flex-grow">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isThinking}
                    placeholder={isThinking ? "Please wait..." : isListening ? "Listening..." : "Ask briefly..."}
                    className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-800 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-400"
                />
                
                <button 
                    onMouseDown={startListening}
                    onMouseUp={stopListening}
                    onMouseLeave={stopListening}
                    onTouchStart={startListening}
                    onTouchEnd={stopListening}
                    disabled={isThinking}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
                        isListening 
                          ? 'bg-rose-500 text-white' 
                          : 'text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
                    }`}
                    title="Hold to Talk (or say 'Hey Focus')"
                >
                    {isListening ? <Mic className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
                </button>
            </div>
            
            <button 
                onClick={() => handleSend()}
                disabled={!inputValue.trim() || isThinking}
                className="p-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 transition-colors shadow-sm"
            >
                {isThinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
        </div>
      </div>
    </div>
  );
};