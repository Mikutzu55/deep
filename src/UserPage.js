// src/UserPage.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const UserPage = () => {
  const { make, model, year, registrationStatus, owner } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (loading) {
    return <div className="text-center mt-5">Loading...</div>;
  }

  if (error) {
    return <div className="text-center mt-5 text-danger">Error: {error}</div>;
  }

  return (
    <div className="container mt-5">
      <h1>Vehicle Details</h1>
      <ul className="list-group">
        <li className="list-group-item">
          <strong>Make:</strong> {make || 'Unknown'}
        </li>
        <li className="list-group-item">
          <strong>Model:</strong> {model || 'Unknown'}
        </li>
        <li className="list-group-item">
          <strong>Year:</strong> {year || 'Unknown'}
        </li>
        <li className="list-group-item">
          <strong>Registration Status:</strong>{' '}
          {registrationStatus || 'Unknown'}
        </li>
        <li className="list-group-item">
          <strong>Owner:</strong> {owner || 'Unknown'}
        </li>
      </ul>
    </div>
  );
};

export default UserPage;
