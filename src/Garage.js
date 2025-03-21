import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
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
} from 'react-icons/fa';
import { Line, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
} from 'chart.js';
import './styles.css';
import jsPDF from 'jspdf'; // For PDF generation
import emailjs from 'emailjs-com'; // For sending emails
import axios from 'axios'; // For API calls

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale
);

// Initialize EmailJS with your User ID
emailjs.init('1y9guBsGcLO0pgE-Q'); // Replace with your EmailJS User ID

// Data for Mileage Over Time graph
const mileageData = (vehicle) => ({
  labels: vehicle?.titleRecords?.map((record) => record.date) || [],
  datasets: [
    {
      label: 'Mileage Over Time',
      data: vehicle?.titleRecords?.map((record) => record.mileage) || [],
      borderColor: '#00ffcc',
      backgroundColor: 'rgba(0, 255, 204, 0.2)',
    },
  ],
});

// Data for Problem Checks radar chart
const problemChecksData = (vehicle) => ({
  labels: Object.keys(vehicle?.problemChecks || {}),
  datasets: [
    {
      label: 'Problem Checks',
      data: Object.values(vehicle?.problemChecks || {}).map((val) =>
        val === 'No problems found!' ? 0 : 1
      ),
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      borderColor: 'rgba(255, 99, 132, 1)',
    },
  ],
});

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

  // Fetch garage data and user role on component mount
  useEffect(() => {
    const fetchGarageData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          setVehicles(userDoc.data().garage || []);
          setUserRole(userDoc.data().membership || 'free');
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
  }, [location.state]);

  // Handle VIN search from the search bar
  const handleVINSearch = async (vin) => {
    setSearchLoading(true);
    setSearchError('');
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userData = userDoc.data();
      let apiType = 'nhtsa'; // Default to NHTSA API for free users or unauthenticated users

      // Check if the user is logged in and has a paid membership
      if (
        userData &&
        (userData.membership === 'premium' ||
          userData.membership === 'business')
      ) {
        apiType = 'clearvin'; // Use ClearVIN API for paid members
      }

      if (apiType === 'nhtsa') {
        // Use NHTSA API for free users or unauthenticated users
        const response = await axios.get(
          `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`
        );

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
          navigate('/garage', { state: { vehicle: vehicleData } });
        } else {
          setSearchError('No data found for this VIN.');
        }
      } else if (apiType === 'clearvin') {
        const response = await axios.get(
          `http://localhost:5000/api/clearvin?vin=${vin}`
        );
        console.log('ClearVIN API Response:', response.data); // Debugging line

        const result = response.data; // Renamed from data to result

        if (result.vehicle) {
          const vehicleData = {
            ...result.vehicle, // Spread operator to include all fields from result.vehicle
            vin: vin, // Ensure VIN is explicitly set
            registrationStatus: 'Active',
            mileage: 0,
            specifications: {
              make: result.vehicle.make || 'N/A',
              model: result.vehicle.model || 'N/A',
              year: result.vehicle.year || 'N/A',
              trim: result.vehicle.trim || 'N/A',
              madeIn: result.vehicle.madeIn || 'N/A',
              engine: result.vehicle.engine || 'N/A',
              style: result.vehicle.style || 'N/A',
              invoicePrice: result.vehicle.invoice || 'N/A',
              msrp: result.vehicle.msrp || 'N/A',
            },
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
            recalls: result.vehicle.recalls
              ? result.vehicle.recalls.map((recall) => ({
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
              result.vehicle.emissionSafetyInspections || [],
            accidentDamageHistory: result.vehicle.accidentDamageHistory || [],
            lienImpoundRecords: result.vehicle.lienImpoundRecords || [],
          };
          console.log('Vehicle Data:', vehicleData); // Debugging line
          navigate('/garage', { state: { vehicle: vehicleData } });
        } else {
          setSearchError('No data found for this VIN using ClearVIN API.');
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err.message);
      setSearchError('Failed to fetch data. Please try again.');
    } finally {
      setSearchLoading(false);
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
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedVehicle(null);
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
    return currentYear - year;
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

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p>Loading your garage...</p>
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
          aria-expanded={showSearchBar}
        >
          <FaPlus className="me-2" /> Add Another VIN
        </Button>
        <Collapse in={showSearchBar}>
          <div className="mt-3">
            <Form
              onSubmit={(e) => {
                e.preventDefault();
                const vin = e.target.elements.vin.value;
                handleVINSearch(vin);
              }}
            >
              <div className="input-group">
                <Form.Control
                  type="text"
                  name="vin"
                  placeholder="Enter VIN"
                  aria-label="Enter VIN"
                  required
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
                    'Search'
                  )}
                </Button>
              </div>
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
        <Button variant="secondary" onClick={toggleCompareMode}>
          {compareMode ? 'Exit Compare Mode' : 'Compare Cars'}
        </Button>
      </div>
      {vehicles.length === 0 ? (
        <p className="text-center text-muted">
          Your garage is empty. Add vehicles to get started!
        </p>
      ) : (
        <Row>
          {vehicles.map((vehicle, index) => (
            <Col key={index} md={6} lg={4} className="mb-4">
              <Card
                className="h-100 shadow-sm glassmorphism-card"
                style={{ border: 'none', borderRadius: '15px' }}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveVehicle(index);
                      }}
                      aria-label="Remove vehicle"
                    >
                      <FaTrash />
                    </Button>
                  </div>
                  <p className="text-muted mb-3">
                    <FaInfoCircle className="me-2" />
                    VIN: {vehicle.vin}
                  </p>
                  <p className="text-muted mb-3">
                    <FaInfoCircle className="me-2" />
                    Registration Status: {vehicle.registrationStatus}
                  </p>
                  {/* Compare Mode Checkbox */}
                  {compareMode && (
                    <Form.Check
                      type="checkbox"
                      label="Compare"
                      checked={selectedForCompare.includes(vehicle)}
                      onChange={() => handleCompareSelection(vehicle)}
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
          >
            Compare Selected Cars
          </Button>
        </div>
      )}
      {userRole === 'free' && (
        <div className="text-center mt-4">
          <Button variant="primary" onClick={handleSeeFullRecord}>
            <FaArrowRight className="me-2" /> See Full Report ($XX.XX)
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
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedVehicle?.make} {selectedVehicle?.model} (
            {selectedVehicle?.year})
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Space for Car Picture and Mascot */}
          <div
            className="text-center mb-4"
            style={{
              height: '200px',
              backgroundColor: '#f8f9fa',
              borderRadius: '10px',
            }}
          >
            {/* Placeholder for Car Picture and Mascot */}
            <p className="text-muted">Car Picture and Mascot Placeholder</p>
          </div>
          {/* Quick Check Section */}
          <Accordion defaultActiveKey="0">
            <Accordion.Item eventKey="0">
              <Accordion.Header>
                <FaCheckCircle className="me-2 text-success" /> Quick Check
              </Accordion.Header>
              <Accordion.Body>
                <Row>
                  <Col md={6} className="mb-3">
                    <div className="d-flex align-items-center">
                      <FaTachometerAlt
                        className="me-2 text-primary"
                        size={20}
                      />
                      <span>Odometer:</span>
                      <Badge bg="success" className="ms-2">
                        {selectedVehicle?.titleRecords?.[0]?.mileage || 'N/A'}{' '}
                        miles
                      </Badge>
                    </div>
                  </Col>
                  <Col md={6} className="mb-3">
                    <div className="d-flex align-items-center">
                      <FaUser className="me-2 text-primary" size={20} />
                      <span>Owner:</span>
                      <Badge bg="success" className="ms-2">
                        {selectedVehicle?.titleRecords?.[0]?.status || 'N/A'}
                      </Badge>
                    </div>
                  </Col>
                  <Col md={6} className="mb-3">
                    <div className="d-flex align-items-center">
                      <FaCalendarAlt className="me-2 text-primary" size={20} />
                      <span>Vehicle Age:</span>
                      <Badge bg="success" className="ms-2">
                        {calculateVehicleAge(selectedVehicle?.year)} years
                      </Badge>
                    </div>
                  </Col>
                  <Col md={6} className="mb-3">
                    <div className="d-flex align-items-center">
                      <FaWrench className="me-2 text-primary" size={20} />
                      <span>Last Inspection:</span>
                      <Badge bg="success" className="ms-2">
                        {selectedVehicle?.titleRecords?.[0]?.date || 'N/A'}
                      </Badge>
                    </div>
                  </Col>
                  <Col md={12} className="mb-3">
                    <div className="d-flex align-items-center">
                      <FaCarCrash className="me-2 text-primary" size={20} />
                      <span>Damage:</span>
                      <Badge
                        bg={
                          hasDamage(selectedVehicle?.problemChecks)
                            ? 'danger'
                            : 'success'
                        }
                        className="ms-2"
                      >
                        {hasDamage(selectedVehicle?.problemChecks)
                          ? 'Yes'
                          : 'No'}
                      </Badge>
                    </div>
                  </Col>
                </Row>
              </Accordion.Body>
            </Accordion.Item>
            {/* Vehicle Specifications */}
            <Accordion.Item eventKey="1">
              <Accordion.Header>
                <FaInfoCircle className="me-2 text-primary" /> Vehicle
                Specifications
              </Accordion.Header>
              <Accordion.Body>
                <p>
                  <strong>VIN:</strong> {selectedVehicle?.vin}
                </p>
                <p>
                  <strong>Year:</strong> {selectedVehicle?.year}
                </p>
                <p>
                  <strong>Make:</strong> {selectedVehicle?.make}
                </p>
                <p>
                  <strong>Model:</strong> {selectedVehicle?.model}
                </p>
                <p>
                  <strong>Trim:</strong>{' '}
                  {selectedVehicle?.specifications?.trim || 'N/A'}
                </p>
                <p>
                  <strong>Engine:</strong>{' '}
                  {selectedVehicle?.specifications?.engine || 'N/A'}
                </p>
                <p>
                  <strong>Made In:</strong>{' '}
                  {selectedVehicle?.specifications?.madeIn || 'N/A'}
                </p>
                <p>
                  <strong>Fuel Capacity:</strong>{' '}
                  {selectedVehicle?.specifications?.fuelCapacity || 'N/A'}
                </p>
                <p>
                  <strong>City Mileage:</strong>{' '}
                  {selectedVehicle?.specifications?.cityMileage || 'N/A'}
                </p>
                <p>
                  <strong>MSRP:</strong>{' '}
                  {selectedVehicle?.specifications?.msrp || 'N/A'}
                </p>
              </Accordion.Body>
            </Accordion.Item>
            {/* Problem Checks */}
            <Accordion.Item eventKey="2">
              <Accordion.Header>
                <FaExclamationCircle className="me-2 text-danger" /> Problem
                Checks
              </Accordion.Header>
              <Accordion.Body>
                <p>
                  <strong>Flood Damage:</strong>{' '}
                  {selectedVehicle?.problemChecks?.floodDamage || 'N/A'}
                </p>
                <p>
                  <strong>Fire Damage:</strong>{' '}
                  {selectedVehicle?.problemChecks?.fireDamage || 'N/A'}
                </p>
                <p>
                  <strong>Hail Damage:</strong>{' '}
                  {selectedVehicle?.problemChecks?.hailDamage || 'N/A'}
                </p>
                <p>
                  <strong>Salt Water Damage:</strong>{' '}
                  {selectedVehicle?.problemChecks?.saltWaterDamage || 'N/A'}
                </p>
                <p>
                  <strong>Vandalism:</strong>{' '}
                  {selectedVehicle?.problemChecks?.vandalism || 'N/A'}
                </p>
                <p>
                  <strong>Rebuilt:</strong>{' '}
                  {selectedVehicle?.problemChecks?.rebuilt || 'N/A'}
                </p>
                <p>
                  <strong>Salvage Damage:</strong>{' '}
                  {selectedVehicle?.problemChecks?.salvageDamage || 'N/A'}
                </p>
              </Accordion.Body>
            </Accordion.Item>
            {/* Graphs */}
            <Accordion.Item eventKey="3">
              <Accordion.Header>
                <FaChartLine className="me-2 text-primary" /> Graphs
              </Accordion.Header>
              <Accordion.Body>
                <h6 className="text-primary">Mileage Over Time</h6>
                <Line data={mileageData(selectedVehicle)} />
                <h6 className="text-primary mt-4">Problem Checks</h6>
                <Radar data={problemChecksData(selectedVehicle)} />
              </Accordion.Body>
            </Accordion.Item>
            {/* Recalls */}
            <Accordion.Item eventKey="4">
              <Accordion.Header>
                <FaExclamationCircle className="me-2 text-danger" /> Recalls
              </Accordion.Header>
              <Accordion.Body>
                {selectedVehicle?.recalls?.map((recall, index) => (
                  <div key={index} className="mb-3">
                    <p>
                      <strong>Recall Date:</strong> {recall.reportReceivedDate}
                    </p>
                    <p>
                      <strong>Recall Number:</strong>{' '}
                      {recall.nhtsaCampaignNumber}
                    </p>
                    <p>
                      <strong>Component:</strong> {recall.component}
                    </p>
                    <p>
                      <strong>Summary:</strong> {recall.summary}
                    </p>
                    <p>
                      <strong>Consequence:</strong> {recall.consequence}
                    </p>
                    <p>
                      <strong>Remedy:</strong> {recall.remedy}
                    </p>
                    <p>
                      <strong>Notes:</strong> {recall.notes}
                    </p>
                  </div>
                ))}
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
                    {selectedVehicle?.titleRecords?.map((record, index) => (
                      <div key={index} className="mb-3">
                        <p>
                          <strong>Date:</strong> {record.date}
                        </p>
                        <p>
                          <strong>State of Title:</strong> {record.state}
                        </p>
                        <p>
                          <strong>Status:</strong> {record.status}
                        </p>
                        <p>
                          <strong>Mileage:</strong> {record.mileage}
                        </p>
                      </div>
                    ))}
                  </Accordion.Body>
                </Accordion.Item>
                {/* Junk / Salvage / Insurance Records */}
                <Accordion.Item eventKey="6">
                  <Accordion.Header>
                    <FaExclamationCircle className="me-2 text-danger" /> Junk /
                    Salvage / Insurance Records
                  </Accordion.Header>
                  <Accordion.Body>
                    {selectedVehicle?.junkSalvageRecords?.map(
                      (record, index) => (
                        <div key={index} className="mb-3">
                          <p>
                            <strong>Date:</strong> {record.date}
                          </p>
                          <p>
                            <strong>Reporting Entity:</strong>{' '}
                            {record.reportingEntity}
                          </p>
                          <p>
                            <strong>Details:</strong> {record.details}
                          </p>
                        </div>
                      )
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
                        <div key={index} className="mb-3">
                          <p>
                            <strong>Date:</strong> {record.date}
                          </p>
                          <p>
                            <strong>Status:</strong> {record.status}
                          </p>
                          <p>
                            <strong>Details:</strong> {record.details}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p>No theft or theft recovery records found!</p>
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
                          <div key={index} className="mb-3">
                            <p>
                              <strong>Date:</strong> {record.date}
                            </p>
                            <p>
                              <strong>Type:</strong> {record.type}
                            </p>
                            <p>
                              <strong>Details:</strong> {record.details}
                            </p>
                          </div>
                        )
                      )
                    ) : (
                      <p>No lien, impound, or export records found!</p>
                    )}
                  </Accordion.Body>
                </Accordion.Item>
                {/* Sale Records */}
                <Accordion.Item eventKey="9">
                  <Accordion.Header>
                    <FaFile className="me-2 text-primary" /> Sale Records
                  </Accordion.Header>
                  <Accordion.Body>
                    {selectedVehicle?.saleRecords?.map((record, index) => (
                      <div key={index} className="mb-3">
                        <p>
                          <strong>Date:</strong> {record.date}
                        </p>
                        <p>
                          <strong>Seller:</strong> {record.seller}
                        </p>
                        <p>
                          <strong>Price:</strong> {record.price}
                        </p>
                        <p>
                          <strong>Mileage:</strong> {record.mileage}
                        </p>
                        <p>
                          <strong>Color:</strong> {record.color}
                        </p>
                      </div>
                    ))}
                  </Accordion.Body>
                </Accordion.Item>

                {/* Emission & Safety Inspection */}
                <Accordion.Item eventKey="10">
                  <Accordion.Header>
                    <FaCheckCircle className="me-2 text-success" /> Emission &
                    Safety Inspection
                  </Accordion.Header>
                  <Accordion.Body>
                    {selectedVehicle?.emissionSafetyInspections?.map(
                      (inspection, index) => (
                        <div key={index} className="mb-3">
                          <p>
                            <strong>Date:</strong> {inspection.date}
                          </p>
                          <p>
                            <strong>Location:</strong> {inspection.location}
                          </p>
                          <p>
                            <strong>Result:</strong> {inspection.result}
                          </p>
                        </div>
                      )
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
                    {selectedVehicle?.accidentDamageHistory?.map(
                      (accident, index) => (
                        <div key={index} className="mb-3">
                          <p>
                            <strong>Date:</strong> {accident.date}
                          </p>
                          <p>
                            <strong>Impact:</strong> {accident.impact}
                          </p>
                          <p>
                            <strong>Airbags:</strong> {accident.airbags}
                          </p>
                          <p>
                            <strong>Repair Cost:</strong> {accident.repairCost}
                          </p>
                        </div>
                      )
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
                    {selectedVehicle?.lienImpoundRecords?.map(
                      (record, index) => (
                        <div key={index} className="mb-3">
                          <p>
                            <strong>Date:</strong> {record.date}
                          </p>
                          <p>
                            <strong>State:</strong> {record.state}
                          </p>
                          <p>
                            <strong>Reported By:</strong> {record.reportedBy}
                          </p>
                          <p>
                            <strong>Event:</strong> {record.event}
                          </p>
                        </div>
                      )
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
                    <div className="text-center">
                      <p>🔒 Discover the full report to view Title Records.</p>
                    </div>
                  </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="6">
                  <Accordion.Header>
                    <FaLock className="me-2 text-warning" /> Theft Records
                  </Accordion.Header>
                  <Accordion.Body>
                    <div className="text-center">
                      <p>🔒 Discover the full report to view Theft Records.</p>
                    </div>
                  </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="7">
                  <Accordion.Header>
                    <FaLock className="me-2 text-warning" /> Sale Records
                  </Accordion.Header>
                  <Accordion.Body>
                    <div className="text-center">
                      <p>🔒 Discover the full report to view Sale Records.</p>
                    </div>
                  </Accordion.Body>
                </Accordion.Item>
              </>
            )}
          </Accordion>

          {/* "See Full Record" Button for Free Users */}
          {userRole === 'free' && (
            <div className="text-center mt-4">
              <Button variant="primary" onClick={handleSeeFullRecord}>
                <FaArrowRight className="me-2" /> Buy 1 Search ($XX.XX)
              </Button>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          {/* Social Media Icons */}
          <div className="d-flex gap-3">
            <Button
              variant="link"
              onClick={() => handleShare('facebook', selectedVehicle)}
              aria-label="Share on Facebook"
            >
              <FaFacebook size={24} />
            </Button>
            <Button
              variant="link"
              onClick={() => handleShare('twitter', selectedVehicle)}
              aria-label="Share on Twitter"
            >
              <FaTwitter size={24} />
            </Button>
            <Button
              variant="link"
              onClick={() => handleShare('instagram', selectedVehicle)}
              aria-label="Share on Instagram"
            >
              <FaInstagram size={24} />
            </Button>
          </div>
          {/* Download PDF Button */}
          <Button
            variant="primary"
            onClick={() => handleDownloadPDF(selectedVehicle)}
          >
            <FaDownload className="me-2" /> Download PDF
          </Button>
          {/* Email PDF Button */}
          <Button
            variant="success"
            onClick={() => handleEmailPDF(selectedVehicle)}
          >
            <FaEnvelope className="me-2" /> Email PDF
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Garage;

