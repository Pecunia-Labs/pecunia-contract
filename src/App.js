import { HashRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Navbar from './components/Navbar';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route
          path="/dashboard"
          element={
            <Dashboard /> } />
        <Route
          path="/"
          element={
            <>
             <Navbar />
             <Home />
            </>} />
      </Routes>
    </HashRouter>
  );
}

export default App;
