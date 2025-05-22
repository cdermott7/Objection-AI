/**
 * Mock Sui blockchain transaction utilities for TuriCheck
 * 
 * This is a simplified version that doesn't depend on the Sui SDK
 * to avoid import errors. It only implements the mock functionality.
 */

// Mock Transaction class (doesn't need real Sui SDK)
class MockTransaction {
  constructor() {
    // No need for actual implementation
  }
}

// Initialize from environment variables
const packageId = process.env.NEXT_PUBLIC_PACKAGE_ID;

// Function for building the transaction to mint a badge
export function buildMintBadgeTx(sessionId: number, correct: boolean, metadataUri: string): MockTransaction {
  const txb = new MockTransaction();
  
  console.log(`Building mock mint badge transaction for sessionId ${sessionId}`);
  console.log(`Package ID: ${packageId}`);
  console.log(`Badge properties: correct=${correct}, metadata=${metadataUri}`);
  
  return txb;
}

// Function to sign and execute a transaction using the provided wallet adapter
export async function signAndExecuteTransaction(
  walletAdapter: any,
  transaction: MockTransaction
): Promise<any> {
  try {
    console.log('Using mock transaction execution');
    return mockSignAndExecuteTransactionBlock(transaction);
  } catch (error) {
    console.error('Error executing transaction:', error);
    throw error;
  }
}

// Mock function for transaction execution
export function mockSignAndExecuteTransactionBlock(transaction: any) {
  console.log('MOCK: Signing and executing transaction:', transaction);
  return new Promise((resolve) => {
    setTimeout(() => {
      // Generate a random digest that looks like a real Sui transaction ID
      const mockDigest = `0x${Array.from({length: 64}, () => 
        Math.floor(Math.random() * 16).toString(16)).join('')}`;
      
      // Generate a random object ID for the badge
      const mockObjectId = `0x${Array.from({length: 64}, () => 
        Math.floor(Math.random() * 16).toString(16)).join('')}`;
      
      resolve({
        digest: mockDigest,
        effects: { 
          status: { status: 'success' },
          created: [{ 
            reference: { objectId: mockObjectId },
            owner: { AddressOwner: '0xd0c2e258507dca532c7ba699aee4b6c2f9cd1881eb8ede689269d3bd89ba75ac' }
          }]
        },
        timestamp_ms: Date.now(),
        checkpoint: Math.floor(Math.random() * 1000000)
      });
    }, 1500); // Simulate network delay
  });
}