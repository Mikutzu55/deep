import React, { useState } from 'react';
import {
  auth,
  googleProvider,
  appleProvider,
  signInWithPopup,
} from './firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { FaGoogle, FaApple } from 'react-icons/fa';
import { Button, Form, Container } from 'react-bootstrap';

const SignUp = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      onSuccess();
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      onSuccess();
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    }
  };

  const handleAppleSignUp = async () => {
    try {
      await signInWithPopup(auth, appleProvider);
      onSuccess();
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    }
  };

  return (
    <Container>
      <Form onSubmit={handleSignUp}>
        <Form.Group className="mb-3">
          <Form.Label>Name</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Form.Group>
        {error && <p className="text-danger">{error}</p>}
        <Button type="submit" variant="primary" className="w-100 mb-3">
          Sign Up
        </Button>
      </Form>
      <div className="text-center mb-3">OR</div>
      <Button
        variant="outline-danger"
        className="w-100 mb-3 d-flex align-items-center justify-content-center"
        onClick={handleGoogleSignUp}
      >
        <FaGoogle className="me-2" /> Sign Up with Google
      </Button>
      <Button
        variant="outline-dark"
        className="w-100 d-flex align-items-center justify-content-center"
        onClick={handleAppleSignUp}
      >
        <FaApple className="me-2" /> Sign Up with Apple
      </Button>
    </Container>
  );
};

export default SignUp;
