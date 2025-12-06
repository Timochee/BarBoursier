import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { ChartData, Beer } from '../types';
import { SECTOR_COLORS, createBeerColorMap, getBeerColor } from '../utils/colors';

interface PriceChartProps {
  chartData: ChartData | null;
  beers: Beer[];
}

export function PriceChart({ chartData, beers }: PriceChartProps) {
  const [viewMode, setViewMode] = useState<'sector' | 'beer'>('sector');
  const [selectedBeers, setSelectedBeers] = useState<Set<number>>(new Set());

  // Create stable color map based on beer IDs
  const beerColorMap = useMemo(() => createBeerColorMap(beers), [beers]);

  if (!chartData || chartData.timeLabels.length === 0) {
    return (
      <div className="h-72 flex flex-col items-center justify-center gap-4" style={{ color: 'var(--text-secondary)' }}>
        <svg className="w-16 h-16 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-lg font-medium">No price history yet</p>
        <p className="text-sm">Make some purchases to see the chart!</p>
      </div>
    );
  }

  const toggleBeer = (beerId: number) => {
    setSelectedBeers(prev => {
      const next = new Set(prev);
      if (next.has(beerId)) {
        next.delete(beerId);
      } else {
        next.add(beerId);
      }
      return next;
    });
  };

  // Prepare data for chart and calculate min/max
  let minPrice = Infinity;
  let maxPrice = -Infinity;

  const data = chartData.timeLabels.map((_label, index) => {
    const point: Record<string, number | string> = { time: index + 1 };

    if (viewMode === 'sector') {
      Object.entries(chartData.sectorPriceHistory).forEach(([sector, prices]) => {
        const price = prices[index] ?? 0;
        point[sector] = price;
        if (price > 0) {
          minPrice = Math.min(minPrice, price);
          maxPrice = Math.max(maxPrice, price);
        }
      });
    } else {
      beers.forEach(beer => {
        if (selectedBeers.size === 0 || selectedBeers.has(beer.id)) {
          const prices = chartData.beerPriceHistory[beer.id] || [];
          const price = prices[index] ?? beer.currentPrice;
          point[beer.name] = price;
          minPrice = Math.min(minPrice, price);
          maxPrice = Math.max(maxPrice, price);
        }
      });
    }

    return point;
  });

  // Add padding to min/max (10% on each side)
  const priceRange = maxPrice - minPrice;
  const padding = Math.max(priceRange * 0.1, 0.5); // At least 0.5€ padding
  const yMin = Math.max(0, Math.floor((minPrice - padding) * 10) / 10);
  const yMax = Math.ceil((maxPrice + padding) * 10) / 10;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex rounded-lg overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
          <button
            onClick={() => setViewMode('sector')}
            className={`px-4 py-2 text-sm font-medium transition-all ${
              viewMode === 'sector'
                ? 'bg-[#e94560] text-white'
                : 'hover:bg-white/10'
            }`}
          >
            By Sector
          </button>
          <button
            onClick={() => setViewMode('beer')}
            className={`px-4 py-2 text-sm font-medium transition-all ${
              viewMode === 'beer'
                ? 'bg-[#e94560] text-white'
                : 'hover:bg-white/10'
            }`}
          >
            By Beer
          </button>
        </div>

        {viewMode === 'beer' && (
          <div className="flex flex-wrap gap-2">
            {beers.map((beer) => {
              const beerColor = getBeerColor(beer.id, beerColorMap);
              return (
                <label
                  key={beer.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all text-sm ${
                    selectedBeers.size === 0 || selectedBeers.has(beer.id)
                      ? 'opacity-100'
                      : 'opacity-40'
                  }`}
                  style={{ background: 'var(--bg-tertiary)' }}
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ background: beerColor }}
                  />
                  <input
                    type="checkbox"
                    checked={selectedBeers.size === 0 || selectedBeers.has(beer.id)}
                    onChange={() => toggleBeer(beer.id)}
                    className="sr-only"
                  />
                  {beer.name}
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis
            dataKey="time"
            stroke="var(--text-secondary)"
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            tickLine={{ stroke: 'var(--border-color)' }}
          />
          <YAxis
            stroke="var(--text-secondary)"
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            tickLine={{ stroke: 'var(--border-color)' }}
            tickFormatter={(value) => `${value.toFixed(2)}`}
            domain={[yMin, yMax]}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
            itemStyle={{ color: 'var(--text-primary)' }}
            formatter={(value: number) => [`${value.toFixed(2)} EUR`, '']}
            labelFormatter={(label) => `Transaction #${label}`}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={(value) => (
              <span style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                {value}
              </span>
            )}
          />

          {viewMode === 'sector' ? (
            Object.keys(chartData.sectorPriceHistory).map(sector => (
              <Line
                key={sector}
                type="monotone"
                dataKey={sector}
                stroke={SECTOR_COLORS[sector] || '#888'}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
            ))
          ) : (
            beers
              .filter(beer => selectedBeers.size === 0 || selectedBeers.has(beer.id))
              .map((beer) => (
                <Line
                  key={beer.id}
                  type="monotone"
                  dataKey={beer.name}
                  stroke={getBeerColor(beer.id, beerColorMap)}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              ))
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
