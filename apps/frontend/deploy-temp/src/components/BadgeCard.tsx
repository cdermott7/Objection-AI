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
  const formattedDate = timestamp 
    ? new Date(timestamp).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) 
    : 'Unknown date';
  
  // Custom badge images for premium look
  const badgeImages = {
    correct: [
      '/badge-correct.svg',
      'https://images.unsplash.com/photo-1614036417651-efe5912156d6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
    ],
    incorrect: [
      '/badge-incorrect.svg',
      'https://images.unsplash.com/photo-1618004912476-29818d81ae2e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
    ]
  };
  
  // Choose appropriate image based on correctness
  const imageSrc = correct ? badgeImages.correct[0] : badgeImages.incorrect[0];
  
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transform hover:translate-y-[-4px] transition-all duration-300 border border-gray-100">
      <div className={`w-full h-2 ${correct ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`}></div>
      
      <div className="relative aspect-square w-full">
        <div className={`absolute inset-0 bg-gradient-to-br ${
          correct 
            ? 'from-emerald-50 via-teal-50 to-cyan-50' 
            : 'from-amber-50 via-orange-50 to-rose-50'
        } opacity-50 z-0`}></div>
        
        <Image
          src={imageSrc}
          alt={`Badge for session ${sessionId}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-contain p-8 z-10 drop-shadow-md"
        />
        
        <div className="absolute top-4 right-4 z-20">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
            correct 
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm' 
              : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm'
          }`}>
            {correct ? 'Correct' : 'Incorrect'}
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-xl text-gray-800">Badge #{sessionId}</h3>
          <div className="flex items-center">
            <span className="h-3 w-3 rounded-full mr-1.5 bg-indigo-500"></span>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Verified</span>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center text-gray-700 text-sm">
            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p>Earned on {formattedDate}</p>
          </div>
          
          <div className="flex items-center text-gray-700 text-sm">
            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <p className="font-medium">TuriCheck Achievement</p>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
          <p className="text-xs text-gray-500">ID: {id.substring(0, 10)}...{id.substring(id.length - 6)}</p>
          
          <a 
            href={`https://explorer.sui.io/object/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium text-sm"
          >
            <span>View on Sui</span>
            <svg className="ml-1.5 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}