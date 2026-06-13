import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './style.css';
import { createClient } from '@supabase/supabase-js';

const Stats = () => {
  const { username } = useParams();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dbStats, setDbStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const supabase = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY
        );

        // Fetch both sources concurrently
        const [apiResponse, dbResponse] = await Promise.all([
          supabase.functions.invoke('get-user-stats', { body: { username } }),
          supabase.from('leaderboard').select('*')
        ]);

        if (apiResponse.error) {
          throw new Error(`Edge Function failed: ${apiResponse.error.message}`);
        }
        
        let data = apiResponse.data;
        if (data && data.error) throw new Error(data.error);
        if (!data || !data.matchedUser) throw new Error('User not found on LeetCode or invalid data received.');

        // Client-Side Case-Insensitive Matching loop
        if (dbResponse.data) {
          const matchedRecord = dbResponse.data.find(u => 
            u.username?.toLowerCase() === username.toLowerCase() ||
            u.leetcode_handle?.toLowerCase() === username.toLowerCase()
          );
          if (matchedRecord) {
            setDbStats(matchedRecord);
          }
        }

        setUserData(data);
        setLoading(false);
      } catch (err) {
        console.error("Stats Fetch Error:", err);
        setError(err.message);
        setLoading(false);
      }
    };
    fetchStats();
  }, [username]);

  const renderRatingGraph = (history) => {
    const attended = history?.filter(h => h.attended) || [];
    if (attended.length === 0) return <p style={{color: '#888', fontStyle: 'italic'}}>No contest history available</p>;

    const ratings = attended.map(h => h.rating);
    const max = Math.max(...ratings) + 100;
    const min = Math.max(0, Math.min(...ratings) - 100);
    
    const width = 800;
    const height = 150;
    
    const points = attended.map((h, i) => {
      const x = (i / (attended.length - 1 || 1)) * width;
      const y = height - ((h.rating - min) / (max - min)) * height;
      return `${x},${y}`;
    });

    return (
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%', minHeight: '150px' }}>
        <polyline points={points.join(' ')} fill="none" stroke="#ffa116" strokeWidth="2" />
        {points.map((p, i) => {
          const [x, y] = p.split(',');
          return (
            <circle key={i} cx={x} cy={y} r="4" fill="#ffa116" style={{ cursor: 'pointer' }}>
              <title>{attended[i].contest.title}: Rating {Math.round(attended[i].rating)}</title>
            </circle>
          );
        })}
      </svg>
    );
  };

  const renderHeatmap = (calendarStr) => {
    if (!calendarStr || calendarStr === "null") return <p style={{color: '#888', fontStyle: 'italic'}}>No submission data visible for private profiles</p>;
    
    const data = JSON.parse(calendarStr || "{}");
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const oneYearAgo = new Date(now);
    oneYearAgo.setDate(now.getDate() - 364);

    const dateCounts = {};
    Object.keys(data).forEach(timestamp => {
      const d = new Date(parseInt(timestamp) * 1000);
      const dateStr = d.toISOString().split('T')[0];
      dateCounts[dateStr] = data[timestamp];
    });

    const boxes = [];
    for (let i = 0; i < 365; i++) {
      const d = new Date(oneYearAgo);
      d.setDate(oneYearAgo.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const count = dateCounts[dateStr] || 0;
      
      let bgColor = '#333';
      if (count > 0) bgColor = '#0e4429';
      if (count > 2) bgColor = '#006d32';
      if (count > 5) bgColor = '#26a641';
      if (count > 10) bgColor = '#39d353';

      boxes.push(
        <div key={i} style={{ width: '12px', height: '12px', backgroundColor: bgColor, borderRadius: '2px' }} title={`${dateStr}: ${count} submissions`} />
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', flexWrap: 'wrap', gap: '4px', height: '110px', overflowX: 'auto', alignContent: 'flex-start' }}>
        {boxes}
      </div>
    );
  };

  if (loading) return <div className="main-wrapper" style={{ justifyContent: 'center', alignItems: 'center' }}><h2 style={{ color: '#4ade80' }}>Loading Stats...</h2></div>;
  if (error || !userData || !userData.matchedUser) return <div className="main-wrapper" style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}><h2 style={{ color: '#ef4743' }}>{error || 'User not found'}</h2><Link to="/" style={{ color: '#888', marginTop: '20px', textDecoration: 'none' }}>← Back to Leaderboard</Link></div>;

  const { matchedUser, userContestRanking, userContestRankingHistory } = userData;
  const profile = matchedUser.profile || {};
  
  const isPrivate = matchedUser.submitStats === null;
  const stats = matchedUser.submitStats?.acSubmissionNum || [];
  const badges = matchedUser.badges || [];

  // Fall back explicitly to localized storage parameters if string matches are null
  const totalSolved = isPrivate ? (dbStats?.total_solved || 0) : (stats.find(s => s.difficulty === 'All')?.count || dbStats?.total_solved || 0);
  const easySolved = isPrivate ? (dbStats?.easy_solved || 0) : (stats.find(s => s.difficulty === 'Easy')?.count || dbStats?.easy_solved || 0);
  const mediumSolved = isPrivate ? (dbStats?.medium_solved || 0) : (stats.find(s => s.difficulty === 'Medium')?.count || dbStats?.medium_solved || 0);
  const hardSolved = isPrivate ? (dbStats?.hard_solved || 0) : (stats.find(s => s.difficulty === 'Hard')?.count || dbStats?.hard_solved || 0);

  return (
    <div className="main-wrapper" style={{ padding: '40px', boxSizing: 'border-box' }}>
      <div className="stats-container" style={{ backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '12px', border: '1px solid #333', maxWidth: '900px', margin: '0 auto', width: '100%', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
          <img src={profile.userAvatar || 'https://assets.leetcode.com/users/avatars/avatar_default.jpg'} alt="Profile Avatar" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #ffa116' }} />
          <div>
            <h1 style={{ color: 'white', margin: '0 0 5px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {profile.realName || matchedUser.username}
              {isPrivate ? (
                <span style={{ backgroundColor: '#ef4743', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '0.5em', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  🔒 Private Profile
                </span>
              ) : (
                <span style={{ backgroundColor: '#4ade80', color: '#1a1a1a', padding: '4px 10px', borderRadius: '12px', fontSize: '0.5em', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  👥 Public Profile
                </span>
              )}
            </h1>
            <p style={{ color: '#888', margin: 0, fontSize: '1.1em' }}>@{matchedUser.username}</p>
            {badges.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                {badges.map((b, i) => (
                  <img key={i} src={b.icon.startsWith('http') ? b.icon : `https://leetcode.com${b.icon}`} title={b.displayName} alt="badge" style={{ width: '30px', height: '30px', borderRadius: '4px' }} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div style={{ backgroundColor: '#2c2c2c', padding: '20px', borderRadius: '8px', border: '1px solid #444' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#ffa116' }}>
              Problem Solving {isPrivate && <span style={{ fontSize: '0.75em', color: '#888', fontWeight: 'normal' }}>(Database Sync)</span>}
            </h3>
            <p style={{ margin: '5px 0', color: 'white' }}><strong>Total:</strong> {totalSolved}</p>
            <div style={{ marginTop: '15px' }}>
              <p style={{ margin: '5px 0', color: '#00af9b' }}>Easy: {easySolved}</p>
              <div style={{ width: '100%', backgroundColor: '#444', height: '8px', borderRadius: '4px' }}>
                <div style={{ width: `${totalSolved ? (easySolved/totalSolved)*100 : 0}%`, backgroundColor: '#00af9b', height: '100%', borderRadius: '4px' }}></div>
              </div>
              <p style={{ margin: '10px 0 5px 0', color: '#ffb800' }}>Medium: {mediumSolved}</p>
              <div style={{ width: '100%', backgroundColor: '#444', height: '8px', borderRadius: '4px' }}>
                <div style={{ width: `${totalSolved ? (mediumSolved/totalSolved)*100 : 0}%`, backgroundColor: '#ffb800', height: '100%', borderRadius: '4px' }}></div>
              </div>
              <p style={{ margin: '10px 0 5px 0', color: '#ff2d55' }}>Hard: {hardSolved}</p>
              <div style={{ width: '100%', backgroundColor: '#444', height: '8px', borderRadius: '4px' }}>
                <div style={{ width: `${totalSolved ? (hardSolved/totalSolved)*100 : 0}%`, backgroundColor: '#ff2d55', height: '100%', borderRadius: '4px' }}></div>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#2c2c2c', padding: '20px', borderRadius: '8px', border: '1px solid #444' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#ffa116' }}>Contest Details</h3>
            {userContestRanking ? (
              <>
                <p style={{ margin: '5px 0', color: 'white' }}><strong>Attended:</strong> {userContestRanking.attendedContestsCount}</p>
                <p style={{ margin: '5px 0', color: 'white' }}><strong>Rating:</strong> {Math.round(userContestRanking.rating)}</p>
                <p style={{ margin: '5px 0', color: 'white' }}><strong>Global Rank:</strong> {userContestRanking.globalRanking}</p>
                {userContestRanking.topPercentage && <p style={{ margin: '15px 0 5px 0', color: '#4ade80', fontSize: '1.2em', fontWeight: 'bold' }}>Top {userContestRanking.topPercentage}%</p>}
              </>
            ) : (
              <p style={{ color: '#888', fontStyle: 'italic', marginTop: '30px', textAlign: 'center' }}>No contest data available</p>
            )}
          </div>
        </div>

        <div style={{ backgroundColor: '#2c2c2c', padding: '20px', borderRadius: '8px', border: '1px solid #444', marginTop: '20px' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#ffa116' }}>Contest Rating History</h3>
          {renderRatingGraph(userContestRankingHistory)}
        </div>

        <div style={{ backgroundColor: '#2c2c2c', padding: '20px', borderRadius: '8px', border: '1px solid #444', marginTop: '20px' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#ffa116' }}>Submissions (Past Year)</h3>
          {renderHeatmap(matchedUser.userCalendar?.submissionCalendar)}
        </div>

        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <Link to="/" style={{ color: '#888', textDecoration: 'none', display: 'inline-block', padding: '10px 20px', backgroundColor: '#2c2c2c', borderRadius: '5px' }}>
            ← Back to Leaderboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Stats;