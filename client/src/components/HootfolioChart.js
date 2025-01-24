import React, { useState, useEffect } from 'react';
import { ResponsiveLine } from '@nivo/line';

const HootfolioNivoChart = ({ data }) => {
  const [filteredData, setFilteredData] = useState(data);

  useEffect(() => {
    // Update filtered data when new data is passed
    filterData(data);
  }, [data]);

  const filterData = (data) => {
    const filtered = data.map((series) => ({
      ...series,
      data: series.data.filter((point) => {
        return true; // Add your logic here
      }),
    }));
    setFilteredData(filtered);
  };

  // Create valuesToShow array to determine which labels to show
  const getYAxisMaxLabels = (data) => {
    if (!data || data.length === 0) return [];

    const allYValues = data.map((v) => v.y);
    const minY = Math.min(...allYValues);
    const maxY = Math.max(...allYValues);

    // Calculate step size for 4 evenly spaced labels (including min and max)
    const stepSize = (maxY - minY) / 3; // Divide into 3 intervals for 4 total labels

    // Generate labels
    const labels = [];
    for (let i = 0; i <= 3; i++) {
      labels.push(minY + i * stepSize);
    }

    return labels;
  };

  const getXAxisMaxLabels = (data) => {
    console.log('DATA');
    console.log(data);
    if (!data || data.length === 0) return [];

    const totalPoints = data.length;

    // Calculate the step size to ensure a maximum of 4 labels
    const step = Math.ceil(totalPoints / 4);

    // Select every `step`th value to get evenly distributed labels
    return data
      .map((v, i) => (i % step === 0 ? v.x : '')) // Show labels at the calculated step
      .filter((v) => v !== ''); // Remove empty labels
  };

  const xAxisMaxLabels = getXAxisMaxLabels(filteredData[0]?.data);

  const formatXAxis = (value) => {
    if (xAxisMaxLabels.includes(value)) {
      const date = new Date(value);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
      }).format(date);
    }
    return ''; // Hide labels not in valuesToShow
  };

  const getLowestYValue = (filteredData) => {
    if (!filteredData || filteredData.length === 0) {
      return null; // Handle case when data is empty or undefined
    }

    // Flatten all data points and find the minimum y value
    return Math.min(
      ...filteredData.flatMap((series) => series.data.map((point) => point.y))
    );
  };

  const lowestYValue = getLowestYValue(filteredData);

  const roundUpToNearest = (value, nearest) =>
    Math.ceil(value / nearest) * nearest;

  const formatYAxis = (value) => {
    // Round up to the nearest 1000 for better formatting
    value = roundUpToNearest(value, 1000);

    if (value < 1000) {
      return `$${value}`; // For values from 0 to 999
    } else if (value < 1_000_000) {
      const formatted = value / 1000;
      return formatted % 1 === 0
        ? `$${formatted}k`
        : `$${formatted.toFixed(1)}k`; // For values from 1,000 to 999,999
    } else if (value < 1_000_000_000) {
      const formatted = value / 1_000_000;
      return formatted % 1 === 0
        ? `$${formatted}M`
        : `$${formatted.toFixed(1)}M`; // For values from 1,000,000 to 999,999,999
    } else {
      const formatted = value / 1_000_000_000;
      return formatted % 1 === 0
        ? `$${formatted}B`
        : `$${formatted.toFixed(1)}B`; // For values 1,000,000,000 and above
    }
  };

  if (!filteredData || filteredData.length === 0) {
    return <div></div>;
  }

  return (
    <div style={{ height: '300px' }}>
      <ResponsiveLine
        data={filteredData}
        margin={{ top: 50, right: 50, bottom: 50, left: 90 }}
        xScale={{ type: 'point' }}
        yScale={{
          type: 'linear',
          min: 'auto',
          max: 'auto',
          stacked: false,
          reverse: false,
        }}
        axisTop={null}
        animate={false}
        enableArea={true}
        enableGridY={false}
        enableGridX={false}
        axisRight={null}
        areaBaselineValue={lowestYValue}
        axisBottom={{
          orient: 'bottom',
          tickSize: 0,
          tickPadding: 16,
          tickRotation: 0,
          tickValues: xAxisMaxLabels,
          format: formatXAxis,
          // legend: "Date",
          // legendOffset: 36,
          // legendPosition: "middle",
        }}
        axisLeft={{
          orient: 'left',
          tickSize: 0,
          tickPadding: 20,
          tickRotation: 0,
          // legend: "Total Value",
          // legendOffset: -70,
          // legendPosition: "middle",
          format: formatYAxis,
          tickValues: getYAxisMaxLabels(filteredData[0]?.data),
        }}
        pointSize={0}
        pointBorderWidth={2}
        fontSize={12}
        colors={['rgb(180, 180, 220)']}
        pointBorderColor={{ from: 'serieColor' }}
        useMesh={true}
        tooltip={({ point }) => {
          const date = new Date(point.data.x);
          const formattedDate = new Intl.DateTimeFormat('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          }).format(date);

          const formattedValue =
            point.data.y < 1000
              ? `$${point.data.y}`
              : point.data.y < 1_000_000
                ? `$${(point.data.y / 1000).toFixed(1)}k`
                : point.data.y < 1_000_000_000
                  ? `$${(point.data.y / 1_000_000).toFixed(1)}M`
                  : `$${(point.data.y / 1_000_000_000).toFixed(1)}B`;

          return (
            <div
              style={{
                fontSize: '8px !important',
                background: ['rgb(100, 100, 140)'],
                color: 'white',
                borderRadius: '4px',
                boxShadow: '0 3px 6px rgba(0, 0, 0, 1)',
                padding: '10px',
                textAlign: 'center',
              }}
            >
              <div>{formattedValue}</div>
              <div>{formattedDate}</div>
            </div>
          );
        }}
        theme={{
          tooltip: {
            container: {
              fontSize: '12px',
            },
          },
          axis: {
            ticks: {
              text: {
                fontSize: 14,
                font: 'helvetica',
              },
            },
          },
          grid: {
            line: {
              stroke: 'red',
            },
          },
        }}
      />
    </div>
  );
};

export default HootfolioNivoChart;
