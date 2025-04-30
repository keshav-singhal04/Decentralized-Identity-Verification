import React, { useState, useEffect } from 'react';

function AdminPanel({ web3, contract, account }) {
  const [verifierAddress, setVerifierAddress] = useState('');
  const [verifierAddresses, setVerifierAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Get list of verifiers
  useEffect(() => {
    const fetchVerifiers = async () => {
      console.log('Starting fetchVerifiers...');
      try {
        // Get the owner address
        const owner = await contract.methods.owner().call();
        console.log('Contract owner:', owner);

        // Get all VerifierAdded events
        const addEvents = await contract.getPastEvents('VerifierAdded', {
          fromBlock: 0,
          toBlock: 'latest'
        });
        console.log('VerifierAdded events:', addEvents);

        // Get all VerifierRemoved events
        const removeEvents = await contract.getPastEvents('VerifierRemoved', {
          fromBlock: 0,
          toBlock: 'latest'
        });
        console.log('VerifierRemoved events:', removeEvents);

        // Create a set of all verifier addresses
        const verifierSet = new Set();
        
        // Add owner if they are a verifier
        const isOwnerVerifier = await contract.methods.verifiers(owner).call();
        if (isOwnerVerifier) {
          verifierSet.add(owner.toLowerCase());
        }

        // Process add events
        for (const event of addEvents) {
          const verifier = event.returnValues.verifier.toLowerCase();
          const isVerifier = await contract.methods.verifiers(verifier).call();
          if (isVerifier) {
            verifierSet.add(verifier);
          }
        }

        // Convert set to array and update state
        const currentVerifiers = Array.from(verifierSet);
        console.log('Current verifiers:', currentVerifiers);
        setVerifierAddresses(currentVerifiers);
      } catch (err) {
        console.error("Error fetching verifiers:", err);
        setError("Failed to fetch verifiers. Please try again.");
      }
    };

    if (contract) {
      fetchVerifiers();
    }
  }, [contract, success]);

  const addVerifier = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validation
      if (!web3.utils.isAddress(verifierAddress)) {
        throw new Error('Invalid Ethereum address');
      }

      console.log('Adding verifier:', verifierAddress);
      // Add verifier on blockchain
      await contract.methods.addVerifier(verifierAddress).send({ from: account });
      console.log('Verifier added successfully');

      // Success
      setSuccess(`Verifier ${verifierAddress} added successfully!`);
      setVerifierAddress('');
    } catch (err) {
      // Error handling
      console.error('Add verifier error:', err);
      setError(err.message || 'Failed to add verifier. See console for details.');
    } finally {
      setLoading(false);
    }
  };

  const removeVerifier = async (address) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Removing verifier:', address);
      // Remove verifier on blockchain
      await contract.methods.removeVerifier(address).send({ from: account });
      console.log('Verifier removed successfully');

      // Success
      setSuccess(`Verifier ${address} removed successfully!`);
    } catch (err) {
      // Error handling
      console.error('Remove verifier error:', err);
      setError(err.message || 'Failed to remove verifier. See console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Admin Panel</h2>
      <p>
        As the contract owner, you can manage authorized verifiers.
      </p>

      <form onSubmit={addVerifier}>
        <div className="form-group">
          <label htmlFor="verifierAddress">Add New Verifier:</label>
          <input
            type="text"
            id="verifierAddress"
            className="form-control"
            value={verifierAddress}
            onChange={(e) => setVerifierAddress(e.target.value)}
            placeholder="0x..."
            disabled={loading}
          />
        </div>

        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Processing...' : 'Add Verifier'}
        </button>

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
      </form>

      <div style={{ marginTop: '20px' }}>
        <h3>Current Verifiers</h3>
        {verifierAddresses.length === 0 ? (
          <p>No verifiers found (except owner)</p>
        ) : (
          <ul>
            {verifierAddresses.map((address, index) => (
              <li key={index} style={{ marginBottom: '10px' }}>
                {address}
                <button 
                  onClick={() => removeVerifier(address)} 
                  className="btn" 
                  style={{ marginLeft: '10px', padding: '5px 10px' }}
                  disabled={loading}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
