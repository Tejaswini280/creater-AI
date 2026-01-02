import React from 'react';

interface StableLoaderProps {
  message?: string;
  className?: string;
}

export const StableLoader: React.FC<StableLoaderProps> = React.memo(({ 
  message = "Loading...", 
  className = "" 
}) => {
  return (
    <div className={`min-h-screen flex flex-col bg-background ${className}`} role="document" style={{ contain: 'layout style paint' }}>
      <header role="banner" className="sr-only">Loading header</header>
      <main role="main" className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" style={{ willChange: 'transform' }}></div>
          <p className="text-muted-foreground">{message}</p>
        </div>
      </main>
    </div>
  );
});

StableLoader.displayName = 'StableLoader';
