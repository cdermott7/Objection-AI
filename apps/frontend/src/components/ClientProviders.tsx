'use client';

import { ReactNode } from 'react';
import { WalletKitProvider } from '@mysten/wallet-kit';
import { WalletStandardAdapterProvider } from '@mysten/wallet-adapter-wallet-standard';
import { UnsafeBurnerWalletAdapter } from '@mysten/wallet-adapter-unsafe-burner';
import { WalletProvider } from '@mysten/wallet-adapter-react';
import { MockWalletProvider } from '../context/MockWalletContext';
import { SuiWalletProvider } from '../context/WalletProvider';

export default function ClientProviders({ children }: { children: ReactNode }) {
  // Set up wallet adapters for Sui
  const adapters = [
    new WalletStandardAdapterProvider(),
    // Only use burner wallet in development for testing
    process.env.NODE_ENV === 'development' ? new UnsafeBurnerWalletAdapter() : null
  ].filter(Boolean);

  return (
    <WalletProvider
      adapters={adapters}
      autoConnect={true}
    >
      <WalletKitProvider>
        <SuiWalletProvider>
          <MockWalletProvider>
            {children}
          </MockWalletProvider>
        </SuiWalletProvider>
      </WalletKitProvider>
    </WalletProvider>
  );
}