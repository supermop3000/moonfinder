import React, { useState } from 'react';

const CompanyForm = ({ initialData, onSubmit }) => {
  // State to manage the form fields
  const [formData, setFormData] = useState({
    productName: initialData?.productName || '',
    category: initialData?.category || '',
    price: initialData?.price || '',
    description: initialData?.description || '',
    features: initialData?.features || '',
    manufacturer: initialData?.manufacturer || '',
    sku: initialData?.sku || '',
    warranty: initialData?.warranty || '',
    competitors: initialData?.competitors || '',
    releaseDate: initialData?.releaseDate || '',
  });

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData); // Send data to parent or backend
  };

  return (
    <form className="product-form" onSubmit={handleSubmit}>
      <h2>Product Information</h2>

      <div className="form-group">
        <label htmlFor="productName">Product Name:</label>
        <input
          type="text"
          id="productName"
          name="productName"
          value={formData.productName}
          onChange={handleInputChange}
        />
      </div>

      <div className="form-group">
        <label htmlFor="category">Category:</label>
        <input
          type="text"
          id="category"
          name="category"
          value={formData.category}
          onChange={handleInputChange}
        />
      </div>

      <div className="form-group">
        <label htmlFor="price">Price:</label>
        <input
          type="number"
          id="price"
          name="price"
          value={formData.price}
          onChange={handleInputChange}
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description:</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
        />
      </div>

      <div className="form-group">
        <label htmlFor="features">Features:</label>
        <textarea
          id="features"
          name="features"
          value={formData.features}
          onChange={handleInputChange}
        />
      </div>

      <div className="form-group">
        <label htmlFor="manufacturer">Manufacturer:</label>
        <input
          type="text"
          id="manufacturer"
          name="manufacturer"
          value={formData.manufacturer}
          onChange={handleInputChange}
        />
      </div>

      <div className="form-group">
        <label htmlFor="sku">SKU:</label>
        <input
          type="text"
          id="sku"
          name="sku"
          value={formData.sku}
          onChange={handleInputChange}
        />
      </div>

      <div className="form-group">
        <label htmlFor="warranty">Warranty Information:</label>
        <input
          type="text"
          id="warranty"
          name="warranty"
          value={formData.warranty}
          onChange={handleInputChange}
        />
      </div>

      <div className="form-group">
        <label htmlFor="competitors">Competitors:</label>
        <textarea
          id="competitors"
          name="competitors"
          value={formData.competitors}
          onChange={handleInputChange}
        />
      </div>

      <div className="form-group">
        <label htmlFor="releaseDate">Release Date:</label>
        <input
          type="date"
          id="releaseDate"
          name="releaseDate"
          value={formData.releaseDate}
          onChange={handleInputChange}
        />
      </div>

      <button type="submit" className="submit-button">
        Save Product Info
      </button>
    </form>
  );
};

export default CompanyForm;
