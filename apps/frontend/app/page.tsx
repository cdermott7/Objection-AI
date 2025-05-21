'use client';

import { useContext } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthContext from '../src/context/AuthContext';
import { useChat } from '../src/context/ChatContext';
import ChatBox from '../src/components/ChatBox';
import GuessForm from '../src/components/GuessForm';

export default function Home() {
  const { user, signOut } = useContext(AuthContext);
  const { chatEnded } = useChat();
  const router = useRouter();
  
  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };
  
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      {/* Header */}
      <header className="max-w-5xl mx-auto flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-indigo-600">TuriCheck</h1>
        
        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-gray-600">
              {user.email}
            </span>
            <Link
              href="/profile"
              className="text-indigo-600 hover:text-indigo-800"
            >
              My Badges
            </Link>
            <button 
              onClick={handleLogout}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button 
            onClick={() => router.push('/login')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            Sign In
          </button>
        )}
      </header>
      
      <main className="max-w-5xl mx-auto">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold mb-2">Human or AI?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Chat with the mysterious entity and try to determine if you're talking to a human or an AI.
            After a brief conversation, make your guess and collect your badge!
          </p>
        </div>
        
        {/* Main content */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="h-[500px] flex flex-col">
            <ChatBox />
          </div>
          
          <div className="flex items-center justify-center">
            {chatEnded ? (
              <GuessForm />
            ) : (
              <div className="text-center p-6 bg-white rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">How to play</h3>
                <ol className="text-left space-y-3 text-gray-600">
                  <li className="flex items-start">
                    <span className="bg-indigo-100 text-indigo-800 w-6 h-6 rounded-full flex items-center justify-center mr-2 flex-shrink-0">1</span>
                    <span>Start a new chat using the button on the left</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-indigo-100 text-indigo-800 w-6 h-6 rounded-full flex items-center justify-center mr-2 flex-shrink-0">2</span>
                    <span>Have a conversation to determine if you're talking to a human or AI</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-indigo-100 text-indigo-800 w-6 h-6 rounded-full flex items-center justify-center mr-2 flex-shrink-0">3</span>
                    <span>Click "End Chat" when you're ready to make your guess</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-indigo-100 text-indigo-800 w-6 h-6 rounded-full flex items-center justify-center mr-2 flex-shrink-0">4</span>
                    <span>Select Human or AI and submit your guess</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-indigo-100 text-indigo-800 w-6 h-6 rounded-full flex items-center justify-center mr-2 flex-shrink-0">5</span>
                    <span>Mint your badge NFT to commemorate your result!</span>
                  </li>
                </ol>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <footer className="max-w-5xl mx-auto mt-12 py-6 text-center text-gray-500 text-sm">
        <p>TuriCheck - A Sui blockchain project for testing Human vs AI recognition</p>
      </footer>
    </div>
  );
}
