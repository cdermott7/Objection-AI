/**
 * LLM Client for TuriCheck
 * 
 * This module handles communication with the AI API (e.g., OpenAI, Claude)
 * Both for AI-generated responses and for simulating human responses
 */

const API_KEY = process.env.NEXT_PUBLIC_AI_API_KEY;
const API_URL = process.env.NEXT_PUBLIC_AI_API_URL || 'https://api.openai.com/v1/chat/completions';

// Message type for the chat history
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Query the AI API with a prompt and return the response
 * @param messages The array of messages to send to the API
 * @param isHuman Whether to simulate a human response
 * @returns The AI's (or simulated human's) response
 */
export async function queryAI(messages: Message[], isHuman: boolean = false): Promise<string> {
  // If we're in development mode and don't have an API key, return a mock response
  if (!API_KEY && process.env.NODE_ENV === 'development') {
    return mockResponse(messages[messages.length - 1].content, isHuman);
  }

  try {
    // Add system prompt to guide the AI's behavior based on whether it should act human or not
    const systemPrompt = isHuman
      ? "You are simulating a human response in a Turing test. Respond naturally, with occasional typos, varying response lengths, and human-like thinking patterns. Avoid being too perfect or systematic."
      : "You are an AI assistant helping with a Turing test. Respond in a helpful, concise manner typical of an AI. Be precise and somewhat formal, but conversational.";

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',  // Or other model ID
        messages: apiMessages,
        temperature: isHuman ? 0.9 : 0.5,  // Higher temperature for more human-like responses
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error querying AI API:', error);
    return 'Sorry, I encountered an error while processing your request.';
  }
}

/**
 * Mock response for development without an API key
 */
function mockResponse(prompt: string, isHuman: boolean): string {
  // Simple mock response system based on the prompt
  if (prompt.toLowerCase().includes('hello') || prompt.toLowerCase().includes('hi')) {
    return isHuman
      ? "Hey there! What's up?"
      : "Hello! How can I assist you today?";
  }
  
  if (prompt.toLowerCase().includes('how are you')) {
    return isHuman
      ? "I'm good, thanks for asking! Been a busy day but hanging in there. How about you?"
      : "I'm functioning well, thank you for asking! How can I help you?";
  }
  
  if (prompt.toLowerCase().includes('weather')) {
    return isHuman
      ? "Not sure about the exact forecast, but it looked pretty nice outside earlier. Why, are you planning to go out?"
      : "I don't have access to real-time weather data, but I'd be happy to help you find that information if you provide your location.";
  }
  
  // Default responses
  return isHuman
    ? "Hmm, interesting question. Let me think about that for a sec... I'd say it depends on context, but generally I think that makes sense. What do you think?"
    : "That's an interesting question. I don't have specific information about that, but I'd be happy to discuss it further or help you find relevant information.";
}