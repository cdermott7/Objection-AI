// @ts-nocheck
'use client';

import { ReactNode, useEffect, useState, createContext, useContext, useCallback } from 'react';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { useWallet } from '@mysten/wallet-adapter-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getFullnodeUrl } from '@mysten/sui/client';
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';

// Set up the network to Sui's testnet, can be changed to mainnet for production
const networks = {
  testnet: { url: getFullnodeUrl('testnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
};

// Create a query client for React Query
const queryClient = new QueryClient();

// Extended wallet context with additional useful methods
interface ExtendedWalletContext {
  // Connection state
  isConnected: boolean;
  address: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  
  // Transaction utilities
  executeTransaction: (transaction: Transaction) => Promise<any>;
  
  // General wallet info
  walletName: string | null;
}

// Default context values
const defaultWalletContext: ExtendedWalletContext = {
  isConnected: false,
  address: null,
  connect: async () => {},
  disconnect: async () => {},
  executeTransaction: async () => ({}),
  walletName: null,
};

// Create the context
const ExtendedWalletContext = createContext<ExtendedWalletContext>(defaultWalletContext);

// Custom hook to access our extended wallet context
export const useExtendedWallet = () => useContext(ExtendedWalletContext);

// Provider component for our extended wallet functionality
function ExtendedWalletProvider({ children }: { children: ReactNode }) {
  const wallet = useWallet();
  
  // Get current wallet state
  const isConnected = wallet.connected;
  const address = wallet.currentAccount?.address || null;
  const walletName = wallet.name || null;
  
  // Console log wallet status on connection changes
  useEffect(() => {
    console.log('Wallet connection status:', { 
      isConnected, 
      address,
      walletName,
      hasAdapter: !!wallet.signAndExecuteTransactionBlock
    });
    
    // Save wallet address to localStorage for persistence
    if (address) {
      localStorage.setItem('sui_wallet_address', address);
      console.log('Saved wallet address to localStorage:', address);
    } else {
      localStorage.removeItem('sui_wallet_address');
    }
  }, [isConnected, address, walletName, wallet]);
  
  // Connect wallet
  const connect = useCallback(async () => {
    try {
      if (wallet.select && !wallet.connected) {
        await wallet.select();
        await wallet.connect();
        console.log('Wallet connected successfully');
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  }, [wallet]);
  
  // Disconnect wallet
  const disconnect = useCallback(async () => {
    try {
      if (wallet.disconnect) {
        await wallet.disconnect();
        console.log('Wallet disconnected successfully');
      }
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  }, [wallet]);
  
  // Execute transaction with proper error handling
  const executeTransaction = useCallback(async (transaction: Transaction) => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }
    
    if (!wallet.signAndExecuteTransactionBlock) {
      throw new Error('Wallet adapter not available');
    }
    
    // Ensure transaction has sender
    if (typeof transaction.setSender === 'function' && !transaction.sender) {
      console.log('Setting transaction sender to current address:', address);
      transaction.setSender(address);
    }
    
    try {
      console.log('Executing transaction with wallet:', walletName);
      const result = await wallet.signAndExecuteTransactionBlock({
        transactionBlock: transaction,
        options: {
          showEffects: true,
          showEvents: true
        }
      });
      
      console.log('Transaction executed successfully:', result);
      return result;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  }, [isConnected, address, wallet, walletName]);
  
  // Create context value
  const contextValue: ExtendedWalletContext = {
    isConnected,
    address,
    connect,
    disconnect,
    executeTransaction,
    walletName
  };
  
  return (
    <ExtendedWalletContext.Provider value={contextValue}>
      {children}
    </ExtendedWalletContext.Provider>
  );
}

// Create a wallet provider component with Sui's dapp-kit
export function SuiWalletProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // Effect to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork="testnet">
        <WalletProvider autoConnect>
          {mounted && (
            <ExtendedWalletProvider>
              {children}
            </ExtendedWalletProvider>
          )}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}