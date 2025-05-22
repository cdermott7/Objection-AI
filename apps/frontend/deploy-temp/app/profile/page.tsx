'use client';

import { useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthContext from '../../src/context/AuthContext';
import { useBadges } from '../../src/hooks/useBadges';
import BadgeCard from '../../src/components/BadgeCard';

export default function Profile() {
  const { user, signOut } = useContext(AuthContext);
  const { badges, isLoading } = useBadges();
  const router = useRouter();
  
  // Mock wallet address for development
  const mockWalletAddress = '0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  
  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      {/* Header */}
      <header className="max-w-5xl mx-auto flex justify-between items-center mb-8 bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <Link href="/" className="flex items-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">TuriCheck</h1>
        </Link>
        
        <div className="flex items-center gap-4">
          <Link 
            href="/"
            className="text-gray-600 hover:text-indigo-600 transition-colors duration-200 font-medium"
          >
            Home
          </Link>
          <button 
            onClick={handleLogout}
            className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-200 transition-all duration-200 shadow-sm"
          >
            Sign Out
          </button>
        </div>
      </header>
      
      <main className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-100 rounded-full opacity-20"></div>
          <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-violet-100 rounded-full opacity-10"></div>
          
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Your Profile</span>
            <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-green-200 via-green-300 to-green-200 text-green-800">
              Verified
            </span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Email</p>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-indigo-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="font-medium text-lg">{user.email}</p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Wallet Address</p>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-indigo-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <p className="font-mono text-xs sm:text-sm break-all bg-gray-100 py-1 px-2 rounded border border-gray-200">
                  {mockWalletAddress}
                </p>
              </div>
              <div className="mt-2 flex justify-end">
                <a 
                  href={`https://explorer.sui.io/address/${mockWalletAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs inline-flex items-center text-indigo-600 hover:text-indigo-800 transition-colors duration-200"
                >
                  <span>View on Sui Explorer</span>
                  <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-6 px-4 py-2 inline-block bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Your Badges</h2>
          
          {isLoading ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="animate-pulse flex flex-col items-center">
                <div className="h-16 w-16 bg-indigo-200 rounded-full mb-4"></div>
                <div className="h-4 bg-indigo-100 rounded w-24 mb-2.5"></div>
                <div className="h-3 bg-gray-100 rounded w-32"></div>
              </div>
              <p className="mt-4 text-indigo-500">Loading your badges...</p>
            </div>
          ) : badges.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-gray-100 relative overflow-hidden">
              <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-indigo-100 rounded-full opacity-10"></div>
              <div className="absolute -top-16 -left-16 w-64 h-64 bg-violet-100 rounded-full opacity-10"></div>
              
              <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              
              <h3 className="text-xl font-semibold mb-4 text-gray-800">No badges yet!</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Put your skills to the test in our Human or AI game and earn your first verification badge on the Sui blockchain.
              </p>
              <Link 
                href="/"
                className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-8 py-3 rounded-xl hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 inline-flex items-center font-medium"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Start Playing
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {badges.map((badge) => (
                <BadgeCard
                  key={badge.id}
                  id={badge.id}
                  sessionId={badge.sessionId}
                  correct={badge.correct}
                  metadataUri={badge.metadataUri}
                  timestamp={badge.timestamp}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      
      <footer className="max-w-5xl mx-auto mt-16 py-8 text-center">
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-center mb-4">
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="ml-3 text-xl font-medium text-gray-800">TuriCheck</h3>
          </div>
          <p className="text-gray-600 text-sm max-w-md mx-auto">
            A Sui blockchain project for testing Human vs AI recognition. Earn badges by correctly identifying whether you're chatting with a human or AI.
          </p>
          <div className="mt-4 flex justify-center space-x-4">
            <a href="https://sui.io" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-700 transition-colors duration-200">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
              </svg>
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-700 transition-colors duration-200">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}