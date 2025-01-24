import { GraphQLClient, gql } from 'graphql-request';
import cron from 'node-cron';
import fs from 'fs';

// Uniswap Subgraph Endpoint
const UNISWAP_SUBGRAPH_URL =
  'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2';

// GraphQL Queries
const TOKEN_QUERY = gql`
  query tokens($tokenAddress: Bytes!) {
    tokens(where: { id: $tokenAddress }) {
      derivedETH
      totalLiquidity
    }
  }
`;

const ETH_PRICE_QUERY = gql`
  query bundles {
    bundles(where: { id: "1" }) {
      ethPrice
    }
  }
`;

// Function to fetch and process data
const fetchUniswapData = async () => {
  const client = new GraphQLClient(UNISWAP_SUBGRAPH_URL);

  try {
    // Fetch ETH price
    const ethPriceData = await client.request(ETH_PRICE_QUERY);
    const ethPriceInUSD = ethPriceData?.bundles[0]?.ethPrice;

    // Fetch DAI token data
    const tokenAddress = '0x6b175474e89094c44da98b954eedeac495271d0f'; // DAI Token Address
    const daiData = await client.request(TOKEN_QUERY, { tokenAddress });

    const daiPriceInEth = daiData?.tokens[0]?.derivedETH;
    const daiTotalLiquidity = daiData?.tokens[0]?.totalLiquidity;

    // Process and log the results
    const result = {
      timestamp: new Date(),
      ethPriceInUSD: ethPriceInUSD || 'Unavailable',
      daiPriceInUSD:
        daiPriceInEth && ethPriceInUSD
          ? (parseFloat(daiPriceInEth) * parseFloat(ethPriceInUSD)).toFixed(2)
          : 'Unavailable',
      daiTotalLiquidity: daiTotalLiquidity || 'Unavailable',
    };

    console.log('Uniswap Data:', result);

    // Optionally save the data to a file
    fs.appendFileSync('uniswapData.log', JSON.stringify(result) + '\n');
  } catch (error) {
    console.error('Error fetching data from Uniswap Subgraph:', error);
  }
};

fetchUniswapData();

// Schedule the function to run every hour (or your desired interval)
// cron.schedule('0 * * * *', () => {
//   console.log('Fetching Uniswap data...');
//   fetchUniswapData();
// });

// module.exports = { fetchUniswapData };
