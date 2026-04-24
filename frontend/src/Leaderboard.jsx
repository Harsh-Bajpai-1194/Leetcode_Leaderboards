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

  const fetchAllData = async () => {
    try {
      setLoading(true);

      // A. Fetch Users
      const { data: supabaseUsers, error: userError } = await supabase
        .from('leaderboard')
        .select('*')
        .order('total_solved', { ascending: false });

      if (userError) throw userError;

const twentyOneDaysAgo = new Date();
twentyOneDaysAgo.setDate(twentyOneDaysAgo.getDate() - 21);

// Change your B. Fetch Activities call to this:
const { data: supabaseActivities, error: actError } = await supabase
  .from('activities')
  .select('*')
  .gte('created_at', twentyOneDaysAgo.toISOString()) // Fetch everything from last 21 days
  .order('created_at', { ascending: false }); 

      if (actError) throw actError;

      // C. Fetch Metadata
      const { data: metaData, error: metaError } = await supabase
        .from('metadata')
        .select('date_string')
        .eq('type', 'last_updated');

      if (metaError) throw metaError;

      // --- D. PROCESS GRAPH DATA ---
      const daysToLookBack = 21;
      const dailySolvedMap = {};
      
      if (supabaseActivities) {
        supabaseActivities.forEach(act => {
          if (!act.text || !act.created_at) return;
          const match = act.text.match(/\+(\d+)/);
          const solved = match ? parseInt(match[1]) : 0;
          const dateKey = new Date(act.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (!dailySolvedMap[dateKey]) dailySolvedMap[dateKey] = 0;
          dailySolvedMap[dateKey] += solved;
        });
      }

      const processedGraphData = [];
      for (let i = daysToLookBack - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        processedGraphData.push({ 
          date: dateStr, 
          solved: dailySolvedMap[dateStr] || 0 
        });
      }

      setData({
        users: supabaseUsers || [],
        activities: supabaseActivities ? supabaseActivities.slice(0, 50) : [],
        graph_data: processedGraphData,
        last_updated: (metaData && metaData.length > 0) ? metaData[0].date_string : "--"
      });
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leaderboard' }, () => fetchAllData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleForceUpdate = async () => {
    if (updateStatus !== 'idle') return;
    setUpdateStatus('loading');
    try {
      const response = await fetch('https://zxmysspedkhrtoqtbjtg.functions.supabase.co/sync-engine', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        }
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
    <div className="main-wrapper" style={{ display: 'flex', gap: '20px', padding: '20px', width: '100%', boxSizing: 'border-box', minHeight: '100vh', backgroundColor: '#000' }}>

      {/* --- LEFT COLUMN: flex 1 --- */}
      <div className="left-section" style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src="/leetcode.jpg" alt="LEETCODE" className="leetcode-img" style={{ width: '100%', borderRadius: '10px' }} />

          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
              <Link to="/admin" style={{ textDecoration: 'none', width: '100%' }}>
                <button style={{ width: '100%', padding: '12px', backgroundColor: '#2c2c2c', color: '#4ade80', border: '1px solid #4ade80', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>🔒 Admin Panel</button>
              </Link>

              <button onClick={handleForceUpdate} disabled={updateStatus !== 'idle'} style={{ width: '100%', padding: '12px', backgroundColor: getButtonColor(), color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: updateStatus === 'idle' ? 'pointer' : 'default' }}>
                {getButtonText()} 
              </button>

              <div style={{ marginTop: '10px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
                <div style={{ width: '100%', marginBottom: '15px', padding: '4px', borderRadius: '8px', backgroundImage: 'url("/border.gif")', backgroundSize: 'cover' }}>
                  <button style={{ width: '100%', padding: '10px', backgroundColor: '#ec4899', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold' }}>💖 SPONSORS</button>
                </div>
                <img src="/QR.jpg" alt="QR" style={{ width: '90%', borderRadius: '8px' }} />
              </div>
          </div>
      </div>

      {/* --- CENTER COLUMN: flex 3 --- */}
      <div className="leaderboard-container" style={{ flex: 3, minWidth: '0' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            LEETCODE LEADERBOARDS
            <img src="https://img.shields.io/badge/Release-v5.5.15-deeppink?style=for-the-the-badge&logo=github" alt="v5.5.15" style={{ height: '28px' }} />
        </h1>
        <div style={{ textAlign: 'center', color: '#888', marginBottom: '15px' }}>Last updated: {data.last_updated}</div>
        <div className="search-container">
          <input
            type="text"
            id="searchInput"
            placeholder="🔍 Search for names..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        <div className="table-wrapper">
          <table className="leaderboard-table" style={{ width: '100%' }}>
            <thead><tr><th>S.no.</th><th>NAME</th><th>Solved</th><th>Profile</th></tr></thead>
            <tbody>
              {loading ? (<tr><td colSpan="4" style={{ textAlign: 'center' }}>Loading...</td></tr>) : (
                filteredUsers.map((user, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {user.badge_icon && <img src={user.badge_icon.startsWith('http') ? user.badge_icon : `https://leetcode.com${user.badge_icon}`} alt="Badge" style={{ width: '25px' }} />}
                      <span>{user.name || user.username}</span>
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
                    <td><a href={user.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', backgroundColor: '#ffa116', color: 'black', padding: '5px 12px', borderRadius: '5px', fontWeight: 'bold' }}>View</a></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- RIGHT COLUMN: flex 2 --- */}
      <div className="right-section" style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '20px', minWidth: '320px' }}>
        <div className="activity-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', margin: 0 }}>
          <div className="activity-title">Activity Feed</div>
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '450px' }}>
            {data.activities && data.activities.length > 0 ? (
              data.activities.map((act, index) => (
                <div key={index} style={{ marginBottom: '10px', borderBottom: '1px solid #333', paddingBottom: '5px' }}>
                  <span style={{ color: 'white', fontWeight: 'bold' }}>{act.text}</span><br />
                  <span style={{ fontSize: '0.8em', color: '#666' }}>{act.time}</span>
                </div>
              ))
            ) : (<div style={{ textAlign: 'center', color: '#888' }}>NO ACTIVITY CURRENTLY</div>)}
          </div>
        </div>
        <div className="graph-wrapper" style={{ backgroundColor: '#1a1a1a', borderRadius: '8px', padding: '10px', border: '1px solid #333' }}>
             {!loading && data.graph_data && <ActivityGraph data={data.graph_data} />}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
