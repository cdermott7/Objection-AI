'use client';

import { useEffect } from 'react';
import AceAttorneyEnhancedGame from './AceAttorneyEnhancedGame';
import { useChat, GameMode } from '../context/ChatContext';

export default function AceAttorneyMode() {
  const { gameMode } = useChat();
  const isAceAttorneyMode = gameMode === GameMode.ACE_ATTORNEY;
  
  console.log('AceAttorneyMode rendering with mode:', { gameMode, isAceAttorneyMode });

  // Apply full-screen mode when component mounts
  useEffect(() => {
    console.log('AceAttorneyMode useEffect running');
    
    // Load required CSS files
    const loadCSS = (url: string, id: string) => {
      if (!document.getElementById(id)) {
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = url;
        document.head.appendChild(link);
        console.log(`Added CSS: ${id}`);
      }
    };
    
    // Load CSS files
    loadCSS('/ace-attorney/backgrounds/backgrounds.css', 'aa-backgrounds-css');
    loadCSS('/ace-attorney/default-sprites.css', 'aa-sprites-css');
    
    // Add the aa-mode class to the body
    document.body.classList.add('ace-attorney-mode');
    console.log('Added ace-attorney-mode class to body');
    
    // Apply styles to all relevant elements
    const applyFullScreenStyles = () => {
      // Apply to html and body
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
      
      // Find and style all containers
      const containers = [
        document.getElementById('__next'),
        document.getElementById('root'),
        document.querySelector('main'),
        ...Array.from(document.querySelectorAll('body > div'))
      ].filter(el => el !== null) as HTMLElement[];
      
      containers.forEach(el => {
        el.style.position = 'fixed';
        el.style.top = '0';
        el.style.left = '0';
        el.style.width = '100vw';
        el.style.height = '100vh';
        el.style.padding = '0';
        el.style.margin = '0';
        el.style.maxWidth = 'none';
        el.style.maxHeight = 'none';
        el.style.overflow = 'hidden';
        el.style.zIndex = '9999';
        el.style.background = '#000';
      });
      
      // Hide all other UI elements
      const hideElements = Array.from(document.querySelectorAll('header, footer, nav, aside, [role="navigation"]'));
      hideElements.forEach(el => {
        if (el instanceof HTMLElement) {
          el.style.display = 'none';
        }
      });
      
      console.log('Applied full-screen styles');
    };
    
    // Apply styles
    applyFullScreenStyles();
    
    // Apply again after a short delay to ensure all elements are rendered
    const styleTimeout = setTimeout(() => {
      applyFullScreenStyles();
    }, 100);
    
    // Preload key assets
    const preloadAssets = () => {
      const assets = [
        // Characters
        '/ace-attorney/hackthenorth24/phoenix/stand.gif',
        '/ace-attorney/hackthenorth24/edgeworth/stand.gif',
        '/ace-attorney/hackthenorth24/judge/stand.gif',
        '/ace-attorney/hackthenorth24/phoenix/stand_talk.gif',
        '/ace-attorney/hackthenorth24/edgeworth/stand_talk.gif',
        '/ace-attorney/hackthenorth24/judge/stand_talk.gif',
        // Backgrounds
        '/ace-attorney/hackthenorth24/phoenix/background.png',
        '/ace-attorney/hackthenorth24/edgeworth/background.jpg',
        '/ace-attorney/hackthenorth24/judge/background.jpg',
        // Objection
        '/ace-attorney/hackthenorth24/objection.gif'
      ];
      
      assets.forEach(asset => {
        const img = new Image();
        img.src = asset;
        console.log(`Preloaded: ${asset}`);
      });
    };
    
    preloadAssets();
    
    return () => {
      // Clean up styles when component unmounts
      document.body.classList.remove('ace-attorney-mode');
      
      // Reset styles
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
      
      // Clean up timeouts
      clearTimeout(styleTimeout);
      
      console.log('Cleaned up AceAttorneyMode component');
    };
  }, []);
  
  if (!isAceAttorneyMode) {
    console.log('Not in Ace Attorney mode, not rendering AA component');
    return null;
  }
  
  console.log('Rendering AceAttorneyEnhancedGame');
  
  return (
    <div 
      className="aa-game-container" 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        backgroundColor: '#000',
        overflow: 'hidden'
      }}
    >
      <AceAttorneyEnhancedGame />
    </div>
  );
}