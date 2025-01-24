import React, { useEffect, useState, useRef } from 'react';
import { debounce } from 'lodash';
import useScreenSize from '../hooks/useScreenSize';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

// Headers with hyphen for easier management
const headers = [
  'Rank',
  'Coin',
  'Price',
  '1HR',
  '24HR',
  '7DAY',
  'Market-Cap',
  'Volume',
];
const displayHeaders = {
  Rank: '#', // Internal "Rank" displays as "#"
  Coin: 'Coin',
  Price: 'Price',
  '1HR': '1HR',
  '24HR': '24HR',
  '7DAY': '7DAY',
  'Market-Cap': 'Market Cap', // Hyphenated header
  Volume: 'Volume',
};

// Mapping headers to data fields
const headerToDataMap = {
  Rank: 'market_cap_rank',
  Coin: 'name',
  Price: 'current_price',
  '1HR': 'price_change_percentage_1h_in_currency',
  '24HR': 'price_change_percentage_24h_in_currency',
  '7DAY': 'price_change_percentage_7d_in_currency',
  'Market-Cap': 'market_cap', // Hyphenated header
  Volume: 'total_volume',
};

const DataTable3 = ({ data, isHeaderSticky }) => {
  const navigate = useNavigate();
  const { width } = useScreenSize();
  const [maxRankWidth, setMaxRankWidth] = useState(0);
  const [sortedData, setSortedData] = useState(data);
  const [sortConfig, setSortConfig] = useState({
    key: 'Rank',
    direction: 'asc',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState(data);

  const handleRowClick = (coinId) => {
    navigate(`/coins/${coinId}`);
  };

  // Ref for the search input
  const searchInputRef = useRef(null);

  useEffect(() => {
    const maxRank = Math.max(...data.map((item) => item.market_cap_rank || 0));
    const maxRankDigits = maxRank.toString().length;
    setMaxRankWidth(maxRankDigits * 12); // Estimate width based on digit count
  }, [data]);

  useEffect(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    const newFilteredData = data.filter((row) =>
      Object.values(row).some((value) =>
        value?.toString().toLowerCase().includes(lowercasedQuery)
      )
    );
    setFilteredData(newFilteredData);
  }, [searchQuery, data]);

  const handleSort = (header) => {
    const key = headerToDataMap[header];
    const direction =
      sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';

    const sorted = [...filteredData].sort((a, b) => {
      const valA = a[key] || 0;
      const valB = b[key] || 0;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return direction === 'asc' ? valA - valB : valB - valA; // Use valB and valA
      }
      return direction === 'asc'
        ? valA.toString().localeCompare(valB.toString())
        : valB.toString().localeCompare(valA.toString());
    });

    setFilteredData(sorted); // Update the filteredData state
    setSortedData(sorted); // Update the sortedData state
    setSortConfig({ key, direction });
  };

  const getPercentageClass = (value) =>
    value < 0 ? 'negative-percentage' : 'positive-percentage';

  // Focus the search input when the component mounts
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  return (
    <div className="DataTable3-container">
      {/* Terminal-Style Search Input */}
      <div className="terminal-search">
        <span className="prompt"></span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="terminal-input"
          placeholder="Search..."
          ref={searchInputRef} // Attach the ref to the input
        />
      </div>

      <table className="data-table3">
        {/* Table Header */}
        <thead className="DataTable3-header">
          <tr className={isHeaderSticky ? 'sticky-header' : ''}>
            {headers.map((header, index) => (
              <th
                key={index}
                className={`header-${header}`} // Hyphenated class names
                style={header === 'Rank' ? { width: `${maxRankWidth}px` } : {}}
                onClick={() => handleSort(header)}
              >
                {displayHeaders[header]}
                {sortConfig.key === headerToDataMap[header] && (
                  <span className="sort-arrow">
                    {sortConfig.direction === 'asc' ? (
                      <FaArrowUp />
                    ) : (
                      <FaArrowDown />
                    )}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>

        {/* Table Body */}
        <tbody>
          {filteredData.map((row, rowIndex) => (
            <tr key={rowIndex} onClick={() => handleRowClick(row.id)}>
              {headers.map((header, colIndex) => (
                <td
                  key={colIndex}
                  className={`data-${header}`} // Hyphenated class names
                  style={
                    header === 'Rank' ? { width: `${maxRankWidth}px` } : {}
                  }
                >
                  {header === 'Rank' && (
                    <span className="rank">{row.market_cap_rank}</span>
                  )}
                  {header === 'Coin' && (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <img
                        src={row.image}
                        alt={row.name}
                        className="coin-icon"
                        style={{
                          width: '30px',
                          height: '30px',
                          marginRight: '10px',
                        }}
                      />
                      {row.name}
                    </div>
                  )}
                  {header === 'Price' &&
                    `$${row.current_price?.toLocaleString()}`}
                  {header === '1HR' && (
                    <span
                      className={getPercentageClass(
                        row.price_change_percentage_1h_in_currency
                      )}
                    >
                      {row.price_change_percentage_1h_in_currency?.toFixed(2) ||
                        'N/A'}
                      %
                    </span>
                  )}
                  {header === '24HR' && (
                    <span
                      className={getPercentageClass(
                        row.price_change_percentage_24h_in_currency
                      )}
                    >
                      {row.price_change_percentage_24h_in_currency?.toFixed(
                        2
                      ) || 'N/A'}
                      %
                    </span>
                  )}
                  {header === '7DAY' && (
                    <span
                      className={getPercentageClass(
                        row.price_change_percentage_7d_in_currency
                      )}
                    >
                      {row.price_change_percentage_7d_in_currency?.toFixed(2) ||
                        'N/A'}
                      %
                    </span>
                  )}
                  {header === 'Market-Cap' &&
                    `$${row.market_cap?.toLocaleString()}`}
                  {header === 'Volume' &&
                    `$${row.total_volume?.toLocaleString()}`}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable3;
