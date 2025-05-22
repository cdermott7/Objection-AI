'use client';

import { ConnectButton } from '@mysten/wallet-kit';

export default function WalletConnect() {
  return (
    <div className="flex flex-col">
      <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-200 text-center flex flex-col items-center">
        <div className="h-16 w-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-medium mb-2">Connect Your Wallet</h2>
        <p className="text-gray-700 mb-6">Connect to the Sui blockchain to play TuriCheck.</p>
        <div className="transform transition-transform hover:scale-105">
          <ConnectButton />
        </div>
      </div>
    </div>
  );
}