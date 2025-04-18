import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Badge, Form, Alert, Spinner } from 'react-bootstrap';
import {
  FaCheck,
  FaStar,
  FaBriefcase,
  FaCarCrash,
  FaIdCard,
  FaDollarSign,
  FaBrain,
  FaLightbulb,
  FaChartLine,
  FaQuestionCircle,
  FaTwitter,
  FaFacebook,
  FaInstagram,
  FaEnvelope,
} from 'react-icons/fa';
import { auth } from './firebase';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useTheme } from './ThemeContext';
import axios from 'axios';

const db = getFirestore();

const Home = ({ theme }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [subscriptionType, setSubscriptionType] = useState('premium');
  const [membership, setMembership] = useState('free');
  const [flippedCards, setFlippedCards] = useState({});
  const { toggleTheme } = useTheme();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();
          if (userData && userData.membership) {
            setMembership(userData.membership);
          } else {
            setMembership('free');
          }
        } catch (err) {
          console.error('Error fetching user data:', err.message);
          setMembership('free');
        }
      } else {
        setMembership('free');
      }
    });

    return () => unsubscribe();
  }, [auth, db]);

  const handleSearch = async (e) => {
    e.preventDefault();
    // Validate VIN input
    if (!searchTerm.trim()) {
      setError('Please enter a valid VIN.');
      return;
    }
    if (searchTerm.length !== 17) {
      setError('VIN must be 17 characters long.');
      return;
    }
    // Check search limit for premium and business users
    if (
      (membership === 'premium' || membership === 'business') &&
      (await getSearchesUsed()) >= (await getSearchLimit())
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
          `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${searchTerm}?format=json`
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
            vin: searchTerm,
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
          `http://localhost:5000/api/clearvin?vin=${searchTerm}`
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

  const getSearchLimit = async () => {
    if (auth.currentUser) {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        return userDoc.data().searchLimit || 0;
      }
    }
    return 0;
  };

  const getSearchesUsed = async () => {
    if (auth.currentUser) {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        return userDoc.data().searchesUsed || 0;
      }
    }
    return 0;
  };

  const plans = {
    premium: [
      {
        id: 1,
        name: 'Starter',
        price: 11.95,
        searches: 1,
        features: ['1 VIN search', 'Basic vehicle details', 'Email support'],
        bestValue: false,
        comparison:
          'Our Starter plan offers more features than competitors at the same price point.',
      },
      {
        id: 2,
        name: 'Explorer',
        price: 40.95,
        searches: 5,
        features: [
          '5 VIN searches',
          'Detailed vehicle history',
          'Email support',
        ],
        bestValue: true,
        comparison:
          'Explorer provides more searches and better support than competitors.',
      },
      {
        id: 3,
        name: 'Pro',
        price: 59.95,
        searches: 8,
        features: [
          '8 VIN searches',
          'Full vehicle history',
          'Priority email support',
        ],
        bestValue: false,
        comparison:
          'Pro offers unmatched value with full history and priority support.',
      },
    ],
    business: [
      {
        id: 4,
        name: 'Small Business',
        price: 149.99,
        searches: 20,
        features: [
          '20 VIN searches',
          'API access',
          'Dedicated account manager',
        ],
        bestValue: false,
        comparison:
          'Perfect for small businesses with API access and dedicated support.',
      },
      {
        id: 5,
        name: 'Enterprise',
        price: 374.99,
        searches: 50,
        features: ['50 VIN searches', 'API access', '24/7 priority support'],
        bestValue: true,
        comparison:
          'Enterprise offers the best value for large-scale operations.',
      },
      {
        id: 6,
        name: 'Corporate',
        price: 589.99,
        searches: 100,
        features: ['100 VIN searches', 'API access', 'Custom integrations'],
        bestValue: false,
        comparison:
          'Corporate is ideal for large enterprises with custom needs.',
      },
    ],
  };

  const toggleCardFlip = (id) => {
    setFlippedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="home-page" data-theme={theme}>
      {/* Hero Section */}
      <div className="hero-section text-center py-5">
        <h1 className="display-4 fw-bold text-primary">
          Welcome to My Car Website!
        </h1>
        <p className="lead">
          Explore cars, check their history, and get personalized
          recommendations.
        </p>
        {/* Search Bar */}
        <form
          onSubmit={handleSearch}
          className="mt-4 d-flex justify-content-center"
        >
          <div className="input-group w-100" style={{ maxWidth: '500px' }}>
            <input
              type="text"
              placeholder="Enter VIN or License Plate"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
              className="form-control shadow-sm"
              style={{
                borderTopRightRadius: '0',
                borderBottomRightRadius: '0',
                border: '2px solid #007bff',
                minHeight: '48px',
                lineHeight: '1.5',
                transition:
                  'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
              }}
              onFocus={(e) => {
                e.target.style.transform = 'scale(1.02)';
                e.target.style.boxShadow = '0 4px 8px rgba(0, 123, 255, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = 'none';
              }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                borderTopLeftRadius: '0',
                borderBottomLeftRadius: '0',
                padding: '0.5rem 1.5rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                backgroundColor: '#007bff',
                borderColor: '#007bff',
                minHeight: '48px',
                transition:
                  'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Searching...
                </>
              ) : (
                'Search'
              )}
            </button>
          </div>
        </form>
        {error && <p className="text-danger mt-3">{error}</p>}
      </div>

      {/* Why Use Our Website Section */}
      <div className="why-section text-center py-5">
        <h2 className="fw-bold text-secondary">Why Use Our Website?</h2>
        <p className="mb-4 muted">
          Discover the key features that make us your go-to platform for vehicle
          information.
        </p>
        <div className="row justify-content-center">
          {[
            {
              icon: <FaCarCrash className="fa-3x mb-3 text-primary" />,
              title: 'Accident History',
              description:
                'Check if the vehicle has been involved in any accidents.',
              link: '#',
            },
            {
              icon: <FaIdCard className="fa-3x mb-3 text-primary" />,
              title: 'Ownership Records',
              description:
                'View the complete ownership history of the vehicle.',
              link: '#',
            },
            {
              icon: <FaDollarSign className="fa-3x mb-3 text-primary" />,
              title: 'Market Value Estimation',
              description: 'Get an estimated market value for the vehicle.',
              link: '#',
            },
            {
              icon: <FaBrain className="fa-3x mb-3 text-primary" />,
              title: 'AI-Powered Recommendations',
              description: 'Get personalized car suggestions and insights.',
              link: '#',
            },
          ].map((feature, index) => (
            <div key={index} className="col-md-3 col-sm-6 mb-4">
              <Card
                className="h-100 shadow-sm feature-card"
                onClick={() => (window.location.href = feature.link)}
              >
                <Card.Body className="d-flex flex-column align-items-center">
                  {feature.icon}
                  <h5 className="card-title fw-bold">{feature.title}</h5>
                  <p className="card-text muted">{feature.description}</p>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Choose Your Plan Section */}
      <div className="pricing-section text-center py-5">
        <h2 className="fw-bold text-secondary">Choose Your Plan</h2>
        <div className="text-center mb-4">
          <div className="subscription-toggle">
            <Button
              variant={
                subscriptionType === 'premium' ? 'primary' : 'outline-primary'
              }
              onClick={() => setSubscriptionType('premium')}
              className="me-2"
            >
              <FaStar className="me-2" /> Premium Plans
            </Button>
            <Button
              variant={
                subscriptionType === 'business' ? 'primary' : 'outline-primary'
              }
              onClick={() => setSubscriptionType('business')}
            >
              <FaBriefcase className="me-2" /> Business Plans
            </Button>
          </div>
        </div>
        <div className="row">
          {plans[subscriptionType].map((plan) => (
            <div key={plan.id} className="col-md-4 mb-4">
              <div
                className={`flip-card ${flippedCards[plan.id] ? 'flipped' : ''}`}
                onClick={() => toggleCardFlip(plan.id)}
              >
                <div className="flip-card-inner">
                  <div className="flip-card-front">
                    <Card className="h-300 shadow-sm">
                      <Card.Body className="d-flex flex-column">
                        <div className="text-center">
                          {plan.bestValue && (
                            <Badge bg="warning" className="mb-3">
                              Best Value
                            </Badge>
                          )}
                          <h4 className="mb-3">{plan.name}</h4>
                          <h2 className="mb-3">
                            ${plan.price}
                            <small className="muted fs-6">/month</small>
                          </h2>
                          <p className="muted mb-4">
                            {plan.searches} VIN search
                            {plan.searches > 1 ? 'es' : ''}
                          </p>
                        </div>
                        <ul className="list-unstyled mb-4">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="mb-2">
                              <FaCheck className="text-success me-2" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <Button
                          variant={
                            plan.bestValue ? 'primary' : 'outline-primary'
                          }
                          className="mt-auto"
                        >
                          Get Started
                        </Button>
                      </Card.Body>
                    </Card>
                  </div>
                  <div className="flip-card-back">
                    <Card className="h-100 shadow-sm">
                      <Card.Body className="d-flex flex-column">
                        <h4 className="mb-3">Why Choose Us?</h4>
                        <p className="muted">{plan.comparison}</p>
                      </Card.Body>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Section */}
      <div className="ai-section text-center py-5">
        <h2 className="fw-bold text-secondary">Experience the Power of AI</h2>
        <p className="mb-4 muted">
          Our AI-driven platform provides personalized recommendations,
          predictive analytics, and "What-If" scenarios to help you make smarter
          decisions about cars.
        </p>
        <div className="row justify-content-center">
          {[
            {
              icon: <FaLightbulb className="fa-3x mb-3 text-primary" />,
              title: 'Personalized Suggestions',
              description:
                'Get tailored car recommendations based on your preferences and budget.',
            },
            {
              icon: <FaChartLine className="fa-3x mb-3 text-primary" />,
              title: 'Predictive Analytics',
              description:
                'Analyze market trends and predict future car values with AI-powered insights.',
            },
            {
              icon: <FaQuestionCircle className="fa-3x mb-3 text-primary" />,
              title: '"What-If" Scenarios',
              description:
                'Simulate different scenarios to understand the impact of mileage, accidents, and more on car value.',
            },
          ].map((feature, index) => (
            <div key={index} className="col-md-4 col-sm-6 mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Body className="d-flex flex-column align-items-center">
                  {feature.icon}
                  <h5 className="card-title fw-bold">{feature.title}</h5>
                  <p className="card-text muted">{feature.description}</p>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;

