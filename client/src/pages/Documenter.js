import React, { useState, useEffect } from 'react';
import '../styles/Documenter.css';

const Documenter = () => {
  const [companyData, setCompanyData] = useState({
    companyName: '',
    industry: '',
    address: '',
    phone: '',
    website: '',
    description: '',
    revenue: '',
    employees: '',
    founded: '',
    ceo: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadLink, setDownloadLink] = useState(null); // State to store the download link

  // Simulate loading existing company data on page load
  useEffect(() => {
    const existingData = {
      companyName: 'TechCorp',
      industry: 'Technology',
      address: '123 Tech Street, Silicon Valley, CA',
      phone: '123-456-7890',
      website: 'https://www.techcorp.com',
      description: 'A leading technology company.',
      revenue: '$5 Billion',
      employees: '10,000',
      founded: '2001',
      ceo: 'Jane Doe',
    };
    setCompanyData(existingData);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCompanyData({ ...companyData, [name]: value });
  };

  const handleSave = () => {
    console.log('Saved Company Data:', companyData);
    alert('Company information saved successfully!');
    // Send updated data to the backend here
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setIsProcessing(true);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('companyData', JSON.stringify(companyData)); // Attach current company data

      try {
        const response = await fetch('/api/process-document', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();

          // Update fields with NLP-processed data
          setCompanyData((prevData) => ({
            ...prevData,
            ...result.filledData, // Assume backend returns matched data in `filledData`
          }));

          // Set the download link for the processed document
          setDownloadLink(result.downloadLink);

          alert('Document processed successfully!');
        } else {
          alert('Error processing document.');
        }
      } catch (error) {
        console.error('Error processing document:', error);
        alert('An error occurred while processing the document.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className="documenter">
      <h1>Documenter: Company Information</h1>

      {/* Editable Fields */}
      <div className="company-fields">
        {Object.entries(companyData).map(([key, value]) => (
          <div className="form-group" key={key}>
            <label htmlFor={key}>{key.replace(/([A-Z])/g, ' $1')}</label>
            <input
              type="text"
              id={key}
              name={key}
              value={value}
              onChange={handleInputChange}
              placeholder={`Enter ${key.replace(/([A-Z])/g, ' $1')}`}
            />
          </div>
        ))}
        <button onClick={handleSave} className="save-button">
          Save
        </button>
      </div>

      {/* Upload Section */}
      <div className="upload-section">
        <h2>Upload Document</h2>
        <input
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={handleFileUpload}
          disabled={isProcessing}
        />
        {isProcessing && <p>Processing document... Please wait.</p>}

        {/* Show the download link once the document is processed */}
        {downloadLink && (
          <div className="download-section">
            <p>Download your processed document:</p>
            <a href={downloadLink} download>
              Click here to download
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default Documenter;
