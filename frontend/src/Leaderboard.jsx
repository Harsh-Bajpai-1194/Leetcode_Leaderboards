import React, { useState, useEffect } from 'react';
import './style.css'; 
import ActivityGraph from './ActivityGraph';

const Leaderboard = () => {
  const [data, setData] = useState({ users: [], activities: [], last_updated: '--' });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Keep this pointing to your Render backend for the live site
    fetch('https://leetcode-leaderboards.onrender.com/api/leaderboard')
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load API data");
        return response.json();
      })
      .then((apiData) => {
        setData(apiData);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error:", error);
        setLoading(false);
      });
  }, []);

  const filteredUsers = data.users
    .filter((user) => {
      const name = user.name || user.username || '';
      return name.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => (b.total_solved || 0) - (a.total_solved || 0));

  return (
    <div className="main-wrapper">
      <img src="/leetcode.jpg" alt="LEETCODE" className="leetcode-img" />
      
      {/* --- CENTER COLUMN: LEADERBOARD --- */}
      <div className="leaderboard-container">
        <h1>LEETCODE LEADERBOARD</h1>
        <div id="last-updated" style={{ textAlign: 'center', color: '#888', fontSize: '0.9em', marginBottom: '15px' }}>
          Last updated: {data.last_updated}
        </div>

        {/* (Graph removed from here) */}

        <div className="search-container">
          <input
            type="text"
            id="searchInput"
            placeholder="🔍 Search for names..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="table-wrapper">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>S.no.</th>
                <th>NAME</th>
                <th>Solved</th>
                <th>Profile</th>
              </tr>
            </thead>
            <tbody id="leaderboard-body">
              {loading ? (
                <tr><td colSpan="4" style={{ textAlign: 'center' }}>Loading...</td></tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <tr key={index} data-rank={index + 1}>
                    <td>{index + 1}</td>
                    
                    <td>{user.name || user.username}</td>
                    
                    {/* Solved Column */}
                    <td className="solved-cell">
                      <div className="solved-wrapper">
                        <span className="main-stat">
                          {user.total_solved || 0}
                        </span>
                        <div className="hover-stats">
                          <span className="easy" title="Easy">{user.easy_solved || 0}</span>
                          <span className="medium" title="Medium">{user.medium_solved || 0}</span>
                          <span className="hard" title="Hard">{user.hard_solved || 0}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <a
                        href={user.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          textDecoration: 'none',
                          backgroundColor: '#ffa116',
                          color: 'black',
                          padding: '5px 10px',
                          borderRadius: '5px',
                          fontWeight: 'bold'
                        }}
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- RIGHT COLUMN: ACTIVITY & GRAPH --- */}
      <div className="activity-container">
        <div className="activity-title">Activity Feed</div>
        
        {/* 1. The Activity List */}
        <div id="activity-content" style={{ marginBottom: '20px' }}>
          {data.activities && data.activities.length > 0 ? (
            data.activities.map((act, index) => (
              <div key={index} style={{ marginBottom: '10px', borderBottom: '1px solid #333', paddingBottom: '5px' }}>
                <span style={{ color: 'white', fontWeight: 'bold' }}>{act.text}</span>
                <br />
                <span style={{ fontSize: '0.8em', color: '#666' }}>{act.time}</span>
              </div>
            ))
          ) : (
            <div>NO ACTIVITY CURRENTLY</div>
          )}
        </div>

        {/* 2. 📈 GRAPH MOVED HERE (Bottom of Sidebar) */}
        <div style={{ borderTop: '1px solid #333', paddingTop: '15px' }}>
             {!loading && data.graph_data && <ActivityGraph data={data.graph_data} />}
        </div>

      </div>

      <div className="contact">
        <h3>If you want your name in the leaderboard, send your Leetcode Profile link here 👇</h3>
        <div className="social-links">
          <a href="#" target="_blank"><i className="fab fa-whatsapp"></i></a>
          <a href="#" target="_blank"><i className="fab fa-linkedin"></i></a>
          <a href="#" target="_blank"><i className="fas fa-envelope"></i></a>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;