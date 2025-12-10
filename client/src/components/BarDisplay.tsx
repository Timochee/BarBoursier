import { useMemo, useEffect, useState, useRef } from 'react';
import type { Beer, ChartData } from 'shared';
import { createBeerColorMap, getBeerColor } from '../utils/colors';
import { getChangeClass } from '../utils/priceChange';
import { PriceChart } from './PriceChart';

interface BarDisplayProps {
  beers: Beer[];
  chartData: ChartData | null;
  isConnected: boolean;
  theme: 'dark' | 'light';
  onExit: () => void;
}

// Sort beers by category then name
const CATEGORY_ORDER: Record<string, number> = {
  pils: 0,
  abbey: 1,
  trappist: 2,
  specialty: 3,
};

const INACTIVITY_TIMEOUT = 5000; // 5 seconds

export function BarDisplay({ beers, chartData, isConnected, theme, onExit }: BarDisplayProps) {
  const [priceChanges, setPriceChanges] = useState<Map<number, 'up' | 'down'>>(new Map());
  const previousPrices = useRef<Map<number, number>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);

  // Reset inactivity timer on any user interaction
  const resetInactivityTimer = () => {
    setShowControls(true);
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    inactivityTimer.current = setTimeout(() => {
      setShowControls(false);
    }, INACTIVITY_TIMEOUT);
  };

  // Setup inactivity detection
  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(event => window.addEventListener(event, resetInactivityTimer));
    resetInactivityTimer(); // Start timer on mount

    return () => {
      events.forEach(event => window.removeEventListener(event, resetInactivityTimer));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, []);

  const beerColorMap = useMemo(() => createBeerColorMap(beers), [beers]);

  // Sort beers by category
  const sortedBeers = useMemo(() => {
    return [...beers].sort((a, b) => {
      const catCompare = (CATEGORY_ORDER[a.category] ?? 99) - (CATEGORY_ORDER[b.category] ?? 99);
      if (catCompare !== 0) return catCompare;
      return a.name.localeCompare(b.name);
    });
  }, [beers]);

  // Track price changes for animations
  useEffect(() => {
    const newChanges = new Map<number, 'up' | 'down'>();

    beers.forEach(beer => {
      const prevPrice = previousPrices.current.get(beer.id);
      if (prevPrice !== undefined && prevPrice !== beer.currentPrice) {
        newChanges.set(beer.id, beer.currentPrice > prevPrice ? 'up' : 'down');
      }
      previousPrices.current.set(beer.id, beer.currentPrice);
    });

    if (newChanges.size > 0) {
      setPriceChanges(newChanges);
      // Clear animations after 2s
      const timeout = setTimeout(() => setPriceChanges(new Map()), 2000);
      return () => clearTimeout(timeout);
    }
  }, [beers]);

  // Auto-scroll effect
  useEffect(() => {
    if (!autoScroll || !containerRef.current) return;

    const container = containerRef.current;
    let scrollDirection = 1;
    const scrollSpeed = 0.5;

    const scroll = () => {
      if (!container) return;

      container.scrollTop += scrollDirection * scrollSpeed;

      // Reverse direction at bounds
      if (container.scrollTop >= container.scrollHeight - container.clientHeight) {
        scrollDirection = -1;
      } else if (container.scrollTop <= 0) {
        scrollDirection = 1;
      }
    };

    const interval = setInterval(scroll, 30);
    return () => clearInterval(interval);
  }, [autoScroll]);

  // Exit on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExit();
      if (e.key === ' ') setAutoScroll(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExit]);

  const getChangePercent = (beer: Beer) => {
    return ((beer.currentPrice - beer.basePrice) / beer.basePrice) * 100;
  };

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden ${theme}`}
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* Header */}
      <header
        className="flex items-center justify-between px-8 py-4 border-b"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent">
            Bar Boursier
          </h1>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            {isConnected ? 'Live' : 'Offline'}
          </div>
        </div>
        {/* Controls - visible only when active */}
        <div
          className={`flex items-center gap-4 text-sm transition-opacity duration-500 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          style={{ color: 'var(--text-secondary)' }}
        >
          <span>ESC to exit</span>
          <span>SPACE to toggle scroll</span>
          <button
            onClick={onExit}
            className="px-4 py-2 rounded-lg transition-colors hover:bg-white/10"
            style={{ background: 'var(--bg-tertiary)' }}
          >
            Exit
          </button>
        </div>
      </header>

      {/* Beer Grid */}
      <div
        ref={containerRef}
        className={`overflow-auto p-6 scrollbar-hide ${chartData ? 'h-[calc(100vh-80px-380px)]' : 'h-[calc(100vh-80px)]'}`}
        style={{ scrollBehavior: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {sortedBeers.map((beer) => {
            const change = getChangePercent(beer);
            const changeDirection = priceChanges.get(beer.id);
            const beerColor = getBeerColor(beer.id, beerColorMap);

            return (
              <div
                key={beer.id}
                className={`relative p-4 rounded-xl border transition-all duration-500 ${
                  changeDirection === 'up'
                    ? 'border-green-500 shadow-lg shadow-green-500/30 scale-[1.02]'
                    : changeDirection === 'down'
                      ? 'border-red-500 shadow-lg shadow-red-500/30 scale-[1.02]'
                      : ''
                }`}
                style={{
                  background: 'var(--bg-secondary)',
                  borderColor: changeDirection ? undefined : 'var(--border-color)'
                }}
              >
                {/* Flash overlay for price change */}
                {changeDirection && (
                  <div
                    className={`absolute inset-0 rounded-xl animate-pulse opacity-20 ${
                      changeDirection === 'up' ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                )}

                <div className="relative z-10">
                  {/* Beer name and icon */}
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0"
                      style={{ background: beerColor }}
                    >
                      {beer.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold truncate">{beer.name}</h2>
                      <span className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>{beer.category}</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-center">
                    <div className={`text-4xl font-bold mb-1 transition-colors duration-300 ${
                      changeDirection === 'up' ? 'text-green-400' :
                        changeDirection === 'down' ? 'text-red-400' : ''
                    }`}>
                      {beer.currentPrice.toFixed(2)}
                      <span className="text-xl ml-1" style={{ color: 'var(--text-secondary)' }}>€</span>
                    </div>
                    <div className={`text-lg font-semibold ${getChangeClass(change)}`}>
                      {change > 0 ? '+' : ''}{change.toFixed(1)}%
                      {change > 0 ? ' ▲' : change < 0 ? ' ▼' : ''}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Price Chart at bottom */}
      {chartData && (
        <div
          className="h-[380px] border-t px-6 py-4"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
        >
          <PriceChart chartData={chartData} beers={beers} />
        </div>
      )}

      {/* Auto-scroll indicator - visible only when active */}
      <div
        className={`fixed right-4 px-4 py-2 rounded-lg text-sm transition-opacity duration-500 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: 'var(--bg-tertiary)',
          color: 'var(--text-secondary)',
          bottom: chartData ? '400px' : '20px'
        }}
      >
        Auto-scroll: {autoScroll ? 'ON' : 'OFF'}
      </div>
    </div>
  );
}
