import React, { useEffect, useState } from 'react';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import formatPrice from './FormatPrice';

const headerToKeyMap = {
  '#': 'market_cap_rank',
  Coin: 'name',
  Price: 'current_price',
  '1HR': 'price_change_percentage_1h_in_currency',
  '24HR': 'price_change_percentage_24h_in_currency',
  '7DAY': 'price_change_percentage_7d_in_currency',
  'Market Cap': 'market_cap',
  Volume: 'total_volume',
};

const DataGrid = ({ headers, data, showMarketCap, showVolume }) => {
  const navigate = useNavigate();
  const [sortedData, setSortedData] = useState(data);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Function to sort data based on the current sort configuration
  const sortData = (unsortedData, key, direction) => {
    if (!key) return unsortedData;

    return [...unsortedData].sort((a, b) => {
      const valA = a[key] || 0;
      const valB = b[key] || 0;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return direction === 'asc' ? valA - valB : valB - valA;
      }

      return direction === 'asc'
        ? valA.toString().localeCompare(valB.toString())
        : valB.toString().localeCompare(valA.toString());
    });
  };

  // Apply sorting when the data or sort configuration changes
  useEffect(() => {
    const sorted = sortData(data, sortConfig.key, sortConfig.direction);
    setSortedData(sorted);
  }, [data, sortConfig]);

  const handleSort = (header) => {
    const key = headerToKeyMap[header];
    if (!key) return;

    const direction =
      sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';

    setSortConfig({ key, direction });
  };

  const getPercentageClass = (percentage) =>
    percentage < 0 ? 'negative-percentage' : 'positive-percentage';

  const visibleHeaders = [
    '#',
    'Coin',
    'Price',
    '1HR',
    '24HR',
    '7DAY',
    ...(showMarketCap ? ['Market Cap'] : []),
    ...(showVolume ? ['Volume'] : []),
  ];

  const handleRowClick = (coinId) => {
    navigate(`/coins/${coinId}`);
  };

  return (
    <div className="DataGrid-container">
      {/* Header */}
      <div className="data-grid header sticky-header">
        {visibleHeaders.map((header, index) => (
          <div
            key={index}
            className={`data-grid-cell header-cell ${header.replace(/\s+/g, '')} ${
              header === '#' ? 'rank-header' : ''
            }`}
            onClick={() => handleSort(header)}
          >
            {header}
            {sortConfig.key === headerToKeyMap[header] && (
              <span className="dt1-sort-arrow">
                {sortConfig.direction === 'asc' ? (
                  <FaArrowUp />
                ) : (
                  <FaArrowDown />
                )}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Data Rows */}
      {sortedData.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="data-grid row"
          onClick={() => handleRowClick(row.id)}
          style={{
            '--island-logo': `url(${row.image})`,
          }}
        >
          {/* Background Image */}
          <div
            className="row-background"
            style={{
              backgroundImage: `url(${row.image})`,
            }}
          ></div>
          <span className="data-grid-cell rank-column">{`${row.market_cap_rank}`}</span>
          <div className="data-grid-cell island-coin">
            <img src={row.image} alt={row.name} className="island-coin-icon" />
            <span>{row.name}</span>
          </div>
          <span className="data-grid-cell-percent">
            {formatPrice(row.current_price)}
          </span>
          <span
            className={`data-grid-cell-percent 1h ${getPercentageClass(
              row.price_change_percentage_1h_in_currency
            )}`}
          >
            {row.price_change_percentage_1h_in_currency?.toFixed(2) || 'N/A'}%
          </span>
          <span
            className={`data-grid-cell-percent 24h ${getPercentageClass(
              row.price_change_percentage_24h_in_currency
            )}`}
          >
            {row.price_change_percentage_24h_in_currency?.toFixed(2) || 'N/A'}%
          </span>
          <span
            className={`data-grid-cell-percent 7d ${getPercentageClass(
              row.price_change_percentage_7d_in_currency
            )}`}
          >
            {row.price_change_percentage_7d_in_currency?.toFixed(2) || 'N/A'}%
          </span>
          {showMarketCap && (
            <span className="data-grid-cell MarketCap">
              {row.market_cap.toLocaleString()}
            </span>
          )}
          {showVolume && (
            <span className="data-grid-cell Volume">
              {row.total_volume.toLocaleString()}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default DataGrid;
