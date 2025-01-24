import React, { useEffect, useState, useRef } from 'react';
import useMarketData from '../hooks/useMarketData';
import useScreenSize from '../hooks/useScreenSize';
import '../styles/Market.css';
import Spinner from '../components/LoadingSpinner';
import { FaCog } from 'react-icons/fa';

const Market = () => {
  const { width } = useScreenSize();
  const { marketData, loading: marketLoading } = useMarketData();

  const [selectedStyle, setSelectedStyle] = useState('DataTable1'); // Default to DataTable1
  const [DataTableComponent, setDataTableComponent] = useState(null); // Dynamically loaded component
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const [showJumpToTop, setShowJumpToTop] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true); // Loading state for theme changes
  const [showMarketCap, setShowMarketCap] = useState(false); // State for showing market cap
  const [showVolume, setShowVolume] = useState(false); // State for showing volume
  const dropdownRef = useRef(null);
  const settingsIconRef = useRef(null);

  const headers = [
    '#',
    'Coin',
    'Price',
    '1HR',
    '24HR',
    '7DAY',
    'Market Cap',
    'Volume',
  ];

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handleThemeChange = (style) => {
    if (style !== selectedStyle) {
      setLoading(true); // Set loading to true when theme changes
      setSelectedStyle(style);
    }
  };

  const toggleMarketCap = () => {
    setShowMarketCap((prev) => !prev);
  };

  const toggleVolume = () => {
    setShowVolume((prev) => !prev);
  };

  // Toggle dropdown function
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  // Dynamically load DataTable component and CSS
  useEffect(() => {
    const loadComponent = async () => {
      try {
        const { default: Component } = await import(
          `../components/${selectedStyle}.js`
        );
        setDataTableComponent(() => Component);

        await import(`../styles/${selectedStyle}.css`);
        console.log(`${selectedStyle} loaded successfully.`);
        setLoading(false); // Set loading to false once component and CSS are loaded
      } catch (error) {
        console.error(`Error loading ${selectedStyle}:`, error);
        setLoading(false); // Set loading to false in case of error
      }
    };

    loadComponent();
  }, [selectedStyle]);

  // Handle scroll for sticky header
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsHeaderSticky(scrollY > 0); // Sticky header
      setShowJumpToTop(scrollY > 300); // Show "Jump to Top" button after 300px
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [width]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        settingsIconRef.current &&
        !settingsIconRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="Market">
      {/* Gear Icon for Settings */}
      <div className="settings-container">
        <div
          className="settings-icon"
          onClick={toggleDropdown}
          ref={settingsIconRef}
        >
          <FaCog />
        </div>
        {showDropdown && (
          <div className="dropdown-menu" ref={dropdownRef}>
            <div className="dropdown-section">
              <h4>Themes</h4>
              <div
                className={`theme-option ${selectedStyle === 'DataTable1' ? 'selected' : ''}`}
                onClick={() => handleThemeChange('DataTable1')}
              >
                Comfy
              </div>
              <div
                className={`theme-option ${selectedStyle === 'DataTable2' ? 'selected' : ''}`}
                onClick={() => handleThemeChange('DataTable2')}
              >
                Styled
              </div>
              <div
                className={`theme-option ${selectedStyle === 'DataTable3' ? 'selected' : ''}`}
                onClick={() => handleThemeChange('DataTable3')}
              >
                Terminal
              </div>
            </div>
            {selectedStyle === 'DataTable1' && (
              <div className="dropdown-section">
                <h4 className="drop-columns-header">Columns</h4>
                <div
                  className={`column-option ${showMarketCap ? 'selected' : ''}`}
                  onClick={toggleMarketCap}
                >
                  {showMarketCap ? 'Market Cap' : 'Market Cap'}
                </div>
                <div
                  className={`column-option ${showVolume ? 'selected' : ''}`}
                  onClick={toggleVolume}
                >
                  {showVolume ? 'Volume' : 'Volume'}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {loading || marketLoading ? (
        <Spinner />
      ) : DataTableComponent ? (
        <DataTableComponent
          headers={headers}
          data={marketData}
          isHeaderSticky={isHeaderSticky}
          showMarketCap={showMarketCap}
          showVolume={showVolume}
        />
      ) : (
        <div></div>
      )}
      {/* Jump to Top Button */}
      {showJumpToTop && (
        <button className="jump-to-top" onClick={scrollToTop}>
          JUMP TO TOP
        </button>
      )}
    </div>
  );
};

export default Market;
