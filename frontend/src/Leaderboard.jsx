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

  const fetchAllData = async () => {
    try {
      setLoading(true);

      const [usersResponse, metaResponse] = await Promise.all([
        supabase.from('leaderboard').select('*').order('total_solved', { ascending: false }),
        supabase.from('metadata').select('date_string').eq('type', 'last_updated')
      ]);

      if (usersResponse.error) throw usersResponse.error;
      if (metaResponse.error) throw metaResponse.error;

      setData(prev => ({
        ...prev,
        users: usersResponse.data || [],
        last_updated: (metaResponse.data && metaResponse.data.length > 0) ? metaResponse.data[0].date_string : "--"
      }));
      setLoading(false); 

      const now = new Date();
      const twentyOneDaysAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 21));

      const { data: supabaseActivities, error: actError } = await supabase
        .from('activities')
        .select('created_at, text, time')
        .gte('created_at', twentyOneDaysAgo.toISOString()) 
        .order('created_at', { ascending: false })
        .limit(5000);

      if (actError) throw actError;

      const daysToLookBack = 21;
      const dailySolvedMap = {};

      if (supabaseActivities) {
        supabaseActivities.forEach(act => {
          if (!act.text || !act.created_at) return;
          const match = act.text.match(/\+(\d+)/);
          const solved = match ? parseInt(match[1]) : 0;
          
          const dateKey = new Date(act.created_at).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            timeZone: 'UTC' 
          });
          
          if (!dailySolvedMap[dateKey]) dailySolvedMap[dateKey] = 0;
          dailySolvedMap[dateKey] += solved;
        });
      }

      const processedGraphData = [];
      for (let i = daysToLookBack - 1; i >= 0; i--) {
        const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
        const dateStr = d.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          timeZone: 'UTC'
        });
        processedGraphData.push({ 
          date: dateStr, 
          solved: dailySolvedMap[dateStr] || 0 
        });
      }

      setData(prev => ({
        ...prev,
        activities: supabaseActivities ? supabaseActivities.slice(0, 50) : [],
        graph_data: processedGraphData
      }));
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    
    let debounceTimer;
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leaderboard' }, () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          fetchAllData();
        }, 1500);
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
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

              <div className="sponsor-container">
                <div className="sponsor-banner-wrapper">
                  <button className="sponsor-btn">💖 SPONSORS</button>
                </div>
                <img src="/QR.jpg" alt="QR" className="qr-img" />
              </div>
          </div>
      </div>

      {/* --- CENTER COLUMN --- */}
      <div className="leaderboard-container">
        <h1>
          LEETCODE LEADERBOARDS
          <a href="https://github.com/Harsh-Bajpai-1194/Leetcode_Leaderboards" target="_blank" rel="noopener noreferrer" className="release-link">
            <img src="https://img.shields.io/badge/Release-v5.7.0-deeppink?style=for-the-the-badge&logo=github" alt="v5.7.0" className="release-badge" />
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
        
        <div className="table-wrapper">
          <table className="leaderboard-table">
            <thead><tr><th>S.no.</th><th>NAME</th><th>Solved</th><th>Profile</th><th>Stats</th></tr></thead>
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
                    <td className="stats-btn-cell"><button className="stats-btn">Stats</button></td>
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
          {/* Note: Connected this div to your CSS custom scrollbar ID! */}
          <div id="activity-content"> 
            {data.activities && data.activities.length > 0 ? (
              data.activities.map((act, index) => (
                <div key={index} className="activity-item">
                  <span className="activity-text">{act.text}</span><br />
                  <span className="activity-time">{act.time}</span>
                </div>
              ))
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