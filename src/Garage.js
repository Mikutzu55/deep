import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Button,
  Card,
  Container,
  Row,
  Col,
  Spinner,
  Alert,
  Modal,
  Accordion,
  Form,
  Badge,
  Collapse,
  OverlayTrigger,
  Tooltip,
} from 'react-bootstrap';
import {
  FaCar,
  FaTrash,
  FaInfoCircle,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaPlus,
  FaDownload,
  FaEnvelope,
  FaCheckCircle,
  FaExclamationCircle,
  FaTachometerAlt,
  FaUser,
  FaCalendarAlt,
  FaWrench,
  FaCarCrash,
  FaFile,
  FaChartLine,
  FaLock,
  FaArrowRight,
  FaHistory,
  FaSearch,
  FaCarSide,
  FaTag,
  FaCogs,
  FaMapMarkerAlt,
  FaGasPump,
  FaRoad,
  FaDollarSign,
  FaBolt,
} from 'react-icons/fa';
import { Line, Radar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  Filler, // Add this import
} from 'chart.js';
import './styles.css';
import jsPDF from 'jspdf'; // For PDF generation
import emailjs from 'emailjs-com'; // For sending emails
import axios from 'axios'; // For API calls

// Register Chart.js components including Filler
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  Filler // Add this registration
);

// Initialize EmailJS with your User ID
emailjs.init('1y9guBsGcLO0pgE-Q'); // Replace with your EmailJS User ID

// Enhanced Data for Mileage Over Time graph
const mileageData = (vehicle) => ({
  labels: vehicle?.titleRecords?.map((record) => record.date) || [],
  datasets: [
    {
      label: 'Mileage Over Time',
      data: vehicle?.titleRecords?.map((record) => record.mileage) || [],
      borderColor: 'rgba(0, 200, 255, 1)',
      backgroundColor: 'rgba(0, 200, 255, 0.2)',
      borderWidth: 2,
      pointBackgroundColor: 'rgba(0, 200, 255, 1)',
      pointBorderColor: '#fff',
      pointHoverRadius: 6,
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(0, 200, 255, 1)',
      tension: 0.4,
      fill: true,
    },
  ],
});

// Enhanced options for mileage chart
const mileageOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        boxWidth: 20,
        font: {
          size: 12,
          weight: 'bold',
        },
        color: '#333',
      },
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleFont: { weight: 'bold' },
      bodyFont: { size: 13 },
      padding: 10,
      displayColors: true,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: '#666',
        font: {
          size: 10,
        },
      },
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(200, 200, 200, 0.2)',
      },
      ticks: {
        color: '#666',
        font: {
          size: 10,
        },
      },
    },
  },
};

// Enhanced Data for Problem Checks radar chart
const problemChecksData = (vehicle) => {
  const problemTypes = Object.keys(vehicle?.problemChecks || {});
  const problemValues = Object.values(vehicle?.problemChecks || {}).map(
    (val) => (val === 'No problems found!' ? 0 : 1)
  );

  // Count problems found vs no problems
  const problemsFound = problemValues.filter((v) => v === 1).length;
  const noProblems = problemValues.filter((v) => v === 0).length;

  return {
    labels: ['Problems Found', 'No Issues'],
    datasets: [
      {
        data: [problemsFound, noProblems],
        backgroundColor: ['rgba(255, 99, 132, 0.7)', 'rgba(75, 192, 192, 0.7)'],
        borderColor: ['rgba(255, 99, 132, 1)', 'rgba(75, 192, 192, 1)'],
        borderWidth: 1,
        hoverOffset: 4,
      },
    ],
  };
};

// Enhanced options for problems chart
const problemOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        font: {
          size: 12,
        },
        color: '#333',
      },
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleFont: { weight: 'bold' },
      bodyFont: { size: 13 },
      padding: 10,
    },
  },
  cutout: '60%',
};

