'use client';

import { ReactNode } from 'react';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// You can use any network available from Sui: 'mainnet', 'testnet', 'devnet', 'localnet'
const NETWORK = 'testnet';
const queryClient = new QueryClient();

export function SuiWalletProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider
        envs={{
          [NETWORK]: { url: getFullnodeUrl(NETWORK) }
        }}
        defaultNetwork={NETWORK}
      >
        <WalletProvider autoConnect>
          {children}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}