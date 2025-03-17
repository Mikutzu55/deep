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
} from 'react-icons/fa';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import axios from 'axios'; // Ensure axios is imported

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const Home = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [subscriptionType, setSubscriptionType] = useState('premium'); // 'premium' or 'business'
  const [membership, setMembership] = useState('free'); // Default to free membership

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

    return () => unsubscribe(); // Cleanup the listener on component unmount
  }, [auth, db]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setError('Please enter a valid VIN.');
      return;
    }
    if (searchTerm.length !== 17) {
      setError('VIN must be 17 characters long.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      let response;
      let apiType = 'nhtsa'; // Default to NHTSA API for free users or unauthenticated users

      // Check if the user is logged in
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        const userData = userDoc.data();
        if (
          userData &&
          (userData.membership === 'premium' ||
            userData.membership === 'business')
        ) {
          apiType = 'clearvin'; // Use ClearVIN API for paid members
        }
        console.log('User Membership:', userData.membership); // Debugging line
      }

      console.log('API Type:', apiType); // Debugging line

      if (apiType === 'nhtsa') {
        // Use NHTSA API for free users or unauthenticated users
        response = await axios.get(
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
          navigate('/garage', { state: { vehicle: vehicleData } });
        } else {
          setError('No data found for this VIN.');
        }
      } else if (apiType === 'clearvin') {
        // Use ClearVIN API for paid members
        response = await axios.get(
          `http://localhost:5000/api/clearvin?vin=${searchTerm}`
        );
        console.log('ClearVIN API Response:', response.data); // Debugging line
        if (response.data.status === 'ok') {
          const clearVinData = response.data.result.vinSpec;
          const vehicleData = {
            make: clearVinData.make || 'N/A',
            model: clearVinData.model || 'N/A',
            year: clearVinData.year || 'N/A',
            vin: searchTerm,
            registrationStatus: 'Active',
            mileage: 0,
            specifications: {
              make: clearVinData.make || 'N/A',
              model: clearVinData.model || 'N/A',
              year: clearVinData.year || 'N/A',
              trim: clearVinData.trim || 'N/A',
              madeIn: clearVinData.madeIn || 'N/A',
              engine: clearVinData.engine || 'N/A',
              style: clearVinData.style || 'N/A',
              invoicePrice: clearVinData.invoice || 'N/A',
              msrp: clearVinData.msrp || 'N/A',
            },
            titleRecords: response.data.result.titleRecords || [],
            junkSalvageRecords: response.data.result.junkSalvageRecords || [],
            saleRecords: response.data.result.saleRecords || [],
            problemChecks: {
              floodDamage: clearVinData.floodDamage || 'No problems found!',
              fireDamage: clearVinData.fireDamage || 'No problems found!',
              hailDamage: clearVinData.hailDamage || 'No problems found!',
              saltWaterDamage:
                clearVinData.saltWaterDamage || 'No problems found!',
              vandalism: clearVinData.vandalism || 'No problems found!',
              rebuilt: clearVinData.rebuilt || 'No problems found!',
              salvageDamage: clearVinData.salvageDamage || 'No problems found!',
            },
            recalls: response.data.result.recalls
              ? response.data.result.recalls.map((recall) => ({
                  summary: recall.Summary || 'No summary available',
                  component: recall.Component || 'No component specified',
                  consequence: recall.Consequence || 'No consequence specified',
                  remedy: recall.Remedy || 'No remedy specified',
                  notes: recall.Notes || 'No notes available',
                  manufacturer:
                    recall.Manufacturer || 'No manufacturer specified',
                  reportReceivedDate:
                    recall.ReportReceivedDate || 'No date specified',
                  nhtsaCampaignNumber:
                    recall.NHTSACampaignNumber ||
                    'No campaign number specified',
                }))
              : [],
            emissionSafetyInspections:
              response.data.result.emissionSafetyInspections || [],
            accidentDamageHistory:
              response.data.result.accidentDamageHistory || [],
            lienImpoundRecords: response.data.result.lienImpoundRecords || [],
          };
          navigate('/garage', { state: { vehicle: vehicleData } });
        } else {
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

  const plans = {
    premium: [
      {
        id: 1,
        name: 'Starter',
        price: 11.95,
        searches: 1,
        features: ['1 VIN search', 'Basic vehicle details', 'Email support'],
        bestValue: false,
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
      },
      {
        id: 5,
        name: 'Enterprise',
        price: 374.99,
        searches: 50,
        features: ['50 VIN searches', 'API access', '24/7 priority support'],
        bestValue: true,
      },
      {
        id: 6,
        name: 'Corporate',
        price: 589.99,
        searches: 100,
        features: ['100 VIN searches', 'API access', 'Custom integrations'],
        bestValue: false,
      },
    ],
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <div className="hero-section text-center py-5">
        <h1 className="display-4 fw-bold text-primary">
          Welcome to My Car Website!
        </h1>
        <p className="lead text-muted">
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
              onChange={(e) => setSearchTerm(e.target.value.toUpperCase())} // Ensure VIN is uppercase
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
              aria-label="Search for vehicle details"
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.boxShadow = '0 4px 8px rgba(0, 123, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = 'none';
              }}
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
        {/* Display Error Message */}
        {error && <p className="text-danger mt-3">{error}</p>}
      </div>
      {/* Pricing Section */}
      <div className="pricing-section text-center py-5">
        <h2 className="fw-bold text-secondary">Choose Your Plan</h2>
        <div className="text-center mb-4">
          <Form>
            <Form.Check
              type="switch"
              id="subscription-toggle"
              label={
                subscriptionType === 'premium' ? (
                  <span>
                    <FaStar className="me-2" /> Premium Plans
                  </span>
                ) : (
                  <span>
                    <FaBriefcase className="me-2" /> Business Plans
                  </span>
                )
              }
              checked={subscriptionType === 'business'}
              onChange={() =>
                setSubscriptionType(
                  subscriptionType === 'premium' ? 'business' : 'premium'
                )
              }
            />
          </Form>
        </div>
        <div className="row justify-content-center">
          {plans[subscriptionType].map((plan) => (
            <div key={plan.id} className="col-md-4 mb-4">
              <Card className="h-100 shadow-sm">
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
                      <small className="text-muted fs-6">/month</small>
                    </h2>
                    <p className="text-muted mb-4">
                      {plan.searches} VIN search{plan.searches > 1 ? 'es' : ''}
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
                    variant={plan.bestValue ? 'primary' : 'outline-primary'}
                    className="mt-auto"
                  >
                    Get Started
                  </Button>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      </div>
      {/* Why Use Our Website Section */}
      <div className="why-section text-center py-5">
        <h2 className="fw-bold text-secondary">Why Use Our Website?</h2>
        <p className="mb-4 text-muted">
          Discover the key features that make us your go-to platform for vehicle
          information.
        </p>
        <div className="row justify-content-center">
          {/* Feature Cards */}
          {[
            {
              icon: <FaCarCrash className="fa-3x mb-3 text-primary" />,
              title: 'Accident History',
              description:
                'Check if the vehicle has been involved in any accidents.',
            },
            {
              icon: <FaIdCard className="fa-3x mb-3 text-primary" />,
              title: 'Ownership Records',
              description:
                'View the complete ownership history of the vehicle.',
            },
            {
              icon: <FaDollarSign className="fa-3x mb-3 text-primary" />,
              title: 'Market Value Estimation',
              description: 'Get an estimated market value for the vehicle.',
            },
            {
              icon: <FaBrain className="fa-3x mb-3 text-primary" />,
              title: 'AI-Powered Recommendations',
              description: 'Get personalized car suggestions and insights.',
            },
          ].map((feature, index) => (
            <div key={index} className="col-md-3 col-sm-6 mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Body className="d-flex flex-column align-items-center">
                  {feature.icon}
                  <h5 className="card-title fw-bold">{feature.title}</h5>
                  <p className="card-text text-muted">{feature.description}</p>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      </div>
      {/* AI Section */}
      <div className="ai-section text-center py-5">
        <h2 className="fw-bold text-secondary">Experience the Power of AI</h2>
        <p className="mb-4 text-muted">
          Our AI-driven platform provides personalized recommendations,
          predictive analytics, and "What-If" scenarios to help you make smarter
          decisions about cars.
        </p>
        <div className="row justify-content-center">
          {/* AI Feature Cards */}
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
                  <p className="card-text text-muted">{feature.description}</p>
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

