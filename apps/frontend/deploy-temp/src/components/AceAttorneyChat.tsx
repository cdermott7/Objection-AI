'use client';

import AceAttorneyEnhancedGame from './AceAttorneyEnhancedGame';
import { useEffect } from 'react';

export default function AceAttorneyChat() {
  // Apply full-screen mode when component mounts
  useEffect(() => {
    // Create and append a link to load the CSS for hackthenorth24 backgrounds
    const linkId = 'hackthenorth24-backgrounds-css';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = '/ace-attorney/backgrounds/backgrounds.css';
      document.head.appendChild(link);
    }

    // Ensure we're in full screen mode
    document.body.classList.add('ace-attorney-mode');
    
    // Apply styles to html and root elements
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.height = '100vh';
    document.documentElement.style.width = '100vw';
    document.documentElement.style.padding = '0';
    document.documentElement.style.margin = '0';
    
    // Force all parent containers to be full-screen
    const containers = document.querySelectorAll('body > div, #__next, #root, main');
    containers.forEach(container => {
      if (container instanceof HTMLElement) {
        container.style.height = '100vh';
        container.style.width = '100vw';
        container.style.padding = '0';
        container.style.margin = '0';
        container.style.maxWidth = 'none';
        container.style.overflow = 'hidden';
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.right = '0';
        container.style.bottom = '0';
        container.style.zIndex = '9999';
      }
    });
    
    // Preload key assets
    const keyAssets = [
      // Characters
      '/ace-attorney/hackthenorth24/phoenix/stand.gif',
      '/ace-attorney/hackthenorth24/edgeworth/stand.gif',
      '/ace-attorney/hackthenorth24/judge/stand.gif',
      // Backgrounds
      '/ace-attorney/hackthenorth24/phoenix/background.png',
      '/ace-attorney/hackthenorth24/edgeworth/background.jpg',
      '/ace-attorney/hackthenorth24/judge/background.jpg',
      // Objection
      '/ace-attorney/hackthenorth24/objection.gif'
    ];
    
    keyAssets.forEach(asset => {
      const img = new Image();
      img.src = asset;
    });
    
    return () => {
      // Clean up when component unmounts
      document.body.classList.remove('ace-attorney-mode');
      document.documentElement.style.removeProperty('overflow');
      document.documentElement.style.removeProperty('height');
      document.documentElement.style.removeProperty('width');
      document.documentElement.style.removeProperty('padding');
      document.documentElement.style.removeProperty('margin');
      
      // Restore container styles
      containers.forEach(container => {
        if (container instanceof HTMLElement) {
          container.style.removeProperty('height');
          container.style.removeProperty('width');
          container.style.removeProperty('padding');
          container.style.removeProperty('margin');
          container.style.removeProperty('max-width');
          container.style.removeProperty('overflow');
          container.style.removeProperty('position');
          container.style.removeProperty('top');
          container.style.removeProperty('left');
          container.style.removeProperty('right');
          container.style.removeProperty('bottom');
          container.style.removeProperty('z-index');
        }
      });
      
      // Remove the CSS link
      const link = document.getElementById(linkId);
      if (link) {
        link.remove();
      }
    };
  }, []);
  
  return (
    <div className="ace-attorney-container fixed inset-0 z-[9999] w-screen h-screen bg-black">
      <AceAttorneyEnhancedGame />
    </div>
  );
}