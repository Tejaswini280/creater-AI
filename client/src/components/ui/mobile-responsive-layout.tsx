import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  Home,
  Plus,
  Calendar,
  Settings,
  Bell,
  Search,
  User,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  List,
  Filter,
  SortAsc,
  MoreVertical,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
  touchEnabled: boolean;
}

interface MobileResponsiveLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  gap?: string;
  className?: string;
}

interface ResponsiveCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

interface MobileNavigationProps {
  items: Array<{
    id: string;
    label: string;
    icon: React.ComponentType<any>;
    href?: string;
    onClick?: () => void;
    badge?: string | number;
    active?: boolean;
  }>;
  variant?: 'bottom' | 'top' | 'sidebar';
  className?: string;
}

interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  position?: 'center' | 'bottom' | 'top';
}

// Custom hook for device detection and responsive utilities
export const useDevice = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenWidth: 1920,
    screenHeight: 1080,
    orientation: 'landscape',
    touchEnabled: false
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const orientation = height > width ? 'portrait' : 'landscape';
      const touchEnabled = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      setDeviceInfo({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        screenWidth: width,
        screenHeight: height,
        orientation,
        touchEnabled
      });
    };

    updateDeviceInfo();
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);

  return deviceInfo;
};

// Responsive breakpoints
export const breakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
  wide: 1536
};

