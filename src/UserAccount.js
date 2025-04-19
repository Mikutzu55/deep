import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { updateEmail, updatePassword } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Button, Form, Alert, Card, ProgressBar, Badge } from 'react-bootstrap';
import Subscribe from './Subscribe'; // Import the Subscribe component

const UserAccount = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [membership, setMembership] = useState('Free');
  const [searchLimit, setSearchLimit] = useState(0);
  const [searchesUsed, setSearchesUsed] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const user = auth.currentUser;

  useEffect(() => {
    const fetchUserData = async () => {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setPhone(docSnap.data().phone || '');
        setMembership(docSnap.data().membership || 'Free');
        setSearchLimit(docSnap.data().searchLimit || 0);
        setSearchesUsed(docSnap.data().searchesUsed || 0);
      }
    };
    fetchUserData();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (email !== user.email) {
        await updateEmail(user, email);
      }
      if (password) {
        await updatePassword(user, password);
      }

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        phone,
        membership: membership.toLowerCase(), // Store membership in lowercase
      });

      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 5000);
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4">My Account</h2>
      <Card className="p-4 shadow mb-4">
        <div className="mb-4">
          <h4>Membership Status</h4>
          <Badge
            bg={
              membership.toLowerCase() === 'premium'
                ? 'warning'
                : membership.toLowerCase() === 'business'
                  ? 'info'
                  : 'secondary'
            }
            className="fs-6"
          >
            {membership} Member
          </Badge>
        </div>

        <div className="mb-4">
          <h4>Search Usage</h4>
          <ProgressBar
            now={(searchesUsed / searchLimit) * 100}
            label={`${searchesUsed}/${searchLimit}`}
            variant={searchesUsed >= searchLimit ? 'danger' : 'success'}
            className="mb-2"
          />
          <small>
            {searchesUsed >= searchLimit
              ? 'You have reached your search limit. Upgrade your plan for more searches.'
              : `You have ${searchLimit - searchesUsed} searches remaining.`}
          </small>
        </div>

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Email address</Form.Label>
            <Form.Control
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={user.email}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>New Password</Form.Label>
            <Form.Control
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Phone Number</Form.Label>
            <Form.Control
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter phone number"
            />
          </Form.Group>

          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Button variant="primary" type="submit">
            Update Profile
          </Button>
        </Form>
      </Card>

      {/* Subscription Plans Section */}
      <Card className="p-4 shadow">
        <h4 className="mb-4">Upgrade Your Membership</h4>
        <Subscribe />
      </Card>
    </div>
  );
};

export default UserAccount;


