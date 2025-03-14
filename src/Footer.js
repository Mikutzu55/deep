import React from 'react';

const Footer = () => {
  return (
    <footer
      style={{
        backgroundImage: 'linear-gradient(120deg, #333333, #555555)',
        color: '#ffffff',
        padding: '3rem 1rem',
        textAlign: 'center',
        fontFamily: "'Poppins', sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Animation */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background:
            'radial-gradient(circle, rgba(255,255,255,0.05) 10%, transparent 10%)',
          animation: 'glow 10s linear infinite',
          zIndex: -1,
        }}
      ></div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Logo or Brand Name */}
        <h2
          style={{
            fontSize: '1.8rem',
            fontWeight: 'bold',
            marginBottom: '10px',
            color: '#007bff', // Blue accent to match the website theme
            textShadow: '0 0 15px #007bff',
            letterSpacing: '2px',
          }}
        >
          My Car Website
        </h2>
        {/* Navigation Links */}
        <div
          style={{
            display: 'flex',
            gap: '20px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {['About Us', 'Contact', 'Privacy Policy'].map((link, index) => (
            <a
              key={index}
              href={`/${link.toLowerCase().replace(' ', '-')}`}
              style={{
                color: '#007bff', // Blue accent
                textDecoration: 'none',
                transition: 'color 0.3s ease, transform 0.3s ease',
                fontSize: '1rem',
                fontWeight: '500',
              }}
              onMouseOver={(e) => {
                e.target.style.color = '#ff6f61'; // Warm hover color
                e.target.style.transform = 'scale(1.1)';
              }}
              onMouseOut={(e) => {
                e.target.style.color = '#007bff';
                e.target.style.transform = 'scale(1)';
              }}
            >
              {link}
            </a>
          ))}
        </div>
        {/* Social Media Icons */}
        <div
          style={{
            display: 'flex',
            gap: '20px',
            marginTop: '20px',
          }}
        >
          {[
            { icon: 'fab fa-facebook-f', link: 'https://facebook.com' },
            { icon: 'fab fa-twitter', link: 'https://twitter.com' },
            { icon: 'fab fa-instagram', link: 'https://instagram.com' },
            { icon: 'fab fa-linkedin-in', link: 'https://linkedin.com' },
          ].map(({ icon, link }, index) => (
            <a
              key={index}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#007bff', // Blue accent
                fontSize: '1.5rem',
                transition: 'transform 0.3s ease, color 0.3s ease',
                textShadow: '0 0 10px #007bff',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.2)';
                e.currentTarget.style.textShadow = '0 0 15px #ff6f61'; // Warm hover effect
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.textShadow = '0 0 10px #007bff';
              }}
            >
              <i className={icon}></i>
            </a>
          ))}
        </div>
        {/* Copyright Notice */}
        <p
          style={{
            marginTop: '20px',
            fontSize: '0.9rem',
            opacity: '0.8',
            letterSpacing: '1px',
          }}
        >
          © {new Date().getFullYear()} My Car Website. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
