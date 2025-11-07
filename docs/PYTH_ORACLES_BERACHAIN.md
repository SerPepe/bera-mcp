# Pyth Network Oracle Integration Guide - Berachain

## Overview

This guide provides complete information for integrating **Pyth Network** price oracles on **Berachain** (both Bepolia testnet and mainnet). Pyth Network offers high-frequency, low-latency price feeds with multiple publishers for reliable on-chain price data.

**Official Documentation**: [Pyth Network Docs](https://docs.pyth.network/)

---

## Contract Addresses

### Pyth Oracle Contract

The Pyth oracle contract address is **the same** for both testnet and mainnet:

| Network | Contract Address |
|---------|------------------|
| **Berachain Bepolia** (Testnet) | `0x2880aB155794e7179c9eE2e38200202908C17B43` |
| **Berachain** (Mainnet) | `0x2880aB155794e7179c9eE2e38200202908C17B43` |

**Source**: [Pyth Network Contract Addresses](https://docs.pyth.network/price-feeds/core/contract-addresses/evm#testnets)

---

## Available Price Feeds

### Berachain Native Assets

#### 1. HONEY/USD
**Feed ID**: `0xf67b033925d73d43ba4401e00308d9b0f26ab4fbd1250e8b5407b9eaade7e1f4`  
**Symbol**: `Crypto.HONEY/USD`  
**Base**: HONEY (Berachain stablecoin)  
**Quote**: USD  
**Exponent**: -8  
**View Feed**: [Pyth Insights - HONEY/USD](https://insights.pyth.network/price-feeds/Crypto.HONEY%2FUSD)

**Use Case**: Price validation for HONEY-denominated protocols, stablecoin pegs, lending protocols.

---

#### 2. BERA/USD
**Feed ID**: `0x962088abcfdbdb6e30db2e340c8cf887d9efb311b1f2f17b155a63dbb6d40265`  
**Symbol**: `Crypto.BERA/USD`  
**Base**: BERA (Berachain native token)  
**Quote**: USD  
**Exponent**: -8  
**View Feed**: [Pyth Insights - BERA/USD](https://insights.pyth.network/price-feeds/Crypto.BERA%2FUSD)

**Use Case**: Native token pricing, gas price calculations, protocol valuations.

---

#### 3. BYUSD/USD (Berachain PYUSD)
**Feed ID**: `0x00456705ae9007ea761e95c724035a23a62fe9e444bbc744e11af7f050ab53c3`  
**Symbol**: `Crypto.BYUSD/USD`  
**Base**: BYUSD (Berachain PYUSD)  
**Quote**: USD  
**Exponent**: -8  
**View Feed**: [Pyth Insights - BYUSD/USD](https://insights.pyth.network/price-feeds/Crypto.BYUSD%2FUSD)

**Use Case**: PYUSD stablecoin pricing, cross-chain stablecoin protocols.

---

### Infrared Protocol Assets

#### 4. IBERA/USD (Infrared Berachain)
**Feed ID**: `0xeb943c0b5c9e02a529f799ac91070c3b7046f9412f3e5b0a90ba00267b838f34`  
**Symbol**: `Crypto.IBERA/USD`  
**Base**: IBERA (Infrared Berachain token)  
**Quote**: USD  
**Exponent**: -8  
**View Feed**: [Pyth Insights - IBERA/USD](https://insights.pyth.network/price-feeds/Crypto.IBERA%2FUSD)

**Use Case**: Infrared protocol integrations, liquid staking derivatives.

---

#### 5. IBGT/USD
**Feed ID**: `0xc929105a1af143cbfc887c4573947f54422a9ca88a9e622d151b8abdf5c2962f`  
**Symbol**: `Crypto.IBGT/USD`  
**Base**: IBGT (Infrared BGT token)  
**Quote**: USD  
**Exponent**: -8  
**View Feed**: [Pyth Insights - IBGT/USD](https://insights.pyth.network/price-feeds/Crypto.IBGT%2FUSD)

**Use Case**: BGT token pricing, governance token valuations.

---

## Quick Reference Table

| Asset | Feed ID | Symbol | Base | Quote | Exponent |
|-------|---------|--------|------|-------|----------|
| HONEY | `0xf67b033925d73d43ba4401e00308d9b0f26ab4fbd1250e8b5407b9eaade7e1f4` | Crypto.HONEY/USD | HONEY | USD | -8 |
| BERA | `0x962088abcfdbdb6e30db2e340c8cf887d9efb311b1f2f17b155a63dbb6d40265` | Crypto.BERA/USD | BERA | USD | -8 |
| BYUSD | `0x00456705ae9007ea761e95c724035a23a62fe9e444bbc744e11af7f050ab53c3` | Crypto.BYUSD/USD | BYUSD | USD | -8 |
| IBERA | `0xeb943c0b5c9e02a529f799ac91070c3b7046f9412f3e5b0a90ba00267b838f34` | Crypto.IBERA/USD | IBERA | USD | -8 |
| IBGT | `0xc929105a1af143cbfc887c4573947f54422a9ca88a9e622d151b8abdf5c2962f` | Crypto.IBGT/USD | IBGT | USD | -8 |

---

## Integration Guide

### 1. Install Dependencies

```bash
npm install @pythnetwork/pyth-sdk-solidity
```

Or use the interface directly (as we do in this repo):

```solidity
import {IPyth, PythStructs} from "../interfaces/IPyth.sol";
```

### 2. Pyth Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

interface IPyth {
    function getPriceUnsafe(bytes32 id) external view returns (PythStructs.Price memory);
    function getPriceNoOlderThan(bytes32 id, uint256 age) external view returns (PythStructs.Price memory);
}

library PythStructs {
    struct Price {
        int64 price;        // Price value
        uint64 conf;        // Confidence interval
        int32 expo;         // Exponent (-8 for USD pairs)
        uint256 publishTime; // Publish timestamp
    }
}
```

### 3. Basic Integration Example

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {IPyth, PythStructs} from "./interfaces/IPyth.sol";

contract PriceOracle {
    IPyth public immutable pyth;
    bytes32 public immutable feedId;
    
    // Berachain Pyth contract (same for testnet and mainnet)
    address constant PYTH_CONTRACT = 0x2880aB155794e7179c9eE2e38200202908C17B43;
    
    constructor(bytes32 _feedId) {
        pyth = IPyth(PYTH_CONTRACT);
        feedId = _feedId;
    }
    
    /// @notice Get price in 1e18 format
    function getPrice() external view returns (uint256) {
        // Get price no older than 5 minutes
        PythStructs.Price memory p = pyth.getPriceNoOlderThan(feedId, 300);
        
        // Convert to 1e18 format
        // Price format: price * 10^expo = actual USD value
        // Example: price = 100000000, expo = -8 → 1.0 USD
        require(p.price > 0, "invalid price");
        require(p.expo <= 0, "expo must be negative or zero");
        
        uint256 expoOffset = uint256(int256(-p.expo)); // Convert -8 to 8
        uint256 multiplier = 10 ** (18 + expoOffset); // 10^(18 + 8) = 10^26
        return uint256(int256(p.price)) * multiplier;
    }
}
```

### 4. Deploy Example

```typescript
import { ethers } from "hardhat";

async function deploy() {
  const PYTH_CONTRACT = "0x2880aB155794e7179c9eE2e38200202908C17B43";
  const HONEY_USD_FEED_ID = "0xf67b033925d73d43ba4401e00308d9b0f26ab4fbd1250e8b5407b9eaade7e1f4";
  
  const PriceOracle = await ethers.getContractFactory("PriceOracle");
  const oracle = await PriceOracle.deploy(HONEY_USD_FEED_ID);
  
  await oracle.waitForDeployment();
  console.log("Oracle deployed at:", await oracle.getAddress());
}
```

---

## Price Conversion Formula

Pyth prices use a specific format that needs conversion:

### Formula

```
actualPrice = price * 10^expo
normalizedPrice = price * 10^(18 - expo)
```

### Example: HONEY/USD

- **Pyth Price**: `100000000` (int64)
- **Exponent**: `-8`
- **Actual Value**: `100000000 * 10^(-8) = 1.0 USD`
- **Normalized (1e18)**: `100000000 * 10^(18 - (-8)) = 100000000 * 10^26 = 1e18`

### Solidity Implementation

```solidity
function convertTo1e18(int64 price, int32 expo) internal pure returns (uint256) {
    require(price > 0, "price must be positive");
    require(expo <= 0, "expo must be negative or zero");
    
    uint256 expoOffset = uint256(int256(-expo));
    uint256 multiplier = 10 ** (18 + expoOffset);
    return uint256(int256(price)) * multiplier;
}
```

---

## Best Practices

### 1. Freshness Checks

Always use `getPriceNoOlderThan()` to ensure price data is recent:

```solidity
// Reject prices older than 5 minutes
PythStructs.Price memory p = pyth.getPriceNoOlderThan(feedId, 300);
```

### 2. Confidence Intervals

Check confidence intervals for high-value operations:

```solidity
PythStructs.Price memory p = pyth.getPriceNoOlderThan(feedId, 300);
require(p.conf < maxConfidence, "confidence too high");
```

### 3. Price Bounds

Validate prices are within expected ranges:

```solidity
uint256 price = convertTo1e18(p.price, p.expo);
require(price >= minPrice && price <= maxPrice, "price out of bounds");
```

### 4. Error Handling

Handle stale or invalid prices gracefully:

```solidity
try pyth.getPriceNoOlderThan(feedId, 300) returns (PythStructs.Price memory p) {
    // Use price
} catch {
    // Fallback to cached price or revert
}
```

---

## Network-Specific Configuration

### Berachain Bepolia (Testnet)

```typescript
const config = {
  network: "berachain-bepolia",
  chainId: 80069,
  pythContract: "0x2880aB155794e7179c9eE2e38200202908C17B43",
  feeds: {
    HONEY_USD: "0xf67b033925d73d43ba4401e00308d9b0f26ab4fbd1250e8b5407b9eaade7e1f4",
    BERA_USD: "0x962088abcfdbdb6e30db2e340c8cf887d9efb311b1f2f17b155a63dbb6d40265",
    // ... other feeds
  }
};
```

### Berachain Mainnet

```typescript
const config = {
  network: "berachain",
  chainId: 80094, // Verify actual mainnet chain ID
  pythContract: "0x2880aB155794e7179c9eE2e38200202908C17B43",
  feeds: {
    HONEY_USD: "0xf67b033925d73d43ba4401e00308d9b0f26ab4fbd1250e8b5407b9eaade7e1f4",
    BERA_USD: "0x962088abcfdbdb6e30db2e340c8cf887d9efb311b1f2f17b155a63dbb6d40265",
    // ... other feeds (same as testnet)
  }
};
```

**Note**: Feed IDs are typically the same across testnet and mainnet, but always verify.

---

## Monitoring & Verification

### Check Feed Status

Visit [Pyth Insights](https://insights.pyth.network/) to monitor:
- Current price
- Confidence intervals
- Last update time
- Number of publishers

### On-Chain Verification

```typescript
// Check price freshness
const price = await pyth.getPriceUnsafe(feedId);
const age = block.timestamp - price.publishTime;
console.log("Price age:", age, "seconds");

// Check confidence
console.log("Confidence:", price.conf.toString());
```

---

## Common Use Cases

### 1. Stablecoin Peg Validation

```solidity
contract StablecoinGuard {
    IPyth public immutable pyth;
    bytes32 public immutable feedId;
    uint256 public constant MIN_PRICE = 0.99e18; // $0.99
    uint256 public constant MAX_PRICE = 1.01e18; // $1.01
    
    function isWithinPeg() external view returns (bool) {
        PythStructs.Price memory p = pyth.getPriceNoOlderThan(feedId, 300);
        uint256 price = convertTo1e18(p.price, p.expo);
        return price >= MIN_PRICE && price <= MAX_PRICE;
    }
}
```

### 2. Lending Protocol Collateral Pricing

```solidity
function getCollateralValue(address token, uint256 amount) external view returns (uint256) {
    bytes32 feedId = tokenToFeedId[token];
    PythStructs.Price memory p = pyth.getPriceNoOlderThan(feedId, 300);
    uint256 price = convertTo1e18(p.price, p.expo);
    return (amount * price) / 1e18;
}
```

### 3. DEX Price Oracle

```solidity
function getTokenPrice(address token) external view returns (uint256) {
    bytes32 feedId = tokenToFeedId[token];
    PythStructs.Price memory p = pyth.getPriceNoOlderThan(feedId, 60); // 1 minute freshness
    return convertTo1e18(p.price, p.expo);
}
```

---

## Troubleshooting

### "Price data is stale"

**Cause**: Price hasn't updated within the specified age limit.  
**Fix**: 
- Check feed status on [Pyth Insights](https://insights.pyth.network/)
- Increase `maxAge` parameter if needed
- Verify Pyth contract is operational

### "invalid price" or "price must be positive"

**Cause**: Price returned is negative or zero.  
**Fix**: 
- Verify feed ID is correct
- Check feed is active on Pyth Insights
- Ensure network matches (testnet vs mainnet)

### Price Always Returns Default Value

**Cause**: Oracle contract not properly initialized.  
**Fix**: 
- Verify Pyth contract address: `0x2880aB155794e7179c9eE2e38200202908C17B43`
- Check feed ID matches the network
- Ensure contract has view access to Pyth

---

## Security Considerations

1. **Always use `getPriceNoOlderThan()`** - Never use `getPriceUnsafe()` without checking `publishTime`
2. **Validate confidence intervals** - High confidence = unreliable price
3. **Set price bounds** - Reject prices outside expected ranges
4. **Handle errors gracefully** - Don't revert on stale prices if not critical
5. **Monitor feed status** - Set up alerts for feed downtime

---

## Additional Resources

- [Pyth Network Documentation](https://docs.pyth.network/)
- [Pyth Network Contract Addresses](https://docs.pyth.network/price-feeds/core/contract-addresses/evm)
- [Pyth Insights Dashboard](https://insights.pyth.network/)
- [Berachain Documentation](https://docs.berachain.com/)
- [Pyth SDK for Solidity](https://github.com/pyth-network/pyth-sdk-solidity)

---

## Example Implementation

See our `PriceGuard.sol` contract for a complete implementation:

```solidity
// contracts/core/PriceGuard.sol
// Full implementation with:
// - Pyth integration
// - Price band validation
// - Freshness checks
// - Toggleable enforcement
```

---

## Support

- **Pyth Network Discord**: [Join Discord](https://discord.gg/pythnetwork)
- **Berachain Discord**: [Join Discord](https://discord.gg/berachain)
- **Pyth Network Docs**: [docs.pyth.network](https://docs.pyth.network/)

---

**Last Updated**: 2025-01-XX  
**Maintained By**: Honey Protocol Team

