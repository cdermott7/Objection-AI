'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useCurrentAccount, useConnectWallet, useDisconnectWallet, ConnectButton } from '@mysten/dapp-kit';

interface WalletUser {
  id: string;
  address: string;
  isConnected: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: WalletUser | null;
  isLoading: boolean;
  connectWallet: () => Promise<void>;
  signOut: () => Promise<void>;
  ConnectButton: typeof ConnectButton;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  connectWallet: async () => {},
  signOut: async () => {},
  ConnectButton,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const currentAccount = useCurrentAccount();
  const { mutate: connect, isPending: isConnecting } = useConnectWallet();
  const { mutate: disconnect } = useDisconnectWallet();
  
  const [user, setUser] = useState<WalletUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // For debugging
  useEffect(() => {
    console.log('Auth Provider Mounted');
    console.log('Current Account:', currentAccount);
  }, []);

  // Effect to sync wallet connection status
  useEffect(() => {
    const updateUserFromWallet = async () => {
      try {
        console.log('Updating user from wallet, currentAccount:', currentAccount);
        
        if (currentAccount) {
          // Create user object from wallet
          const walletUser: WalletUser = {
            id: currentAccount.address,
            address: currentAccount.address,
            isConnected: true,
            createdAt: new Date().toISOString(),
          };
          
          // Save to local storage for persistence
          localStorage.setItem('turicheck_wallet_user', JSON.stringify(walletUser));
          setUser(walletUser);
          console.log('Wallet connected, user created:', walletUser);
        } else {
          // Check if we have a stored user
          const storedUser = localStorage.getItem('turicheck_wallet_user');
          
          if (storedUser) {
            // If wallet is disconnected but we have a stored user, clear it
            localStorage.removeItem('turicheck_wallet_user');
            setUser(null);
            console.log('Wallet disconnected, clearing user');
          } else {
            // No stored user and no wallet connected
            setUser(null);
            console.log('No wallet connected and no stored user');
          }
        }
      } catch (error) {
        console.error('Error updating user from wallet:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    updateUserFromWallet();
  }, [currentAccount]);

  // Connect wallet
  const connectWallet = async () => {
    try {
      console.log('Connecting wallet...');
      setIsLoading(true);
      
      // The connect function expects a wallet name
      // Since we don't know which wallets are available, use null
      // to show the wallet selection modal
      connect(null);
      console.log('Wallet connection initiated');
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    } finally {
      setTimeout(() => setIsLoading(false), 1000); // Add a small delay
    }
  };

  // Disconnect wallet
  const signOut = async () => {
    try {
      console.log('Disconnecting wallet...');
      disconnect();
      localStorage.removeItem('turicheck_wallet_user');
      setUser(null);
      console.log('Wallet disconnected');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      throw error;
    }
  };

  const value = {
    user,
    isLoading: isLoading || isConnecting,
    connectWallet,
    signOut,
    ConnectButton,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;