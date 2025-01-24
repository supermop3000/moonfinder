import React, { useEffect } from 'react';

const GoogleAnalytics = () => {
  useEffect(() => {
    // Dynamically add the gtag.js script
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-4TKW6EETF8';
    document.head.appendChild(script);

    // Initialize Google Analytics
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    gtag('js', new Date());
    gtag('config', 'G-4TKW6EETF8');
  }, []); // Run once on component mount

  return null; // This component doesn't render anything
};

export default GoogleAnalytics;
