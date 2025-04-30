/**
 * Truffle configuration file for Identity Verification project
 */

module.exports = {
  networks: {
    // Development network using Ganache
    development: {
      host: "127.0.0.1",
      port: 7545,  // Default Ganache GUI port (use 8545 for ganache-cli)
      network_id: "*",  // Match any network id
    },
  },

  // Configure compilers
  compilers: {
    solc: {
      version: "0.8.19",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
      }
    }
  },

  // Configure contract build directory (to be accessible by the React app)
  contracts_build_directory: "./client/src/contracts"
};