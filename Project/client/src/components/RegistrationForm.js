import React, { useState } from 'react';
import { registerUser } from '../services/api'; // Import the API service

function RegistrationForm({ web3, contract, account }) {
  const [name, setName] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [documentType, setDocumentType] = useState('0'); // Keep for database records only
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [identityHash, setIdentityHash] = useState('');
  
  // Fixed salt for added security
  const FIXED_SALT = "IdentityVerificationSystem2025";

  const registerIdentity = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validation
      if (!name.trim() || !documentId.trim()) {
        throw new Error('Name and document ID are required');
      }

      // Create hash from name and document ID using keccak256 with encodePacked and salt
      const combinedData = web3.utils.keccak256(
        web3.utils.encodePacked(name, documentId, FIXED_SALT)
      );

      setIdentityHash(combinedData);

      // Check if identity already exists before trying to register
      const identityCheck = await contract.methods.checkIdentity(combinedData).call();
      if (identityCheck.isRegistered) {
        throw new Error('This identity has already been registered');
      }

      // Register identity on blockchain
      await contract.methods.registerIdentity(combinedData).send({ from: account });

      // Save user data to backend database
      await registerUser({
        name,
        documentId,
        documentType, // Kept in the database for record-keeping
        identityHash: combinedData,
        walletAddress: account
      });

      // Success
      setSuccess(`Identity registered successfully! Your identity hash is: ${combinedData}`);
      setName('');
      setDocumentId('');
      setDocumentType('0');
    } catch (err) {
      // Error handling
      console.error('Registration error:', err);
      if (err.message.includes('Identity already registered') || 
          err.message.includes('This identity has already been registered')) {
        setError('This identity has already been registered. Please use a different identity.');
      } else if (err.message.includes('Address already registered')) {
        setError('This address has already registered an identity.');
      } else if (err.message.includes('rejected')) {
        setError('Transaction was rejected. Please try again.');
      } else {
        setError(err.message || 'Failed to register identity. See console for details.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Register Your Identity</h2>
      <p>
        Enter your information below. Your personal data will be securely stored and your identity hash will be registered on the blockchain.
      </p>

      <form onSubmit={registerIdentity}>
        <div className="form-group">
          <label htmlFor="name">Full Name:</label>
          <input
            type="text"
            id="name"
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="documentId">Document ID:</label>
          <input
            type="text"
            id="documentId"
            className="form-control"
            value={documentId}
            onChange={(e) => setDocumentId(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="documentType">Document Type:</label>
          <select
            id="documentType"
            className="form-control"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            disabled={loading}
          >
            <option value="0">Passport</option>
            <option value="1">Driver's License</option>
            <option value="2">National ID</option>
            <option value="3">Other</option>
          </select>
        </div>

        <button type="submit" className="btn" disabled={loading || !name.trim() || !documentId.trim()}>
          {loading ? 'Processing...' : 'Register Identity'}
        </button>

        {error && (
          <div className="error">
            <i className="error-icon">⚠️</i> {error}
          </div>
        )}
        
        {success && (
          <div className="success">
            <i className="success-icon">✓</i> {success}
            <div className="hash-display">{identityHash}</div>
          </div>
        )}
      </form>
    </div>
  );
}

export default RegistrationForm;