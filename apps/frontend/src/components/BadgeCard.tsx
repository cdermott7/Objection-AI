'use client';

import Image from 'next/image';

interface BadgeCardProps {
  id: string;
  sessionId: number;
  correct: boolean;
  metadataUri?: string;
  timestamp?: string;
}

export default function BadgeCard({ id, sessionId, correct, metadataUri, timestamp }: BadgeCardProps) {
  // Format date for display
  const formattedDate = timestamp ? new Date(timestamp).toLocaleDateString() : 'Unknown date';
  
  // Default image based on correctness
  const imageSrc = correct 
    ? '/badge-correct.svg'
    : '/badge-incorrect.svg';
  
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
      <div className="relative aspect-square w-full">
        <Image
          src={imageSrc}
          alt={`Badge for session ${sessionId}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
        />
      </div>
      
      <div className="p-4">
        <h3 className="font-bold text-lg mb-1">TuriCheck Badge #{sessionId}</h3>
        
        <div className="flex items-center mb-2">
          <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${
            correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {correct ? 'Correct Guess' : 'Incorrect Guess'}
          </span>
        </div>
        
        <p className="text-gray-600 text-sm">Earned on {formattedDate}</p>
        
        <div className="mt-3 pt-3 border-t border-gray-200">
          <a 
            href={`https://explorer.sui.io/object/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            View on Sui Explorer →
          </a>
        </div>
      </div>
    </div>
  );
}