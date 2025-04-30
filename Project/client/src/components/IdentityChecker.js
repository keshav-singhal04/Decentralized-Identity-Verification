import React, { useState } from 'react';
import Web3 from 'web3';

const IdentityChecker = ({ web3, contract }) => {
  const [identityHash, setIdentityHash] = useState('');
  const [name, setName] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [identityStatus, setIdentityStatus] = useState(null);
  const [activeOption, setActiveOption] = useState('direct'); // 'direct' or 'generate'

  // Fixed salt for added security
  const FIXED_SALT = "IdentityVerificationSystem2025";

  const generateHash = () => {
    if (!name.trim() || !documentId.trim()) {
      setError('Name and document ID are required');
      return;
    }

    try {
      const combinedData = web3.utils.keccak256(
        web3.utils.encodePacked(name, documentId, FIXED_SALT)
      );
      setIdentityHash(combinedData);
      setError('');
    } catch (err) {
      setError('Failed to generate hash. Please check your input.');
    }
  };

  const checkIdentity = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setIdentityStatus(null);

    try {
      const result = await contract.methods.checkIdentity(identityHash).call();
      setIdentityStatus({
        isRegistered: result[0],
        isVerified: result[1],
        isRevoked: result[2],
        revocationTimestamp: result[3],
        revocationReason: result[4]
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp || timestamp === '0') return 'N/A';
    return new Date(parseInt(timestamp) * 1000).toLocaleString();
  };

  return (
    <div className="card">
      <h2>Check Identity Status</h2>
      <p>Enter your information or an identity hash to check verification status.</p>

      <div className="options-tabs">
        <div 
          className={`option-tab ${activeOption === 'generate' ? 'active' : ''}`}
          onClick={() => setActiveOption('generate')}
        >
          Option 1: Generate hash from personal information
        </div>
        <div 
          className={`option-tab ${activeOption === 'direct' ? 'active' : ''}`}
          onClick={() => setActiveOption('direct')}
        >
          Option 2: Enter identity hash directly
        </div>
      </div>

      {activeOption === 'generate' && (
        <div className="generate-hash-section">
          <div className="form-group">
            <label htmlFor="name">Full Name:</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="form-control"
            />
          </div>
          <div className="form-group">
            <label htmlFor="documentId">Document ID:</label>
            <input
              type="text"
              id="documentId"
              value={documentId}
              onChange={(e) => setDocumentId(e.target.value)}
              placeholder="Enter your document ID"
              className="form-control"
            />
          </div>
          <button 
            type="button" 
            onClick={generateHash}
            className="btn"
            disabled={!name.trim() || !documentId.trim()}
          >
            Generate Hash
          </button>
        </div>
      )}

      <form onSubmit={checkIdentity} className="check-form">
        <div className="form-group">
          <label>Identity Hash:</label>
          <input
            type="text"
            value={identityHash}
            onChange={(e) => setIdentityHash(e.target.value)}
            placeholder="0x..."
            required
            className="form-control"
          />
        </div>
        <button type="submit" disabled={loading || !identityHash.trim()}>
          {loading ? 'Checking...' : 'Check Identity Status'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      {identityStatus && (
        <div className="status-card">
          <h3>Identity Status</h3>
          <div className="status-item">
            <strong>Registration Status:</strong>
            <span className={identityStatus.isRegistered ? 'status-valid' : 'status-invalid'}>
              {identityStatus.isRegistered ? 'Registered' : 'Not Registered'}
            </span>
          </div>
          <div className="status-item">
            <strong>Verification Status:</strong>
            <span className={identityStatus.isVerified ? 'status-valid' : 'status-invalid'}>
              {identityStatus.isVerified ? 'Verified' : 'Not Verified'}
            </span>
          </div>
          <div className="status-item">
            <strong>Revocation Status:</strong>
            <span className={identityStatus.isRevoked ? 'status-invalid' : 'status-valid'}>
              {identityStatus.isRevoked ? 'Revoked' : 'Active'}
            </span>
          </div>
          {identityStatus.isRevoked && (
            <>
              <div className="status-item">
                <strong>Revocation Date:</strong>
                <span>{formatDate(identityStatus.revocationTimestamp)}</span>
              </div>
              <div className="status-item">
                <strong>Revocation Reason:</strong>
                <span>{identityStatus.revocationReason || 'No reason provided'}</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default IdentityChecker;