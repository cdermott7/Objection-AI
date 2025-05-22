'use client';

// Mock wallet implementation for testing
export interface MockWalletState {
  isConnected: boolean;
  address: string | null;
  balance: number;
}

export const createMockWallet = () => {
  // Initial state
  const state: MockWalletState = {
    isConnected: false,
    address: null,
    balance: 10, // Start with 10 SUI by default
  };

  // Generate a random mock address
  const generateAddress = () => {
    return '0x' + Array.from({length: 64}, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  };

  // Connect mock wallet
  const connect = () => {
    state.isConnected = true;
    state.address = generateAddress();
    // Save to localStorage for persistence
    localStorage.setItem('mockWalletState', JSON.stringify(state));
    return state;
  };

  // Disconnect mock wallet
  const disconnect = () => {
    state.isConnected = false;
    state.address = null;
    localStorage.removeItem('mockWalletState');
    return state;
  };

  // Initialize from localStorage if available
  const init = () => {
    const saved = localStorage.getItem('mockWalletState');
    if (saved) {
      const parsed = JSON.parse(saved) as MockWalletState;
      state.isConnected = parsed.isConnected;
      state.address = parsed.address;
      state.balance = parsed.balance || 10; // Fallback to 10 if no balance
    }
    return state;
  };

  // Mock transaction execution
  const mockSignAndExecuteTransactionBlock = (transaction: any) => {
    console.log('MOCK: Signing and executing transaction:', transaction);
    return new Promise((resolve) => {
      setTimeout(() => {
        // Generate a random digest that looks like a real Sui transaction ID
        const mockDigest = `0x${Array.from({length: 64}, () => 
          Math.floor(Math.random() * 16).toString(16)).join('')}`;
        
        // Generate a random object ID for the created object
        const mockObjectId = `0x${Array.from({length: 64}, () => 
          Math.floor(Math.random() * 16).toString(16)).join('')}`;
        
        resolve({
          digest: mockDigest,
          effects: { 
            status: { status: 'success' },
            created: [{ 
              reference: { objectId: mockObjectId },
              owner: { AddressOwner: state.address || '0x0' }
            }]
          },
          timestamp_ms: Date.now(),
          checkpoint: Math.floor(Math.random() * 1000000)
        });
      }, 1500); // Simulate network delay
    });
  };
  
  // Update balance (for staking and rewards)
  const updateBalance = (amount: number) => {
    state.balance += amount;
    // Save to localStorage for persistence
    if (state.isConnected) {
      localStorage.setItem('mockWalletState', JSON.stringify(state));
    }
    return state;
  };
  
  // Get current balance
  const getBalance = () => state.balance;
  
  return {
    connect,
    disconnect,
    init,
    getState: () => state,
    mockSignAndExecuteTransactionBlock,
    updateBalance,
    getBalance,
  };
};