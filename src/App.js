import React, { useState, useEffect, useCallback } from 'react';
import {
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
  Navigate,
} from 'react-router-dom';
import {
  Navbar,
  Container,
  Nav,
  Button,
  Modal,
  NavDropdown,
} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';
import Home from './Home';
import About from './About';
import Contact from './Contact';
import UserPage from './UserPage';
import Footer from './Footer';
import ErrorBoundary from './ErrorBoundary';
import { auth } from './firebase';
import SignUp from './SignUp';
import Login from './Login';
import Garage from './Garage';
import VINSearch from './VINSearch';
import UserAccount from './UserAccount';
import { FaUserCircle } from 'react-icons/fa';
import { signOut } from 'firebase/auth';

// PrivateRoute Component
const PrivateRoute = ({ children }) => {
  const user = auth.currentUser;
  return user ? children : <Navigate to="/login" replace />;
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light';
    }
    return 'light';
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const pageTitle =
      location.pathname === '/'
        ? 'Home'
        : location.pathname.slice(1).replace(/-/g, ' ').toUpperCase();
    document.title = `Car Website - ${pageTitle}`;
  }, [theme, location]);

  const handleAuthModal = (login = true) => {
    setIsLogin(login);
    setShowAuthModal(true);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth); // Fixed typo here
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div>
      {/* Navigation Bar */}
      <Navbar bg="dark" variant="dark" expand="lg" fixed="top">
        <Container>
          <Navbar.Brand as={Link} to="/" className="fw-bold">
            Car Website
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/" className="text-white">
                Home
              </Nav.Link>
              <Nav.Link as={Link} to="/about" className="text-white">
                About
              </Nav.Link>
              <Nav.Link as={Link} to="/contact" className="text-white">
                Contact
              </Nav.Link>
              <Nav.Link as={Link} to="/garage" className="text-white">
                My Garage
              </Nav.Link>
              <Nav.Link as={Link} to="/vin-search" className="text-white">
                VIN Search
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
          {auth.currentUser ? (
            <div className="d-flex align-items-center">
              <NavDropdown
                title={<FaUserCircle size={24} />}
                id="basic-nav-dropdown"
                align="end"
                className="text-white"
              >
                <NavDropdown.Item as={Link} to="/my-account">
                  My Account
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/garage">
                  My Garage
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>
                  Logout
                </NavDropdown.Item>
              </NavDropdown>
              <Button
                variant="outline-light"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="ms-2"
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </Button>
            </div>
          ) : (
            <div className="d-flex">
              <Button
                variant="outline-light"
                onClick={() => handleAuthModal(true)}
                aria-label="Login/Signup"
                className="me-2"
              >
                <FaUserCircle size={24} />
              </Button>
              <Button
                variant="outline-light"
                onClick={toggleTheme}
                aria-label="Toggle theme"
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </Button>
            </div>
          )}
        </Container>
      </Navbar>

      {/* Auth Modal */}
      <Modal
        show={showAuthModal}
        onHide={() => setShowAuthModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{isLogin ? 'Log In' : 'Sign Up'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {isLogin ? (
            <Login onSuccess={() => setShowAuthModal(false)} />
          ) : (
            <SignUp onSuccess={() => setShowAuthModal(false)} />
          )}
          <div className="text-center mt-3">
            <Button variant="link" onClick={() => setIsLogin(!isLogin)}>
              {isLogin
                ? 'Need an account? Sign Up'
                : 'Already have an account? Log In'}
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* Main Content */}
      <ErrorBoundary
        fallback={<div>Something went wrong. Please try again later.</div>}
      >
        <Container className="mt-5 pt-5">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/vin-search" element={<VINSearch />} />
            <Route
              path="/garage"
              element={
                <PrivateRoute>
                  <Garage />
                </PrivateRoute>
              }
            />
            <Route
              path="/my-account"
              element={
                <PrivateRoute>
                  <UserAccount />
                </PrivateRoute>
              }
            />
            <Route
              path="/user-page/:make/:model/:year/:registrationStatus/:owner"
              element={
                <PrivateRoute>
                  <UserPage />
                </PrivateRoute>
              }
            />
            <Route
              path="*"
              element={
                <div className="text-center mt-5">
                  <h1>404 - Page Not Found</h1>
                  <Button variant="primary" onClick={() => navigate('/')}>
                    Go Back to Home
                  </Button>
                </div>
              }
            />
          </Routes>
        </Container>
      </ErrorBoundary>

      {/* Conditional Footer Rendering */}
      {location.pathname !== '*' && <Footer />}
    </div>
  );
}

export default App;
