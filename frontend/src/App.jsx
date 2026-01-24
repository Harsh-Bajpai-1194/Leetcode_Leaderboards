import React from 'react';
// Fixed router for Netlify deployment
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Leaderboard from './Leaderboard';
import AdminPanel from './AdminPanel';

function App() {
  return (
    <Router>
      <div className="App">
        <h1 style={{color: 'yellow', textAlign: 'center'}}>VERSION TEST: 2.0</h1>
        <Routes>
          {/* Main Page */}
          <Route path="/" element={<Leaderboard />} />
          
          {/* Admin Page */}
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </div>
    </Router>
  );
}
export default App;
