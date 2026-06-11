import React from 'react';
// Fixed router for Netlify deployment
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Leaderboard from './Leaderboard';
import AdminPanel from './AdminPanel';
import Stats from './Stats';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Main Page */}
          <Route path="/" element={<Leaderboard />} />
          
          {/* Admin Page */}
          <Route path="/admin" element={<AdminPanel />} />
          
          {/* Stats Page */}
          <Route path="/stats/:username" element={<Stats />} />
        </Routes>
      </div>
    </Router>
  );
}
export default App;
