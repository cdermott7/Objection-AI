'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat, GameMode } from '../context/ChatContext';
import AceAttorneyChat from './AceAttorneyChat';

export default function ChatBox() {
  const { messages, isLoading, chatEnded, timeRemaining, chatPartnerType, sendMessage, startChat, endChat, gameMode } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [startingChat, setStartingChat] = useState(false);
  
  // Check if we're in Ace Attorney mode
  const isAceAttorneyMode = gameMode === GameMode.ACE_ATTORNEY;
  
  // Debug logging for game mode
  useEffect(() => {
    console.log('ChatBox: Current game mode:', { 
      gameMode, 
      isAceAttorneyMode,
      standardMode: GameMode.STANDARD, 
      aceAttorneyMode: GameMode.ACE_ATTORNEY 
    });
  }, [gameMode, isAceAttorneyMode]);
  
  // Scroll to bottom of messages whenever they change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle Ace Attorney mode body class and apply full-screen styles
  useEffect(() => {
    if (isAceAttorneyMode) {
      // Add the ace-attorney-mode class to the body
      document.body.classList.add('ace-attorney-mode');
      
      // Add CSS variables for Ace Attorney styling
      document.documentElement.style.setProperty('--aa-mode', 'true');
      
      // Hide all site elements except the Ace Attorney UI
      const nonAaElements = document.querySelectorAll('header, footer, nav, aside, .page-wrapper, [class*="layout"], [class*="container"]');
      nonAaElements.forEach(el => {
        if (el) el.classList.add('non-aa-content');
      });
      
      // Make the main element take up the full screen
      const mainElement = document.querySelector('main');
      if (mainElement) {
        mainElement.classList.add('aa-main');
        // Ensure main has correct styles
        mainElement.style.padding = '0';
        mainElement.style.margin = '0';
        mainElement.style.width = '100vw';
        mainElement.style.height = '100vh';
        mainElement.style.maxWidth = 'none';
        mainElement.style.overflow = 'hidden';
      }
      
      // Force app layout to be full screen
      const appElement = document.querySelector('#__next') || document.querySelector('#app');
      if (appElement) {
        appElement.style.height = '100vh';
        appElement.style.width = '100vw';
        appElement.style.maxWidth = 'none';
        appElement.style.padding = '0';
        appElement.style.margin = '0';
        appElement.style.overflow = 'hidden';
      }
      
    } else {
      // Remove the Ace Attorney mode classes
      document.body.classList.remove('ace-attorney-mode');
      document.documentElement.style.removeProperty('--aa-mode');
      
      // Show all main content elements
      const nonAaElements = document.querySelectorAll('.non-aa-content');
      nonAaElements.forEach(el => {
        el.classList.remove('non-aa-content');
      });
      
      // Restore the main element styles
      const mainElement = document.querySelector('main');
      if (mainElement) {
        mainElement.classList.remove('aa-main');
        mainElement.style.removeProperty('padding');
        mainElement.style.removeProperty('margin');
        mainElement.style.removeProperty('width');
        mainElement.style.removeProperty('height');
        mainElement.style.removeProperty('max-width');
        mainElement.style.removeProperty('overflow');
      }
      
      // Restore app layout
      const appElement = document.querySelector('#__next') || document.querySelector('#app');
      if (appElement) {
        appElement.style.removeProperty('height');
        appElement.style.removeProperty('width');
        appElement.style.removeProperty('max-width');
        appElement.style.removeProperty('padding');
        appElement.style.removeProperty('margin');
        appElement.style.removeProperty('overflow');
      }
    }
    
    return () => {
      // Clean up when component unmounts
      document.body.classList.remove('ace-attorney-mode');
      document.documentElement.style.removeProperty('--aa-mode');
      
      const nonAaElements = document.querySelectorAll('.non-aa-content');
      nonAaElements.forEach(el => {
        el.classList.remove('non-aa-content');
      });
      
      const mainElement = document.querySelector('main');
      if (mainElement) {
        mainElement.classList.remove('aa-main');
        mainElement.style.removeProperty('padding');
        mainElement.style.removeProperty('margin');
        mainElement.style.removeProperty('width');
        mainElement.style.removeProperty('height');
        mainElement.style.removeProperty('max-width');
        mainElement.style.removeProperty('overflow');
      }
      
      // Restore app layout
      const appElement = document.querySelector('#__next') || document.querySelector('#app');
      if (appElement) {
        appElement.style.removeProperty('height');
        appElement.style.removeProperty('width');
        appElement.style.removeProperty('max-width');
        appElement.style.removeProperty('padding');
        appElement.style.removeProperty('margin');
        appElement.style.removeProperty('overflow');
      }
    };
  }, [isAceAttorneyMode]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const message = input.trim();
    setInput('');
    await sendMessage(message);
  };

  // Handle starting a new chat
  const handleStartChat = async () => {
    setStartingChat(true);
    try {
      await startChat();
    } catch (error) {
      console.error('Error starting chat:', error);
    } finally {
      setStartingChat(false);
    }
  };

  // Handle ending the chat
  const handleEndChat = () => {
    endChat();
  };

  // Render Ace Attorney Chat if in Ace Attorney mode
  if (isAceAttorneyMode) {
    console.log('ChatBox: Rendering Ace Attorney mode');
    
    return (
      <div className="w-full h-full bg-black overflow-hidden fixed inset-0 z-[9999] ace-attorney-content">
        <AceAttorneyChat />
        
        {/* Exit button positioned absolutely */}
        <button 
          onClick={() => {
            if (typeof window !== 'undefined') {
              localStorage.removeItem('turiCheckGameMode');
              window.location.reload();
            }
          }}
          className="fixed top-2 right-2 bg-red-600 text-white px-3 py-1 rounded-md z-[10000] shadow-lg"
          style={{ zIndex: 10000 }}
        >
          EXIT COURT
        </button>
      </div>
    );
  }
  
  // Otherwise, render standard chat
  return (
    <div className="flex flex-col h-full w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
      {/* Premium Chat header */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-500 text-white p-5 flex justify-between items-center">
        <div className="flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <h2 className="text-xl font-bold tracking-tight">TuriCheck</h2>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Timer display */}
          {messages.length > 0 && !chatEnded && (
            <div className={`flex items-center ${timeRemaining <= 10 ? 'text-red-100 animate-pulse' : ''}`}>
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-mono font-semibold">{timeRemaining}s</span>
            </div>
          )}
          
          {messages.length > 0 && !chatEnded ? (
            <button 
              onClick={handleEndChat}
              className="bg-white text-indigo-600 px-5 py-1.5 rounded-full text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200"
            >
              End Chat
            </button>
          ) : (
            <span className="text-sm opacity-80 font-medium">
              {chatEnded ? 'Chat ended' : 'Human or AI?'}
            </span>
          )}
        </div>
      </div>
      
      {/* Messages area with refined styling */}
      <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-b from-gray-50 to-white">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="mb-6 w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-800">Test Your Perception</h3>
            <p className="mb-5 text-gray-600 max-w-sm">
              Start a chat and try to determine if you're talking to a human or an AI. 
              <span className="block mt-2 font-medium">You'll have just 60 seconds to chat before making your guess!</span>
            </p>
            <button
              onClick={handleStartChat}
              disabled={startingChat}
              className="bg-gradient-to-r from-indigo-600 to-violet-500 text-white px-8 py-3 rounded-full font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:transform-none"
            >
              {startingChat ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting...
                </div>
              ) : 'Start New Conversation'}
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role !== 'user' && (
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 flex items-center justify-center mr-2 mt-1 shadow-sm">
                      <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10c0 5.523 4.477 10 10 10s10-4.477 10-10C20 4.477 15.523 0 10 0zM4 10a6 6 0 1112 0 6 6 0 01-12 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <div 
                    className={`inline-block rounded-2xl py-3 px-4 max-w-sm shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-tr-none'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                    }`}
                  >
                    <p className="leading-relaxed">{msg.content}</p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-700 flex items-center justify-center ml-2 mt-1 shadow-sm">
                      <span className="text-xs font-medium text-white">You</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {isLoading && (
              <div className="flex justify-start mt-4">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 flex items-center justify-center mr-2 shadow-sm">
                  <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10c0 5.523 4.477 10 10 10s10-4.477 10-10C20 4.477 15.523 0 10 0zM4 10a6 6 0 1112 0 6 6 0 01-12 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none py-3 px-4 shadow-sm">
                  <div className="inline-flex items-center">
                    <span className="text-gray-500 text-sm font-medium mr-2">
                      {chatPartnerType === 'human' ? 'Typing...' : 'Processing...'}
                    </span>
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></div>
                      <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      {/* Premium Input area */}
      <form 
        onSubmit={handleSubmit} 
        className={`p-5 bg-white border-t border-gray-100 flex items-center ${chatEnded ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <div className="flex-1 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={chatEnded ? "Chat has ended" : "Type your message..."}
            disabled={chatEnded || messages.length === 0}
            className="w-full border border-gray-200 rounded-full py-3 px-4 pl-5 pr-16 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading || chatEnded || messages.length === 0}
            className="absolute right-1 top-1 bottom-1 bg-gradient-to-r from-indigo-600 to-violet-500 text-white px-4 rounded-full font-medium shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center disabled:opacity-70"
          >
            <span className="mr-1">Send</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}