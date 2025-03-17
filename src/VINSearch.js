import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Spinner, Alert } from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import axios from 'axios';

const VINSearch = () => {
  const [vin, setVin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('free');
  const [searchLimit, setSearchLimit] = useState(0);
  const [searchesUsed, setSearchesUsed] = useState(0);
  const navigate = useNavigate();

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserRole(userData.membership || 'free');
          setSearchLimit(userData.searchLimit || 0);
          setSearchesUsed(userData.searchesUsed || 0);
        }
      }
    };
    fetchUserData();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    // Validate VIN input
    if (!vin.trim()) {
      setError('Please enter a valid VIN.');
      return;
    }
    if (vin.length !== 17) {
      setError('VIN must be 17 characters long.');
      return;
    }
    // Check search limit for premium and business users
    if (
      (userRole === 'premium' || userRole === 'business') &&
      searchesUsed >= searchLimit
    ) {
      setError('You have reached your search limit. Please upgrade your plan.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      let apiType = 'nhtsa'; // Default to NHTSA API for free users or unauthenticated users
      // Determine API type based on user membership
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData && typeof userData.membership === 'string') {
            const membershipLower = userData.membership.toLowerCase();
            if (
              membershipLower === 'premium' ||
              membershipLower === 'business'
            ) {
              apiType = 'clearvin'; // Use ClearVIN API for premium and business members
            }
          }
        }
      }
      console.log('API Type:', apiType); // Debugging line
      // Fetch data based on the determined API type
      if (apiType === 'nhtsa') {
        // Use NHTSA API for free users or unauthenticated users
        const response = await axios.get(
          `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`
        );
        console.log('NHTSA API Response:', response.data); // Debugging line
        if (response.data.Count > 0) {
          const vehicleData = {
            make:
              response.data.Results.find((r) => r.Variable === 'Make')?.Value ||
              'N/A',
            model:
              response.data.Results.find((r) => r.Variable === 'Model')
                ?.Value || 'N/A',
            year:
              response.data.Results.find((r) => r.Variable === 'Model Year')
                ?.Value || 'N/A',
            vin: vin,
            registrationStatus: 'Active',
            mileage: 0,
            specifications: {
              make:
                response.data.Results.find((r) => r.Variable === 'Make')
                  ?.Value || 'N/A',
              model:
                response.data.Results.find((r) => r.Variable === 'Model')
                  ?.Value || 'N/A',
              year:
                response.data.Results.find((r) => r.Variable === 'Model Year')
                  ?.Value || 'N/A',
              trim:
                response.data.Results.find((r) => r.Variable === 'Trim')
                  ?.Value || 'N/A',
              madeIn:
                response.data.Results.find(
                  (r) => r.Variable === 'Plant Country'
                )?.Value || 'N/A',
              engine:
                response.data.Results.find((r) => r.Variable === 'Engine Model')
                  ?.Value || 'N/A',
              style:
                response.data.Results.find((r) => r.Variable === 'Body Class')
                  ?.Value || 'N/A',
              fuelCapacity:
                response.data.Results.find(
                  (r) => r.Variable === 'Fuel Capacity'
                )?.Value || 'N/A',
              cityMileage:
                response.data.Results.find((r) => r.Variable === 'City MPG')
                  ?.Value || 'N/A',
              msrp:
                response.data.Results.find((r) => r.Variable === 'Base MSRP')
                  ?.Value || 'N/A',
            },
            titleRecords: [],
            junkSalvageRecords: [],
            saleRecords: [],
            problemChecks: {
              floodDamage: 'No problems found!',
              fireDamage: 'No problems found!',
              hailDamage: 'No problems found!',
              saltWaterDamage: 'No problems found!',
              vandalism: 'No problems found!',
              rebuilt: 'No problems found!',
              salvageDamage: 'No problems found!',
            },
          };
          console.log('Vehicle Data:', vehicleData); // Debugging line
          navigate('/garage', { state: { vehicle: vehicleData } });
        } else {
          setError('No data found for this VIN.');
        }
      } else if (apiType === 'clearvin') {
        // Use ClearVIN API for premium and business members
        const response = await axios.get(
          `http://localhost:5000/api/clearvin?vin=${vin}`
        );
        console.log('ClearVIN API Response:', response.data); // Debugging line
        if (response.data.vehicle) {
          const result = response.data; // Renamed from data to result
          const vehicleData = {
            ...result.vehicle,
            titleRecords: result.vehicle.titleRecords || [],
            junkSalvageRecords: result.vehicle.junkSalvageRecords || [],
            saleRecords: result.vehicle.saleRecords || [],
            problemChecks: {
              floodDamage:
                result.vehicle.problemChecks?.floodDamage ||
                'No problems found!',
              fireDamage:
                result.vehicle.problemChecks?.fireDamage ||
                'No problems found!',
              hailDamage:
                result.vehicle.problemChecks?.hailDamage ||
                'No problems found!',
              saltWaterDamage:
                result.vehicle.problemChecks?.saltWaterDamage ||
                'No problems found!',
              vandalism:
                result.vehicle.problemChecks?.vandalism || 'No problems found!',
              rebuilt:
                result.vehicle.problemChecks?.rebuilt || 'No problems found!',
              salvageDamage:
                result.vehicle.problemChecks?.salvageDamage ||
                'No problems found!',
            },
            recalls: result.vehicle.recalls || [],
            emissionSafetyInspections:
              result.vehicle.emissionSafetyInspections || [],
            accidentDamageHistory: result.vehicle.accidentDamageHistory || [],
            lienImpoundRecords: result.vehicle.lienImpoundRecords || [],
          };
          console.log('Vehicle Data:', vehicleData); // Debugging line
          navigate('/garage', { state: { vehicle: vehicleData } });

          // Deduct one search from the user's account
          if (auth.currentUser) {
            const userDocRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userDocRef, {
              searchesUsed: increment(1),
            });
          }
        } else {
          console.error(
            'ClearVIN API response does not contain vehicle data:',
            response.data
          ); // Debugging line
          setError('No data found for this VIN using ClearVIN API.');
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err.message);
      console.error('Error details:', err.response?.data || err);
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
      <Form onSubmit={handleSearch}>
        <div className="input-group mb-3">
          <Form.Control
            type="text"
            placeholder="Enter VIN"
            value={vin}
            onChange={(e) => {
              if (e.target.value.length <= 17) {
                setVin(e.target.value.toUpperCase());
              }
            }}
            aria-label="Enter VIN"
            required
            maxLength={17}
            style={{
              borderRadius: '25px 0 0 25px',
              border: '2px solid #007bff',
              padding: '10px 20px',
              fontSize: '1.2rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
          />
          <Button
            variant="primary"
            type="submit"
            disabled={loading}
            style={{
              borderRadius: '0 25px 25px 0',
              border: '2px solid #007bff',
              padding: '10px 20px',
              fontSize: '1.2rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              backgroundColor: '#007bff',
              color: '#fff',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#0056b3';
              e.target.style.boxShadow = '0 6px 8px rgba(0, 0, 0, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#007bff';
              e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            }}
          >
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
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

