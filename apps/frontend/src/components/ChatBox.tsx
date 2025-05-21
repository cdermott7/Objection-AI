'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';

export default function ChatBox() {
  const { messages, isLoading, chatEnded, sendMessage, startChat, endChat } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom of messages whenever they change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    await startChat();
  };

  // Handle ending the chat
  const handleEndChat = () => {
    endChat();
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      {/* Chat header */}
      <div className="bg-indigo-600 text-white p-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">TuriCheck Chat</h2>
        {messages.length > 0 && !chatEnded ? (
          <button 
            onClick={handleEndChat}
            className="bg-white text-indigo-600 px-4 py-1 rounded-full text-sm font-medium"
          >
            End Chat
          </button>
        ) : (
          <span className="text-sm opacity-75">
            {chatEnded ? 'Chat ended' : 'Start a conversation'}
          </span>
        )}
      </div>
      
      {/* Messages area */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p className="mb-4 text-center">
              Start a chat to determine if you're talking to a human or AI.
            </p>
            <button
              onClick={handleStartChat}
              className="bg-indigo-600 text-white px-6 py-2 rounded-full font-medium"
            >
              Start New Chat
            </button>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
              >
                <div 
                  className={`inline-block rounded-lg py-2 px-4 max-w-xs break-words ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="text-left mb-4">
                <div className="bg-gray-200 text-gray-800 rounded-lg py-2 px-4 inline-block">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      {/* Input area */}
      <form 
        onSubmit={handleSubmit} 
        className={`p-4 border-t border-gray-200 flex ${chatEnded ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={chatEnded ? "Chat has ended" : "Type your message..."}
          disabled={chatEnded || messages.length === 0}
          className="flex-1 border border-gray-300 rounded-l-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading || chatEnded || messages.length === 0}
          className="bg-indigo-600 text-white px-4 py-2 rounded-r-lg font-medium disabled:bg-indigo-400"
        >
          Send
        </button>
      </form>
    </div>
  );
}