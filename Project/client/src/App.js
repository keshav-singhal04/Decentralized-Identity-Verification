import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import detectEthereumProvider from '@metamask/detect-provider';
import IdentityVerification from './contracts/IdentityVerification.json';
import RegistrationForm from './components/RegistrationForm';
import VerificationPanel from './components/VerificationPanel';
import IdentityChecker from './components/IdentityChecker';
import AdminPanel from './components/AdminPanel';
import RevocationPanel from './components/RevocationPanel';
import './components/styles.css';  // Import the styles

function App() {
  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [contract, setContract] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isVerifier, setIsVerifier] = useState(false);
  const [activeTab, setActiveTab] = useState('register');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Initialize web3 and contract
  useEffect(() => {
    const init = async () => {
      try {
        // Check if MetaMask is installed
        const provider = await detectEthereumProvider();
        
        if (provider) {
          // Use provider with Web3
          const web3Instance = new Web3(provider);
          setWeb3(web3Instance);
          
          // Get connected accounts
          const accounts = await web3Instance.eth.requestAccounts();
          setAccounts(accounts);
          
          // Get network ID
          const networkId = await web3Instance.eth.net.getId();
          
          // Get contract instance
          const deployedNetwork = IdentityVerification.networks[networkId];
          if (deployedNetwork) {
            const instance = new web3Instance.eth.Contract(
              IdentityVerification.abi,
              deployedNetwork.address
            );
            setContract(instance);
            
            // Check if current user is owner
            const owner = await instance.methods.owner().call();
            setIsOwner(owner.toLowerCase() === accounts[0].toLowerCase());
            
            // Check if current user is verifier
            const verifier = await instance.methods.verifiers(accounts[0]).call();
            setIsVerifier(verifier || owner.toLowerCase() === accounts[0].toLowerCase());
          } else {
            setError("Smart contract not deployed to detected network.");
          }
        } else {
          setError("Please install MetaMask to use this application.");
        }
      } catch (error) {
        console.error("Failed to load web3 or contracts:", error);
        setError("Failed to connect to blockchain. Please check console for details.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        setAccounts(accounts);
        window.location.reload();
      });
    }
  }, []);

  if (loading) {
    return <div className="container"><div className="card">Loading application...</div></div>;
  }

  if (error) {
    return <div className="container"><div className="card error">{error}</div></div>;
  }

  return (
    <div className="container">
      <h1>Decentralized Identity Verification</h1>
      
      <div className="card">
        <p>Connected Account: {accounts[0]}</p>
        {isOwner && <p><strong>You are the contract owner</strong></p>}
        {isVerifier && <p><strong>You are an authorized verifier</strong></p>}
      </div>
      
      <div className="tabs">
        <div 
          className={`tab ${activeTab === 'register' ? 'active' : ''}`}
          onClick={() => setActiveTab('register')}
        >
          Register Identity
        </div>
        <div 
          className={`tab ${activeTab === 'check' ? 'active' : ''}`}
          onClick={() => setActiveTab('check')}
        >
          Check Identity
        </div>
        {isVerifier && (
          <>
            <div 
              className={`tab ${activeTab === 'verify' ? 'active' : ''}`}
              onClick={() => setActiveTab('verify')}
            >
              Verify Identities
            </div>
            <div 
              className={`tab ${activeTab === 'revoke' ? 'active' : ''}`}
              onClick={() => setActiveTab('revoke')}
            >
              Revoke Identity
            </div>
          </>
        )}
        {isOwner && (
          <div 
            className={`tab ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            Admin Panel
          </div>
        )}
      </div>
      
      {activeTab === 'register' && (
        <RegistrationForm 
          web3={web3} 
          contract={contract} 
          account={accounts[0]} 
        />
      )}
      
      {activeTab === 'check' && (
        <IdentityChecker
          web3={web3}
          contract={contract}
        />
      )}
      
      {isVerifier && activeTab === 'verify' && (
        <VerificationPanel
          web3={web3}
          contract={contract}
          account={accounts[0]}
        />
      )}

      {isVerifier && activeTab === 'revoke' && (
        <RevocationPanel
          web3={web3}
          contract={contract}
          account={accounts[0]}
        />
      )}
      
      {isOwner && activeTab === 'admin' && (
        <AdminPanel
          web3={web3}
          contract={contract}
          account={accounts[0]}
        />
      )}
    </div>
  );
}

export default App;
