import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './style.css'; 
import ActivityGraph from './ActivityGraph';

const Leaderboard = () => {
  const [data, setData] = useState({ users: [], activities: [], last_updated: '--' });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // 👇 NEW STATE: Controls button text (idle, loading, success, error)
  const [updateStatus, setUpdateStatus] = useState('idle'); 

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

  // 👇 UPDATED: Silent Update (No Alerts)
  const handleForceUpdate = async () => {
    if (updateStatus !== 'idle') return; // Prevent double clicking

    setUpdateStatus('loading'); // Change button text immediately

    try {
        const response = await fetch('https://leetcode-leaderboards.onrender.com/api/trigger-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        
        if (response.ok) {
            setUpdateStatus('success');
            // Automatically reload page after 30 seconds to show results
            setTimeout(() => {
                window.location.reload();
            }, 30000);
        } else {
            setUpdateStatus('error');
            setTimeout(() => setUpdateStatus('idle'), 3000); // Reset after 3s
        }
    } catch (error) {
        setUpdateStatus('error');
        setTimeout(() => setUpdateStatus('idle'), 3000);
    }
  };

  const filteredUsers = data.users
    .filter((user) => {
      const name = user.name || user.username || '';
      return name.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => (b.total_solved || 0) - (a.total_solved || 0));

  // 👇 HELPER: Get Button Text based on Status
  const getButtonText = () => {
      switch(updateStatus) {
          case 'loading': return '⏳ Requesting...';
          case 'success': return '✅ Started (Wait 30s)';
          case 'error': return '❌ Failed. Try Again.';
          default: return '⚡ Force Update';
      }
  };

  // 👇 HELPER: Get Button Color
  const getButtonColor = () => {
      switch(updateStatus) {
          case 'loading': return '#f59e0b'; // Orange
          case 'success': return '#10b981'; // Green
          case 'error': return '#ef4444';   // Red
          default: return '#ef4743';        // Default Red
      }
  };

  return (
    <div className="main-wrapper">
      
      {/* --- LEFT COLUMN: LOGO & BUTTONS --- */}
      <div style={{ flex: 25, maxWidth: '400px', minWidth: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src="/leetcode.jpg" alt="LEETCODE" className="leetcode-img" style={{ width: '100%', display: 'block', borderRadius: '10px' }} />
          
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px', width: '80%' }}>
              
              <Link to="/admin" style={{ textDecoration: 'none', width: '100%' }}>
                <button style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#2c2c2c',
                  color: '#4ade80',
                  border: '1px solid #4ade80',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1em'
                }}>
                  🔒 Admin Panel
                </button>
              </Link>

              {/* 👇 UPDATED BUTTON */}
              <button 
                onClick={handleForceUpdate}
                disabled={updateStatus !== 'idle'} // Disable while running
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: getButtonColor(), // Dynamic Color
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: updateStatus === 'idle' ? 'pointer' : 'default',
                  fontWeight: 'bold',
                  fontSize: '1em',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  transition: 'background-color 0.3s ease'
                }}
              >
                {getButtonText()} 
              </button>
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
                    
                    <td style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {user.badge_icon && (
                        <img 
                          src={user.badge_icon.startsWith('http') ? user.badge_icon : `https://leetcode.com${user.badge_icon}`} 
                          alt="Badge" 
                          title={user.badge_name}
                          style={{ width: '25px', height: '25px' }} 
                        />
                      )}
                      <span>{user.name || user.username}</span>
                    </td>
                    
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
