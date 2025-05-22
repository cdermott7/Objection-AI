'use client';

import { useQuery } from '@tanstack/react-query';

interface Badge {
  id: string;
  sessionId: number;
  correct: boolean;
  metadataUri?: string;
  timestamp?: string;
}

export function useBadges() {
  // Mock user address for development
  const ownerAddress = '0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID;

  const fetchBadges = async (): Promise<Badge[]> => {
    // Return mock data for development
    console.log('Using mock badge data for development');
    return [
      {
        id: '0x123456789abcdef0123456789abcdef01',
        sessionId: 1,
        correct: true,
        timestamp: new Date().toISOString()
      },
      {
        id: '0xabcdef123456789abcdef123456789ab',
        sessionId: 2,
        correct: false,
        timestamp: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: '0x987654321fedcba987654321fedcba98',
        sessionId: 3,
        correct: true,
        timestamp: new Date(Date.now() - 172800000).toISOString()
      }
    ];
  };

  const { data: badges = [], isLoading, error } = useQuery({
    queryKey: ['badges', ownerAddress, PACKAGE_ID],
    queryFn: fetchBadges,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return {
    badges,
    isLoading,
    error
  };
}