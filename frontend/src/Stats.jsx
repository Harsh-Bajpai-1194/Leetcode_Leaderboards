import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './style.css';
import { createClient } from '@supabase/supabase-js';

const Stats = () => {
  const { username } = useParams();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const supabase = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY
        );

        let finalData;
        const { data, error: functionError } = await supabase.functions.invoke('get-user-stats', {
          body: { username },
        });

        if (functionError) {
          console.warn("Edge Function failed, falling back to Node server...", functionError);
          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
          try {
            const response = await fetch(`${backendUrl}/api/user-stats/${username}`);
            if (!response.ok) throw new Error('Failed to fetch user stats from Node server.');
            finalData = await response.json();
          } catch (fallbackError) {
            throw new Error(`Backend unreachable! Ensure your server is running and VITE_BACKEND_URL is set.`);
          }
        } else {
          finalData = data;
        }
        
        if (finalData && finalData.error) throw new Error(finalData.error);
        if (!finalData || !finalData.matchedUser) throw new Error('User not found on LeetCode or invalid data received.');

        setUserData(finalData);
        setLoading(false);
      } catch (err) {
        console.error("Stats Fetch Error:", err);
        setError(err.message);
        setLoading(false);
      }
    };
    fetchStats();
  }, [username]);

  // Visual Graph Builder: Rating Line Chart
  const renderRatingGraph = (history) => {
    const attended = history?.filter(h => h.attended) || [];
    if (attended.length === 0) return <p style={{color: '#888'}}>No contest history</p>;

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

  // Visual Graph Builder: GitHub-style Heatmap
  const renderHeatmap = (calendarStr) => {
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
  if (error || !userData || !userData.matchedUser) return <div className="main-wrapper" style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}><h2 style={{ color: '#ef4743' }}>Error: {error || 'User not found'}</h2><Link to="/" style={{ color: '#888', marginTop: '20px', textDecoration: 'none' }}>← Back to Leaderboard</Link></div>;

  const { matchedUser, userContestRanking, userContestRankingHistory } = userData;
  const profile = matchedUser.profile || {};
  const stats = matchedUser.submitStats?.acSubmissionNum || [];
  const badges = matchedUser.badges || [];

  const totalSolved = stats.find(s => s.difficulty === 'All')?.count || 0;
  const easySolved = stats.find(s => s.difficulty === 'Easy')?.count || 0;
  const mediumSolved = stats.find(s => s.difficulty === 'Medium')?.count || 0;
  const hardSolved = stats.find(s => s.difficulty === 'Hard')?.count || 0;

  return (
    <div className="main-wrapper" style={{ padding: '40px', boxSizing: 'border-box' }}>
      <div className="stats-container" style={{ backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '12px', border: '1px solid #333', maxWidth: '900px', margin: '0 auto', width: '100%', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
        
        {/* Header Profile Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
          <img src={profile.userAvatar} alt="Profile Avatar" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #ffa116' }} />
          <div>
            <h1 style={{ color: 'white', margin: '0 0 5px 0' }}>{profile.realName || matchedUser.username}</h1>
            <p style={{ color: '#888', margin: 0, fontSize: '1.1em' }}>@{matchedUser.username}</p>
            {/* Badges List */}
            {badges.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                {badges.map((b, i) => (
                  <img key={i} src={b.icon.startsWith('http') ? b.icon : `https://leetcode.com${b.icon}`} title={b.displayName} alt="badge" style={{ width: '30px', height: '30px', borderRadius: '4px' }} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Data Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          
          <div style={{ backgroundColor: '#2c2c2c', padding: '20px', borderRadius: '8px', border: '1px solid #444' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#ffa116' }}>Problem Solving</h3>
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
                {/* Top Percentage Added Here */}
                <p style={{ margin: '15px 0 5px 0', color: '#4ade80', fontSize: '1.2em', fontWeight: 'bold' }}>Top {userContestRanking.topPercentage}%</p>
              </>
            ) : (
              <p style={{ color: '#888' }}>No contest data available</p>
            )}
          </div>
        </div>

        {/* Rating Line Chart */}
        <div style={{ backgroundColor: '#2c2c2c', padding: '20px', borderRadius: '8px', border: '1px solid #444', marginTop: '20px' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#ffa116' }}>Contest Rating History</h3>
          {renderRatingGraph(userContestRankingHistory)}
        </div>

        {/* Submissions Heatmap */}
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