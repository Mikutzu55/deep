// ErrorBoundary.js
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    // Update state so the next render shows the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Log the error to an error reporting service or console.
    console.error('Error caught by boundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      // You can customize the fallback UI here.
      return (
        <div className="text-center mt-5">
          <h2>Something went wrong.</h2>
          <p>We're sorry for the inconvenience. Please try again later.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
