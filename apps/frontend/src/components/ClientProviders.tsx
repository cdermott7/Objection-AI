'use client';

import { ReactNode } from 'react';
import { WalletKitProvider } from '@mysten/wallet-kit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockWalletProvider } from '../context/MockWalletContext';

const queryClient = new QueryClient();

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletKitProvider>
        <MockWalletProvider>
          {children}
        </MockWalletProvider>
      </WalletKitProvider>
    </QueryClientProvider>
  );
}