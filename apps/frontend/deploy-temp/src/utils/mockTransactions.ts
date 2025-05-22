'use client';

// Mock transaction functions for testing

export const mockSignAndExecuteTransaction = async (transactionBlock: any) => {
  console.log("Mock signing and executing transaction", transactionBlock);
  
  // Simulate a delay for network request
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Generate a mock digest
  const digest = '0x' + Array.from({length: 64}, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  return {
    digest,
    effects: {
      status: { status: 'success' },
      created: [],
      mutated: [],
      gasUsed: { computationCost: '1000', storageCost: '500', storageRebate: '400' }
    },
    confirmedLocalExecution: true,
    timestamp_ms: Date.now(),
    checkpoint: '123456789',
  };
};