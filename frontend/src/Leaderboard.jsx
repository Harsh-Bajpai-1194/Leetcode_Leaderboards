import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './style.css'; 
import ActivityGraph from './ActivityGraph';
import { createClient } from '@supabase/supabase-js';

// 1. Initialize Supabase safely
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

const Leaderboard = () => {
  const [data, setData] = useState({ users: [], activities: [], graph_data: [], last_updated: '--' });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchAllData = async () => {
    // 1. STALE-WHILE-REVALIDATE: Instantly load cached data (0ms response time)
    const cachedData = localStorage.getItem('leaderboard_cache');
    if (cachedData) {
      try {
        setData(JSON.parse(cachedData));
        setLoading(false);
      } catch (e) {
        setLoading(true);
      }
    } else {
      setLoading(true);
    }

    let fetchedViaSupabase = false;

    if (supabase) {
      try {
        const now = new Date();
        const twentyOneDaysAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 21));

        const [usersResponse, metaResponse, activitiesResponse] = await Promise.all([
          supabase.from('leaderboard').select('*').order('total_solved', { ascending: false }),
          supabase.from('metadata').select('date_string').eq('type', 'last_updated'),
          supabase.from('activities')
            .select('created_at, text, time, submission_id')
            .gte('created_at', twentyOneDaysAgo.toISOString()) 
            .order('created_at', { ascending: false })
            .limit(5000)
        ]);

        if (!usersResponse.error && usersResponse.data && usersResponse.data.length > 0) {
          const supabaseActivities = activitiesResponse.data || [];
          const daysToLookBack = 21;
          const dailySolvedMap = {};

          supabaseActivities.forEach(act => {
            if (!act.text || !act.created_at) return;
            const match = act.text.match(/\+(\d+)/);
            const solved = match ? parseInt(match[1]) : 0;
            
            const dateKey = new Date(act.created_at).toLocaleDateString('en-US', { 
              month: 'short', day: 'numeric', timeZone: 'UTC' 
            });
            
            if (!dailySolvedMap[dateKey]) dailySolvedMap[dateKey] = 0;
            dailySolvedMap[dateKey] += solved;
          });

          const processedGraphData = [];
          for (let i = daysToLookBack - 1; i >= 0; i--) {
            const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
            processedGraphData.push({ date: dateStr, solved: dailySolvedMap[dateStr] || 0 });
          }

          const freshData = {
            users: usersResponse.data || [],
            last_updated: (metaResponse.data && metaResponse.data.length > 0) ? metaResponse.data[0].date_string : "--",
            activities: supabaseActivities.slice(0, 50),
            graph_data: processedGraphData
          };

          setData(freshData);
          localStorage.setItem('leaderboard_cache', JSON.stringify(freshData));
          setLoading(false);
          fetchedViaSupabase = true;
        }
      } catch (error) {
        console.warn("Supabase fetch failed, falling back to server API:", error?.message || error);
      }
    }

    if (!fetchedViaSupabase) {
      try {
        const response = await fetch('/api/leaderboard');
        const apiData = await response.json();
        if (apiData && apiData.users) {
          setData(apiData);
          localStorage.setItem('leaderboard_cache', JSON.stringify(apiData));
        }
      } catch (err) {
        console.error("API Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchAllData();
    
    let debounceTimer;
    let channel;

    const handleChanges = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => fetchAllData(), 1500);
    };

    if (supabase) {
      try {
        channel = supabase
          .channel('schema-db-changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'leaderboard' }, handleChanges)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, handleChanges)
          .subscribe();
      } catch (e) {
        console.warn('Supabase subscribe failed:', e);
      }
    }

    return () => { 
      if (supabase && channel) supabase.removeChannel(channel); 
      clearTimeout(debounceTimer);
    };
  }, []);

  const filteredUsers = data.users
    .filter((user) => {
      const name = user.name || user.leetcode_handle || '';
      return name.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => (b.total_solved || 0) - (a.total_solved || 0));

  return (
    <div className="main-wrapper">

      {/* --- LEFT COLUMN --- */}
      <div className="left-section">
          <img src="/leetcode.jpg" alt="LEETCODE" className="leetcode-img" />

          <div className="left-menu-container">
              <Link to="/admin" className="admin-link">
                <button className="admin-btn">🔒 Admin Panel</button>
              </Link>
                {/* The animated wrapper is now perfectly uniform */}
                <div className="sponsor-banner-wrapper">
                  <div className="sponsor-container" style={{ margin: 0, padding: '15px' }}>
                    
                    {/* Link is applied ONLY to the button now */}
                    <Link to="/sponsors" style={{ width: '100%', textDecoration: 'none' }}>
                      <button className="sponsor-btn" style={{ marginBottom: '15px', width: '100%' }}>
                        💵 SPONSORS 💵
                      </button>
                    </Link>
                    
                    <div style={{ fontSize: '0.9rem', color: '#ddd', textAlign: 'center', marginBottom: '10px' }}>
                      🙏 Please donate 🙏
                      <br />
                      Even ₹1 helps!
                    </div>

                    <img src="/QR.jpg" alt="QR" className="qr-img" />

                    <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '8px', textAlign: 'center' }}>
                      Our Goal: $3/month for proxy servers <br />
                      (☕ Keep the Server Alive)
                    </div>
                  </div></div>
                  </div></div>
                  
                  

      {/* --- CENTER COLUMN --- */}
      <div className="leaderboard-container">
        <h1>
          LEETCODE LEADERBOARDS
          <a href="https://github.com/Harsh-Bajpai-1194/Leetcode_Leaderboards" target="_blank" rel="noopener noreferrer" className="release-link">
            <img src="https://img.shields.io/badge/Release-v5.8.2-deeppink?style=for-the-the-badge&logo=github" alt="v5.8.2" className="release-badge" />
          </a>
          <a href="https://leetcode-leaderboards-status.betteruptime.com/" target="_blank" rel="noopener noreferrer" className="status-link" title="Website Status">
            <img src="/status.jpg" alt="Status" className="status-btn" />
          </a>
        </h1>
        <div className="last-updated">Last updated: {data.last_updated}</div>
        
        <div className="search-container">
          <input
            type="text"
            id="searchInput"
            placeholder="🔍 Search for names..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* COMBINED RESPONSIVE WRAPPER */}
        <div className="table-wrapper table-responsive">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>S.no.</th>
                <th>NAME</th>
                <th>Solved</th>
                <th>Profile</th>
                <th>Stats</th>
              </tr>
            </thead>
            <tbody>
              {loading && data.users.length === 0 ? (<tr><td colSpan="5" className="loading-text">Loading...</td></tr>) : (
                filteredUsers.map((user, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td className="user-name-cell">
                      {user.badge_icon && <img src={user.badge_icon.startsWith('http') ? user.badge_icon : `https://leetcode.com${user.badge_icon}`} alt="Badge" className="user-badge" />}
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
                    <td><a href={user.url} target="_blank" rel="noopener noreferrer" className="profile-btn">View</a></td>
                    <td className="stats-btn-cell">
                      <button 
                        className="stats-btn" 
                        onClick={() => navigate(`/stats/${user.leetcode_handle || user.username}`)}> Stats </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* --- RIGHT COLUMN --- */}
      <div className="right-section">
        <div className="activity-container">
          <div className="activity-title">Activity Feed</div>
          <div id="activity-content"> 
            {data.activities && data.activities.length > 0 ? (
              data.activities.map((act, index) => {
                const subId = act.submission_id || (act.text && act.text.match(/submission[s]?\/detail\/(\d+)/)?.[1]) || '2096549016';
                
                // Helper to extract user name from activity text
                let userName = act.user_name || act.name || act.username || '';
                if (!userName && act.text) {
                  const cleanText = act.text.replace(/^🎉\s*/, '').trim();
                  if (cleanText.includes(' got added')) {
                    userName = cleanText.split(' got added')[0].trim();
                  } else if (cleanText.includes(' solved')) {
                    userName = cleanText.split(' solved')[0].trim();
                  }
                }

                const targetUrl = `/submissions/${subId}${userName ? `?user=${encodeURIComponent(userName)}` : ''}`;

                return (
                  <div key={index} className="activity-item">
                    <span className="activity-text">
                      {act.text}
                      {/* Conditionally render the submission link only if the text does not contain '+' */}
                      {!act.text.includes('+') && (
                        <Link
                          to={targetUrl}
                          title="View Submission Details"
                          className="activity-submission-link"
                          style={{ marginLeft: '8px', display: 'inline-block', verticalAlign: 'middle', cursor: 'pointer' }}
                        >
                          <img 
                            src="/submission.jpg" 
                            alt="View Submission" 
                            className="submission-icon-img"
                            style={{ width: '18px', height: '18px', borderRadius: '4px', transition: 'transform 0.2s ease, filter 0.2s ease' }} 
                          />
                        </Link>
                      )}
                    </span>
                    <br />
                    <span className="activity-time">{act.time}</span>
                  </div>
                );
              })
            ) : (<div className="no-activity">NO ACTIVITY CURRENTLY</div>)}
          </div>
        </div>
        <div className="graph-wrapper">
             {data.graph_data && data.graph_data.length > 0 ? (
               <ActivityGraph data={data.graph_data} />
             ) : (
               <div className="graph-loading">Loading graph data...</div>
             )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
