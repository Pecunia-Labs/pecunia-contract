import { useState } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Navbar from './components/Navbar';

function App() {
  const [ethaddress, setETHAddress] = useState("");

  return (
    <HashRouter>
      <Routes>
        <Route
          path="/dashboard"
          element={
            <Dashboard ethaddress={ethaddress} /> } />
        <Route
          path="/"
          element={
            <>
             <Navbar setETHAddress={setETHAddress} />
             <Home />
            </>} />
      </Routes>
    </HashRouter>
  );
}

export default App;
