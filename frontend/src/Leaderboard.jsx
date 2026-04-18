import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './style.css'; 
import ActivityGraph from './ActivityGraph';
import { createClient } from '@supabase/supabase-js';

// 1. Initialize Supabase
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

const Leaderboard = () => {
  const [data, setData] = useState({ users: [], activities: [], last_updated: '--' });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [updateStatus, setUpdateStatus] = useState('idle'); 

  // --- DATA FETCHING LOGIC (Both Render & Supabase) ---

  const fetchAllData = async () => {
    try {
      // Step A: Fetch core data from Render (Activities, Graph, etc.)
      const renderResponse = await fetch('https://leetcode-leaderboards.onrender.com/api/leaderboard');
      const renderData = await renderResponse.json();

      // Step B: Fetch Realtime User Rankings from Supabase
      const { data: supabaseUsers, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('problems_solved', { ascending: false });

      if (error) throw error;

      // Step C: Merge Supabase users into the Render data object
      // This ensures your UI uses the fresh Supabase scores but Render's activities
      setData({
        ...renderData,
        users: supabaseUsers.length > 0 ? supabaseUsers : renderData.users
      });
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial Load
    fetchAllData();

    // 2. Setup Realtime Subscription
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leaderboard' },
        (payload) => {
          console.log('Real-time update received from Supabase!', payload);
          fetchAllData(); // Re-sync everything when DB changes
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // --- EVENT HANDLERS ---

  const handleForceUpdate = async () => {
    if (updateStatus !== 'idle') return;
    setUpdateStatus('loading');

    try {
      const response = await fetch('https://leetcode-leaderboards.onrender.com/api/trigger-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      if (response.ok) {
        setUpdateStatus('success');
        // We don't necessarily need window.location.reload() anymore 
        // because Supabase Realtime will catch the update automatically!
        setTimeout(() => setUpdateStatus('idle'), 45000);
      } else {
        setUpdateStatus('error');
        setTimeout(() => setUpdateStatus('idle'), 3000);
      }
    } catch (error) {
      setUpdateStatus('error');
      setTimeout(() => setUpdateStatus('idle'), 3000);
    }
  };

  // --- RENDER HELPERS ---

  const filteredUsers = data.users
    .filter((user) => {
      const name = user.name || user.leetcode_handle || user.username || '';
      return name.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => (b.problems_solved || b.total_solved || 0) - (a.problems_solved || a.total_solved || 0));

  const getButtonText = () => {
    switch(updateStatus) {
      case 'loading': return '⏳ Requesting...';
      case 'success': return '✅ Started (Wait 45s)';
      case 'error': return '❌ Failed. Try Again.';
      default: return '⚡ Force Update';
    }
  };

  const getButtonColor = () => {
    switch(updateStatus) {
      case 'loading': return '#f59e0b';
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      default: return '#ef4743';
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
                  width: '100%', padding: '10px', backgroundColor: '#2c2c2c', color: '#4ade80',
                  border: '1px solid #4ade80', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1em'
                }}>
                  🔒 Admin Panel
                </button>
              </Link>

              <button 
                onClick={handleForceUpdate}
                disabled={updateStatus !== 'idle'}
                style={{
                  width: '100%', padding: '10px', backgroundColor: getButtonColor(),
                  color: 'white', border: 'none', borderRadius: '5px',
                  cursor: updateStatus === 'idle' ? 'pointer' : 'default',
                  fontWeight: 'bold', fontSize: '1em', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', gap: '5px',
                  transition: 'background-color 0.3s ease'
                }}
              >
                {getButtonText()} 
              </button>

              <div style={{ 
                  marginTop: '10px', width: '100%', display: 'flex', flexDirection: 'column', 
                  alignItems: 'center', backgroundColor: '#1a1a1a', padding: '15px', 
                  borderRadius: '8px', border: '1px solid #333', boxSizing: 'border-box'
              }}>
                <div style={{
                  width: '100%', marginBottom: '15px', padding: '4px', borderRadius: '8px',
                  backgroundImage: 'url("/border.gif")', backgroundSize: 'cover', backgroundPosition: 'center', boxSizing: 'border-box'
                }}>
                  <button style={{
                    width: '100%', padding: '10px', backgroundColor: '#ec4899', color: 'white',
                    border: 'none', borderRadius: '5px', fontWeight: 'bold', fontSize: '1em',
                    cursor: 'default', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
                  }}>
                    💖 SPONSORS
                  </button>
                </div>
                <img src="/QR.jpg" alt="Sponsor QR Code" style={{ width: '85%', maxWidth: '180px', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.5)' }} />
                <p style={{ color: '#888', fontSize: '0.8em', marginTop: '10px', textAlign: 'center', marginBottom: 0 }}>
                  Scan to support the project!
                </p>
              </div>
          </div>
      </div>
      
      {/* --- CENTER COLUMN: LEADERBOARD --- */}
      <div className="leaderboard-container">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            LEETCODE LEADERBOARDS
            <img src="https://img.shields.io/badge/Release-v5.3.11-deeppink?style=for-the-the-badge&logo=github" alt="Version" style={{ height: '28px' }} />
        </h1>
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
                          alt="Badge" title={user.badge_name} style={{ width: '25px', height: '25px' }} 
                        />
                      )}
                      <span>{user.name || user.leetcode_handle || user.username}</span>
                      {user.streak > 100 && <span>🔥</span>}
                    </td>
                    <td className="solved-cell">
                      <div className="solved-wrapper">
                        <span className="main-stat">{user.problems_solved || user.total_solved || 0}</span>
                        <div className="hover-stats">
                          <span className="easy" title="Easy">{user.easy_solved || 0}</span>
                          <span className="medium" title="Medium">{user.medium_solved || 0}</span>
                          <span className="hard" title="Hard">{user.hard_solved || 0}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <a href={user.url || `https://leetcode.com/${user.leetcode_handle}`} target="_blank" rel="noopener noreferrer" 
                        style={{ textDecoration: 'none', backgroundColor: '#ffa116', color: 'black', padding: '5px 10px', borderRadius: '5px', fontWeight: 'bold' }}>
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

      {/* --- RIGHT COLUMN: ACTIVITY --- */}
      <div className="right-section" style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: '300px' }}>
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
