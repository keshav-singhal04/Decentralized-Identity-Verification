import React, { useState, useEffect } from 'react';
import { fetchPendingRegistrations, updateVerificationStatus } from '../services/api'; // Import API services

function VerificationPanel({ web3, contract, account }) {
  const [identityHash, setIdentityHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pendingUsers, setPendingUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Fetch pending registrations when component mounts
  useEffect(() => {
    loadPendingRegistrations();
  }, []);

  // Function to load pending registrations from backend
  const loadPendingRegistrations = async () => {
    setIsDataLoading(true);
    setError('');
    try {
      const data = await fetchPendingRegistrations();
      setPendingUsers(data);
    } catch (err) {
      console.error('Failed to load pending registrations:', err);
      setError('Failed to load pending registrations. Please try again.');
    } finally {
      setIsDataLoading(false);
    }
  };

  // Handle user selection from dropdown
  const handleUserSelect = (e) => {
    const userId = e.target.value;
    setSelectedUser(userId);
    
    if (userId) {
      const selectedUserData = pendingUsers.find(user => user._id === userId);
      if (selectedUserData) {
        setIdentityHash(selectedUserData.identityHash);
      }
    } else {
      setIdentityHash('');
    }
  };

  const verifyIdentity = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Validation
      if (!identityHash.trim()) {
        throw new Error('Identity hash is required');
      }
      
      // Verify identity on blockchain
      await contract.methods.verifyIdentity(identityHash).send({ from: account });
      
      // Update verification status in the database
      if (selectedUser) {
        await updateVerificationStatus({
          userId: selectedUser,
          verifierAddress: account
        });
      }
      
      // Success
      setSuccess(`Identity verified successfully!`);
      setIdentityHash('');
      setSelectedUser('');
      
      // Refresh the pending registrations list
      loadPendingRegistrations();
    } catch (err) {
      // Error handling
      console.error('Verification error:', err);
      setError(err.message || 'Failed to verify identity. See console for details.');
    } finally {
      setLoading(false);
    }
  };

  // Function to get document type name
  const getDocumentTypeName = (typeCode) => {
    const docTypes = {
      0: 'Passport',
      1: 'Driver\'s License',
      2: 'National ID',
      3: 'Other'
    };
    return docTypes[typeCode] || 'Unknown';
  };

  // Function to mask document ID for display
  const maskDocumentId = (id) => {
    if (!id) return '';
    if (id.length <= 4) return '*'.repeat(id.length);
    return id.substring(0, 4) + '*'.repeat(id.length - 4);
  };

  return (
    <div className="card">
      <h2>Verify User Identities</h2>
      <p>
        As an authorized verifier, you can confirm a user's identity by selecting them from the dropdown or entering their identity hash directly.
      </p>

      <form onSubmit={verifyIdentity}>
        <div className="form-group">
          <label htmlFor="userSelect">Select Pending Registration:</label>
          {isDataLoading ? (
            <p>Loading pending registrations...</p>
          ) : (
            <select
              id="userSelect"
              className="form-control"
              value={selectedUser}
              onChange={handleUserSelect}
              disabled={loading || pendingUsers.length === 0}
            >
              <option value="">-- Select a user --</option>
              {pendingUsers.map(user => (
                <option key={user._id} value={user._id}>
                  {user.name} - {getDocumentTypeName(user.documentType)} ({maskDocumentId(user.documentId)})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="identityHash">Identity Hash to Verify:</label>
          <input
            type="text"
            id="identityHash"
            className="form-control"
            value={identityHash}
            onChange={(e) => setIdentityHash(e.target.value)}
            placeholder="0x..."
            disabled={loading}
          />
        </div>

        <button 
          type="submit" 
          className="btn" 
          disabled={loading || !identityHash.trim()}
        >
          {loading ? 'Processing...' : 'Verify Identity'}
        </button>

        {pendingUsers.length === 0 && !isDataLoading && (
          <div className="info-message">
            No pending registrations to verify.
          </div>
        )}

        {error && (
          <div className="error">
            <i className="error-icon">⚠️</i> 
            {error.includes("Internal JSON-RPC error.") ? "User does not exist" : error}
          </div>
        )}
        
        {success && (
          <div className="success">
            <i className="success-icon">✓</i> {success}
          </div>
        )}
      </form>

      <div className="refresh-section">
        <button 
          className="refresh-btn" 
          onClick={loadPendingRegistrations} 
          disabled={isDataLoading}
        >
          {isDataLoading ? 'Loading...' : 'Refresh Pending Registrations'}
        </button>
      </div>
    </div>
  );
}

export default VerificationPanel;