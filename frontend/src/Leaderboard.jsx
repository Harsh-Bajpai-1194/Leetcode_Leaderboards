import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './style.css'; 
import ActivityGraph from './ActivityGraph';
import { createClient } from '@supabase/supabase-js';

// 1. Initialize Supabase
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

const Leaderboard = () => {
  const [data, setData] = useState({ users: [], activities: [], graph_data: [], last_updated: '--' });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [updateStatus, setUpdateStatus] = useState('idle'); 

  // --- DATA FETCHING LOGIC (Pure Supabase) ---

  const fetchAllData = async () => {
    try {
      setLoading(true);

      // A. Fetch Users
      const { data: supabaseUsers, error: userError } = await supabase
        .from('leaderboard')
        .select('*')
        .order('total_solved', { ascending: false });

      if (userError) throw userError;

      // B. Fetch Activities
      const { data: supabaseActivities, error: actError } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (actError) throw actError;

      // C. Fetch Metadata
      const { data: metaData, error: metaError } = await supabase
        .from('metadata')
        .select('date_string')
        .eq('type', 'last_updated');

      if (metaError) throw metaError;

      // D. Update State (Fixing the 'meta' is not defined error)
      setData({
        users: supabaseUsers || [],
        activities: supabaseActivities || [],
        graph_data: [], 
        last_updated: (metaData && metaData.length > 0) ? metaData[0].date_string : "--"
      });
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data from Supabase:", error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();

    // Setup Realtime Subscription
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leaderboard' },
        () => {
          console.log('Real-time update received!');
          fetchAllData(); 
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
      // Direct call to your Supabase Edge Function instead of Render
      const response = await fetch('https://zxmysspedkhrtoqtbjtg.functions.supabase.co/sync-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        setUpdateStatus('success');
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
      const name = user.name || user.leetcode_handle || '';
      return name.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => (b.total_solved || 0) - (a.total_solved || 0));

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
      
      {/* --- LEFT COLUMN --- */}
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
              </div>
          </div>
      </div>
      
      {/* --- CENTER COLUMN --- */}
      <div className="leaderboard-container">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            LEETCODE LEADERBOARDS
            <img 
              src="https://img.shields.io/badge/Release-v5.5.8-deeppink?style=for-the-the-badge&logo=github" 
              alt="Version v5.5.8"  
              style={{ height: '28px' }} 
            />
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
            <tbody>
              {loading ? (
                <tr><td colSpan="4" style={{ textAlign: 'center' }}>Loading from Supabase...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center' }}>No users found.</td></tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <tr key={index} data-rank={index + 1}>
                    <td>{index + 1}</td>
                    <td style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {user.badge_icon && (
                        <img 
                          src={user.badge_icon.startsWith('http') ? user.badge_icon : `https://leetcode.com${user.badge_icon}`} 
                          alt="Badge" style={{ width: '25px', height: '25px' }} 
                        />
                      )}
                      <span>{user.name || user.leetcode_handle}</span>
                    </td>
                    <td className="solved-cell">
                      <div className="solved-wrapper">
                        <span className="main-stat">{user.total_solved || 0}</span>
                        <div className="hover-stats">
                          <span className="easy">{user.easy_solved || 0}</span>
                          <span className="medium">{user.medium_solved || 0}</span>
                          <span className="hard">{user.hard_solved || 0}</span>
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
    </div>
  );
};

export default Leaderboard;
