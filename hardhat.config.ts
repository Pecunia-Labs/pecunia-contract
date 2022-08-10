
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });


export default {
  solidity: {
    version: "0.8.2",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
    },
    mumbai: {
      url: process.env.MUMBAI_URL || '',
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
  },
  },
};