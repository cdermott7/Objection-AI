'use client';

import { useContext } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthContext from '../../src/context/AuthContext';
import { useWallet } from '@mysten/dapp-kit';
import { useBadges } from '../../src/hooks/useBadges';
import BadgeCard from '../../src/components/BadgeCard';

export default function Profile() {
  const { user, signOut } = useContext(AuthContext);
  const { currentAccount } = useWallet();
  const { badges, isLoading } = useBadges();
  const router = useRouter();
  
  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };
  
  // Redirect to login if not authenticated
  if (!user) {
    router.push('/login');
    return null;
  }
  
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      {/* Header */}
      <header className="max-w-5xl mx-auto flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-indigo-600">TuriCheck</h1>
        
        <div className="flex items-center gap-4">
          <Link 
            href="/"
            className="text-gray-600 hover:text-gray-800"
          >
            Home
          </Link>
          <button 
            onClick={handleLogout}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            Sign Out
          </button>
        </div>
      </header>
      
      <main className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Your Profile</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600 mb-1">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            
            {currentAccount && (
              <div>
                <p className="text-gray-600 mb-1">Wallet Address</p>
                <p className="font-medium truncate">{currentAccount.address}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Your Badges</h2>
          
          {isLoading ? (
            <div className="text-center py-12">Loading your badges...</div>
          ) : badges.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <h3 className="text-xl font-semibold mb-4">No badges yet!</h3>
              <p className="text-gray-600 mb-6">
                Play the Human or AI game to earn your first badge.
              </p>
              <Link 
                href="/"
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 inline-block"
              >
                Start Playing
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      
      <footer className="max-w-5xl mx-auto mt-12 py-6 text-center text-gray-500 text-sm">
        <p>TuriCheck - A Sui blockchain project for testing Human vs AI recognition</p>
      </footer>
    </div>
  );
}