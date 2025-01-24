import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Spinner from '../components/LoadingSpinner';
import '../styles/CoinDetails.css';
import formatPrice from '../components/FormatPrice';

const CoinDetails = () => {
  const { id } = useParams();
  const [coin, setCoin] = useState(null);
  const [tradingPairs, setTradingPairs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoinDetails = async () => {
      setLoading(true);
      try {
        const cachedData = localStorage.getItem('marketData');
        const marketData = cachedData ? JSON.parse(cachedData) : [];
        const coinData = marketData.find((coin) => coin.id === id);
        setCoin(coinData);

        const response = await fetch(`/api/trading-pairs/${id}`);
        if (response.status === 304) {
          const cachedPairs = localStorage.getItem(`tradingPairs-${id}`);
          if (cachedPairs) {
            setTradingPairs(JSON.parse(cachedPairs));
          }
        } else {
          const data = await response.json();
          const filteredPairs = data.filter(
            (pair) =>
              pair.last_price !== 0 &&
              pair.last_qty !== 0 &&
              pair.bid_price !== 0 &&
              pair.volume !== 0 &&
              pair.high_price !== 0 &&
              pair.low_price !== 0
          );
          setTradingPairs(filteredPairs);
          localStorage.setItem(
            `tradingPairs-${id}`,
            JSON.stringify(filteredPairs)
          );
        }
      } catch (error) {
        console.error('Error fetching trading pairs:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCoinDetails();
  }, [id]);

  if (loading) return <Spinner />;
  if (!coin)
    return <div>Coin not found. Please check the ID or refresh the page.</div>;

  return (
    <div className="coin-details">
      <header className="coin-header">
        <img src={coin.image} alt={coin.name} className="coin-image" />
        <div>
          <h1 className="coin-title">
            {coin.name}{' '}
            <span className="coin-symbol">
              {coin.symbol?.toUpperCase() || 'N/A'}
            </span>
          </h1>
        </div>
      </header>
      <section className="coin-info-container">
        <div className="info-box">
          <h2>Market Cap Rank</h2>
          <p>#{coin.market_cap_rank}</p>
        </div>
        <div className="info-box">
          <h2>Current Price</h2>
          <p>{formatPrice(coin.current_price)}</p>
        </div>
        <div className="info-box">
          <h2>24HR Change</h2>
          <p
            className={
              coin.price_change_percentage_24h_in_currency > 0
                ? 'positive'
                : 'negative'
            }
          >
            {coin.price_change_percentage_24h_in_currency?.toFixed(2) || 'N/A'}%
          </p>
        </div>
        <div className="info-box">
          <h2>Total Volume</h2>
          <p
            className={
              coin.total_volume?.toLocaleString().length > 12
                ? 'large-number'
                : ''
            }
          >
            ${coin.total_volume?.toLocaleString()}
          </p>
        </div>
      </section>
      <h2 className="trading-pairs-header">Markets</h2>
      <div className="trading-pairs-container">
        <table className="trading-pairs">
          <thead>
            <tr>
              <th>Exchange</th>
              <th>Pair</th>
              <th>Last Price</th>
              <th>Volume</th>
              <th>Quote Volume</th>
            </tr>
          </thead>
          <tbody>
            {tradingPairs.map((pair, index) => (
              <tr key={index}>
                <td>Binance</td>
                <td>{pair.symbol}</td>
                <td>{formatPrice(pair.last_price)}</td>
                <td>{pair.volume?.toLocaleString()}</td>
                <td>{pair.quote_volume?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CoinDetails;
