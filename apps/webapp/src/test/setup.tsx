import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock Capacitor — getPlatform is a vi.fn so tests can override it
const mockGetPlatform = vi.fn(() => 'web');
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: mockGetPlatform,
    isNativePlatform: () => false,
    isPluginAvailable: () => false,
    Http: {
      request: vi.fn(),
    },
  },
}));

// Mock @capacitor/device
vi.mock('@capacitor/device', () => ({
  Device: {
    getInfo: vi.fn().mockResolvedValue({ platform: 'web' }),
  },
}));

// Mock @capacitor/browser
vi.mock('@capacitor/browser', () => ({
  Browser: {
    open: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock @capacitor/preferences
vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn().mockResolvedValue({ value: null }),
    set: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock @capacitor/splash-screen
vi.mock('@capacitor/splash-screen', () => ({
  SplashScreen: {
    hide: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock @capacitor/app
vi.mock('@capacitor/app', () => ({
  App: {
    addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }),
  },
}));

// Mock @sentry/react
vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Routes: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Route: ({ element }: { element: React.ReactNode }) => <div>{element}</div>,
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/', search: '' }),
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
  Toaster: () => null,
}));

// Mock recharts
vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: ({ dataKey, fill }: { dataKey: string; fill: string }) => <div data-key={dataKey} fill={fill} />,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: ({ dataKey }: { dataKey: string }) => <div data-key={dataKey} />,
  Cell: ({ fill }: { fill: string }) => <div fill={fill} />,
  XAxis: ({ dataKey }: { dataKey: string }) => <div data-key={dataKey} />,
  YAxis: () => <div />,
  CartesianGrid: ({ strokeDasharray }: { strokeDasharray: string }) => <div stroke={strokeDasharray} />,
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Legend: () => <div />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});
vi.stubGlobal('IntersectionObserver', mockIntersectionObserver);

// Mock ResizeObserver (used by cmdk/Command component)
const mockResizeObserver = vi.fn();
mockResizeObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});
vi.stubGlobal('ResizeObserver', mockResizeObserver);

// Mock matchMedia with cached instances (same query = same mql object)
interface MockMediaQueryList {
  matches: boolean;
  media: string;
  onchange: null | EventListener;
  addListener: (cb: EventListener) => void;
  removeListener: (cb: EventListener) => void;
  addEventListener: (event: string, cb: EventListener) => void;
  removeEventListener: (event: string, cb: EventListener) => void;
  dispatchEvent: (event: Event) => boolean;
}
const matchMediaInstances = new Map<string, MockMediaQueryList>();
const matchMediaMock = (query: string) => {
  // Return cached instance for the same query string
  if (matchMediaInstances.has(query)) {
    return matchMediaInstances.get(query);
  }
  
  const listeners = new Set<EventListener>();
  const mql = {
    matches: window.innerWidth < 768,
    media: query,
    onchange: null,
    addListener: (cb: EventListener) => listeners.add(cb),
    removeListener: (cb: EventListener) => listeners.delete(cb),
    addEventListener: (_: string, cb: EventListener) => listeners.add(cb),
    removeEventListener: (_: string, cb: EventListener) => listeners.delete(cb),
    dispatchEvent: (event: Event) => {
      mql.matches = window.innerWidth < 768;
      listeners.forEach(cb => cb(event));
      return true;
    },
  };
  matchMediaInstances.set(query, mql);
  return mql;
};
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(matchMediaMock),
});

// Mock localStorage
const localStorageMock = {
  storage: new Map<string, string>(),
  getItem: vi.fn((key: string) => localStorageMock.storage.get(key) || null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageMock.storage.set(key, value);
  }),
  removeItem: vi.fn((key: string) => {
    localStorageMock.storage.delete(key);
  }),
  clear: vi.fn(() => {
    localStorageMock.storage.clear();
  }),
};
vi.stubGlobal('localStorage', localStorageMock);

// Mock performance (preserve existing now() if available)
vi.stubGlobal('performance', {
  now: () => 0,
  getEntriesByType: vi.fn(() => [{ type: 'navigate' }]),
});

// scrollIntoView is not implemented in jsdom - needed by cmdk/Command
Element.prototype.scrollIntoView = vi.fn();

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.clearAllTimers();
  localStorageMock.storage.clear();
  matchMediaInstances.clear();
});
