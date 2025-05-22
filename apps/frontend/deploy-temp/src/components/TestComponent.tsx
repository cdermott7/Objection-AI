'use client';

import { useEffect } from 'react';

export default function TestComponent() {
  // Just a minimal component for testing
  useEffect(() => {
    console.log('TestComponent mounted');
    
    // Add a class to body for testing
    document.body.classList.add('test-component-loaded');
    
    return () => {
      document.body.classList.remove('test-component-loaded');
    };
  }, []);
  
  return (
    <div className="p-4 bg-gray-100 rounded">
      <p>Test Component</p>
    </div>
  );
}