// Responsive utilities
export const responsiveUtils = {
  // Container queries
  container: (maxWidth?: number) => ({
    maxWidth: maxWidth || '100%',
    margin: '0 auto',
    paddingLeft: '1rem',
    paddingRight: '1rem',
    '@media (min-width: 640px)': {
      paddingLeft: '1.5rem',
      paddingRight: '1.5rem',
    },
    '@media (min-width: 1024px)': {
      paddingLeft: '2rem',
      paddingRight: '2rem',
    }
  }),

  // Grid system
  grid: (columns: { mobile: number; tablet: number; desktop: number }) => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${columns.mobile}, 1fr)`,
    gap: '1rem',
    '@media (min-width: 768px)': {
      gridTemplateColumns: `repeat(${columns.tablet}, 1fr)`,
      gap: '1.5rem',
    },
    '@media (min-width: 1024px)': {
      gridTemplateColumns: `repeat(${columns.desktop}, 1fr)`,
      gap: '2rem',
    }
  }),

  // Flex utilities
  flex: {
    center: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    between: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    column: {
      display: 'flex',
      flexDirection: 'column'
    },
    wrap: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.5rem'
    }
  },

  // Spacing utilities
  spacing: {
    section: 'py-8 md:py-12 lg:py-16',
    container: 'px-4 sm:px-6 lg:px-8',
    card: 'p-4 sm:p-6 lg:p-8'
  },

  // Typography utilities
  text: {
    responsive: 'text-sm sm:text-base lg:text-lg',
    heading: 'text-xl sm:text-2xl lg:text-3xl font-bold',
    subheading: 'text-lg sm:text-xl lg:text-2xl font-semibold'
  }
};

// Main responsive layout component
export default function MobileResponsiveLayout({
  children,
  sidebar,
  header,
  footer,
  className = ''
}: MobileResponsiveLayoutProps) {
  const device = useDevice();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Mobile Header */}
      {device.isMobile && (
        <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
          <div className="flex items-center justify-between">
            {sidebar && (
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  {sidebar}
                </SheetContent>
              </Sheet>
            )}
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold">CreatorNexus</h1>
            </div>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </header>
      )}

      {/* Desktop Header */}
      {!device.isMobile && header && (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          {header}
        </header>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        {!device.isMobile && sidebar && (
          <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] sticky top-16">
            {sidebar}
          </aside>
        )}

        {/* Main Content */}
        <main className={`flex-1 ${responsiveUtils.spacing.container} ${responsiveUtils.spacing.section}`}>
          {children}
        </main>
      </div>

      {/* Footer */}
      {footer && (
        <footer className={`bg-white border-t border-gray-200 ${responsiveUtils.spacing.container} py-6`}>
          {footer}
        </footer>
      )}
    </div>
  );
}

// Responsive Grid Component
export function ResponsiveGrid({
  children,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = '1rem',
  className = ''
}: ResponsiveGridProps) {
  const device = useDevice();

  const getColumns = () => {
    if (device.isMobile) return columns.mobile;
    if (device.isTablet) return columns.tablet;
    return columns.desktop;
  };

  return (
    <div
      className={`grid gap-${gap} ${className}`}
      style={{
        gridTemplateColumns: `repeat(${getColumns()}, 1fr)`
      }}
    >
      {children}
    </div>
  );
}

// Responsive Card Component
export function ResponsiveCard({
  children,
  variant = 'default',
  padding = 'md',
  className = ''
}: ResponsiveCardProps) {
  const device = useDevice();

  const getPadding = () => {
    const paddingMap = {
      none: 'p-0',
      sm: 'p-3 sm:p-4',
      md: 'p-4 sm:p-6',
      lg: 'p-6 sm:p-8 lg:p-10'
    };
    return paddingMap[padding];
  };

  const getVariantStyles = () => {
    const variants = {
      default: 'bg-white border border-gray-200 shadow-sm',
      elevated: 'bg-white border border-gray-200 shadow-lg',
      outlined: 'bg-white border-2 border-gray-300',
      filled: 'bg-gray-50 border border-gray-200'
    };
    return variants[variant];
  };

  return (
    <Card className={`${getPadding()} ${getVariantStyles()} ${className}`}>
      {children}
    </Card>
  );
}

// Mobile Navigation Component
export function MobileNavigation({
  items,
  variant = 'bottom',
  className = ''
}: MobileNavigationProps) {
  const device = useDevice();
  const [activeItem, setActiveItem] = useState(items[0]?.id);

  // Only show mobile navigation on mobile devices or when specified
  if (!device.isMobile && variant === 'bottom') return null;

  const navClasses = {
    bottom: 'fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-50',
    top: 'fixed top-0 left-0 right-0 bg-white border-b border-gray-200 px-4 py-2 z-50',
    sidebar: 'flex flex-col space-y-2 p-4'
  };

  return (
    <nav className={`${navClasses[variant]} ${className}`}>
      <div className={`flex ${variant === 'sidebar' ? 'flex-col space-y-2' : 'justify-around'}`}>
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveItem(item.id);
                item.onClick?.();
              }}
              className={`relative flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              } ${variant === 'sidebar' ? 'flex-row space-x-3 w-full text-left' : ''}`}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 ${variant === 'sidebar' ? 'h-4 w-4' : ''}`} />
                {item.badge && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </div>
              <span className={`text-xs mt-1 ${variant === 'sidebar' ? 'mt-0 flex-1' : ''}`}>
                {item.label}
              </span>
              {isActive && variant !== 'sidebar' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-full"
                  initial={false}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// Responsive Modal Component
export function ResponsiveModal({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  position = 'center'
}: ResponsiveModalProps) {
  const device = useDevice();

  const getSizeClasses = () => {
    const sizes = {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
      full: 'max-w-full mx-4'
    };
    return sizes[size];
  };

  const getPositionClasses = () => {
    const positions = {
      center: 'items-center',
      bottom: 'items-end',
      top: 'items-start'
    };
    return positions[position];
  };

  if (device.isMobile && position === 'center') {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          {title && (
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{title}</h2>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          {children}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <div className={`fixed inset-0 z-50 flex ${getPositionClasses()} p-4`}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: position === 'bottom' ? 20 : 0 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: position === 'bottom' ? 20 : 0 }}
              className={`bg-white rounded-lg shadow-xl ${getSizeClasses()} w-full max-h-[90vh] overflow-y-auto`}
            >
              {(title || device.isMobile) && (
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold">{title}</h2>
                  <Button variant="ghost" size="sm" onClick={onClose}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              )}
              <div className="p-6">
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// Responsive Search Component
export function ResponsiveSearch({ placeholder = "Search...", onSearch }: {
  placeholder?: string;
  onSearch?: (query: string) => void;
}) {
  const device = useDevice();
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(!device.isMobile);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    onSearch?.(searchQuery);
  };

  return (
    <div className="relative">
      {device.isMobile ? (
        <div className="flex items-center">
          {!isExpanded ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="p-2"
            >
              <Search className="h-4 w-4" />
            </Button>
          ) : (
            <div className="flex items-center space-x-2 flex-1">
              <Input
                placeholder={placeholder}
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                className="flex-1"
                autoFocus
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsExpanded(false);
                  setQuery('');
                  onSearch?.('');
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={placeholder}
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      )}
    </div>
  );
}

// Responsive Table Component
export function ResponsiveTable({
  headers,
  rows,
  className = ''
}: {
  headers: Array<{ key: string; label: string; sortable?: boolean }>;
  rows: Array<Record<string, any>>;
  className?: string;
}) {
  const device = useDevice();

  if (device.isMobile) {
    return (
      <div className={`space-y-4 ${className}`}>
        {rows.map((row, index) => (
          <Card key={index} className="p-4">
            <div className="space-y-2">
              {headers.map((header) => (
                <div key={header.key} className="flex justify-between">
                  <span className="font-medium text-gray-600">{header.label}:</span>
                  <span>{row[header.key]}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            {headers.map((header) => (
              <th key={header.key} className="text-left py-3 px-4 font-medium text-gray-600">
                <div className="flex items-center space-x-1">
                  <span>{header.label}</span>
                  {header.sortable && <SortAsc className="h-4 w-4" />}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
              {headers.map((header) => (
                <td key={header.key} className="py-3 px-4">
                  {row[header.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Accessibility utilities
export const accessibilityUtils = {
  // Focus management
  focusRing: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',

  // Screen reader utilities
  srOnly: 'sr-only',
  srOnlyFocusable: 'sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0',

  // ARIA attributes helper
  getAriaProps: (props: {
    label?: string;
    describedBy?: string;
    expanded?: boolean;
    controls?: string;
    current?: boolean | 'page' | 'step' | 'location' | 'date' | 'time';
  }) => ({
    'aria-label': props.label,
    'aria-describedby': props.describedBy,
    'aria-expanded': props.expanded,
    'aria-controls': props.controls,
    'aria-current': props.current
  }),

  // Keyboard navigation
  keyboardNavigation: {
    onKeyDown: (event: React.KeyboardEvent, actions: {
      onEnter?: () => void;
      onEscape?: () => void;
      onArrowUp?: () => void;
      onArrowDown?: () => void;
      onArrowLeft?: () => void;
      onArrowRight?: () => void;
    }) => {
      switch (event.key) {
        case 'Enter':
          actions.onEnter?.();
          break;
        case 'Escape':
          actions.onEscape?.();
          break;
        case 'ArrowUp':
          event.preventDefault();
          actions.onArrowUp?.();
          break;
        case 'ArrowDown':
          event.preventDefault();
          actions.onArrowDown?.();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          actions.onArrowLeft?.();
          break;
        case 'ArrowRight':
          event.preventDefault();
          actions.onArrowRight?.();
          break;
      }
    }
  }
};

// Touch gesture utilities
export const touchUtils = {
  // Swipe detection
  useSwipe: (element: HTMLElement | null, callbacks: {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
  }) => {
    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!startX || !startY) return;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = startX - endX;
      const diffY = startY - endY;
      const minSwipeDistance = 50;

      if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal swipe
        if (Math.abs(diffX) > minSwipeDistance) {
          if (diffX > 0) {
            callbacks.onSwipeLeft?.();
          } else {
            callbacks.onSwipeRight?.();
          }
        }
      } else {
        // Vertical swipe
        if (Math.abs(diffY) > minSwipeDistance) {
          if (diffY > 0) {
            callbacks.onSwipeUp?.();
          } else {
            callbacks.onSwipeDown?.();
          }
        }
      }

      startX = 0;
      startY = 0;
    };

    useEffect(() => {
      if (!element) return;

      element.addEventListener('touchstart', handleTouchStart);
      element.addEventListener('touchend', handleTouchEnd);

      return () => {
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchend', handleTouchEnd);
      };
    }, [element]);
  }
};

// Performance utilities for mobile
export const performanceUtils = {
  // Lazy loading
  lazyLoad: (callback: () => void, options?: IntersectionObserverInit) => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback();
          observer.disconnect();
        }
      });
    }, options);

    return observer;
  },

  // Debounce for search inputs
  debounce: (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(null, args), wait);
    };
  },

  // Throttle for scroll events
  throttle: (func: Function, limit: number) => {
    let inThrottle: boolean;
    return (...args: any[]) => {
      if (!inThrottle) {
        func.apply(null, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};

// Example usage component
export function ResponsiveExample() {
  const device = useDevice();
  const { toast } = useToast();

  const navigationItems = [
    { id: 'home', label: 'Home', icon: Home, badge: 3 },
    { id: 'projects', label: 'Projects', icon: Plus },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <MobileResponsiveLayout
      sidebar={
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Navigation</h2>
          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100"
                  onClick={() => toast({
                    title: `${item.label} clicked`,
                    description: `You are on a ${device.isMobile ? 'mobile' : device.isTablet ? 'tablet' : 'desktop'} device`
                  })}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <Badge variant="destructive" className="ml-auto">
                      {item.badge}
                    </Badge>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      }
      header={
        <div className="px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">CreatorNexus</h1>
          <div className="flex items-center space-x-4">
            <ResponsiveSearch onSearch={(query) => console.log('Search:', query)} />
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        </div>
      }
      footer={
        <div className="text-center text-gray-600">
          <p>&copy; 2024 CreatorNexus. All rights reserved.</p>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Dashboard</h2>
            <p className="text-gray-600">
              Welcome back! You're on a {device.isMobile ? '📱 mobile' : device.isTablet ? '📟 tablet' : '🖥️ desktop'} device
            </p>
          </div>
          <Badge variant="outline" className="flex items-center space-x-2">
            {device.isMobile ? <Smartphone className="h-4 w-4" /> : device.isTablet ? <Tablet className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
            <span>{device.screenWidth} x {device.screenHeight}</span>
          </Badge>
        </div>

        <ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 3 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ResponsiveCard key={i} variant="elevated">
              <CardHeader>
                <CardTitle>Card {i}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>This is responsive card {i}. It adapts to different screen sizes automatically.</p>
                <Button className="mt-4" size="sm">
                  Learn More
                </Button>
              </CardContent>
            </ResponsiveCard>
          ))}
        </ResponsiveGrid>
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation items={navigationItems} />
    </MobileResponsiveLayout>
  );
}
