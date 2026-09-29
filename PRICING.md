# Pricing Logic - Bar Boursier

## Overview

This document describes the complete price evolution logic in the beer market simulation.

The market:
- Reacts to each purchase (not at intervals)
- Operates as **zero-sum**: total increases = total decreases
- Applies sector correlations
- Uses dynamic volatility
- Integrates mean reversion
- Has anti-crash protections

---

## 1. Base Data

Each beer has:
- `basePrice` - Original price
- `currentPrice` - Current market price
- `volatility` - Base volatility (0.22 to 0.55)
- `sector` - Category (pils, abbey, trappist, specialty)

System constants:
- `baseMove` = 0.45
- `sectorCorrelation` = 0.45
- `minPrice` = 0.50€
- `maxPrice` = 25.00€

---

## 2. Effective Volatility

Volatility adjusts based on current price:

```
priceRatio = clamp(currentPrice / basePrice, 0.5, 2.0)
modifier = clamp(1 - 0.3 × ln(priceRatio), 0.5, 1.2)
effectiveVolatility = volatility × modifier
```

**Effect**:
- Price ↑ → Volatility ↓ (expensive beers stabilize)
- Price ↓ → Volatility ↑ (cheap beers become more reactive)

---

## 3. Price Increase (Purchased Beer)

When a user buys a beer:

```
increase = baseMove × effectiveVolatility × currentPrice × quantity^0.7
```

- Sub-linear growth (quantity^0.7) = diminishing returns
- Proportional to current price
- Controlled by volatility

---

## 4. Sector Correlation (Same Sector Beers)

Beers in the same sector also increase:

```
correlatedIncrease = increase × sectorCorrelation × (volatility_other / volatility_bought)
```

Creates "sector trends" - buying Jupiler also raises Stella and Maes.

---

## 5. Mean Reversion

Each beer is pulled toward its base price:

```
gapRatio = |currentPrice - basePrice| / basePrice
strength = 0.01 × (1 + gapRatio) × sectorMultiplier
correction = (basePrice - currentPrice) × strength
```

**Sector multipliers** (higher = faster return):

| Sector | Multiplier | Speed |
|--------|------------|-------|
| Pils | 1.5 | Fast |
| Abbey | 1.0 | Normal |
| Specialty | 0.8 | Slow |
| Trappist | 0.6 | Very slow |

---

## 6. Zero-Sum Distribution (Other Sectors Decrease)

### Step 1: Calculate total increase
```
totalIncrease = purchasedIncrease + sum(correlatedIncreases)
```

### Step 2: Calculate decrease weights
```
weight = SECTOR_MATRIX[boughtSector][beerSector] × effectiveVolatility
share = weight / totalWeight
targetDecrease = totalIncrease × share
```

### Sector Matrix

| Buy ↓ / Decrease → | Pils | Abbey | Trappist | Specialty |
|--------------------|------|-------|----------|-----------|
| **Pils** | - | 0.8 | 0.5 | 0.3 |
| **Abbey** | 0.6 | - | 0.9 | 0.4 |
| **Trappist** | 0.5 | 0.9 | - | 0.5 |
| **Specialty** | 0.4 | 0.5 | 0.5 | - |

**Reading**: Buying Abbey causes Trappist to decrease most (0.9), Pils medium (0.6), Specialty least (0.4).

---

## 7. Anti-Crash Protections

### Protection 1: Max -10% per transaction
```
targetDecrease = min(targetDecrease, currentPrice × 0.10)
```

### Protection 2: Floor brake
Reduces decrease when approaching minimum price:
```
distanceToFloor = (currentPrice - minPrice) / currentPrice
protectionFactor = min(1.0, distanceToFloor × 2)
targetDecrease *= protectionFactor
```

### Protection 3: Absolute floor
```
newPrice = max(newPrice, minPrice)
```

---

## 8. Rounding & Final Balancing

### Round to quarter euro
```
roundedPrice = round(price × 4) / 4
```

### Zero-sum adjustment
After rounding, compensate for imbalance:
- If increases > decreases: lower a high-priced beer by 0.25€
- If increases < decreases: raise a low-priced beer by 0.25€

Tolerance: ±0.20€

---

## 9. Complete Example

**Initial state**:
- Jupiler (pils): 2.50€, vol 0.25
- Stella (pils): 2.75€, vol 0.22
- Leffe (abbey): 3.50€, vol 0.35
- Chimay (trappist): 5.00€, vol 0.50

**Action**: Buy 1 Jupiler

**Calculations**:
1. Jupiler increase: `0.45 × 0.25 × 2.50 × 1 = +0.28€` → rounded +0.25€
2. Stella (same sector): `+0.25 × 0.45 × 0.88 = +0.10€` → rounded +0.25€
3. Total increase: 0.50€
4. Leffe absorbs ~60%: -0.25€
5. Chimay absorbs ~40%: -0.25€
6. Total decrease: 0.50€ ✓ Zero-sum!

**Result**:
| Beer | Before | After | Change |
|------|--------|-------|--------|
| Jupiler | 2.50€ | 2.75€ | +0.25€ |
| Stella | 2.75€ | 3.00€ | +0.25€ |
| Leffe | 3.50€ | 3.25€ | -0.25€ |
| Chimay | 5.00€ | 4.75€ | -0.25€ |

---

## 10. Summary

This model:
- Reacts after each purchase
- Is stable, fluid, and realistic
- Reproduces natural market behavior
- Prevents explosions/implosions
- Doesn't require crash mechanics
- Prevents market manipulation