const Garage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null); // For lightbox
  const [showModal, setShowModal] = useState(false); // For lightbox
  const [compareMode, setCompareMode] = useState(false); // For compare mode
  const [selectedForCompare, setSelectedForCompare] = useState([]); // Cars selected for comparison
  const [showSearchBar, setShowSearchBar] = useState(false); // For search bar visibility
  const [searchLoading, setSearchLoading] = useState(false); // For search bar loading state
  const [searchError, setSearchError] = useState(''); // For search bar errors
  const [userRole, setUserRole] = useState('free'); // Track user role
  const [searchLimit, setSearchLimit] = useState(0); // Search limit for the user
  const [searchesUsed, setSearchesUsed] = useState(0); // Searches used by the user
  const [vin, setVin] = useState(''); // For VIN input
  const [activeTab, setActiveTab] = useState('0'); // For tracking active accordion tab

  // Fetch garage data and user role on component mount
  useEffect(() => {
    const fetchGarageData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setVehicles(userData.garage || []);
          setUserRole(userData.membership || 'free');
          setSearchLimit(userData.searchLimit || 0);
          setSearchesUsed(userData.searchesUsed || 0);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching garage data:', err);
        setError('Failed to load garage data.');
        setLoading(false);
      }
    };
    fetchGarageData();
  }, []);

  // Add a new vehicle if it doesn't already exist
  useEffect(() => {
    if (location.state?.vehicle) {
      const handleAddVehicle = async () => {
        try {
          const vehicleToAdd = location.state.vehicle;
          navigate('/garage', { replace: true, state: null });

          const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          const currentVehicles = userDoc.data()?.garage || [];
          const vehicleExists = currentVehicles.some(
            (v) => v.vin === vehicleToAdd.vin
          );

          if (vehicleExists) {
            setError('This vehicle is already in your garage.');
            return;
          }

          if (currentVehicles.length >= 20) {
            setError('Maximum of 20 cars allowed in the garage.');
            return;
          }

          await updateDoc(doc(db, 'users', auth.currentUser.uid), {
            garage: arrayUnion(vehicleToAdd),
          });

          setVehicles([...currentVehicles, vehicleToAdd]); // Update local state immediately
          setError('');
        } catch (err) {
          console.error('Error updating garage:', err);
          setError('Failed to update garage.');
        }
      };

      handleAddVehicle();
    }
  }, [location.state, navigate]);

  // Handle VIN search from the search bar
  const handleVINSearch = async (vinToSearch) => {
    // Validate VIN input
    if (!vinToSearch.trim()) {
      setSearchError('Please enter a valid VIN.');
      return;
    }
    if (vinToSearch.length !== 17) {
      setSearchError('VIN must be 17 characters long.');
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

  // Handle removing a vehicle
  const handleRemoveVehicle = async (index) => {
    try {
      const updatedVehicles = vehicles.filter((_, i) => i !== index);
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        garage: updatedVehicles,
      });
      setVehicles(updatedVehicles);
      setError('');
    } catch (err) {
      setError('Failed to remove vehicle.');
    }
  };

  // Lightbox for car details
  const handleShowModal = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowModal(true);
    setActiveTab('0'); // Reset to first tab when opening
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedVehicle(null);
    setActiveTab('0'); // Reset active tab when closing modal
  };

  // Quick check navigation - go to specific tab when clicking on quick check items
  const navigateToSection = (eventKey) => {
    setActiveTab(eventKey);
  };

  // Social media sharing
  const handleShare = (platform, vehicle) => {
    const shareText = `Check out my ${vehicle.make} ${vehicle.model} (${vehicle.year})!`;
    const shareUrl = window.location.href;
    switch (platform) {
      case 'facebook':
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
          '_blank'
        );
        break;
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
          '_blank'
        );
        break;
      case 'instagram':
        // Instagram doesn't support direct sharing, so we open the URL in a new tab
        window.open(shareUrl, '_blank');
        break;
      default:
        break;
    }
  };

  // Toggle compare mode
  const toggleCompareMode = () => {
    setCompareMode(!compareMode);
    setSelectedForCompare([]); // Reset selected cars when toggling compare mode
  };

  // Handle car selection for comparison
  const handleCompareSelection = (vehicle) => {
    if (selectedForCompare.includes(vehicle)) {
      setSelectedForCompare(selectedForCompare.filter((v) => v !== vehicle));
    } else {
      setSelectedForCompare([...selectedForCompare, vehicle]);
    }
  };

  // Generate and download PDF
  const handleDownloadPDF = (vehicle) => {
    const doc = new jsPDF();
    doc.text(
      `Vehicle Details: ${vehicle.make} ${vehicle.model} (${vehicle.year})`,
      10,
      10
    );
    doc.text(`VIN: ${vehicle.vin}`, 10, 20);
    doc.text(`Registration Status: ${vehicle.registrationStatus}`, 10, 30);
    // Add Recalls
    doc.text('Recalls:', 10, 40);
    vehicle.recalls.forEach((recall, index) => {
      doc.text(`Recall ${index + 1}: ${recall.summary}`, 15, 50 + index * 10);
    });
    // Add Emission & Safety Inspection
    doc.text('Emission & Safety Inspection:', 10, 100);
    vehicle.emissionSafetyInspections.forEach((inspection, index) => {
      doc.text(
        `Inspection ${index + 1}: ${inspection.result}`,
        15,
        110 + index * 10
      );
    });
    // Add Accident & Damage History
    doc.text('Accident & Damage History:', 10, 150);
    vehicle.accidentDamageHistory.forEach((accident, index) => {
      doc.text(
        `Accident ${index + 1}: ${accident.impact}`,
        15,
        160 + index * 10
      );
    });
    // Add Lien & Impound Records
    doc.text('Lien & Impound Records:', 10, 200);
    vehicle.lienImpoundRecords.forEach((record, index) => {
      doc.text(`Record ${index + 1}: ${record.event}`, 15, 210 + index * 10);
    });
    doc.save(`${vehicle.make}_${vehicle.model}_${vehicle.year}.pdf`);
  };

  // Send PDF via email
  const handleEmailPDF = (vehicle) => {
    const templateParams = {
      to_email: auth.currentUser.email,
      subject: `Vehicle Details: ${vehicle.make} ${vehicle.model} (${vehicle.year})`,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      vin: vehicle.vin,
    };
    emailjs
      .send('service_4divxql', 'template_8ozxsxi', templateParams)
      .then((response) => {
        console.log('Email sent successfully!', response.status, response.text);
        alert('Email sent successfully!');
      })
      .catch((err) => {
        console.error('Failed to send email:', err);
        alert('Failed to send email. Please try again.');
      });
  };

  // Helper function to calculate vehicle age
  const calculateVehicleAge = (year) => {
    const currentYear = new Date().getFullYear();
    return currentYear - parseInt(year);
  };

  // Helper function to check if the car has any damage
  const hasDamage = (problemChecks) => {
    return Object.values(problemChecks || {}).some(
      (val) => val !== 'No problems found!'
    );
  };

  // Handle "See Full Record" button click for free users
  const handleSeeFullRecord = async () => {
    if (userRole === 'free') {
      // Redirect to payment page or perform a paid search
      alert('You are being redirected to purchase a full record.');
      // Example: navigate to a payment page
      navigate('/checkout', { state: { vin: selectedVehicle.vin } });
    }
  };

  // Get a summary of the most critical car data
  const getVehicleHealthStatus = (vehicle) => {
    if (!vehicle) return { status: 'unknown', message: 'No data available' };

    const hasDamageReport = hasDamage(vehicle.problemChecks);
    const hasRecalls = vehicle.recalls && vehicle.recalls.length > 0;

    if (hasDamageReport) {
      return {
        status: 'danger',
        message: 'Damage reported',
        icon: <FaExclamationCircle />,
      };
    } else if (hasRecalls) {
      return {
        status: 'warning',
        message: 'Recalls found',
        icon: <FaExclamationCircle />,
      };
    } else {
      return {
        status: 'success',
        message: 'No issues detected',
        icon: <FaCheckCircle />,
      };
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner
          animation="border"
          role="status"
          className="text-primary"
          style={{ width: '3rem', height: '3rem' }}
        >
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3 text-primary fw-bold">Loading your garage...</p>
      </div>
    );
  }

  return (
    <Container className="mt-5 pt-5">
      <h2 className="text-center mb-4 fw-bold text-primary">
        <FaCar className="me-2" /> My Garage
      </h2>
      {error && <Alert variant="danger">{error}</Alert>}

      {/* Add VIN Button and Search Bar */}
      <div className="text-center mb-4">
        <Button
          variant="primary"
          onClick={() => setShowSearchBar(!showSearchBar)}
          className="btn-modern"
          aria-expanded={showSearchBar}
        >
          <FaPlus className="me-2" /> Add Another VIN
        </Button>
        <Collapse in={showSearchBar}>
          <div className="mt-3">
            <Form
              onSubmit={(e) => {
                e.preventDefault();
                handleVINSearch(vin);
              }}
            >
              <div className="input-group">
                <Form.Control
                  type="text"
                  placeholder="Enter VIN (17 characters)"
                  aria-label="Enter VIN"
                  value={vin}
                  onChange={(e) => {
                    if (e.target.value.length <= 17) {
                      setVin(e.target.value.toUpperCase());
                    }
                  }}
                  required
                  maxLength={17}
                  className="search-input"
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
                    e.target.style.boxShadow =
                      '0 4px 8px rgba(0, 123, 255, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <Button
                  variant="primary"
                  type="submit"
                  disabled={searchLoading}
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
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow =
                      '0 4px 8px rgba(0, 123, 255, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  {searchLoading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Searching...
                    </>
                  ) : (
                    <>
                      <FaSearch className="me-2" /> Search
                    </>
                  )}
                </Button>
              </div>
              {userRole !== 'free' && (
                <div className="mt-2 text-end">
                  <small className="text-muted">
                    Searches used: {searchesUsed}/{searchLimit}
                  </small>
                </div>
              )}
            </Form>
            {searchError && (
              <Alert variant="danger" className="mt-3">
                {searchError}
              </Alert>
            )}
          </div>
        </Collapse>
      </div>

      {/* Compare Mode Toggle */}
      <div className="text-center mb-4">
        <Button
          variant={compareMode ? 'warning' : 'secondary'}
          onClick={toggleCompareMode}
          className="btn-modern"
        >
          {compareMode ? 'Exit Compare Mode' : 'Compare Cars'}
        </Button>
      </div>

      {vehicles.length === 0 ? (
        <div className="text-center my-5 py-5">
          <FaCarSide size={60} className="text-muted mb-3" />
          <p className="text-muted fs-5">
            Your garage is empty. Add vehicles to get started!
          </p>
        </div>
      ) : (
        <Row>
          {vehicles.map((vehicle, index) => (
            <Col key={index} md={6} lg={4} className="mb-4">
              <Card
                className="h-100 shadow-sm vehicle-card"
                style={{
                  border: 'none',
                  borderRadius: '15px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                }}
                onClick={() => !compareMode && handleShowModal(vehicle)}
              >
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold mb-0">
                      {vehicle.make} {vehicle.model} ({vehicle.year})
                    </h5>
                    <Button
                      variant="danger"
                      size="sm"
                      className="rounded-circle"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveVehicle(index);
                      }}
                      aria-label="Remove vehicle"
                    >
                      <FaTrash />
                    </Button>
                  </div>
                  <p className="text-muted mb-2">
                    <span className="badge bg-light text-dark me-2">VIN:</span>
                    {vehicle.vin}
                  </p>

                  {/* Vehicle Health Status Badge */}
                  <div className="d-flex align-items-center mb-3">
                    <Badge
                      bg={getVehicleHealthStatus(vehicle).status}
                      className="d-flex align-items-center py-2 px-3"
                    >
                      {getVehicleHealthStatus(vehicle).icon}
                      <span className="ms-2">
                        {getVehicleHealthStatus(vehicle).message}
                      </span>
                    </Badge>
                  </div>

                  {/* Compare Mode Checkbox */}
                  {compareMode && (
                    <Form.Check
                      type="checkbox"
                      label="Select for comparison"
                      checked={selectedForCompare.includes(vehicle)}
                      onChange={() => handleCompareSelection(vehicle)}
                      className="mt-2"
                    />
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Compare Selected Cars */}
      {compareMode && selectedForCompare.length > 1 && (
        <div className="text-center mt-4">
          <Button
            variant="success"
            onClick={() =>
              navigate('/compare', { state: { vehicles: selectedForCompare } })
            }
            className="btn-modern"
          >
            <FaChartLine className="me-2" />
            Compare Selected Cars
          </Button>
        </div>
      )}

      {/* Lightbox Modal */}
      <Modal
        show={showModal}
        onHide={handleCloseModal}
        centered
        size="lg"
        scrollable
        className="vehicle-modal"
        backdrop="static"
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="d-flex align-items-center">
            <FaCarSide className="text-primary me-2" />
            {selectedVehicle?.make} {selectedVehicle?.model} (
            {selectedVehicle?.year})
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="pt-0">
          {/* Hero Banner for Vehicle */}
          <div
            className="vehicle-hero-banner mb-4 text-white d-flex flex-column justify-content-end"
            style={{
              height: '200px',
              background: 'linear-gradient(135deg, #00c6ff, #0072ff)',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              className="position-absolute w-100 h-100"
              style={{
                top: 0,
                left: 0,
                background:
                  'url("https://via.placeholder.com/800x400?text=Car+Image") center/cover no-repeat',
                opacity: 0.3,
              }}
            />
            <div className="position-relative">
              <h3 className="mb-1 fw-bold">
                {selectedVehicle?.year} {selectedVehicle?.make}{' '}
                {selectedVehicle?.model}
              </h3>
              <p className="mb-0">VIN: {selectedVehicle?.vin}</p>
            </div>
          </div>

          {/* Quick Check Section with Interactive Elements */}
          <div
            className="quick-check-section p-3 mb-4 rounded"
            style={{ background: 'rgba(0,123,255,0.05)' }}
          >
            <h5 className="mb-3 d-flex align-items-center">
              <FaCheckCircle className="text-primary me-2" /> Quick Check
            </h5>
            <Row>
              <Col md={6} className="mb-3">
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Click to see odometer details</Tooltip>}
                >
                  <div
                    className="d-flex align-items-center p-2 rounded quick-check-item"
                    onClick={() => navigateToSection('5')}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="quick-check-icon">
                      <FaTachometerAlt className="text-primary" size={20} />
                    </div>
                    <div className="ms-3">
                      <div className="text-muted small">Odometer</div>
                      <div className="fw-bold">
                        {selectedVehicle?.titleRecords?.[0]?.mileage || 'N/A'}
                        {' miles'}
                      </div>
                    </div>
                  </div>
                </OverlayTrigger>
              </Col>

              <Col md={6} className="mb-3">
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Click to see ownership history</Tooltip>}
                >
                  <div
                    className="d-flex align-items-center p-2 rounded quick-check-item"
                    onClick={() => navigateToSection('5')}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="quick-check-icon">
                      <FaUser className="text-primary" size={20} />
                    </div>
                    <div className="ms-3">
                      <div className="text-muted small">Owners</div>
                      <div className="fw-bold">
                        {selectedVehicle?.titleRecords?.length || '1'}
                      </div>
                    </div>
                  </div>
                </OverlayTrigger>
              </Col>

              <Col md={6} className="mb-3">
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Click to see vehicle age details</Tooltip>}
                >
                  <div
                    className="d-flex align-items-center p-2 rounded quick-check-item"
                    onClick={() => navigateToSection('1')}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="quick-check-icon">
                      <FaCalendarAlt className="text-primary" size={20} />
                    </div>
                    <div className="ms-3">
                      <div className="text-muted small">Vehicle Age</div>
                      <div className="fw-bold">
                        {calculateVehicleAge(selectedVehicle?.year)} years
                      </div>
                    </div>
                  </div>
                </OverlayTrigger>
              </Col>

              <Col md={6} className="mb-3">
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Click to see inspection history</Tooltip>}
                >
                  <div
                    className="d-flex align-items-center p-2 rounded quick-check-item"
                    onClick={() => navigateToSection('10')}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="quick-check-icon">
                      <FaWrench className="text-primary" size={20} />
                    </div>
                    <div className="ms-3">
                      <div className="text-muted small">Last Inspection</div>
                      <div className="fw-bold">
                        {selectedVehicle?.emissionSafetyInspections?.[0]
                          ?.date || 'N/A'}
                      </div>
                    </div>
                  </div>
                </OverlayTrigger>
              </Col>

              <Col md={6} className="mb-3">
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Click to see damage history</Tooltip>}
                >
                  <div
                    className="d-flex align-items-center p-2 rounded quick-check-item"
                    onClick={() => navigateToSection('2')}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="quick-check-icon">
                      <FaCarCrash className="text-primary" size={20} />
                    </div>
                    <div className="ms-3">
                      <div className="text-muted small">Damage</div>
                      <div className="fw-bold">
                        <Badge
                          bg={
                            hasDamage(selectedVehicle?.problemChecks)
                              ? 'danger'
                              : 'success'
                          }
                        >
                          {hasDamage(selectedVehicle?.problemChecks)
                            ? 'Yes'
                            : 'No'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </OverlayTrigger>
              </Col>

              <Col md={6} className="mb-3">
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Click to see recall information</Tooltip>}
                >
                  <div
                    className="d-flex align-items-center p-2 rounded quick-check-item"
                    onClick={() => navigateToSection('4')}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="quick-check-icon">
                      <FaBolt className="text-primary" size={20} />
                    </div>
                    <div className="ms-3">
                      <div className="text-muted small">Recalls</div>
                      <div className="fw-bold">
                        <Badge
                          bg={
                            selectedVehicle?.recalls?.length > 0
                              ? 'warning'
                              : 'success'
                          }
                        >
                          {selectedVehicle?.recalls?.length || 0}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </OverlayTrigger>
              </Col>
            </Row>
          </div>

          {/* Detailed Vehicle Information Accordion */}
          <Accordion
            activeKey={activeTab}
            onSelect={(key) => setActiveTab(key)}
          >
            <Accordion.Item eventKey="0">
              <Accordion.Header>
                <FaCheckCircle className="me-2 text-success" /> Overview
              </Accordion.Header>
              <Accordion.Body>
                <div className="row">
                  <div className="col-md-7">
                    <h6 className="mb-3">Vehicle Summary</h6>
                    <ul className="list-unstyled">
                      <li className="mb-2">
                        <span className="text-muted me-2">
                          <FaCar />
                        </span>
                        <strong>Make & Model:</strong> {selectedVehicle?.make}{' '}
                        {selectedVehicle?.model}
                      </li>
                      <li className="mb-2">
                        <span className="text-muted me-2">
                          <FaCalendarAlt />
                        </span>
                        <strong>Year:</strong> {selectedVehicle?.year}
                      </li>
                      <li className="mb-2">
                        <span className="text-muted me-2">
                          <FaCogs />
                        </span>
                        <strong>Engine:</strong>{' '}
                        {selectedVehicle?.specifications?.engine || 'N/A'}
                      </li>
                      <li className="mb-2">
                        <span className="text-muted me-2">
                          <FaTag />
                        </span>
                        <strong>Style:</strong>{' '}
                        {selectedVehicle?.specifications?.style || 'N/A'}
                      </li>
                    </ul>
                  </div>
                  <div className="col-md-5">
                    <div
                      className="health-status-card p-3 rounded"
                      style={{
                        background:
                          getVehicleHealthStatus(selectedVehicle).status ===
                          'success'
                            ? 'linear-gradient(120deg, #84fab0, #8fd3f4)'
                            : getVehicleHealthStatus(selectedVehicle).status ===
                                'warning'
                              ? 'linear-gradient(120deg, #f6d365, #fda085)'
                              : 'linear-gradient(120deg, #ff9a9e, #fad0c4)',
                        color: '#fff',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                      }}
                    >
                      <h6 className="mb-3 fw-bold">Health Status</h6>
                      <div className="d-flex align-items-center">
                        <div style={{ fontSize: '2rem' }}>
                          {getVehicleHealthStatus(selectedVehicle).icon}
                        </div>
                        <div className="ms-3">
                          <h5 className="mb-1">
                            {getVehicleHealthStatus(selectedVehicle).message}
                          </h5>
                          <p className="mb-0 small">
                            {getVehicleHealthStatus(selectedVehicle).status ===
                            'success'
                              ? 'This vehicle appears to be in good condition based on available records.'
                              : getVehicleHealthStatus(selectedVehicle)
                                    .status === 'warning'
                                ? 'This vehicle has recalls that require attention.'
                                : 'This vehicle has damage records that may affect its value.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Accordion.Body>
            </Accordion.Item>

            {/* Vehicle Specifications */}
            <Accordion.Item eventKey="1">
              <Accordion.Header>
                <FaInfoCircle className="me-2 text-primary" /> Vehicle
                Specifications
              </Accordion.Header>
              <Accordion.Body>
                <Row>
                  <Col md={6}>
                    <ul className="list-unstyled">
                      <li className="mb-2">
                        <span className="text-muted me-2">
                          <FaCar />
                        </span>
                        <strong>VIN:</strong> {selectedVehicle?.vin}
                      </li>
                      <li className="mb-2">
                        <span className="text-muted me-2">
                          <FaCalendarAlt />
                        </span>
                        <strong>Year:</strong> {selectedVehicle?.year}
                      </li>
                      <li className="mb-2">
                        <span className="text-muted me-2">
                          <FaCarSide />
                        </span>
                        <strong>Make:</strong> {selectedVehicle?.make}
                      </li>
                      <li className="mb-2">
                        <span className="text-muted me-2">
                          <FaCarSide />
                        </span>
                        <strong>Model:</strong> {selectedVehicle?.model}
                      </li>
                      <li className="mb-2">
                        <span className="text-muted me-2">
                          <FaTag />
                        </span>
                        <strong>Trim:</strong>{' '}
                        {selectedVehicle?.specifications?.trim || 'N/A'}
                      </li>
                    </ul>
                  </Col>
                  <Col md={6}>
                    <ul className="list-unstyled">
                      <li className="mb-2">
                        <span className="text-muted me-2">
                          <FaCogs />
                        </span>
                        <strong>Engine:</strong>{' '}
                        {selectedVehicle?.specifications?.engine || 'N/A'}
                      </li>
                      <li className="mb-2">
                        <span className="text-muted me-2">
                          <FaMapMarkerAlt />
                        </span>
                        <strong>Made In:</strong>{' '}
                        {selectedVehicle?.specifications?.madeIn || 'N/A'}
                      </li>
                      <li className="mb-2">
                        <span className="text-muted me-2">
                          <FaGasPump />
                        </span>
                        <strong>Fuel Capacity:</strong>{' '}
                        {selectedVehicle?.specifications?.fuelCapacity || 'N/A'}
                      </li>
                      <li className="mb-2">
                        <span className="text-muted me-2">
                          <FaRoad />
                        </span>
                        <strong>City Mileage:</strong>{' '}
                        {selectedVehicle?.specifications?.cityMileage || 'N/A'}
                      </li>
                      <li className="mb-2">
                        <span className="text-muted me-2">
                          <FaDollarSign />
                        </span>
                        <strong>MSRP:</strong>{' '}
                        {selectedVehicle?.specifications?.msrp || 'N/A'}
                      </li>
                    </ul>
                  </Col>
                </Row>
              </Accordion.Body>
            </Accordion.Item>

            {/* Problem Checks */}
            <Accordion.Item eventKey="2">
              <Accordion.Header>
                <FaExclamationCircle className="me-2 text-danger" /> Problem
                Checks
              </Accordion.Header>
              <Accordion.Body>
                <Row>
                  <Col md={7}>
                    <div className="problems-list">
                      {Object.entries(selectedVehicle?.problemChecks || {}).map(
                        ([key, value], index) => (
                          <div
                            key={index}
                            className={`problem-item d-flex align-items-center mb-2 p-2 rounded ${
                              value !== 'No problems found!'
                                ? 'bg-danger bg-opacity-10'
                                : 'bg-success bg-opacity-10'
                            }`}
                          >
                            {value !== 'No problems found!' ? (
                              <FaExclamationCircle className="text-danger me-2" />
                            ) : (
                              <FaCheckCircle className="text-success me-2" />
                            )}
                            <div>
                              <strong>
                                {key
                                  .replace(/([A-Z])/g, ' $1')
                                  .replace(/^./, (str) => str.toUpperCase())}
                                :
                              </strong>{' '}
                              <span
                                className={
                                  value !== 'No problems found!'
                                    ? 'text-danger'
                                    : 'text-success'
                                }
                              >
                                {value}
                              </span>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </Col>
                  <Col md={5}>
                    <div
                      className="chart-container"
                      style={{ height: '250px' }}
                    >
                      <Doughnut
                        data={problemChecksData(selectedVehicle)}
                        options={problemOptions}
                      />
                    </div>
                  </Col>
                </Row>
              </Accordion.Body>
            </Accordion.Item>

            {/* Graphs */}
            <Accordion.Item eventKey="3">
              <Accordion.Header>
                <FaChartLine className="me-2 text-primary" /> Graphs
              </Accordion.Header>
              <Accordion.Body>
                <div className="mb-4">
                  <h6 className="text-primary mb-3">Mileage Over Time</h6>
                  <div className="chart-container" style={{ height: '250px' }}>
                    <Line
                      data={mileageData(selectedVehicle)}
                      options={mileageOptions}
                    />
                  </div>
                </div>

                <div>
                  <h6 className="text-primary mb-3">Problem Distribution</h6>
                  <div className="chart-container" style={{ height: '250px' }}>
                    <Doughnut
                      data={problemChecksData(selectedVehicle)}
                      options={problemOptions}
                    />
                  </div>
                </div>
              </Accordion.Body>
            </Accordion.Item>

            {/* Recalls */}
            <Accordion.Item eventKey="4">
              <Accordion.Header>
                <FaExclamationCircle className="me-2 text-danger" /> Recalls
              </Accordion.Header>
              <Accordion.Body>
                {selectedVehicle?.recalls?.length > 0 ? (
                  selectedVehicle.recalls.map((recall, index) => (
                    <div
                      key={index}
                      className="recall-item mb-4 p-3 rounded"
                      style={{
                        border: '1px solid rgba(0,0,0,0.1)',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                      }}
                    >
                      <div className="d-flex justify-content-between mb-2">
                        <Badge bg="danger" className="py-2 px-3">
                          Recall #{index + 1}
                        </Badge>
                        <small className="text-muted">
                          {recall.reportReceivedDate}
                        </small>
                      </div>
                      <h6 className="fw-bold">{recall.component}</h6>
                      <p>{recall.summary}</p>
                      <div className="recall-details mt-3">
                        <div className="mb-2">
                          <strong>Consequence:</strong> {recall.consequence}
                        </div>
                        <div className="mb-2">
                          <strong>Remedy:</strong> {recall.remedy}
                        </div>
                        <div>
                          <strong>Campaign #:</strong>{' '}
                          {recall.nhtsaCampaignNumber}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <FaCheckCircle size={40} className="text-success mb-3" />
                    <p>No recalls have been reported for this vehicle.</p>
                  </div>
                )}
              </Accordion.Body>
            </Accordion.Item>

            {/* Additional Fields for Paid Users */}
            {userRole !== 'free' ? (
              <>
                {/* Title Records */}
                <Accordion.Item eventKey="5">
                  <Accordion.Header>
                    <FaFile className="me-2 text-primary" /> Title Records
                  </Accordion.Header>
                  <Accordion.Body>
                    {selectedVehicle?.titleRecords?.length > 0 ? (
                      <div className="timeline-container">
                        {selectedVehicle.titleRecords.map((record, index) => (
                          <div key={index} className="timeline-item">
                            <div className="timeline-marker"></div>
                            <div
                              className="timeline-content p-3 mb-3 rounded"
                              style={{ border: '1px solid rgba(0,0,0,0.1)' }}
                            >
                              <div className="d-flex justify-content-between mb-2">
                                <h6 className="mb-0 fw-bold">{record.date}</h6>
                                <Badge bg="info">{record.state}</Badge>
                              </div>
                              <div className="mb-1">
                                <strong>Status:</strong> {record.status}
                              </div>
                              <div>
                                <strong>Mileage:</strong> {record.mileage} miles
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted">
                        No title records available.
                      </p>
                    )}
                  </Accordion.Body>
                </Accordion.Item>

                {/* Junk / Salvage / Insurance Records */}
                <Accordion.Item eventKey="6">
                  <Accordion.Header>
                    <FaExclamationCircle className="me-2 text-danger" /> Junk /
                    Salvage / Insurance Records
                  </Accordion.Header>
                  <Accordion.Body>
                    {selectedVehicle?.junkSalvageRecords?.length > 0 ? (
                      selectedVehicle.junkSalvageRecords.map(
                        (record, index) => (
                          <div
                            key={index}
                            className="mb-3 p-3 rounded bg-light"
                          >
                            <div className="d-flex justify-content-between mb-2">
                              <strong>Date:</strong> {record.date}
                              <Badge bg="warning" text="dark">
                                {record.reportingEntity}
                              </Badge>
                            </div>
                            <div>
                              <strong>Details:</strong> {record.details}
                            </div>
                          </div>
                        )
                      )
                    ) : (
                      <div className="text-center py-4">
                        <FaCheckCircle
                          size={40}
                          className="text-success mb-3"
                        />
                        <p>No junk, salvage, or insurance records found.</p>
                      </div>
                    )}
                  </Accordion.Body>
                </Accordion.Item>

                {/* Theft Records */}
                <Accordion.Item eventKey="7">
                  <Accordion.Header>
                    <FaExclamationCircle className="me-2 text-danger" /> Theft
                    Records
                  </Accordion.Header>
                  <Accordion.Body>
                    {selectedVehicle?.theftRecords?.length > 0 ? (
                      selectedVehicle?.theftRecords?.map((record, index) => (
                        <div key={index} className="mb-3 p-3 rounded bg-light">
                          <div className="d-flex justify-content-between mb-2">
                            <strong>Date:</strong> {record.date}
                            <Badge bg="danger">{record.status}</Badge>
                          </div>
                          <div>
                            <strong>Details:</strong> {record.details}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <FaCheckCircle
                          size={40}
                          className="text-success mb-3"
                        />
                        <p>No theft or theft recovery records found!</p>
                      </div>
                    )}
                  </Accordion.Body>
                </Accordion.Item>

                {/* Lien / Impound / Export Records */}
                <Accordion.Item eventKey="8">
                  <Accordion.Header>
                    <FaExclamationCircle className="me-2 text-danger" /> Lien /
                    Impound / Export Records
                  </Accordion.Header>
                  <Accordion.Body>
                    {selectedVehicle?.lienImpoundExportRecords?.length > 0 ? (
                      selectedVehicle?.lienImpoundExportRecords?.map(
                        (record, index) => (
                          <div
                            key={index}
                            className="mb-3 p-3 rounded bg-light"
                          >
                            <div className="d-flex justify-content-between mb-2">
                              <strong>Date:</strong> {record.date}
                              <Badge bg="warning" text="dark">
                                {record.type}
                              </Badge>
                            </div>
                            <div>
                              <strong>Details:</strong> {record.details}
                            </div>
                          </div>
                        )
                      )
                    ) : (
                      <div className="text-center py-4">
                        <FaCheckCircle
                          size={40}
                          className="text-success mb-3"
                        />
                        <p>No lien, impound, or export records found!</p>
                      </div>
                    )}
                  </Accordion.Body>
                </Accordion.Item>

                {/* Sale Records */}
                <Accordion.Item eventKey="9">
                  <Accordion.Header>
                    <FaFile className="me-2 text-primary" /> Sale Records
                  </Accordion.Header>
                  <Accordion.Body>
                    {selectedVehicle?.saleRecords?.length > 0 ? (
                      <div className="timeline-container">
                        {selectedVehicle?.saleRecords?.map((record, index) => (
                          <div key={index} className="timeline-item">
                            <div className="timeline-marker"></div>
                            <div
                              className="timeline-content p-3 mb-3 rounded"
                              style={{ border: '1px solid rgba(0,0,0,0.1)' }}
                            >
                              <div className="d-flex justify-content-between mb-2">
                                <h6 className="mb-0 fw-bold">{record.date}</h6>
                                <Badge bg="success">${record.price}</Badge>
                              </div>
                              <div className="row">
                                <div className="col-sm-6 mb-1">
                                  <strong>Seller:</strong> {record.seller}
                                </div>
                                <div className="col-sm-6 mb-1">
                                  <strong>Mileage:</strong> {record.mileage}{' '}
                                  miles
                                </div>
                              </div>
                              <div>
                                <strong>Color:</strong> {record.color}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted">
                        No sale records available.
                      </p>
                    )}
                  </Accordion.Body>
                </Accordion.Item>

                {/* Emission & Safety Inspection */}
                <Accordion.Item eventKey="10">
                  <Accordion.Header>
                    <FaCheckCircle className="me-2 text-success" /> Emission &
                    Safety Inspection
                  </Accordion.Header>
                  <Accordion.Body>
                    {selectedVehicle?.emissionSafetyInspections?.length > 0 ? (
                      selectedVehicle.emissionSafetyInspections.map(
                        (inspection, index) => (
                          <div
                            key={index}
                            className="mb-3 p-3 rounded"
                            style={{
                              border: '1px solid rgba(0,0,0,0.1)',
                              background: inspection.result
                                .toLowerCase()
                                .includes('pass')
                                ? 'rgba(40, 167, 69, 0.05)'
                                : 'rgba(220, 53, 69, 0.05)',
                            }}
                          >
                            <div className="d-flex justify-content-between mb-2">
                              <strong>Date:</strong> {inspection.date}
                              <Badge
                                bg={
                                  inspection.result
                                    .toLowerCase()
                                    .includes('pass')
                                    ? 'success'
                                    : 'danger'
                                }
                              >
                                {inspection.result}
                              </Badge>
                            </div>
                            <div className="mb-2">
                              <strong>Location:</strong> {inspection.location}
                            </div>
                          </div>
                        )
                      )
                    ) : (
                      <div className="text-center py-4">
                        <FaExclamationCircle
                          size={40}
                          className="text-warning mb-3"
                        />
                        <p>
                          No emission or safety inspection records available.
                        </p>
                      </div>
                    )}
                  </Accordion.Body>
                </Accordion.Item>

                {/* Accident & Damage History */}
                <Accordion.Item eventKey="11">
                  <Accordion.Header>
                    <FaCarCrash className="me-2 text-danger" /> Accident &
                    Damage History
                  </Accordion.Header>
                  <Accordion.Body>
                    {selectedVehicle?.accidentDamageHistory?.length > 0 ? (
                      selectedVehicle.accidentDamageHistory.map(
                        (accident, index) => (
                          <div
                            key={index}
                            className="mb-4 p-3 rounded"
                            style={{
                              border: '1px solid rgba(220, 53, 69, 0.2)',
                              background: 'rgba(220, 53, 69, 0.05)',
                            }}
                          >
                            <div className="d-flex justify-content-between mb-3">
                              <Badge bg="danger" className="py-2 px-3">
                                Accident #{index + 1}
                              </Badge>
                              <span className="text-muted">
                                {accident.date}
                              </span>
                            </div>
                            <div className="row mb-3">
                              <div className="col-md-6 mb-2">
                                <div className="d-flex">
                                  <strong className="me-2">Impact:</strong>
                                  <span>{accident.impact}</span>
                                </div>
                              </div>
                              <div className="col-md-6 mb-2">
                                <div className="d-flex">
                                  <strong className="me-2">Airbags:</strong>
                                  <span>{accident.airbags}</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <strong>Repair Cost:</strong>{' '}
                              <span className="badge bg-dark">
                                {accident.repairCost}
                              </span>
                            </div>
                          </div>
                        )
                      )
                    ) : (
                      <div className="text-center py-4">
                        <FaCheckCircle
                          size={40}
                          className="text-success mb-3"
                        />
                        <p>No accident or damage history records found.</p>
                      </div>
                    )}
                  </Accordion.Body>
                </Accordion.Item>

                {/* Lien & Impound Records */}
                <Accordion.Item eventKey="12">
                  <Accordion.Header>
                    <FaExclamationCircle className="me-2 text-danger" /> Lien &
                    Impound Records
                  </Accordion.Header>
                  <Accordion.Body>
                    {selectedVehicle?.lienImpoundRecords?.length > 0 ? (
                      selectedVehicle.lienImpoundRecords.map(
                        (record, index) => (
                          <div
                            key={index}
                            className="mb-3 p-3 rounded"
                            style={{
                              border: '1px solid rgba(0,0,0,0.1)',
                              background: 'rgba(0,0,0,0.02)',
                            }}
                          >
                            <div className="d-flex justify-content-between mb-2">
                              <strong>Date:</strong> {record.date}
                              <Badge bg="warning" text="dark">
                                {record.event}
                              </Badge>
                            </div>
                            <div className="mb-2">
                              <strong>State:</strong> {record.state}
                            </div>
                            <div>
                              <strong>Reported By:</strong> {record.reportedBy}
                            </div>
                          </div>
                        )
                      )
                    ) : (
                      <div className="text-center py-4">
                        <FaCheckCircle
                          size={40}
                          className="text-success mb-3"
                        />
                        <p>No lien or impound records found.</p>
                      </div>
                    )}
                  </Accordion.Body>
                </Accordion.Item>
              </>
            ) : (
              <>
                {/* Placeholder for Paid Fields */}
                <Accordion.Item eventKey="5">
                  <Accordion.Header>
                    <FaLock className="me-2 text-warning" /> Title Records
                  </Accordion.Header>
                  <Accordion.Body>
                    <div className="text-center py-4">
                      <FaLock size={40} className="text-warning mb-3" />
                      <h5>Premium Feature</h5>
                      <p>Unlock the full report to view Title Records.</p>
                      <Button
                        variant="primary"
                        className="mt-2 btn-modern"
                        onClick={handleSeeFullRecord}
                      >
                        <FaArrowRight className="me-2" /> Upgrade Now
                      </Button>
                    </div>
                  </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="6">
                  <Accordion.Header>
                    <FaLock className="me-2 text-warning" /> Theft Records
                  </Accordion.Header>
                  <Accordion.Body>
                    <div className="text-center py-4">
                      <FaLock size={40} className="text-warning mb-3" />
                      <h5>Premium Feature</h5>
                      <p>Unlock the full report to view Theft Records.</p>
                      <Button
                        variant="primary"
                        className="mt-2 btn-modern"
                        onClick={handleSeeFullRecord}
                      >
                        <FaArrowRight className="me-2" /> Upgrade Now
                      </Button>
                    </div>
                  </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="7">
                  <Accordion.Header>
                    <FaLock className="me-2 text-warning" /> Sale Records
                  </Accordion.Header>
                  <Accordion.Body>
                    <div className="text-center py-4">
                      <FaLock size={40} className="text-warning mb-3" />
                      <h5>Premium Feature</h5>
                      <p>Unlock the full report to view Sale Records.</p>
                      <Button
                        variant="primary"
                        className="mt-2 btn-modern"
                        onClick={handleSeeFullRecord}
                      >
                        <FaArrowRight className="me-2" /> Upgrade Now
                      </Button>
                    </div>
                  </Accordion.Body>
                </Accordion.Item>
              </>
            )}
          </Accordion>

          {/* "See Full Record" Button for Free Users */}
          {userRole === 'free' && (
            <div className="text-center mt-4 mb-3">
              <Button
                variant="primary"
                onClick={handleSeeFullRecord}
                className="btn-modern pulse-animation"
                size="lg"
              >
                <FaArrowRight className="me-2" /> Buy 1 Search ($XX.XX)
              </Button>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer className="border-0 pt-0 d-flex justify-content-between">
          {/* Social Media Icons */}
          <div className="social-share-icons d-flex gap-2">
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>Share on Facebook</Tooltip>}
            >
              <Button
                variant="outline-primary"
                className="rounded-circle p-2"
                onClick={() => handleShare('facebook', selectedVehicle)}
                aria-label="Share on Facebook"
              >
                <FaFacebook size={18} />
              </Button>
            </OverlayTrigger>

            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>Share on Twitter</Tooltip>}
            >
              <Button
                variant="outline-info"
                className="rounded-circle p-2"
                onClick={() => handleShare('twitter', selectedVehicle)}
                aria-label="Share on Twitter"
              >
                <FaTwitter size={18} />
              </Button>
            </OverlayTrigger>

            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>Share on Instagram</Tooltip>}
            >
              <Button
                variant="outline-danger"
                className="rounded-circle p-2"
                onClick={() => handleShare('instagram', selectedVehicle)}
                aria-label="Share on Instagram"
              >
                <FaInstagram size={18} />
              </Button>
            </OverlayTrigger>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons d-flex gap-2">
            <Button
              variant="outline-primary"
              onClick={() => handleDownloadPDF(selectedVehicle)}
            >
              <FaDownload className="me-2" /> Download PDF
            </Button>
            <Button
              variant="success"
              onClick={() => handleEmailPDF(selectedVehicle)}
            >
              <FaEnvelope className="me-2" /> Email PDF
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Garage;

