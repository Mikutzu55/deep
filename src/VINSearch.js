import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Form,
  Spinner,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
} from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';

const VINSearch = () => {
  const [vin, setVin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiType, setApiType] = useState('nhtsa'); // Default to NHTSA API
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!vin.trim()) {
      setError('Please enter a valid VIN.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      let response;

      if (apiType === 'nhtsa') {
        // Fetch data from NHTSA API via backend proxy
        response = await fetch(`/api/nhtsa?vin=${vin}`);
      } else if (apiType === 'clearvin') {
        // Fetch data from ClearVIN API via backend proxy
        response = await fetch(`/api/clearvin?vin=${vin}`);
      }

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      // Ensure the vehicle data structure matches what Garage.js expects
      const vehicleData = {
        ...result.vehicle,
        titleRecords: result.vehicle.titleRecords || [],
        junkSalvageRecords: result.vehicle.junkSalvageRecords || [],
        saleRecords: result.vehicle.saleRecords || [],
        problemChecks: {
          floodDamage:
            result.vehicle.problemChecks?.floodDamage || 'No problems found!',
          fireDamage:
            result.vehicle.problemChecks?.fireDamage || 'No problems found!',
          hailDamage:
            result.vehicle.problemChecks?.hailDamage || 'No problems found!',
          saltWaterDamage:
            result.vehicle.problemChecks?.saltWaterDamage ||
            'No problems found!',
          vandalism:
            result.vehicle.problemChecks?.vandalism || 'No problems found!',
          rebuilt:
            result.vehicle.problemChecks?.rebuilt || 'No problems found!',
          salvageDamage:
            result.vehicle.problemChecks?.salvageDamage || 'No problems found!',
        },
        recalls: result.vehicle.recalls || [],
        emissionSafetyInspections:
          result.vehicle.emissionSafetyInspections || [],
        accidentDamageHistory: result.vehicle.accidentDamageHistory || [],
        lienImpoundRecords: result.vehicle.lienImpoundRecords || [],
      };

      // Navigate to Garage page with the vehicle data
      navigate('/garage', { state: { vehicle: vehicleData } });
    } catch (err) {
      console.error('Error fetching data:', err.message);
      setError('Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5 pt-5">
      <h2 className="text-center mb-4 fw-bold text-primary">
        <FaSearch className="me-2" /> VIN Search
      </h2>

      {/* API Selection Toggle */}
      <div className="text-center mb-4">
        <ToggleButtonGroup
          type="radio"
          name="api-type"
          value={apiType}
          onChange={setApiType}
        >
          <ToggleButton id="nhtsa-api" value="nhtsa">
            Free NHTSA API
          </ToggleButton>
          <ToggleButton id="clearvin-api" value="clearvin">
            ClearVIN API (Trial)
          </ToggleButton>
        </ToggleButtonGroup>
      </div>

      <Form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
      >
        <div className="input-group mb-3">
          <Form.Control
            type="text"
            placeholder="Enter VIN"
            value={vin}
            onChange={(e) => setVin(e.target.value)}
            aria-label="Enter VIN"
            aria-describedby="search-button"
          />
          <Button
            variant="primary"
            id="search-button"
            onClick={handleSearch}
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
              'Search'
            )}
          </Button>
        </div>
      </Form>

      {error && (
        <Alert variant="danger" className="text-center">
          {error}
        </Alert>
      )}
    </div>
  );
};

export default VINSearch;
