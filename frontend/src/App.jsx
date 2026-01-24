import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Leaderboard from './Leaderboard';
import AdminPanel from './AdminPanel';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Main Page */}
          <Route path="/" element={<Leaderboard />} />
          
          {/* Hidden Admin Page */}
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
