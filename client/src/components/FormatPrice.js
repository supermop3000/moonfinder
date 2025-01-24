const formatPrice = (price) => {
  const numericPrice = parseFloat(price); // Convert to a float

  if (isNaN(numericPrice)) {
    return 'N/A'; // Handle invalid values
  }

  if (numericPrice < 1) {
    // Ensure at least 3 significant figures for values less than 1
    let formatted = numericPrice.toPrecision(3); // Ensures 3 significant digits
    return `$${parseFloat(formatted).toString()}`; // Add the dollar sign
  }

  // Values greater than or equal to 1, always show 2 decimal places
  return `$${numericPrice.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export default formatPrice;
