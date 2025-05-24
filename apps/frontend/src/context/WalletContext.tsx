// @ts-nocheck
'use client';

import { WalletKitProvider, useWalletKit } from '@mysten/wallet-kit';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type WalletContextType = {
  connected: boolean;
  connecting: boolean;
  currentAccount: any;
  connectWallet: () => void;
  disconnectWallet: () => void;
};

const WalletContext = createContext<WalletContextType>({
  connected: false,
  connecting: false,
  currentAccount: null,
  connectWallet: () => {},
  disconnectWallet: () => {},
});

export function SuiWalletKitProvider({ children }: { children: ReactNode }) {
  return (
    <WalletKitProvider>
      <WalletContextProvider>
        {children}
      </WalletContextProvider>
    </WalletKitProvider>
  );
}

function WalletContextProvider({ children }: { children: ReactNode }) {
  const { isConnected, isConnecting, currentAccount, connect, disconnect } = useWalletKit();
  
  // Debug logging
  useEffect(() => {
    console.log("Wallet state:", { isConnected, isConnecting, currentAccount });
  }, [isConnected, isConnecting, currentAccount]);
  
  const connectWallet = async () => {
    try {
      console.log("Connecting wallet...");
      await connect();
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };
  
  const disconnectWallet = async () => {
    try {
      console.log("Disconnecting wallet...");
      await disconnect();
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  };
  
  const value = {
    connected: isConnected,
    connecting: isConnecting,
    currentAccount,
    connectWallet,
    disconnectWallet,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  return useContext(WalletContext);
}