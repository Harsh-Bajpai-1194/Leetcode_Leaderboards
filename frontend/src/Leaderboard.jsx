import React, { useState, useEffect } from 'react';
import './style.css'; // Make sure your CSS file is imported here

const Leaderboard = () => {
  const [data, setData] = useState({ users: [], activities: [], last_updated: '--' });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // 1. Fetch Data on Component Mount
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

  // 2. Filter Users based on Search
  const filteredUsers = data.users
    .filter((user) => {
      const name = user.name || user.username || '';
      return name.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => (b.total_solved || 0) - (a.total_solved || 0));

  return (
    <div className="main-wrapper">
      {/* --- LEETCODE LOGO --- */}
      <img src="leetcode.jpg" alt="LEETCODE" className="leetcode-img" />

      {/* --- LEADERBOARD SECTION --- */}
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

        {/* 👇 WRAPPER DIV FOR SCROLLING 👇 */}
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
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{user.name || user.username}</td>
                    <td style={{ fontWeight: 'bold', color: '#ffa116' }}>{user.total_solved || 0}</td>
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
        {/* 👆 END OF WRAPPER 👆 */}
      </div>

      {/* --- ACTIVITY FEED SECTION --- */}
      <div className="activity-container">
        <div className="activity-title">Activity Feed</div>
        <div id="activity-content">
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

      {/* --- FOOTER CONTACT --- */}
      <div className="contact">
        <h3>If you want your name in the leaderboard, send your Leetcode Profile link here 👇</h3>
        <div className="social-links">
          <a href="https://wa.me/+918081605775?text=Hello" target="_blank" rel="noopener noreferrer">
            <i className="fab fa-whatsapp"></i>
          </a>
          <a href="https://www.linkedin.com/in/Harsh-Bajpai1194" target="_blank" rel="noopener noreferrer">
            <i className="fab fa-linkedin"></i>
          </a>
          <a href="mailto:harshbajpai1194@gmail.com" target="_blank" rel="noopener noreferrer">
            <i className="fas fa-envelope"></i>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;