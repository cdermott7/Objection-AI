'use client';

import { useEffect } from 'react';
import AceAttorneyEnhancedGame from '../../src/components/AceAttorneyEnhancedGame';

export default function AceAttorneyPage() {
  // Set up Ace Attorney mode when this page loads
  useEffect(() => {
    // Force ace attorney mode in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('turiCheckGameMode', 'ace_attorney');
      
      // Apply fullscreen styles
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.margin = '0';
      document.documentElement.style.padding = '0';
      document.documentElement.style.width = '100vw';
      document.documentElement.style.height = '100vh';
      
      document.body.style.overflow = 'hidden';
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.body.style.width = '100vw';
      document.body.style.height = '100vh';
      document.body.style.position = 'fixed';
      document.body.style.top = '0';
      document.body.style.left = '0';
      document.body.style.backgroundColor = '#000';
      document.body.classList.add('ace-attorney-mode');
      
      // Create and append a link to load the CSS for hackthenorth24 backgrounds
      const linkId = 'hackthenorth24-backgrounds-css';
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = '/ace-attorney/backgrounds/backgrounds.css';
        document.head.appendChild(link);
      }
    }
    
    return () => {
      // Clean up when component unmounts
      document.body.classList.remove('ace-attorney-mode');
      
      document.documentElement.style.removeProperty('overflow');
      document.documentElement.style.removeProperty('margin');
      document.documentElement.style.removeProperty('padding');
      document.documentElement.style.removeProperty('width');
      document.documentElement.style.removeProperty('height');
      
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('margin');
      document.body.style.removeProperty('padding');
      document.body.style.removeProperty('width');
      document.body.style.removeProperty('height');
      document.body.style.removeProperty('position');
      document.body.style.removeProperty('top');
      document.body.style.removeProperty('left');
      document.body.style.removeProperty('backgroundColor');
    };
  }, []);
  
  return (
    <div className="fixed inset-0 w-screen h-screen bg-black z-[9999]">
      <AceAttorneyEnhancedGame />
      
      {/* Exit button */}
      <button 
        onClick={() => {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('turiCheckGameMode');
            window.location.href = '/';
          }
        }}
        className="fixed top-2 right-2 bg-red-600 text-white px-3 py-1 rounded-md z-[10000] shadow-lg"
      >
        EXIT COURT
      </button>
    </div>
  );
}