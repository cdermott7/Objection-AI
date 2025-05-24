// @ts-nocheck
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createMockWallet, MockWalletState } from '../utils/mockWallet';

interface MockWalletContextType {
  isConnected: boolean;
  address: string | null;
  balance: number;
  connect: () => void;
  disconnect: () => void;
  mockSignAndExecuteTransactionBlock: (transaction: any) => Promise<any>;
  updateBalance: (amount: number) => MockWalletState;
}

const MockWalletContext = createContext<MockWalletContextType>({
  isConnected: false,
  address: null,
  balance: 0,
  connect: () => {},
  disconnect: () => {},
  mockSignAndExecuteTransactionBlock: async () => ({}),
  updateBalance: () => ({ isConnected: false, address: null, balance: 0 }),
});

export const useMockWallet = () => useContext(MockWalletContext);

export const MockWalletProvider = ({ children }: { children: ReactNode }) => {
  const [wallet] = useState(() => createMockWallet());
  const [state, setState] = useState<MockWalletState>({ isConnected: false, address: null });

  // Initialize wallet state from localStorage
  useEffect(() => {
    const initialState = wallet.init();
    setState({ ...initialState });
  }, [wallet]);

  // Connect wallet
  const connect = () => {
    const newState = wallet.connect();
    setState({ ...newState });
  };

  // Disconnect wallet
  const disconnect = () => {
    const newState = wallet.disconnect();
    setState({ ...newState });
  };

  const value = {
    isConnected: state.isConnected,
    address: state.address,
    balance: state.balance,
    connect,
    disconnect,
    mockSignAndExecuteTransactionBlock: wallet.mockSignAndExecuteTransactionBlock,
    updateBalance: wallet.updateBalance,
  };

  return (
    <MockWalletContext.Provider value={value}>
      {children}
    </MockWalletContext.Provider>
  );
};