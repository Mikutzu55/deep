import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Spinner, Alert } from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';

const Home = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchTerm.trim()) {
      setError('Please enter a valid VIN.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Fetch data from the backend's NHTSA endpoint
      const response = await fetch(`/api/nhtsa?vin=${searchTerm}`);

      if (!response.ok) {
        const text = await response.text(); // Get raw response for debugging
        console.error('Unexpected response:', text);
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      const vehicleData = result.vehicle;

      // Map the vehicle data to match the expected structure
      const mappedVehicleData = {
        make: vehicleData.make || 'N/A',
        model: vehicleData.model || 'N/A',
        year: vehicleData.year || 'N/A',
        vin: vehicleData.vin,
        registrationStatus: vehicleData.registrationStatus || 'Active',
        mileage: vehicleData.mileage || 0,
        specifications: {
          make: vehicleData.specifications.make || 'N/A',
          model: vehicleData.specifications.model || 'N/A',
          year: vehicleData.specifications.year || 'N/A',
          trim: vehicleData.specifications.trim || 'N/A',
          madeIn: vehicleData.specifications.madeIn || 'N/A',
          engine: vehicleData.specifications.engine || 'N/A',
          style: vehicleData.specifications.style || 'N/A',
          antiBrakeSystem: vehicleData.specifications.antiBrakeSystem || 'N/A',
          fuelCapacity: vehicleData.specifications.fuelCapacity || 'N/A',
          overallHeight: vehicleData.specifications.overallHeight || 'N/A',
          overallWidth: vehicleData.specifications.overallWidth || 'N/A',
          optionalSeating: vehicleData.specifications.optionalSeating || 'N/A',
          cityMileage: vehicleData.specifications.cityMileage || 'N/A',
          msrp: vehicleData.specifications.msrp || 'N/A',
        },
        titleRecords: vehicleData.titleRecords || [],
        junkSalvageRecords: vehicleData.junkSalvageRecords || [],
        saleRecords: vehicleData.saleRecords || [],
        problemChecks: vehicleData.problemChecks || {
          floodDamage: 'No problems found!',
          fireDamage: 'No problems found!',
          hailDamage: 'No problems found!',
          saltWaterDamage: 'No problems found!',
          vandalism: 'No problems found!',
          rebuilt: 'No problems found!',
          salvageDamage: 'No problems found!',
        },
      };

      // Navigate to Garage page with the vehicle data
      navigate('/garage', { state: { vehicle: mappedVehicleData } });
    } catch (err) {
      console.error('Error fetching NHTSA data:', err.message); // Log the error
      setError('Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Hero Section */}
      <div className="text-center mt-5">
        <h1>Find Your Car's History</h1>
        <p className="lead">
          Enter your car's VIN to get detailed information.
        </p>

        <Form onSubmit={handleSearch} className="mt-4">
          <Form.Group controlId="searchTerm">
            <Form.Control
              type="text"
              placeholder="Enter VIN"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={loading}
            />
          </Form.Group>

          <Button
            variant="primary"
            type="submit"
            className="mt-3"
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Searching...
              </>
            ) : (
              <>
                <FaSearch className="me-2" />
                Search
              </>
            )}
          </Button>

          {error && (
            <Alert variant="danger" className="mt-3">
              {error}
            </Alert>
          )}
        </Form>
      </div>

      {/* Features Section */}
      <div className="container mt-5">
        <div className="row">
          <div className="col-md-4">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title fw-bold">Accurate Data</h5>
                <p className="card-text text-muted">
                  Get precise details about your vehicle's history.
                </p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title fw-bold">Comprehensive Reports</h5>
                <p className="card-text text-muted">
                  Access detailed reports on accidents, recalls, and more.
                </p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title fw-bold">"What-If" Scenarios</h5>
                <p className="card-text text-muted">
                  Simulate different scenarios to understand the impact of
                  mileage, accidents, and more on car value.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
