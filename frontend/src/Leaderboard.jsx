import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './style.css'; 
import ActivityGraph from './ActivityGraph';

const Leaderboard = () => {
  const [data, setData] = useState({ users: [], activities: [], last_updated: '--' });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      
      {/* --- LEFT COLUMN: IMAGE & LOCK --- */}
      {/* We wrap them in a div so they stack vertically while keeping the layout intact */}
      <div style={{ flex: 25, maxWidth: '400px', minWidth: '200px' }}>
          <img 
            src="/leetcode.jpg" 
            alt="LEETCODE" 
            className="leetcode-img" 
            style={{ width: '100%', display: 'block' }} // Ensure image fills the wrapper
          />
          
          {/* 🔒 LOCK BUTTON (Placed immediately below image) */}
          <div style={{ textAlign: 'center', marginTop: '10px', opacity: 0.3 }}>
             <Link to="/admin" title="Admin Login" style={{ color: '#555', fontSize: '1.2em', textDecoration: 'none' }}>
                🔒
             </Link>
          </div>
      </div>
      
      {/* --- CENTER COLUMN: LEADERBOARD --- */}
      <div className="leaderboard-container">
        <h1>LEETCODE LEADERBOARD</h1>
        <div id="last-updated" style={{ textAlign: 'center', color: '#888', fontSize: '0.9em', marginBottom: '15px' }}>
          Last updated: {data.last_updated}
        </div>

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
                    
                    <td className="solved-cell">
                      <div className="solved-wrapper">
                        <span className="main-stat">{user.total_solved || 0}</span>
                        <div className="hover-stats">
                          <span className="easy" title="Easy">{user.easy_solved || 0}</span>
                          <span className="medium" title="Medium">{user.medium_solved || 0}</span>
                          <span className="hard" title="Hard">{user.hard_solved || 0}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <a href={user.url} target="_blank" rel="noopener noreferrer" 
                        style={{
                          textDecoration: 'none',
                          backgroundColor: '#ffa116',
                          color: 'black',
                          padding: '5px 10px',
                          borderRadius: '5px',
                          fontWeight: 'bold'
                        }}>
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

      {/* --- RIGHT COLUMN WRAPPER --- */}
      <div className="right-section" style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: '300px' }}>
        
        {/* BOX 1: Activity Feed */}
        <div className="activity-container" style={{ margin: 0 }}>
          <div className="activity-title">Activity Feed</div>
          
          <div id="activity-content" style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '5px' }}>
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
        </div>

        {/* BOX 2: Graph */}
        <div className="graph-wrapper">
             {!loading && data.graph_data && <ActivityGraph data={data.graph_data} />}
        </div>

      </div>

      <div className="contact" style={{ width: '100%' }}>
        <h3>Thanks for visiting!</h3>
        </div>
    </div>
  );
};

export default Leaderboard;