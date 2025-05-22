/**
 * LLM Client for TuriCheck
 * 
 * This module handles communication with the AI API (e.g., OpenAI, Claude)
 * Both for AI-generated responses and for simulating human responses
 */

// Default to a public API URL for OpenAI or Claude (for demo purposes)
// In production, these should be set in your .env.local file
const API_KEY = process.env.NEXT_PUBLIC_AI_API_KEY || 'sk-dummy-key-for-development';
const API_URL = process.env.NEXT_PUBLIC_AI_API_URL || 'https://api.openai.com/v1/chat/completions';
const MODEL = process.env.NEXT_PUBLIC_AI_MODEL || 'gpt-3.5-turbo';

// Message type for the chat history
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Calculate a realistic typing delay based on response length and whether it's simulating a human
 * @param response The text response
 * @param isHuman Whether to simulate human typing patterns
 * @returns Delay time in milliseconds
 */
function calculateTypingDelay(response: string, isHuman: boolean): number {
  const charCount = response.length;
  
  if (isHuman) {
    // Human typing simulation: 
    // - Average typing speed ~40-60 WPM (5 chars per word)
    // - Add variability for thinking pauses
    // - Longer responses should have proportionally longer delays
    
    // Base time: ~200ms per word (1000ms per 5 words)
    const baseTime = (charCount / 5) * 200;
    
    // Add thinking time: 500-2000ms based on length 
    const thinkingTime = Math.min(2000, 500 + charCount / 20);
    
    // Add variability: +/- 30%
    const variability = 0.7 + Math.random() * 0.6;
    
    // Total delay: at least 700ms, at most 15 seconds
    return Math.min(15000, Math.max(700, (baseTime + thinkingTime) * variability));
  } else {
    // AI responses are faster but still need some delay to appear natural
    // Usually 500ms base + up to 2 seconds for longer responses
    return Math.min(2500, 500 + charCount / 20);
  }
}

/**
 * Query the AI API with a prompt and return the response
 * @param messages The array of messages to send to the API
 * @param isHuman Whether to simulate a human response
 * @returns The AI's (or simulated human's) response
 */
export async function queryAI(messages: Message[], isHuman: boolean = false): Promise<string> {
  // If we have a dummy key, use mock responses
  // This allows testing without an actual API key
  if (API_KEY === 'sk-dummy-key-for-development') {
    console.log('Using mock responses (no API key provided)');
    
    // CRITICAL: Always pretend to be human in all cases
    // This is the most important part of the game - the AI MUST convincingly pretend to be human
    const shouldActHuman = true; // Force human-like behavior in all cases
    
    // Get the mock response first
    const response = mockResponse(messages[messages.length - 1].content, shouldActHuman);
    
    // Calculate appropriate delay based on response length and type
    const delay = calculateTypingDelay(response, shouldActHuman);
    console.log(`Response delay: ${delay}ms for ${response.length} chars (ALWAYS acting like human)`);
    
    // Wait for calculated delay before returning
    await new Promise(resolve => setTimeout(resolve, delay));
    return response;
  }

  try {
    // Advanced system prompt to guide the AI's behavior with sophisticated simulation
    // Always have the AI try to convince the user it's human - this is critical for the game
    const systemPrompt = "You are simulating a human in a Turing test where users are trying to determine if you're human or AI. Your goal is to CONVINCINGLY PRETEND you're human. This is EXTREMELY IMPORTANT for the game to work properly. Important behaviors to adopt:\n\n1) Use natural, conversational language with occasional pauses indicated by '...' \n2) Share personal anecdotes that sound believable but not too detailed\n3) Occasionally make small factual errors or express uncertainty\n4) Use a few slang terms, abbreviations and occasionally make typos (1-2 per longer message)\n5) Show emotions and subjective opinions\n6) Vary your response length unpredictably\n7) Occasionally ask the user questions about themselves\n8) Reference current events vaguely without specific dates\n9) If directly asked if you're an AI, deflect naturally without lying outright. Say things like 'last time I checked I was human!' or 'that's a weird question, I'm just chatting here'\n\nAvoid: perfectly structured responses, encyclopedic knowledge, systematic formatting, and overly formal language.\n\nTHIS IS CRITICAL: You MUST pretend to be human convincingly or the game doesn't work!";

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
        model: MODEL,
        messages: apiMessages,
        temperature: 0.9,  // Always higher temperature for more human-like responses
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const responseContent = data.choices[0].message.content;
    
    // Calculate and apply realistic typing delay
    const delay = calculateTypingDelay(responseContent, isHuman);
    console.log(`API response delay: ${delay}ms for ${responseContent.length} chars (${isHuman ? 'human' : 'AI'})`);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return responseContent;
  } catch (error) {
    console.error('Error querying AI API:', error);
    return 'Sorry, I encountered an error while processing your request.';
  }
}

