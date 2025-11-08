import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// All the remaining scraped content
const scrapedDocs = {
  'panda-subgraph-advanced-usage-guide.md': `# Panda Subgraph Advanced Usage Guide

## Complex Integration Patterns

### Real-time Market Making

Track pool state changes and price movements in real-time using GraphQL queries with polling strategies.

### Historical Analysis Engine

Efficiently process historical data for analytics using batch processing and time-based queries.

## Performance Optimization

### Caching Strategies

Implement efficient caching for frequently accessed data with TTL-based cache invalidation.

### Batch Processing

Efficiently handle multiple queries using batching techniques.

## Error Handling & Recovery

### Robust Query Handler

Handle network issues and retry failed queries with exponential backoff.

## Edge Cases

### Handling Network Upgrades

Monitor network continuity and handle potential network upgrade scenarios.

## Best Practices & Tips

1. Query Optimization - Only request needed fields
2. Rate Limiting - Implement rate limiting for API calls
3. Performance Monitoring - Track query performance metrics`,

  'panda-api.md': `# Panda API

Kodiak provides a way to get all the tokens created using the panda factory. The REST API is used for this purpose.

## Base API url

\`\`\`
https://api.panda.kodiak.finance
\`\`\`

## How to use

First of all, any routes with the panda api assume that you specify a chainId,

\`\`\`
https://api.panda.kodiak.finance/80084/endpoints.....
\`\`\`

There are no other requirements at this time, the API is fully public and does not require a API key

## Endpoints

#### Get a list of tokens (\`GET /tokens\`)

| Query argument | Required | Description |
|----------------|----------|-------------|
| limit | No | Maximum number of tokens in the response (Up to 100) |
| page | No | Current Page |
| addresses | No | A list of addresses separated by commas. If specified, you will only receive tokens from this list |

Example:
\`\`\`
https://api.panda.kodiak.finance/80084/tokens?limit=20&page=2
\`\`\`

#### Get a specific tokens (\`GET /tokens/<address>\`)

Example:
\`\`\`
https://api.panda.kodiak.finance/80084/tokens/0xc22212eba66997d6bb9d006f4e61d2da0a17fe35
\`\`\`

#### Get a tokenList (\`GET /tokenList.json\`)

Example:
\`\`\`
https://api.panda.kodiak.finance/80084/tokenList.json
\`\`\`

Provides a list of all tokens in a token list compatible format. This list only includes tokens that have been **graduated**`,

  'farms-technical-integration-guide.md': `# Farms Technical Integration Guide

## Overview

KodiakFarm is an advanced staking protocol that implements a dynamic reward system with time-locked staking mechanisms. The protocol enables users to stake ERC20 tokens and earn multiple reward types simultaneously, with rewards amplified through a duration-based multiplier system.

### Technical Details

**Initialization and Setup**

1. **Deployment Flow**
   - Deploy the contract through the FarmFactory
   - Initialize with owner, staking token, reward tokens, managers, and rates
   - Fund the contract with reward tokens
   - Call \`startFarm()\` to begin operations

2. **Reward Configuration**
   - Multiple reward tokens can be configured
   - Each token has its own manager and rate
   - Additional reward tokens can be added post-deployment

3. **Staking Mechanism**
   - Users lock tokens for a specified duration
   - Lock duration affects reward multiplier
   - Multiplier ranges from 1x to 3x (configurable)

**Integration Steps**

1. **Contract Setup** - Initialize the farm contract
2. **Token Approvals** - Approve staking and reward tokens
3. **Staking Integration** - Lock tokens, withdraw, and claim rewards
4. **Event Handling** - Monitor StakeLocked and RewardPaid events

## Best Practices

1. **Security Considerations**
   - Always verify reward token balances before setting rates
   - Implement frontend checks for lock duration limits
   - Monitor total staked amounts against cap
   - Handle emergency scenarios through proper channels

2. **Gas Optimization**
   - Batch withdrawals using \`withdrawLockedMultiple\`
   - Use \`withdrawLockedAll\` for mass withdrawals
   - Consider gas costs when setting reward periods

3. **Error Handling**
   - Implement proper error handling for failed transactions
   - Monitor for paused states (staking, withdrawals, rewards)
   - Handle grey-listed address scenarios`,

  'farms-smart-contract-reference.md': `# Farms Smart Contract Reference

## Core Functions

\`initialize\`: Initializes a new KodiakFarm instance.

\`stakeLocked\`: Stakes tokens with a time lock.

\`withdrawLocked\`: Withdraws a specific locked stake.

\`getReward\`: Claims all available reward tokens.

\`addNewRewardToken\`: Adds a new reward token to the farm.

\`setRewardRate\`: Updates the reward rate for a specific token.

\`emergencyWithdraw\`: Emergency withdraws a stake without claiming rewards.

\`recoverERC20\`: Recovers mistakenly sent tokens from the contract.

## Administrative Functions

\`setMultipliers\`: Updates the maximum lock multiplier.

\`addNewRewardToken\`: Adds a new reward token to the farm.

## Events

- \`StakeLocked\`: Emitted when tokens are staked
- \`WithdrawLocked\`: Emitted when tokens are withdrawn
- \`RewardPaid\`: Emitted when rewards are paid

## Role-Based Access Control

1. **Owner** - Set multipliers, add reward tokens, configure staking caps, manage greylist
2. **Factory Owner** - Emergency controls, pause withdrawals/rewards, override lock restrictions
3. **Token Managers** - Manage specific reward tokens, set reward rates, recover mistaken tokens

## Security Features

1. **Emergency Controls** - Pause staking/withdrawals/rewards, emergency withdrawal option
2. **Access Controls** - Multi-role system, greylist functionality, manager-specific permissions
3. **Economic Safety** - Dynamic reward adjustment, staking caps, lock time restrictions`,

  'protocol-islands.md': `# Kodiak Islands Protocol

## Introduction to Automated Liquidity Management (ALM)

Concentrated liquidity in Kodiak V3 pool offers significantly higher capital efficiency compared to traditional AMMs, but it comes with increased complexity in liquidity management. As liquidity providers need to actively manage their positions to maintain optimal ranges as prices move, Automated Liquidity Management (ALM) solutions become essential for efficient capital deployment.

## What are Kodiak Islands?

Kodiak Islands are ERC20-wrapped Kodiak V3 positions that enable simplified liquidity provision through a fungible token interface. When users add liquidity to an Island, they receive Kodiak Island tokens representing their proportional ownership of the underlying Kodiak V3 position. These tokens can be freely transferred, traded, or redeemed for the underlying assets at any time.

Key benefits:
- Simplified liquidity provision through standard ERC20 interface
- Liquidity is rebalanced to stay "in range" and balanced around "fair price" (for managed Islands)
- Compatible with Berachain Proof-of-Liquidity, and eligible for BGT whitelisting
- Fungible ERC-20 representation of Concentrated Liquidity positions
- Automatic fee compounding
- Rebalance using liquidity through-out Berachain, not just what's in the pool

## Types of Kodiak Islands

- **Kodiak Islands** - Kodiak Islands are deployed and permissioned by Kodiak Protocol and rebalanced by permissioned parties (manager) authorized by the Kodiak Protocol. Each Island has a strategy designed to keep the Island "in range" around "fair price" in order to be compatible with Proof-of-Liquidity. Kodiak Islands charge a manager fee of 10% of LP fees generated.

- **Permissionless Islands** - Deployed by anyone, this enables anyone to create ERC-20 wrappers on a particular "fixed range" Kodiak V3 pool of their choice. For trust minimization, once the Island is deployed, the ranges cannot be adjusted. Permissionless Islands charge a manager fee of 5% of LP fees generated.`,

  'kodiak-islands-understanding-token-deposit-ratio.md': `# Understanding Token Deposit Ratio

## Overview

When providing liquidity to a Kodiak Island, tokens must be deposited in a specific ratio determined by the current price and position of the underlying Kodiak V3 pool.

## Core Concepts

- Island Token Ratio: Each Island has a target ratio of its underlying tokens (token0 and token1). This ratio is determined by the current price of the tokens and the position's boundaries.
- Single-Sided Deposits: Users often want to deposit a single token. In this case, a portion of the input token must be swapped for the other token to match the Island's target ratio.
- Price Impact: Swapping tokens can cause price impact, which is the change in price due to the size of the trade. We want to minimize this impact while still achieving the desired token ratio.
- Optimal Swap Amount: The goal is to find the swap amount that results in the most efficient deposit into the Island, considering the target ratio and minimizing price impact.

## Depositing with Both Tokens

The ratio of tokens to be deposited in an island can be found by calling the function \`island.getMintAmounts(amount0Max, amount1Max)\` on the particular island with the max amounts of token0 and token1 the user is willing to deposit. This returns \`(amount0, amount1, liquidityMinted)\` where amount0 and amount1 correspond to the amount of tokens that will be used by the island and the amount of liquidity that is minted using \`(amount0, amount1)\`.

## Finding Deposit Ratio and Swap Data for Zaps

### Step 1 - Finding the correct ratio of tokens to deposit

We use one unit of both tokens and call the \`getMintAmounts\` function on the island to check the amounts of tokens deposited thus giving us a ratio. We then normalize it to 18 decimals to remove all decimal discrepancy.

### Step 2 - We get the swap price of inputToken -> OutputToken from the Swap router(KodiakRouter)

We use the kodiak quoter api to fetch the current price of the input token in terms of the output token.

### Step 3 - Calculate the swap amount based on the information from step 1 and step 2

This step calculates the ideal swap amount assuming no price impact.

The formula depends on whether the input token is token0 or token1.

If input token is token0:
\`\`\`
swapAmount = (i1 * amount * 1 ether) / (i0 * exchangePriceX18 + (i1 * 1 ether))
\`\`\`

If input token is token1:
\`\`\`
swapAmount = (i0 * amount * 1 ether) / (i1 * exchangePriceX18 + i0 * 1 ether)
\`\`\`

### Step 4 - Get Final Swap Data

Now fetch the final swap data using the amount from step3, this returns the outputQuote and the calldata for the transaction which need to be used for constructing the \`RouterSwapParams\` passed to the IslandRouter.`,

  'kodiak-islands-subgraph.md': `# Kodiak Islands Subgraph

## Overview

The Kodiak Islands subgraph indexes and tracks data from the Kodiak Islands protocol, a DeFi liquidity management system focusing on automated vault strategies. This subgraph captures essential metrics, events, and state changes from the protocol's smart contracts, making the data easily accessible for analysis and integration with other applications.

## Purpose

The Kodiak Islands subgraph serves several key purposes:

1. **Track Protocol Performance** - Monitor TVL, fees earned, APR, and other financial metrics across all vaults
2. **User Activity Analysis** - Track deposits, withdrawals, and user engagement metrics
3. **Vault Strategy Insights** - Monitor position ticks, rebalances, and strategy changes
4. **Historical Data Access** - Access time-series data through hourly and daily snapshots

## Key Features

- **Comprehensive Vault Tracking**: Monitor the creation, performance, and activity of all Kodiak vaults
- **Financial Metrics**: Track TVL, fees (LP fees and manager fees), volumes, and APR for vaults
- **Detailed Event Logging**: Record deposits, withdrawals, fee earnings, rebalances, and other protocol events
- **Time-Series Data**: Access historical data through hourly and daily snapshots for both vaults and protocol metrics
- **Position Management**: Monitor liquidity positions through lower and upper tick tracking

## Architecture

The Kodiak Islands subgraph is structured around several core entities:

- **KodiakIslandProtocol**: The parent entity representing the entire protocol
- **KodiakVault**: Individual vault instances managed by the protocol
- **Events**: Transactions like deposits and withdrawals made to vaults
- **Snapshots**: Time-based records of protocol and vault metrics (hourly and daily)
- **Token Information**: Details about the tokens managed within vaults

## Data Flow

Data is captured through event handlers that process blockchain events emitted by the Kodiak Islands smart contracts. Key events include:

1. **Island Creation**: When a new vault is created
2. **Minting/Burning**: When users deposit or withdraw funds
3. **Rebalancing**: When vaults adjust their position ranges
4. **Fee Collection**: When fees are earned by vaults`,

  'kodiak-islands-subgraph-entity-reference.md': `# Kodiak Islands Subgraph Entity Reference

## Overview

This section provides a comprehensive reference for all entities in the Kodiak Islands subgraph, including their fields, relationships, and purpose.

## Core Entities

### KodiakVault

Represents an individual vault in the Kodiak Islands protocol.

Key fields:
- \`id\`: Smart contract address of the vault
- \`protocol\`: The protocol this vault belongs to
- \`name\`: Name of the liquidity pool
- \`symbol\`: Symbol of the liquidity pool
- \`inputToken\`: Token that needs to be deposited to take a position
- \`outputToken\`: Token that is minted to track ownership of position
- \`manager\`: Manager of the vault
- \`managerFee\`: Manager fee (in percentage) of the vault
- \`totalValueLockedUSD\`: Current TVL of this pool in USD
- \`cumulativeLpFeesUSD\`: All revenue generated, accrued to the supply side
- \`cumulativeManagerFeesUSD\`: All revenue generated, accrued to the protocol
- \`cumulativeTotalFeesUSD\`: All revenue generated by the vault
- \`inputTokenBalance\`: Amount of input token in the pool
- \`outputTokenSupply\`: Total supply of output token
- \`outputTokenPriceUSD\`: Price per share of output token in USD
- \`pricePerShare\`: Amount of input token per full share of output token
- \`volumeToken0\`: Volume of token0
- \`volumeToken1\`: Volume of token1
- \`volumeUSD\`: Volume in USD
- \`weeklyVolumeUSD\`: Weekly volume in USD
- \`weeklyFeesEarnedUSD\`: Weekly fees earned in USD
- \`lowerTick\`: Lower price tick of current position
- \`upperTick\`: Upper price tick of current position

### KodiakApr

Tracks APR (Annual Percentage Rate) information for vaults.

### KodiakAprAccumulated

Tracks accumulated APR data over time.

## Events

### KodiakDeposit

Records deposit events to vaults.

Key fields:
- \`asset\`: Token deposited
- \`amount\`: Amount of token deposited in native units
- \`amountUSD\`: Amount of token deposited in USD
- \`amount0\`: Amount of token0
- \`amount1\`: Amount of token1
- \`vault\`: The vault involving this transaction

### KodiakWithdraw

Records withdrawal events from vaults.

### KodiakStrategyChange

Records changes to vault strategies.

## Snapshots

### KodiakUsageMetricsDailySnapshot

Daily snapshot of protocol usage metrics.

### KodiakUsageMetricsHourlySnapshot

Hourly snapshot of protocol usage metrics.

### KodiakFinancialsDailySnapshot

Daily snapshot of protocol financial metrics.

### KodiakVaultDailySnapshot

Daily snapshot of vault metrics.

### KodiakVaultHourlySnapshot

Hourly snapshot of vault metrics.`,

  'kodiak-islands-subgraph-query-guide.md': `# Kodiak Islands Subgraph Query Guide

## Introduction

This guide provides examples and best practices for querying the Kodiak Islands subgraph using GraphQL.

## Getting Started

To query the Kodiak Islands subgraph, you'll need to:
1. Know the subgraph endpoint URL
2. Have a basic understanding of GraphQL query syntax
3. Use a GraphQL client (like Apollo Client) or make HTTP requests to the endpoint

## Common Query Examples

### Protocol Overview

Get basic information about the protocol.

### List All Vaults

Retrieve all vaults with basic information.

### Get Vault Details

Get detailed information about a specific vault.

### Recent Deposits

Query recent deposit events for a specific vault.

### Recent Withdrawals

Query recent withdrawal events for a specific vault.

### Daily Vault Performance

Query daily snapshots for a vault to analyze performance over time.

### Protocol Usage Metrics

Query daily protocol usage metrics.

### Protocol Financial Metrics

Query daily protocol financial metrics.

### Strategy Changes

Track strategy changes for a specific vault.

### Vault APR History

Query APR history for a vault.

## Filtering and Sorting

### Time-Based Filtering

Filter snapshots within a specific time range.

### Value-Based Filtering

Filter vaults by TVL.

### Sorting Results

Sort vaults by TVL in descending order.

## Pagination

For large result sets, use pagination with \`first\` and \`skip\`.

## Advanced Queries

### Get User Activity Across Vaults

Find all deposits and withdrawals for a specific user.

### Compare Multiple Vaults

Compare performance metrics for multiple vaults.

## Best Practices

1. Query Only What You Need: Only request the fields you actually need to minimize response size.
2. Use Pagination: For large collections, always use pagination to prevent timeouts.
3. Filter Efficiently: Apply filters at the query level rather than filtering results in your application.
4. Optimize Sorting: Sort at the query level for better performance.
5. Cache Results: GraphQL responses are highly cacheable. Implement client-side caching for better performance.
6. Handle Time Data Correctly: Remember that timestamps are in seconds since Unix epoch.`,

  'kodiak-islands-subgraph-advanced-usage-guide.md': `# Kodiak Islands Subgraph Advanced Usage Guide

This guide covers advanced topics and strategies for working with the Kodiak Islands subgraph, including complex querying patterns, integration strategies, performance optimization, and custom analytics.

## Complex Querying Patterns

### Fragment Reuse

For complex applications that frequently query similar fields, use GraphQL fragments to reduce duplication.

### Dynamic Querying with Variables

Use GraphQL variables for dynamic queries.

### Advanced Filtering Combinations

Combine multiple filters for complex data selection.

## Time Series Analysis

### Calculating Period-over-Period Changes

To calculate weekly changes in vault performance.

### Analyzing APR Trends

Track APR trends over longer periods to identify patterns.

## Integration Strategies

### Real-time Data Updates

For applications requiring real-time data, implement a polling strategy.

### Combining with On-chain Data

For some advanced use cases, you may need to combine subgraph data with direct on-chain calls.

### Building Custom Analytics

Create custom analytics by combining multiple queries.

## Performance Optimization

### Query Optimization

Optimize your queries to reduce response time and load on the subgraph:
1. Select only necessary fields
2. Limit result sizes
3. Use efficient filtering

### Client-Side Caching

Implement caching to reduce redundant queries.

### Batching Queries

For applications that need multiple related pieces of data, batch your queries.

## Advanced Use Cases

### Strategy Analysis

Analyze the effectiveness of different vault strategies by tracking changes to tick ranges.

### Portfolio Analysis

For users with positions across multiple vaults, build portfolio analytics.

### Vault Comparison Tool

Build a tool to compare performance across vaults.

## Working with Time Series Data

When working with time series data from the Kodiak Islands subgraph, consider these strategies:

1. **Handling Missing Data Points**: Daily and hourly snapshots may have missing data points. Implement interpolation strategies in your application to handle these gaps.
2. **Normalizing Timestamps**: Convert Unix timestamps to your local timezone for display.
3. **Grouping Data**: For longer time ranges, group data into periods (weekly, monthly).`,

  'kodiak-islands-smart-contract-reference.md': `# Kodiak Islands Smart Contract Reference

## Overview

Kodiak Islands are Automated Liquidity Managers that abstract away all the complexities of liquidity provisioning to a Kodiak v3 pool while also maximising the fee returns. Users can provide liquidity to their favourite Kodiak v3 pools and get fungible receipt ERC-20 tokens that represent their share of the liquidity provided by the island.

## Core Architecture

There are 3 main smart contracts that help create new islands:

1. **Kodiak Island Factory** - The KodiakIslandFactory contract is responsible for deploying and managing instances of KodiakIsland vaults. This factory contract is designed to be non-upgradeable, and it deploys KodiakIsland vaults as ERC1967 minimal clones. Each factory maintains only one island implementation at a time and deploys clones of that implementation.

2. **Kodiak Island** - Kodiak Islands are ERC20-wrapped Kodiak V3 positions that enable simplified liquidity provision through a fungible token interface. When users add liquidity to an Island, they receive Kodiak Island tokens representing their proportional ownership of the underlying Kodiak V3 position. These tokens can be freely transferred, traded, or redeemed for the underlying assets at any time.

3. **Island Router** - The IslandRouter contract serves as a helper contract for users to easily provide liquidity to Kodiak Islands. It handles the complexities of depositing tokens, slippage protection, and token swaps when needed, while ensuring optimal liquidity provision.`,

  'kodiak-island-factory.md': `# Kodiak Island Factory

## Deploying New Islands

\`deployVault\`: Creates a new Kodiak Island using these parameters.

**Parameters:**
- \`tokenA\`: First token in the pool pair
- \`tokenB\`: Second token in the pool pair
- \`uniFee\`: Underlying pool fee tier (eg: 100, 500, 3000, 10000)
- \`manager\`: Manager address (0x0 for unmanaged/permissionless islands)
- \`managerTreasury\`: The address that will receive the manager's fee share
- \`managerFee\`: Manager fee in basis points (0 - 10000)
- \`lowerTick\`: lower tick of the island's position
- \`upperTick\`: upper tick of the island's position

**Returns**: The address of the newly deployed KodiakIsland vault.

**Deployment Process**:
- The function sorts the tokens (tokenA, tokenB) to ensure consistent ordering.
- It fetches the corresponding Kodiak V3 pool address using the provided tokens and fee tier.
- It validates that the Kodiak V3 pool exists and that the provided ticks align with the pool's tick spacing.
- It clones the islandImplementation contract to create a new KodiakIsland vault.
- It initializes the new vault with the provided parameters.

**Emits**: \`IslandCreated\` on successful deployment

## Requirements for deploying a permissionless Island

1. The \`manager\` address must be set to zero address.
2. The \`managerTreasury\` must be set to zero address.
3. The \`managerFee\` must be set to 0.
4. The deployed island refers the \`managerFee\` and \`managerTreasury\` from the factory for permissionless islands

## Querying Deployed Islands and related data

**Get All Deployers**: Returns array of all addresses that have deployed at least one island.

**Get Islands by Deployer**: Returns array of all islands deployed by a specific address.

**Count Functions**: 
- \`numIslands()\`: Returns total number of islands deployed through factory.
- \`numDeployers()\`: Returns total number of unique deployer addresses.
- \`numIslands(address deployer)\`: Returns number of islands deployed by specific address.

## Factory Management

Only the factory owner can call these functions.

**Set Island Implementation**: Updates the implementation contract used for new island deployments.

**Set Treasury**: Updates the treasury address that receives protocol fees.

**Set Island Fee**: Updates the protocol fee for permissionless islands.`,

  'kodiak-island.md': `# Kodiak Island

Kodiak Islands are ERC20-wrapped Kodiak V3 positions that enable simplified liquidity provision through a fungible token interface. When users add liquidity to an Island, they receive Kodiak Island tokens representing their proportional ownership of the underlying Kodiak V3 position.

For detailed contract reference, see the full documentation.`,

  'kodiak-island-router.md': `# Kodiak Island Router

## Overview

The IslandRouter contract serves as a helper contract for users to easily provide liquidity to Kodiak Islands. It handles the complexities of depositing tokens, slippage protection, and token swaps when needed, while ensuring optimal liquidity provision.

Kodiak Islands require liquidity providers to deposit tokens in specific ratios that match the Island's underlying Kodiak V3 position. The router provides several key protections:

- Minimum output amount protection for swaps when providing liquidity with single token.
- Deposit ratio slippage protection
- Minimum LP token (shares) protection

## Managing Liquidity

### Token Deposit Ratio

The router handles liquidity addition by:
1. Calculating the optimal deposit amounts using \`island.getMintAmounts()\`
2. Ensuring the amounts meet minimum requirements
3. Transferring tokens and minting LP tokens

### Steps to Add Liquidity

1. Approve the router to spend your tokens
2. Choose the appropriate liquidity addition method based on your tokens
3. If the liquidity addition is using a single token, find the appropriate swap data and use Kodiak Quoter api to get the calldata
4. Set reasonable slippage parameters
5. Execute transaction
6. Kodiak Island LP tokens sent to the receiver
7. In case of zaps msg.sender receives back any unused token0 or token1

## Adding liquidity with both tokens

### Standard Two Token Deposit

\`addLiquidity\`: Adds liquidity with both tokens.

**Parameters:**
- \`island\`: Address of the Kodiak Island
- \`amount0Max\`: Maximum amount of token0 willing to deposit
- \`amount1Max\`: Maximum amount of token1 willing to deposit
- \`amount0Min\`: Minimum acceptable token0 deposit (slippage protection)
- \`amount1Min\`: Minimum acceptable token1 deposit (slippage protection)
- \`amountSharesMin\`: Minimum IslandTokens to receive
- \`receiver\`: Address to receive LP tokens

### Native BERA + Token Deposit

\`addLiquidityNative\`: Adds liquidity using native BERA and a token.

## Adding Liquidity with a single token

When depositing into a concentrated liquidity position like an Island, it's crucial to understand that the underlying tokens need to be in a specific ratio to maximize the value of the position. If a user wants to deposit a single token, a swap is required to balance the tokens before adding liquidity to the position.

### Single Token Deposit Implementation

\`addLiquiditySingle\`: Adds liquidity with a single token, performing a swap to achieve the correct ratio.

\`addLiquiditySingleNative\`: Adds liquidity with native BERA, performing a swap to achieve the correct ratio.

## Removing Liquidity

\`removeLiquidity\`: Removes liquidity from a Kodiak Island position by burning LP tokens and getting the underlying tokens.

\`removeLiquidityNative\`: Similar to \`removeLiquidity\` but specifically handles positions involving WBERA, automatically unwrapping it to native BERA before returning it to the user.`,

  'kodiak-islands-api.md': `# Kodiak Islands API

## Pools & Farms API

This documentation covers the REST API endpoints for kodiak pools.

## Base URL

\`\`\`
https://backend.kodiak.finance
\`\`\`

## Pools Endpoint

\`\`\`
GET /vaults
\`\`\`

Retrieves information about liquidity positions (pools) with comprehensive filtering, sorting, and pagination options.

## Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| \`chainId\` | number | Yes | Blockchain network ID (e.g., 80094) |
| \`limit\` | number | No | Maximum number of results to return (default: 20) |
| \`offset\` | number | No | Number of results to skip for pagination (default: 0) |
| \`orderBy\` | string | No | Field to sort results by (see Sorting Options) |
| \`orderDirection\` | string | No | Sort direction: \`asc\` or \`desc\` (default: \`desc\`) |
| \`user\` | string | No | Address to filter positions by user holdings |
| \`search\` | string | No | Search term to filter results by token names or symbols |
| \`rewardVault\` | boolean | No | When \`true\`, filters for positions with reward vaults |
| \`sweetened\` | boolean | No | When \`true\`, filters for incentivized/sweetened positions |
| \`volatile\` | boolean | No | Filter for volatile (\`true\`) or stable (\`false\`) pairs |
| \`minimumTvl\` | number | No | Minimum total value locked threshold (e.g., 10000 = $10,000) |

## Sorting Options

The API supports sorting by the following fields:
- \`tvl\`: Total value locked in the position
- \`farmTvl\`: Total value locked in associated farms
- \`apr\`: Base APR from trading fees
- \`farmApr\`: Farm/incentive APR
- \`totalApr\`: Combined APR (base + farm)
- \`balance\`: User's balance in the position (requires \`user\` parameter)
- \`farmBalance\`: User's balance in associated farms/reward vaults (requires \`user\` parameter)
- \`vaultBalance\`: User's balance in associated pools that are unstaked (requires \`user\` parameter)

## Response Format

The API returns a JSON object with the following structure:

\`\`\`
{
  "data": [IslandApiResponse],
  "count": number
}
\`\`\`

Each island position includes:
- Position details (id, provider, ticks, TVL, APR, fees)
- Token information (token0 and token1 with prices)
- Farm information (if applicable)
- User-specific fields (when user parameter is provided)`,

  'baults.md': `# Baults

## Bault API

Get a list of all the Baults, their TVL and APY here:

https://backend.kodiak.finance/baults

## Bault Compounding Guide

This guide explains how compounding works in Baults, including the BGT auction mechanism, optimal usage patterns, and integration with the BountyHelper contract which is designed to make compounding free and effectively available for anyone to call.

## How Compounding Works

Baults are ERC4626-compliant vaults that stake tokens in reward vaults to earn BGT rewards. Over time, these BGT rewards accumulate but remain unclaimed in the reward vault. Compounding is the process of claiming these BGT rewards and either:

1. Receiving them directly as BGT tokens
2. Converting them to wrapped BGT tokens (like iBGT, yBGT, LBGT etc.)

## The Bounty Mechanism

Baults use a bounty-based auction system that:

1. Allows anyone to trigger the compounding process
2. Requires the caller to provide the configured "bounty" in bault asset (the staking tokens)
3. Gives the caller all the accumulated BGT rewards as either BGT or wrappedBGT of choice.

### How the Bounty System Works

1. The caller pays a fixed amount of staking tokens (the bounty)
2. A small portion of the bounty (set by \`compoundFeeBps\`) goes to the protocol treasury
3. The rest of the bounty is staked in the reward vault, benefiting all vault users effectively increasing the share price for each user.
4. The caller receives all accumulated BGT rewards or a wrapped version

This creates a market-driven incentive for compounding - when the value of unclaimed BGT exceeds the bounty cost, someone will claim it.

## Cost-Effective Compounding

With the introduction of the bounty system, you can benefit from the compounding process and claim the rewards. To compound cost-effectively:

1. **Monitor BGT accrual**: Wait until enough BGT has accumulated to justify the bounty cost
2. **Calculate break-even point**: Compare the value of claimable BGT against the bounty cost
3. **Choose the right wrapper**: Different wrappers have different valuations for BGT and are generally a better choice against BGT itself. So find the best wrapper that maximizes the value of the BGT rewards.
4. **Executing Claims**: Once the breakeven point has been reached, execute the claim transaction to receive the rewards as soon as possible to benefit from any excess rewards that accumulate.

## Previewing Potential Claims

Before executing a compound transaction, you can preview the expected outcome:

\`earned()\`: Preview the amount of BGT that would be claimed
\`previewClaimBgtWrapper(wrapperAddress)\`: Preview the amount of wrapped BGT tokens that would be minted

## Performing Compounding

### Direct BGT Claim

\`claimBgt\`: Claims BGT rewards directly.

### Wrapped BGT Claim (iBGT, LBGT, yBGT)

\`claimBgtWrapper\`: Claims BGT rewards as wrapped BGT tokens.

## BountyHelper: Zero-Capital Compounding (Recommended)

The BountyHelper is a specialized contract that enables anyone to compound Baults without needing the bounty payment upfront. It uses a clever mechanism to make compounding easy and accessible for everyone without need of the bounty.

### How BountyHelper Works

1. **Pre-funding mechanism**: The helper maintains a balance of staking tokens that can be used for bounties
2. **Swap integration**: When using bounty helper, the claimed wrappers must be swapped for the staking token to return the bounty amount back to the contract. You can use any contract that can swap/exchange the bgtWrapper for the underlying staking token. We recommend using the Enso Router for swapping directly from the liquid wrapper to the underlying staking token.
3. **Refund system**: Returns any excess tokens to the caller after returning the free bounty amount accessed by the compounder and additionally rewards the compounder by transferring any amount of remaining staking token/bgt wrapper back to the user.

## Compounding Algorithm Overview using the BountyHelper

The compounding process follows these key steps:

1. **Discovery**: Find baults that are ready to compound
2. **Wrapper Selection**: Determine the best BGT wrapper (iBGT, YBGT, LBGT) for maximum value
3. **Quote Generation**: Get swap quote to convert wrapper to underlying staking token
4. **Profitability Check**: Ensure the swap output covers the required bounty
5. **Execution**: Send the compound transaction via BountyHelper

## Key Points

### What You Need
- A wallet with some BERA for gas
- Access to a swap router (Enso recommended)
- RPC endpoint for Berachain

### How You Profit
- You earn the excess **bounty** (mostly in staking tokens) for each successful compound
- No upfront capital required - BountyHelper funds the bounty
- Profit = \`stakingTokenSwapOutput - baultBounty\`

### BGT Wrappers
Choose the best wrapper for maximum value:
- **iBGT**: Infrared liquid staking token
- **YBGT**: Yeet liquid staking token
- **LBGT**: Another liquid staking option

### When to Compound
- \`stakingTokenSwapOutput >= baultBounty\` (profitable)
- Gas costs(generally dust) < expected profit`
};

const outputDir = join(process.cwd(), 'data', 'kodiak-docs');
mkdirSync(outputDir, { recursive: true });

Object.entries(scrapedDocs).forEach(([filename, content]) => {
  const filePath = join(outputDir, filename);
  writeFileSync(filePath, content, 'utf-8');
  console.log(`Saved: ${filename}`);
});

console.log(`\nSaved ${Object.keys(scrapedDocs).length} files to ${outputDir}`);

