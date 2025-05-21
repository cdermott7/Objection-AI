'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';

interface Badge {
  id: string;
  sessionId: number;
  correct: boolean;
  metadataUri?: string;
  timestamp?: string;
}

export function useBadges() {
  const { currentAccount } = useWallet();
  const ownerAddress = currentAccount?.address;
  const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID;

  const fetchBadges = async (): Promise<Badge[]> => {
    if (!ownerAddress || !PACKAGE_ID) {
      return [];
    }

    try {
      // In a real implementation, you would query the Sui blockchain here
      // For now, let's return mock data
      const mockBadges: Badge[] = [
        {
          id: '0x123456789abcdef',
          sessionId: 1,
          correct: true,
          timestamp: new Date().toISOString()
        },
        {
          id: '0xabcdef123456789',
          sessionId: 2,
          correct: false,
          timestamp: new Date(Date.now() - 86400000).toISOString()
        }
      ];

      return mockBadges;
    } catch (error) {
      console.error('Error fetching badges:', error);
      return [];
    }
  };

  const { data: badges = [], isLoading, error } = useQuery({
    queryKey: ['badges', ownerAddress],
    queryFn: fetchBadges,
    enabled: !!ownerAddress
  });

  return {
    badges,
    isLoading,
    error
  };
}