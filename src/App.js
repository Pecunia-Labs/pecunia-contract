import { useState } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Navbar from './components/Navbar';

function App() {
  const [ethaddress, setETHAddress] = useState("");
  const [sequenceWallet, setSequenceWallet] = useState(null);
  const [contractHeir, setContractHeir] = useState(null);
  const [contractNFT, setContractNFT] = useState(null);

  return (
    <HashRouter>
      <Routes>
        <Route
          path="/dashboard"
          element={
            <Dashboard
              ethaddress={ethaddress}
              sequenceWallet={sequenceWallet}
              contractHeir={contractHeir}
              contractNFT={contractNFT} /> } />
        <Route
          path="/"
          element={
            <>
             <Navbar setETHAddress={setETHAddress} setSequenceWallet={setSequenceWallet} setContractHeir={setContractHeir} setContractNFT={setContractNFT} />
             <Home />
            </>} />
      </Routes>
    </HashRouter>
  );
}

export default App;
