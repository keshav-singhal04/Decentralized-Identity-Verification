import React, { useState } from 'react';
import Web3 from 'web3';

const RevocationPanel = ({ web3, contract, account }) => {
  const [identityHash, setIdentityHash] = useState('');
  const [revocationReason, setRevocationReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRevoke = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await contract.methods.revokeIdentity(identityHash, revocationReason)
        .send({ from: account });
      setSuccess('Identity successfully revoked');
      setIdentityHash('');
      setRevocationReason('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Revoke Identity</h2>
      <form onSubmit={handleRevoke}>
        <div className="form-group">
          <label>Identity Hash:</label>
          <input
            type="text"
            value={identityHash}
            onChange={(e) => setIdentityHash(e.target.value)}
            placeholder="Enter identity hash"
            required
          />
        </div>
        <div className="form-group">
          <label>Revocation Reason:</label>
          <textarea
            value={revocationReason}
            onChange={(e) => setRevocationReason(e.target.value)}
            placeholder="Enter reason for revocation"
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Revoking...' : 'Revoke Identity'}
        </button>
      </form>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
    </div>
  );
};

export default RevocationPanel; 