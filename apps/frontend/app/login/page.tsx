'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import { useMockWallet } from '../../src/context/MockWalletContext';

export default function Login() {
  const router = useRouter();
  const currentAccount = useCurrentAccount();
  const { isConnected, address, connect: connectMock } = useMockWallet();
  const [loading, setLoading] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log("Login page mounted");
    console.log("Wallet state:", { 
      currentAccount: !!currentAccount, 
      mockConnected: isConnected, 
      mockAddress: address 
    });
  }, [currentAccount, isConnected, address]);

  // Check if user is already logged in with any wallet
  useEffect(() => {
    if ((currentAccount && currentAccount.address) || (isConnected && address)) {
      console.log("User is logged in, redirecting to home");
      router.push('/');
    }
  }, [currentAccount, isConnected, address, router]);

  const handleMockConnect = () => {
    setLoading(true);
    try {
      connectMock();
      console.log("Mock wallet connected");
    } catch (error) {
      console.error("Error connecting mock wallet:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-lg text-gray-600">Connecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 relative">
        <div className="absolute -z-10 w-64 h-64 rounded-full bg-indigo-200 opacity-20 blur-3xl -top-10 -left-8"></div>
        <div className="absolute -z-10 w-64 h-64 rounded-full bg-violet-200 opacity-20 blur-3xl -bottom-10 -right-8"></div>
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 shadow-lg mb-4">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="mt-4 text-center text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            Connect to TuriCheck
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Connect your wallet to start using TuriCheck
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="text-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Connect your wallet</h3>
              <p className="text-sm text-gray-500 mt-1">
                Connect with a wallet to play TuriCheck and collect badges
              </p>
            </div>
            
            <div className="flex flex-col items-center gap-4">
              {/* Sui Wallet Kit Button */}
              <div className="w-full">
                <ConnectButton connectText="Connect Sui Wallet" />
              </div>
              
              {/* Divider */}
              <div className="relative w-full py-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-sm text-gray-500">or</span>
                </div>
              </div>
              
              {/* Mock Wallet Button */}
              <button
                onClick={handleMockConnect}
                className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Use Demo Wallet
              </button>
              
              <p className="text-xs text-gray-500 text-center mt-2">
                No wallet extension? Use our demo wallet to try out the app.
              </p>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              By connecting your wallet, you agree to our
              <a href="#" className="text-indigo-600 hover:text-indigo-800 ml-1">Terms of Service</a>
              <span className="mx-1">and</span>
              <a href="#" className="text-indigo-600 hover:text-indigo-800">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}