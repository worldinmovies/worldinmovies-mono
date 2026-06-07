import { useEffect, useState, ReactNode } from 'react';

interface AdminGuardProps {
  children: ReactNode;
}

export const AdminGuard = ({ children }: AdminGuardProps) => {
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if we arrived via client-side navigation
    const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    const navigationType = navigationEntries[0]?.type;

    // If it's not a reload/navigate (meaning it was client-side routing), force a full page reload
    if (navigationType !== 'reload' && navigationType !== 'navigate') {
      window.location.href = '/admin';
      return;
    }

    // If we got here via full page load, nginx auth already happened
    setIsChecking(false);
  }, []);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};