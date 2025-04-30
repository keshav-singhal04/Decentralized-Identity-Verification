

# Project 6: Decentralized Identity Verification
## Team Details

**Team Name**: Synergy

| Team Member                    | Roll Number |
|------------------------|-------------|
| Gireesh Kumar Reddy     | 230005013   |
| Keshav Singhal          | 230001039   |
| Kota Sanjay Kumar       | 230001042   |
| Kumar Ayaman            | 230001044   |
| Kumar Prince            | 230008019   |
| Kunal Gourv             | 230002036   |


## Project Overview

This project aims to develop a full-stack secure identity verification system with the following features:
- Users submit hashed versions of their identity data instead of the original information
- Trusted verifiers authenticate and validate user identities
- Smart contracts maintain and record the verification statuses in a tamper-proof and permanent way


## Project Structure
```
project
├── client          →   React Frontend Application
├── backend         →   Express.js Backend Server
├── contracts       →   Smart Contracts for Identity Management
├── migrations      →   Truffle Migration Files
├── test            →   Test Files
└── node_modules    →   Project Dependencies
```


## Technologies Used

| Technology         | Purpose                                                                 |
|--------------------|-------------------------------------------------------------------------|
| React.js           | Used to build the website                                                    |
| Ganache            | Simulates a local Ethereum blockchain                                    |
| Web3.js            | Connects the website with the blockchain                                 |
| MetaMask           | Loads wallet of accounts provided by Ganache                             |
| Truffle            | Deploys smart contracts and performs testing                              |
| MongoDB            | Stores the off-chain data                                                    |
| OpenZeppelin Ownable | Used for verifier management             |


## Prerequisites

- MetaMask Browser Extension
- Truffle Suite
- Ganache 
- MongoDB
- Node.js

## How to run the website ?

1. Clone the repository:
```
git clone "https://github.com/keshav-singhal04/Decentralized-Identity-Verification"
cd project
```

2. Install dependencies:
```
npm install
```

3. Setup Ganache:
   - Install and launch `Ganache` and create a new workspace
   - Configure the following settings:
     
     ```  
     Network ID: 5777
     RPC Server: HTTP://127.0.0.1:7545
     Chain ID: 1337
     ```
   - Save and start the workspace
   - Note down the first account's private key for development


4. Configure MetaMask:
   - Install `MetaMask` browser extension
   - Add a new custom network with the following details:
     
     ```
     Network Name: Ganache
     RPC URL: HTTP://127.0.0.1:7545
     Chain ID: 1337
     Currency Symbol: ETH
     ```
   - Import an account using the private key obtained from the Ganache account in step 3 

5. Configure the environment variables by creating a `.env` file in the root directory as follows:
   ```
   MONGODB_URI = connection_string
   PRIVATE_KEY = private_key
   ```
   Here, replace `connection_string` with the connection string for your MongoDB database, and `private_key` with the private key obtained from the Ganache 
   account in step 3


6. Start the development environment:
   
   ```
   cd backend
   npm run dev
   ```
7. Open a new terminal to compile and migrate the contract:
   
   ```
   truffle compile
   truffle migrate
   ```
8. In another terminal, start the frontend application:
 
   ```
   cd client
   npm start
   ```
9. On the web browser, click on the `MetaMask` extension button and connect to that Ganache account
10. The website will automatically log in with this account as the admin (since it is the contract deployer). In order to access the website from a regular user's account, copy the private key of some other Ganache account and add it to `MetaMask`


## Features

- **Identity Registration**  
  Users register a hashed identity (`bytes32 identityHash`) via `registerIdentity`, enforcing no duplicates and emitting an `IdentityRegistered` event for auditability.

- **Verifier-Controlled Verification**  
  Authorized verifiers call `verifyIdentity` to mark an identity as verified and emit an `IdentityVerified` event.

- **Identity Revocation**  
  Verifiers use `revokeIdentity` to revoke an identity, recording a `revocationTimestamp` and `revocationReason`, and emitting an `IdentityRevoked` event.

- **Access Control & Management**  
  - `onlyOwner` and `onlyVerifier` modifiers restrict administrative and verification actions.  
  - `addVerifier` / `removeVerifier` let the owner manage which addresses can verify.  

- **Querying Identity Status**  
  Anyone can call `checkIdentity` to retrieve an identity’s registration, verification, and revocation state (including timestamp and reason).

---

## Gas Optimization Techniques

- **Compact Storage Layout**  
  - Uses `bytes32` for identity hashes instead of `string`.  
  - Packs multiple `bool` and `uint256` fields in the `Identity` struct when possible.

- **Event-Driven Logging**  
  Emits concise events (`IdentityRegistered`, `IdentityVerified`, etc.) for off-chain indexing, minimizing on-chain storage.

- **Minimal State Updates**  
  Each function only writes the fields it needs (e.g. revocation only updates `isRevoked`, `revocationTimestamp`, `revocationReason`).

- **O(1) Lookups**  
  Uses `mapping` lookups for verifiers and supported chains, and direct `block.chainid` references to avoid extra calls.

---

## Security Features

- **OpenZeppelin Ownable Access Control**  
  - Only the contract owner can add/remove verifiers.  
  - The `onlyVerifier` modifier allows either the owner or approved verifiers to perform verification/revocation.

- **State-Guard Modifiers & Input Validation**  
  - `notRegistered` and `notRevoked` prevent invalid state transitions.  
  - Rejects zero-value hashes in `registerIdentity`.

- **Privacy-First Design**  
  Only identity hashes are stored on-chain; raw personal data remains off-chain.

- **Fixed-Salt Hashing**  
  A constant salt is applied to all off-chain hashing routines (identity, documents, tokens) to ensure consistency and resist preimage attacks.

---

## Acknowledgement  
- Prof. Subhra Mazumdar, for the project idea and concepts of Ethereum blockchain & smart contracts.  
- A helpful documentation of Web3 on [web3.js](https://web3js.readthedocs.io/en/v1.10.0/web3.html).
- A tutorial on solidity progamming by [Naz Dumanskyy](https://www.youtube.com/watch?v=AYpftDFiIgk&t=8545s)
- An introduction to Ethereum concepts by [thenewboston](https://www.youtube.com/playlist?list=PL6gx4Cwl9DGBrtymuJUiv9Lq5CAYpN8Gl)
