import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Import AuthContext
import HootfolioAssetForm from '../components/HootfolioAssetForm'; // New component for adding assets
import HootfolioSwapForm from '../components/HootfolioSwapForm'; // New component for adding swaps
import Login from '../components/Login'; // Import Login component
import useMarketData from '../hooks/useMarketData';
import '../styles/Hootfolio.css'; // Import the CSS file
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Import icons for the eyeball
import { FaDice } from 'react-icons/fa';
import HootfolioNivoChart from '../components/HootfolioChart';
import LoadingSpinner from '../components/LoadingSpinner';

function Hootfolio() {
  const { isAuthenticating, isLoggedIn, user } = useAuth();
  const API_URL =
    (process.env.REACT_APP_URL || 'https://localhost:3000') + '/api';

  const [hootfolio, setHootfolio] = useState(null); // Initialize hootfolio state
  const [assets, setAssets] = useState([]); // Initialize assets state
  const [sortBy, setSortBy] = useState(null); // State for tracking current sort column
  const [sortOrder, setSortOrder] = useState('asc'); // Track sort direction (asc/desc)
  const [isAddingAsset, setIsAddingAsset] = useState(false); // Toggle for asset form
  const [isAddingSwap, setIsAddingSwap] = useState(false); // Toggle for swap form
  const { marketData } = useMarketData();
  const [editingAssetId, setEditingAssetId] = useState(null); // Track the asset being edited
  const [selectedAssetId, setSelectedAssetId] = useState(null); // Track the selected asset for actions
  const [tempBalance, setTempBalance] = useState(''); // Temporary balance value
  const [assetFormResetTrigger, setAssetFormResetTrigger] = useState(0);
  const [swapFormResetTrigger, setSwapFormResetTrigger] = useState(0);
  const [selectedHootfolioId, setSelectedHootfolioId] = useState(null);
  const [editingHootfolioId, setEditingHootfolioId] = useState(false);
  const [tempHootfolioName, setTempHootfolioName] = useState('');
  const [isEditingAsset, setEditingAsset] = useState('false');
  const [isEditingHootfolio, setEditingHootfolio] = useState(false);
  const [hootfolioImage, setHootfolioImage] = useState(false);
  const [allChartData, setAllChartData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [selectedTimeRange, setTimeRange] = useState('ALL');
  const [isChartVisible, setIsChartVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [gainPercentage, setGainPercentage] = useState(null);
  const [gainValue, setGainValue] = useState(null);
  const [hootfolioIsSelected, setHootfolioSelected] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      console.log('FETCHING HOOT');
      console.log(user);
      console.log(isLoggedIn);
      if (user) {
        try {
          setIsLoading(true);
          await fetchHootfolio();
        } catch (error) {
          console.error('Error fetching data:', error); // Handle errors
        } finally {
          setIsLoading(false);
        }
        if (marketData && assets.length > 0) {
          const updatedAssets = assets.map((asset) => {
            const marketAsset = marketData.find(
              (item) => item.id === asset.asset_id
            );
            return {
              ...asset,
              current_value: marketAsset
                ? marketAsset.current_price * asset.balance
                : 0,
            };
          });

          setAssets(updatedAssets);
        }
      }

      setEditingAsset(false);
    };

    fetchData();
  }, [user]);

  const fetchHootfolio = async () => {
    try {
      // await new Promise((resolve) => setTimeout(resolve, 3000));
      const userHootfolios = await fetch(`${API_URL}/hootfolio/${user.id}`);
      const hootfolioData = await userHootfolios.json();
      const currentHoot = hootfolioData.hootfolio[0];
      setHootfolio(hootfolioData.hootfolio);

      getHootfolioImage(user.username);

      const assetsResponse = await fetch(
        `${API_URL}/hootfolio/${currentHoot.id}/assets/`
      );
      const assetsData = await assetsResponse.json();

      const data = await fetchHootfolioChartData(currentHoot);
      setAllChartData([{ id: 'Total Value', data }]);
      setChartData([{ id: 'Total Value', data }]);
      // handleTimePeriodChange('ALL');
      getGains(data);

      if (assetsResponse.ok) {
        // Sort by `sort_order` from the database
        const sortedAssets = assetsData.assets.sort(
          (a, b) => a.sort_order - b.sort_order
        );
        setAssets(sortedAssets);
      } else {
        console.error(assetsData.message);
      }
    } catch (error) {
      console.error('Error fetching hootfolio:', error);
    }
  };

  const updateHootfolioValuesVisible = async (hootfolioId) => {
    // Update state immutably
    setHootfolio((prevHootfolio) =>
      prevHootfolio.map((item) =>
        item.id === hootfolioId
          ? { ...item, values_visible: !item.values_visible }
          : item
      )
    );

    // Find the current state of the hootfolio item
    const hootfolioItem = hootfolio.find((item) => item.id === hootfolioId);
    const valuesVisible = !hootfolioItem?.values_visible; // Compute the new value

    const response = await fetch(
      `${API_URL}/hootfolio/update-hootfolio-values-visible`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hootfolioId, valuesVisible }),
      }
    );
  };

  const generateHootfolioName = async (hootfolioId) => {
    try {
      const response = await fetch(
        `${API_URL}/hootfolio/generate-hootfolio-name`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ hootfolioId }),
        }
      );

      if (response.ok) {
        const updatedHootfolio = await response.json();

        // Update the hootfolio state with the new name
        setHootfolio((prevHootfolio) =>
          prevHootfolio.map((item) =>
            item.id === hootfolioId
              ? { ...item, name: updatedHootfolio.name }
              : item
          )
        );
      } else {
        alert('Failed to update hootfolio name');
      }
    } catch (error) {
      console.error('Error updating hootfolio name:', error);
      alert('Error updating hootfolio name');
    }
  };

  const updateSortOrderInDb = async (assets) => {
    const updatedOrder = assets.map((asset, index) => ({
      id: asset.id,
      sort_order: index + 1,
    }));

    try {
      await fetch(`${API_URL}/hootfolio/update-asset-sorts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updatedOrder }),
      });
      console.log('Sort order updated in database');
    } catch (error) {
      console.error('Error updating sort order in database:', error);
    }
  };

  const saveHootfolioName = async (hootfolioId) => {
    setEditingHootfolio(false);
    setEditingHootfolioId(false);
    try {
      const response = await fetch(`${API_URL}/hootfolio/update-hootfolio`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        // hootfolioName: is here as it must match the variable name on the server side
        body: JSON.stringify({ hootfolioId, hootfolioName: tempHootfolioName }),
      });

      if (response.ok) {
        const updatedHootfolio = await response.json();

        // Update the hootfolio state with the new name
        setHootfolio((prevHootfolio) =>
          prevHootfolio.map((item) =>
            item.id === hootfolioId
              ? { ...item, name: updatedHootfolio.name }
              : item
          )
        );
      } else {
        alert('Failed to update hootfolio name');
      }
    } catch (error) {
      console.error('Error updating hootfolio name:', error);
      alert('Error updating hootfolio name');
    }
  };

  const getHootfolioImage = async (username) => {
    try {
      // const image = `${username}.svg`;
      const imageUrl = `${API_URL}/hootfolio/identicons/${username}`;
      setHootfolioImage(imageUrl); // Set the image URL directly
    } catch (error) {
      console.error('Error fetching Hootfolio image:', error);
    }
  };

  const saveBalance = async (assetId) => {
    try {
      const response = await fetch(`${API_URL}/hootfolio/update-asset`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assetId,
          balance: tempBalance,
          hootfolioId: hootfolio[0].id,
        }),
      });

      if (response.ok) {
        const updatedAsset = await response.json();
        setAssets((prevAssets) =>
          prevAssets.map((asset) =>
            asset.asset_id === assetId
              ? { ...asset, balance: updatedAsset.balance }
              : asset
          )
        );
        setEditingAssetId(null); // Exit editing mode
      } else {
        alert('Failed to update balance');
      }
    } catch (error) {
      console.error('Error updating balance:', error);
      alert('Error updating balance');
    }
  };

  const deleteAsset = async (assetId) => {
    if (!window.confirm('Are you sure you want to delete this asset?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/hootfolio/delete-asset`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assetId,
          hootfolioId: hootfolio[0].id,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log('Asset deleted successfully:', result);
      }

      setAssets((prevAssets) => {
        const updatedAssets = prevAssets
          .filter((asset) => asset.asset_id !== assetId)
          .map((asset, index) => ({ ...asset, sort_order: index + 1 })); // Reassign sort_order

        updateSortOrderInDb(updatedAssets); // Update the backend
        return updatedAssets;
      });
    } catch (error) {
      console.error('Error deleting asset:', error);
    }
  };

  // Utility function to handle sorting and updating database
  const handleSortAndUpdate = async (newAsset = null) => {
    const updatedAssets = [...assets];

    if (newAsset) {
      // Check if the new asset already exists
      const assetExists = updatedAssets.some(
        (asset) => asset.id === newAsset.id
      );

      if (!assetExists) {
        // Insert new asset at position 0 and cascade others
        updatedAssets.unshift({ ...newAsset, sort_order: 1 });
        updatedAssets.forEach((asset, index) => {
          asset.sort_order = index + 1;
        });
      }
    } else {
      // Ensure existing assets are sorted by sort_order
      updatedAssets.sort((a, b) => a.sort_order - b.sort_order);
    }

    // Update the UI state
    setAssets(updatedAssets);

    // Prepare data for database update
    const updatedOrder = updatedAssets.map((asset) => ({
      id: asset.id,
      sort_order: asset.sort_order,
    }));

    // Update the database
    try {
      await fetch(`${API_URL}/hootfolio/update-hootfolio-asset-sorts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updatedOrder }),
      });
      console.log('Sort order updated successfully');
    } catch (error) {
      console.error('Error updating sort order in database:', error);
    }
  };

  const sortAssets = async (key) => {
    let updatedAssets;

    if (!key) {
      // Fallback to default database sort_order
      updatedAssets = [...assets].sort((a, b) => a.sort_order - b.sort_order);
    } else {
      const newSortOrder =
        sortBy === key && sortOrder === 'asc' ? 'desc' : 'asc';
      setSortBy(key);
      setSortOrder(newSortOrder);

      updatedAssets = [...assets].sort((a, b) => {
        const compare = (valA, valB) => {
          if (key === 'name') return (valA || '').localeCompare(valB || '');
          if (key === 'balance')
            return (parseFloat(valA) || 0) - (parseFloat(valB) || 0);
          if (key === 'value') {
            const valAValue =
              (marketData.find((item) => item.id === a.asset_id)
                ?.current_price || 0) * (a.balance || 0);
            const valBValue =
              (marketData.find((item) => item.id === b.asset_id)
                ?.current_price || 0) * (b.balance || 0);
            return valAValue - valBValue;
          }
          return 0;
        };

        const result = compare(a[key], b[key]);
        return newSortOrder === 'asc' ? result : -result;
      });
    }

    // Assign new sequential `sort_order` values
    const updatedOrder = updatedAssets.map((asset, index) => ({
      id: asset.id,
      sort_order: index + 1,
    }));

    setAssets(updatedAssets);

    // Send updated order to the backend
    try {
      await fetch(`${API_URL}/hootfolio/update-hootfolio-asset-sorts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updatedOrder }),
      });
      console.log('Sort order updated successfully');
    } catch (error) {
      console.error('Error updating sort order:', error);
    }
  };

  const toggleSelectedAsset = (assetId) => {
    setSelectedAssetId((prev) => (prev === assetId ? null : assetId));
  };

  const toggleSelectedHootfolio = (hootfolioId) => {
    setSelectedHootfolioId((prev) =>
      prev === hootfolioId ? null : hootfolioId
    );
  };

  const fetchHootfolioChartData = async (currentHoot) => {
    console.log('FETCHING HOOT CHART DATA');
    try {
      const response = await fetch(`/api/hootfolio/${currentHoot.id}/history`);
      const data = await response.json();

      if (!data.values) {
        throw new Error('No values found in response');
      }

      // Map over data.values, not data
      return data.values.map((item) => ({
        x: new Date(item.timestamp).toLocaleString(), // Format timestamp for Nivo
        y: parseFloat(item.total_value), // Convert total_value to a number
      }));
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  const filterChartData = (data, timeRange) => {
    if (!data || !Array.isArray(data)) {
      console.error('Invalid data passed to filterChartData');
      return [];
    }

    const now = new Date();
    let rangeStart;

    // Define range start based on the time range
    switch (timeRange) {
      case '1D':
        rangeStart = new Date(now - 1 * 24 * 60 * 60 * 1000); // Last 1 day
        break;
      case '7D':
        rangeStart = new Date(now - 7 * 24 * 60 * 60 * 1000); // Last 7 days
        break;
      case '1M':
        rangeStart = new Date(now.setMonth(now.getMonth() - 1)); // Last 1 month
        break;
      case '1Y':
        rangeStart = new Date(now.setFullYear(now.getFullYear() - 1)); // Last 1 year
        break;
      case 'ALL':
      default:
        rangeStart = null; // No filter for "All"
        break;
    }

    // Filter the data based on the time range
    return data.filter((point) => {
      const pointDate = new Date(point.x); // Parse the timestamp from the data
      return rangeStart ? pointDate >= rangeStart : true; // Include all data if no rangeStart
    });
  };

  const getGains = (filteredData) => {
    const sortedData = filteredData.sort(
      (a, b) => new Date(a.x) - new Date(b.x)
    );

    const oldest = sortedData[0];
    const mostRecent = sortedData[sortedData.length - 1];

    const oldestY = oldest.y;
    const mostRecentY = mostRecent.y;

    const periodGainPercentage = `${(
      ((mostRecentY - oldestY) / oldestY) *
      100
    ).toFixed(2)}%`;
    const periodValueChange = mostRecentY - oldestY;
    setGainValue(periodValueChange);
    setGainPercentage(periodGainPercentage);
  };

  const handleTimePeriodChange = async (timeRange) => {
    setTimeRange(timeRange);
    const filteredData = filterChartData(allChartData[0].data, timeRange);

    setChartData([{ id: 'Total Value', data: filteredData }]);

    getGains(filteredData);
  };

  if (isAuthenticating) {
    return <LoadingSpinner />;
  }

  if (!isLoggedIn) {
    return <Login />;
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="Hootfolio">
      {hootfolio && (
        <div className="hootfolio-wrapper">
          <div
            className={
              hootfolioIsSelected
                ? 'hootfolio-container-selected'
                : 'hootfolio-container'
            }
            onClick={() => {
              if (!isEditingHootfolio) {
                console.log('Container clicked');
                toggleSelectedHootfolio(hootfolio[0].id);
                setHootfolioSelected((prevSelected) => !prevSelected);
              }
            }}
          >
            {/* Wallet Name and Icon */}
            <div className="wallet-name-container">
              {hootfolioImage && (
                <img
                  src={hootfolioImage}
                  alt="Wallet Icon"
                  className="wallet-icon"
                />
              )}

              {editingHootfolioId === hootfolio[0].id ? (
                <input
                  type="string"
                  value={tempHootfolioName}
                  onChange={(e) => setTempHootfolioName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveHootfolioName(hootfolio[0].id);
                    if (e.key === 'Escape') {
                      setEditingHootfolio(false);
                      setEditingHootfolioId(false);
                    }
                  }}
                  autoFocus
                  onFocus={(e) => e.target.select()}
                  className="hootfolio-name-input"
                />
              ) : (
                <h3 className="wallet-name">{hootfolio[0].name}</h3>
              )}
            </div>

            {/* Total Asset Value */}
            <span className="hootfolio-total-value">
              {!hootfolio[0].values_visible &&
                new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: 2,
                }).format(
                  assets.reduce((total, asset) => {
                    const marketAsset = marketData.find(
                      (item) => item.id === asset.asset_id
                    );
                    return (
                      total +
                      (marketAsset
                        ? marketAsset.current_price * asset.balance
                        : 0)
                    );
                  }, 0)
                )}
            </span>
          </div>
          {selectedHootfolioId !== null && (
            <div className="selected-hootfolio-actions">
              <button
                className={`visibility-toggle ${
                  isEditingHootfolio ? 'selected' : ''
                }`}
                title={'Hide Values'}
                onClick={() => {
                  updateHootfolioValuesVisible(hootfolio[0].id);
                }}
              >
                {hootfolio[0].values_visible ? <FaEyeSlash /> : <FaEye />}
              </button>
              <button
                className={`edit-hootfolio-button ${
                  isEditingHootfolio ? 'selected' : ''
                }`}
                title={
                  isEditingHootfolio
                    ? 'Save Hootfolio Name'
                    : 'Edit Hootfolio Name'
                }
                onClick={() => {
                  if (isEditingHootfolio) {
                    saveHootfolioName(hootfolio[0].id);
                  } else {
                    // console.log("Entering editing mode...");
                    setEditingHootfolio(true);
                    setEditingHootfolioId(hootfolio[0].id);
                    setTempHootfolioName(hootfolio[0].name);
                  }
                }}
              >
                ✎
              </button>
              <button
                className={`regen-name-hootfolio-button ${
                  isEditingHootfolio ? 'selected' : ''
                }`}
                title={'Regenerate Random Name'}
                onClick={() => {
                  generateHootfolioName(hootfolio[0].id);
                }}
              >
                <FaDice />
              </button>
              {/* <button className="delete-hootfolio-button" onClick={() => deleteAsset(hootfolio[0].id)}>X</button> */}
            </div>
          )}
        </div>
      )}
      {!isLoading && (
        <div className="gainWrapper">
          {hootfolio && hootfolio[0] ? (
            <div className="gainContent">
              {/* Gain Percentage */}
              <div className="gainPercent">
                <span
                  className={`gain ${
                    isNaN(parseFloat(gainPercentage)) ||
                    parseFloat(gainPercentage) >= 0
                      ? 'positive'
                      : 'negative'
                  }`}
                >
                  {gainPercentage !== ''
                    ? isNaN(parseFloat(gainPercentage))
                      ? '0%' // If it's NaN, show 0% and treat it as positive (green)
                      : parseFloat(gainPercentage) > -10 &&
                        parseFloat(gainPercentage) < 10
                      ? `${parseFloat(gainPercentage).toFixed(2)}%` // For small numbers
                      : `${Math.ceil(parseFloat(gainPercentage))}%` // For larger numbers
                    : ''}
                </span>
              </div>

              {/* Gain Value */}
              {!hootfolio[0].values_visible && (
                <div className="gainValue">
                  <span
                    className={`gain ${
                      gainValue >= 0 ? 'positive' : 'negative'
                    }`}
                  >
                    {gainValue !== ''
                      ? gainValue > -100 && gainValue < 100
                        ? new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 2, // Two decimal places for values in range
                            maximumFractionDigits: 2,
                          }).format(gainValue)
                        : new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 0, // No decimals for out-of-range values
                            maximumFractionDigits: 0,
                          }).format(Math.ceil(gainValue)) // Round up for out-of-range values
                      : ''}
                  </span>
                </div>
              )}
            </div>
          ) : (
            'Loading...'
          )}
        </div>
      )}

      <div className="hootfolio-actions">
        <button
          className={`add-asset-button ${isAddingAsset ? 'selected' : ''}`}
          onClick={() => {
            setIsAddingAsset(!isAddingAsset);
            setIsAddingSwap(false);
            setIsChartVisible(false);
          }}
        >
          Add Asset
        </button>
        <button
          className={`add-swap-button ${isAddingSwap ? 'selected' : ''}`}
          onClick={() => {
            setIsAddingSwap(!isAddingSwap);
            setIsAddingAsset(false);
            setIsChartVisible(false);
          }}
        >
          Add Swap
        </button>
        <button
          className="toggle-chart-button"
          onClick={() => {
            setIsChartVisible((prev) => !prev);
            setIsAddingAsset(false);
            setIsAddingSwap(false);
          }}
        >
          {isChartVisible ? 'Hide Chart' : 'Show Chart'}
        </button>
      </div>

      {isAddingAsset && (
        <HootfolioAssetForm
          hootfolio={hootfolio[0]}
          marketData={marketData}
          onSubmit={async (newAsset) => {
            await handleSortAndUpdate(newAsset); // Handle sorting and database updates
            await fetchHootfolio(); // Refresh the hootfolio
            setAssetFormResetTrigger((prev) => prev + 1); // Reset the form
          }}
          onCancel={() => setIsAddingAsset(false)}
          resetTrigger={assetFormResetTrigger}
        />
      )}

      {isAddingSwap && (
        <HootfolioSwapForm
          hootfolio={hootfolio[0]}
          marketData={marketData}
          onSubmit={() => {
            fetchHootfolio();
            setSwapFormResetTrigger((prev) => prev + 1);
          }}
          onCancel={() => setIsAddingSwap(false)}
          resetTrigger={swapFormResetTrigger} // Pass the trigger to the form
        />
      )}

      {/* Conditionally render both the buttons and the chart */}
      {isChartVisible && (
        <>
          {/* Time range buttons */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'center',
              margin: '10px 0',
            }}
          >
            {['1D', '7D', '1M', '1Y', 'ALL'].map((range) => (
              <button
                key={range}
                className={`time-range-button ${
                  selectedTimeRange === range ? 'selected' : ''
                }`}
                onClick={() => handleTimePeriodChange(range)}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Chart component */}
          <HootfolioNivoChart data={chartData} timeRange={selectedTimeRange} />
        </>
      )}

      <div className="hootfolio-assets">
        {assets.length > 0 ? (
          <>
            <div className="hootfolio-asset-header">
              <span className="asset-name" onClick={() => sortAssets('name')}>
                Asset
              </span>
              {!hootfolio[0].values_visible ? (
                <>
                  <span
                    className="asset-balance"
                    onClick={() => sortAssets('balance')}
                  >
                    Amount
                  </span>
                  <span
                    className="asset-total-value"
                    onClick={() => sortAssets('value')}
                  >
                    Value
                  </span>
                </>
              ) : (
                '' // Placeholder or nothing when hidden
              )}
            </div>
            {assets.map((asset, index) => {
              const marketAsset = marketData.find(
                (item) => item.id === asset.asset_id
              );

              return (
                <div key={index} className="hootfolio-asset-wrapper">
                  <div
                    className={`hootfolio-asset ${
                      selectedAssetId === asset.asset_id ? 'selected' : ''
                    }`}
                    onClick={() => {
                      if (!isEditingAsset) {
                        console.log('CLICKED');
                        toggleSelectedAsset(asset.asset_id);
                      }
                    }}
                  >
                    {/* Asset Image */}
                    <img
                      src={asset.image}
                      alt={asset.name}
                      className="asset-icon"
                    />

                    {/* Asset Name and Market Value */}
                    <div className="asset-name-price">
                      <span className="asset-name">{asset.name}</span>
                      <span className="asset-market-value">
                        {marketAsset
                          ? marketAsset.current_price < 0.01 // Extremely small values
                            ? `$${marketAsset.current_price.toFixed(8)}` // Show up to 8 decimal places for tiny values
                            : marketAsset.current_price < 1
                            ? `$${marketAsset.current_price.toFixed(6)}` // Show up to 6 decimal places for small values
                            : `$${marketAsset.current_price.toLocaleString(
                                undefined,
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}` // Standard format for larger values
                          : '-'}
                      </span>
                    </div>

                    {/* Amount Owned */}
                    {!hootfolio[0].values_visible ? (
                      <>
                        <span className="asset-balance">
                          {editingAssetId === asset.asset_id ? (
                            <input
                              type="text" // Use text to allow full user control over input
                              value={tempBalance} // Keep the raw value during editing
                              onChange={(e) => {
                                setTempBalance(e.target.value); // Store the raw input value
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  saveBalance(asset.asset_id); // Save on Enter
                                  setEditingAsset(false); // Exit editing mode
                                  setEditingAssetId(null); // Clear editing asset ID
                                }
                                if (e.key === 'Escape') {
                                  setEditingAssetId(null);
                                  setEditingAsset(false); // Exit edit mode on Escape
                                }
                              }}
                              onBlur={() => {
                                saveBalance(asset.asset_id); // Save on blur (optional)
                                setEditingAssetId(null); // Exit edit mode
                              }}
                              autoFocus
                              onFocus={(e) => e.target.select()} // Select the entire input value on focus
                              className="editable-input"
                            />
                          ) : (
                            Number(asset.balance).toFixed(2) // Display formatted value when not editing
                          )}
                        </span>

                        {/* Total Value */}
                        <span className="asset-total-value">
                          {marketAsset
                            ? new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                maximumFractionDigits: 0,
                              }).format(
                                Number(asset.balance) *
                                  marketAsset.current_price
                              )
                            : '-'}
                        </span>
                      </>
                    ) : (
                      '' // Placeholder for hidden values
                    )}
                  </div>

                  {selectedAssetId === asset.asset_id && (
                    <div className="asset-actions">
                      <button
                        className={`edit-asset-button ${
                          isEditingAsset && editingAssetId === asset.asset_id
                            ? 'selected'
                            : ''
                        }`}
                        title={
                          isEditingAsset && editingAssetId === asset.asset_id
                            ? 'Save Asset Amount'
                            : 'Edit Asset Amount'
                        }
                        onClick={() => {
                          if (
                            isEditingAsset &&
                            editingAssetId === asset.asset_id
                          ) {
                            console.log('DONE EDITING ASSET');
                            // Save changes when already in edit mode
                            saveBalance(asset.asset_id);
                            setEditingAsset(false); // Exit editing mode
                            setEditingAssetId(null); // Clear editing asset ID
                          } else {
                            // Enter editing mode
                            // console.log("Entering editing mode...");
                            setEditingAsset(true);
                            setEditingAssetId(asset.asset_id);
                            setTempBalance(
                              asset.balance ? String(Number(asset.balance)) : ''
                            );
                          }
                        }}
                      >
                        ✎
                      </button>
                      <button
                        className="delete-asset-button"
                        onClick={() => deleteAsset(asset.asset_id)}
                        style={{
                          opacity: editingAssetId ? 0 : 1, // Make it invisible when editingAssetId is truthy
                          pointerEvents: editingAssetId ? 'none' : 'auto', // Disable interactions when invisible
                          transition: 'opacity 0.3s ease', // Optional: Smooth opacity transition
                        }}
                      >
                        X
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        ) : (
          <p>No assets in your Hootfolio yet!</p>
        )}
      </div>
    </div>
  );
}

export default Hootfolio;
