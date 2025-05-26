'use client';

import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthContext from '../src/context/AuthContext';
import { useChat, GameMode } from '../src/context/ChatContext';
import ChatBox from '../src/components/ChatBox';
import GuessForm from '../src/components/GuessForm';
import StakeForm from '../src/components/StakeForm';
import SimpleAceAttorneyToggle from '../src/components/SimpleAceAttorneyToggle';
import { useMockWallet } from '../src/context/MockWalletContext';
import { useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit';

export default function Home() {
  const { signOut } = useContext(AuthContext);
  const { chatEnded, sessionId, startChat } = useChat();
  const router = useRouter();
  const [showStakeForm, setShowStakeForm] = useState(false);
  
  // Check both real and mock wallet
  const currentAccount = useCurrentAccount();
  const { mutate: disconnectWallet } = useDisconnectWallet();
  const { isConnected: isMockConnected, address: mockAddress, disconnect: disconnectMock } = useMockWallet();
  
  // Combined wallet state
  const isWalletConnected = !!currentAccount;
  const isConnected = isWalletConnected || isMockConnected;
  const walletAddress = currentAccount?.address || mockAddress;
  
  // Redirect to login if not connected
  useEffect(() => {
    if (!isConnected) {
      router.push('/login');
    }
  }, [isConnected, router]);
  
  const handleLogout = async () => {
    // Disconnect appropriate wallet
    if (isWalletConnected) {
      disconnectWallet();
    } else if (isMockConnected) {
      disconnectMock();
    }
    
    // Also call signOut for compatibility
    await signOut();
    router.push('/login');
  };
  
  if (!isConnected) {
    return null; // Will redirect to login
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Premium Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">Objection! AI</h1>
            </div>
            
            {isConnected ? (
              <div className="flex items-center gap-5">
                <div className="flex items-center text-gray-700">
                  <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-sm font-medium truncate max-w-[150px]">
                    {walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}` : 'Connected'}
                  </span>
                </div>
                
                <div className="text-indigo-600 font-medium text-sm flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  My Wallet
                </div>
                
                <button 
                  onClick={handleLogout}
                  className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 shadow-sm text-sm font-medium transition-all duration-150"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button 
                onClick={() => router.push('/login')}
                className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-2 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-medium"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Hero Section */}
        <div className="mb-14 text-center relative">
          <div className="absolute inset-0 flex justify-center">
            <div className="w-full max-w-lg h-56 bg-gradient-to-r from-indigo-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative">
            <h2 className="text-4xl font-bold mb-4 text-gray-800">Human or <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">AI?</span></h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Step into the courtroom for the ultimate Turing test! Present your case, analyze responses, and determine if you're facing a human or AI opponent. Can you prove your case beyond reasonable doubt?
            </p>
            
            <div className="mt-6 flex items-center justify-center space-x-4">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="ml-2 text-gray-600">Blockchain Secured</span>
              </div>
              
              <div className="flex items-center">
                <svg className="h-5 w-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="ml-2 text-gray-600">NFT Badges</span>
              </div>
              
              <div className="flex items-center">
                <svg className="h-5 w-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="ml-2 text-gray-600">AI-Powered</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="max-w-3xl mx-auto">
          {chatEnded ? (
            <div className="flex justify-center">
              <GuessForm />
            </div>
          ) : sessionId ? (
            <div className="h-[600px] flex flex-col">
              <ChatBox />
            </div>
          ) : showStakeForm ? (
            <div className="flex justify-center">
              <StakeForm onStakeSubmit={(amount) => {
                console.log(`Starting game with stake: ${amount} SUI`);
                startChat(amount);
              }} />
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-50 rounded-full opacity-50"></div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-50 rounded-full opacity-50"></div>
              
              <div className="relative">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold mb-4 text-center text-gray-800">Choose Game Mode</h3>
                
                <div className="flex flex-col md:flex-row justify-center gap-6 mb-8">
                  {/* Standard Mode Card */}
                  <div 
                    onClick={() => {
                      localStorage.setItem('objectionAIGameMode', GameMode.STANDARD);
                      setShowStakeForm(true);
                    }}
                    className="bg-white border-2 border-indigo-100 hover:border-indigo-500 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col items-center max-w-xs"
                  >
                    <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <h4 className="font-bold text-lg mb-2 text-gray-800">Standard Chat Mode</h4>
                    <p className="text-gray-600 text-sm text-center mb-4">
                      Engage in a natural conversation. Analyze responses to determine if your chat partner is human or AI.
                    </p>
                    <span className="px-4 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                      Free-form conversation
                    </span>
                  </div>
                  
                  {/* Ace Attorney Mode Card */}
                  <div 
                    onClick={() => {
                      localStorage.setItem('objectionAIGameMode', GameMode.ACE_ATTORNEY);
                      window.location.href = '/ace-attorney-mode';
                    }}
                    className="bg-white border-2 border-red-100 hover:border-red-500 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col items-center max-w-xs"
                  >
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <h4 className="font-bold text-lg mb-2 text-gray-800">Ace Attorney Mode</h4>
                    <p className="text-gray-600 text-sm text-center mb-4">
                      Courtroom drama style with structured questions. Decide if the prosecutor Edgeworth is human or AI.
                    </p>
                    <span className="px-4 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                      5 structured questions
                    </span>
                  </div>
                </div>
                
                <h4 className="text-xl font-semibold mb-3 text-center text-gray-800">How to Play</h4>
                
                <ol className="space-y-5">
                  <li className="flex items-start">
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold text-lg mr-3">1</div>
                    <div>
                      <p className="font-medium text-gray-800">Stake SUI tokens</p>
                      <p className="text-gray-600 text-sm">Stake SUI on your ability to distinguish human from AI</p>
                    </div>
                  </li>
                  
                  <li className="flex items-start">
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold text-lg mr-3">2</div>
                    <div>
                      <p className="font-medium text-gray-800">Chat and analyze</p>
                      <p className="text-gray-600 text-sm">Engage in conversation to determine if you're chatting with a human or AI</p>
                    </div>
                  </li>
                  
                  <li className="flex items-start">
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold text-lg mr-3">3</div>
                    <div>
                      <p className="font-medium text-gray-800">Make your guess</p>
                      <p className="text-gray-600 text-sm">Choose whether you think you were talking to a human or an AI</p>
                    </div>
                  </li>
                  
                  <li className="flex items-start">
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold text-lg mr-3">4</div>
                    <div>
                      <p className="font-medium text-gray-800">Win SUI rewards</p>
                      <p className="text-gray-600 text-sm">Correct guesses earn you 1.25x your staked amount of SUI</p>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <footer className="mt-16 bg-white border-t border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center mr-2">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-semibold text-gray-700">Objection! AI</span>
            </div>
            
            <div className="mt-4 md:mt-0 text-center md:text-right">
              <p className="text-gray-500 text-sm">
                A blockchain-powered courtroom for human vs AI detection • Powered by Sui Move contracts
              </p>
              <p className="text-gray-400 text-xs mt-1">
                © {new Date().getFullYear()} Objection! AI • All rights reserved
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}