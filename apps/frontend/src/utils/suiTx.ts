import { TransactionBlock } from '@mysten/sui/transactions';

// Read the package ID from environment variables
const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID || '';

/**
 * Builds a transaction to mint a badge
 * @param sessionId The session ID of the TuriCheck session
 * @param correct Whether the user's guess was correct
 * @param metadataUri The URI to the badge's metadata
 * @returns A TransactionBlock object ready to be signed and executed
 */
export function buildMintBadgeTx(
  sessionId: number,
  correct: boolean,
  metadataUri: string
): TransactionBlock {
  if (!PACKAGE_ID) {
    throw new Error('PACKAGE_ID environment variable is not set');
  }

  const tx = new TransactionBlock();
  
  // Convert the metadata URI to a UTF-8 encoded byte array
  const metadataBytes = Array.from(new TextEncoder().encode(metadataUri));
  
  // Call the mint_badge function in the TuriCheck module
  tx.moveCall({
    target: `${PACKAGE_ID}::TuriCheck::mint_badge`,
    arguments: [
      tx.pure(sessionId),
      tx.pure(correct),
      tx.pure(metadataBytes),
      tx.pure.address(tx.sender), // Send to the transaction signer
    ],
  });

  return tx;
}

/**
 * Signs and executes a transaction using the connected wallet
 * @param signAndExecuteTransaction Function from useWallet() hook to sign and execute the transaction
 * @param tx The transaction block to execute
 * @returns The transaction response
 */
export async function signAndExecuteTransaction(
  signAndExecuteTransaction: (tx: TransactionBlock) => Promise<any>,
  tx: TransactionBlock
) {
  try {
    return await signAndExecuteTransaction(tx);
  } catch (error) {
    console.error('Error executing transaction:', error);
    throw error;
  }
}