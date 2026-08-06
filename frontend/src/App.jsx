import React from 'react';
// Fixed router for Netlify deployment
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Leaderboard from './Leaderboard';
import AdminPanel from './AdminPanel';
import Stats from './Stats';
import Sponsors from './Sponsors';
import SubmissionDetail from './SubmissionDetail';

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

          {/* Sponsors Page */}
          <Route path="/sponsors" element={<Sponsors />} />

          {/* Submissions Detail Page */}
          <Route path="/submissions/:submissionId" element={<SubmissionDetail />} />
          <Route path="/submissions/detail/:submissionId" element={<SubmissionDetail />} />
        </Routes>
      </div>
    </Router>
  );
}
export default App;
