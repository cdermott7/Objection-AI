'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';

interface PhantomEvent {
  type: string;
  data: unknown;
}

interface ConnectedMethods {
  publicKey: PublicKey;
  isConnected: boolean;
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
  signTransaction: unknown;
  signAllTransactions: unknown;
  disconnect: () => Promise<void>;
}

interface PhantomProvider {
  publicKey?: { toString(): string };
  isConnected?: boolean;
  isPhantom?: boolean;
  signTransaction?: unknown;
  signAllTransactions?: unknown;
  signMessage?: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
  connect?: () => Promise<{ publicKey: { toString(): string } }>;
  disconnect?: () => Promise<void>;
  on: (event: string, callback: (args: PhantomEvent) => void) => void;
  request?: (request: { method: string; params?: any }) => Promise<any>;
}

interface PhantomWindow extends Window {
  solana?: PhantomProvider;
  phantom?: {
    solana?: PhantomProvider;
  };
}

interface AuthUser {
  id: string;
  publicKey: string;
  isConnected: boolean;
  createdAt: string;
}

interface PhantomContextState {
  user: AuthUser | null;
  isLoading: boolean;
  connectWallet: () => Promise<void>;
  signOut: () => Promise<void>;
  hasProvider: boolean | null;
}

const defaultState: PhantomContextState = {
  user: null,
  isLoading: true,
  connectWallet: async () => {},
  signOut: async () => {},
  hasProvider: null,
};

const PhantomContext = createContext<PhantomContextState>(defaultState);

export const usePhantom = () => useContext(PhantomContext);

export const PhantomProvider = ({ children }: { children: ReactNode }) => {
  const [hasProvider, setHasProvider] = useState<boolean | null>(null);
  const [provider, setProvider] = useState<PhantomProvider | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for Phantom provider on window load
  useEffect(() => {
    const checkForPhantom = () => {
      try {
        const phantomWindow = window as PhantomWindow;
        console.log("Checking for Phantom provider...");
        
        // Provider is available
        if (phantomWindow.solana?.isPhantom || phantomWindow.phantom?.solana?.isPhantom) {
          console.log("Phantom provider found!");
          const detectedProvider = (phantomWindow.phantom?.solana || phantomWindow.solana) as PhantomProvider;
          setProvider(detectedProvider);
          setHasProvider(true);
          
          // Attempt to restore session
          if (detectedProvider.publicKey) {
            const publicKey = detectedProvider.publicKey.toString();
            console.log("Found connected public key:", publicKey);
            const storedUser = localStorage.getItem('turicheck_phantom_user');
            
            if (storedUser) {
              console.log("Restoring stored user");
              const parsedUser = JSON.parse(storedUser) as AuthUser;
              setUser(parsedUser);
            } else if (detectedProvider.isConnected) {
              // Create new user if wallet is connected but no user in storage
              console.log("Creating new user from connected wallet");
              const newUser: AuthUser = {
                id: publicKey,
                publicKey,
                isConnected: true,
                createdAt: new Date().toISOString(),
              };
              
              localStorage.setItem('turicheck_phantom_user', JSON.stringify(newUser));
              setUser(newUser);
            }
          }
          
          // Add disconnect listener
          detectedProvider.on('disconnect', () => {
            console.log("Disconnect event received");
            localStorage.removeItem('turicheck_phantom_user');
            setUser(null);
            console.log('Wallet disconnected');
          });
          
          // Add connect listener
          detectedProvider.on('connect', (e: PhantomEvent) => {
            console.log("Connect event received", e);
            const connectedData = e.data as any;
            const publicKey = connectedData?.publicKey?.toString() || '';
            
            if (publicKey) {
              console.log("Connected to wallet with public key:", publicKey);
              const newUser: AuthUser = {
                id: publicKey,
                publicKey,
                isConnected: true,
                createdAt: new Date().toISOString(),
              };
              
              localStorage.setItem('turicheck_phantom_user', JSON.stringify(newUser));
              setUser(newUser);
            }
          });
        } else {
          console.log("No Phantom provider found");
          setHasProvider(false);
        }
      } catch (error) {
        console.error("Error checking for Phantom:", error);
        setHasProvider(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    // If window is defined (in browser), check for Phantom
    if (typeof window !== 'undefined') {
      // Wait for the window to fully load
      if (document.readyState === 'complete') {
        checkForPhantom();
      } else {
        window.addEventListener('load', checkForPhantom);
        return () => window.removeEventListener('load', checkForPhantom);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  // Connect to Phantom wallet
  const connectWallet = async () => {
    try {
      setIsLoading(true);
      console.log("Connecting to Phantom wallet...");
      
      if (!provider) {
        console.log("No provider available, opening Phantom website");
        window.open('https://phantom.app/', '_blank');
        setIsLoading(false);
        return;
      }
      
      // Request connection
      console.log("Requesting connection to wallet");
      if (provider.connect) {
        const response = await provider.connect();
        console.log("Connection response:", response);
        
        if (response.publicKey) {
          const publicKey = response.publicKey.toString();
          console.log("Connected to wallet with public key:", publicKey);
          
          // Create new user
          const newUser: AuthUser = {
            id: publicKey,
            publicKey,
            isConnected: true,
            createdAt: new Date().toISOString(),
          };
          
          localStorage.setItem('turicheck_phantom_user', JSON.stringify(newUser));
          setUser(newUser);
        }
      } else {
        console.error("Provider doesn't have connect method");
      }
    } catch (error) {
      console.error('Error connecting to Phantom wallet:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect from Phantom wallet
  const signOut = async () => {
    if (!provider) return;
    
    try {
      console.log("Disconnecting from wallet");
      if (provider.disconnect) {
        await provider.disconnect();
      }
      
      localStorage.removeItem('turicheck_phantom_user');
      setUser(null);
      console.log('Wallet disconnected');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      throw error;
    }
  };

  return (
    <PhantomContext.Provider
      value={{
        user,
        isLoading,
        connectWallet,
        signOut,
        hasProvider,
      }}
    >
      {children}
    </PhantomContext.Provider>
  );
};