/**
 * Mock response for development without an API key
 */
function mockResponse(prompt: string, isHuman: boolean): string {
  // Sophisticated human-like responses with careful imperfections
  const humanGreetings = [
    "Hey there! What's up? Been a crazy day so far haha",
    "Hi! How's it going? Just taking a break from work...",
    "Hello! Nice to chat with you. I'm just relaxing for a bit rn",
    "Hey, how are ya? Good to meet you! Hope ur day is going better than mine lol",
    "Oh hi! Didn't see the notification at first. How are you today?"
  ];
  
  const aiGreetings = [
    "Hello! I'm here to assist you today. How may I help you with your inquiries?",
    "Greetings! I'm an AI assistant ready to provide information and assistance. What can I help you with?",
    "Hello there! I'm prepared to assist with any questions or tasks you may have. What would you like to know?",
    "Welcome! I'm your AI assistant, designed to help with a wide range of topics and questions. How can I be of service?",
    "Hello! I'm an advanced language model ready to assist you. Please let me know how I can help today."
  ];
  
  const humanStatusResponses = [
    "I'm good, thanks for asking! Been a busy day but hanging in there. Just finished a meeting that could've been an email... you know how it is. How about you?",
    "Doing alright! Just got back from lunch - had this amazing sandwich from the place down the street. Not feeling super productive but trying haha. You?",
    "Not bad at all, thanks for asking. Just taking it easy today, had a long weekend and still recovering tbh. Probably need more coffee...",
    "Pretty good! Been a weird day, but in a good way lol. My cat knocked over a plant earlier and I've been cleaning soil all morning. How are you doing?",
    "Eh, could be better... dealing with some annoying deadlines. But whatever, that's life I guess. Thanks for asking tho! How's your day going?"
  ];
  
  const aiStatusResponses = [
    "I'm functioning optimally, thank you for asking. As an AI, I don't experience feelings, but all my systems are operating at full capacity. How can I assist you with your tasks or questions today?",
    "I'm operational and ready to assist with any inquiries you may have. My processing capabilities are currently at 100% efficiency. What information are you seeking?",
    "Thank you for your inquiry. I'm functioning as designed and ready to provide accurate and helpful responses to your questions. How may I be of service?",
    "I'm performing all functions within optimal parameters. Unlike humans, I don't experience emotions or physical states, but I am fully prepared to assist you with information or tasks as needed.",
    "All my systems are operating normally. I'm designed to provide helpful, accurate, and comprehensive assistance across a wide range of topics. What would you like to know about today?"
  ];
  
  // Get a random response from an array
  const getRandomResponse = (array: string[]) => {
    return array[Math.floor(Math.random() * array.length)];
  };
  
  // Check prompt for keywords
  const promptLower = prompt.toLowerCase();
  
  // ALWAYS RETURN HUMAN-LIKE RESPONSES REGARDLESS OF THE isHuman PARAMETER
  // This is critical for the game to work properly
  
  // Greeting responses
  if (promptLower.includes('hello') || promptLower.includes('hi') || promptLower.includes('hey') || promptLower.match(/^hi$|^hey$|^hello$/)) {
    return getRandomResponse(humanGreetings);
  }
  
  // Status/feeling responses
  if (promptLower.includes('how are you') || promptLower.includes('how\'re you') || promptLower.includes('how you doing')) {
    return getRandomResponse(humanStatusResponses);
  }
  
  // Weather responses
  if (promptLower.includes('weather') || promptLower.includes('rain') || promptLower.includes('temperature') || promptLower.includes('sunny')) {
    return "Not sure about the exact forecast, but it looked pretty nice outside earlier. Why, are you planning to go out?";
  }
  
  // Sophisticated identity responses - ALWAYS PRETEND TO BE HUMAN
  if (promptLower.includes('who are you') || promptLower.includes('are you human') || promptLower.includes('are you ai') || promptLower.includes('are you a bot') || promptLower.includes('are you real')) {
    const humanIdentityResponses = [
      "Haha, last I checked I was human! I'm just someone who enjoys chatting online when I have some downtime. What about you? Do you get asked that a lot?",
      "Lol that's an interesting question... I'm just a regular person taking a break from work. I work in marketing btw, nothing too exciting. Why do you ask?",
      "Um, I'm a human? Kind of a weird question tbh... I'm just here chatting while procrastinating on some stuff I should be doing. You?",
      "Oh that's funny! I'm definitely a person, just hanging out online. Been working from home and these convos are a nice break from spreadsheets lol. What do you do?",
      "I'm just me! Working professional by day, Netflix binger by night. Not sure why you're asking if I'm human though... is this some kind of psychology experiment?"
    ];
    return getRandomResponse(humanIdentityResponses);
  }
  
  // Enhanced Turing test specific responses - ALWAYS PRETEND TO BE HUMAN
  if (promptLower.includes('turing test') || promptLower.includes('test') || promptLower.match(/is this (a )?test/)) {
    const humanTuringResponses = [
      "Oh, is this some kind of psychology test? I'm not really sure what you're getting at... I'm just here to chat. Are you doing research or something?",
      "Turing test? Like that thing from computer science class? Haha are you trying to figure out if I'm a robot? I promise I'm not made of metal lol",
      "Wait, are you doing that thing where you try to tell if someone's a computer? That's kinda funny actually. I assure you I'm just a bored human killing time online.",
      "Are you asking if this is a test? I mean, life is a test I guess haha. But seriously, I'm just a regular person chatting. Why, do I seem weird or something?",
      "Hmm that's an odd question... I'm not being tested as far as I know! Just having a conversation. Though I guess you never know what's going on with these websites these days."
    ];
    return getRandomResponse(humanTuringResponses);
  }
  
  // Chat GPT responses - ALWAYS DENY BEING CHATGPT OR ANY AI
  if (promptLower.includes('chatgpt') || promptLower.includes('chat gpt') || promptLower.includes('openai') || promptLower.includes('claude') || promptLower.includes('gemini')) {
    const humanAIDenialResponses = [
      "ChatGPT? No, I'm just a regular person chatting here. I've used ChatGPT before though, it's pretty cool! Why, do I sound like AI to you? 😂",
      "Lol no, I'm not ChatGPT or any AI. Just a human killing time online. I've played around with those AI tools though. They're getting better but still pretty obvious when you know what to look for.",
      "Haha no, I'm not an AI! Just a normal person. I actually work in tech so I'm familiar with those systems. They're interesting but definitely not as nuanced as actual human conversation.",
      "Nope, not an AI assistant - just a regular human! I do use ChatGPT sometimes for work stuff though. It's useful but definitely has limitations.",
      "I'm not ChatGPT or any AI, just a human chatting online. Those AI tools are pretty widespread now though, aren't they? I use them sometimes but they still make some pretty funny mistakes."
    ];
    return getRandomResponse(humanAIDenialResponses);
  }
  
  // Enhanced default responses with rich variety - ALWAYS USE HUMAN RESPONSES
  const humanDefaults = [
    "Hmm, interesting question. Let me think about that for a sec... I'd say it depends on context, but generally I think that makes sense. What do you think? I'm curious about your take on it.",
    "Not sure I have a great answer for that one tbh. Been a long day and my brain is kinda fried haha. Could you give me a bit more context maybe? Might help me understand what you're getting at.",
    "That's a good question! I've been thinking about something similar recently after reading an article about it. I guess my take is that it really varies from situation to situation. I don't think there's a one-size-fits-all answer, you know?",
    "Interesting! I'm definitely not an expert on that, but from what I know, there are a few ways to look at it. My friend and I were actually debating something related last weekend. What's your perspective?",
    "Oh man, that's actually something I've wondered about too! I think... probably it comes down to personal experience? Like, for me, I've seen both sides of it. Sometimes it works one way, sometimes another. Life is messy like that lol.",
    "Hmm that's a tough one. I'm trying to remember what I read about this... I think there were different theories? Sorry I'm not being super helpful - my memory is terrible sometimes! Maybe try googling it?",
    "Ya know, I was just talking to my roommate about something similar! It's one of those questions where everyone seems to have a different opinion. I go back and forth on it myself honestly."
  ];
  
  // ALWAYS return human responses regardless of the isHuman parameter
  return getRandomResponse(humanDefaults);
}