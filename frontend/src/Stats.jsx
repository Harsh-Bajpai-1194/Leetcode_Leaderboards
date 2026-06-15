import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
// import './style.css'; // Commented out to resolve compilation error in this environment
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Safe environment variable access for both local Vite and preview environments
const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || 'placeholder';

// 🛠️ FIX: Initialize Supabase OUTSIDE the component so it only runs once!
// This instantly removes the "Multiple GoTrueClient instances" warning.
const supabase = createClient(supabaseUrl, supabaseKey);

const Stats = () => {
  const { username } = useParams();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dbStats, setDbStats] = useState(null);

  // --- AI CHATBOT STATE ---
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Initialize welcome message dynamically based on the profile being viewed
  useEffect(() => {
    setChatMessages([
      { sender: 'ai', text: `🤖 Hello! I am CodeX AI. Want me to analyze ${username}'s performance or suggest topics for them to practice?` }
    ]);
  }, [username]);

  // Auto-scroll chat to the bottom when new messages appear
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiTyping]);

  // --- 🪄 MAGIC TEXT FORMATTER FOR GEMINI MARKDOWN ---
  const formatMessage = (text) => {
    // Split the text by bold markers (**)
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      // If it's a bold segment, render it wrapped in <strong> with your brand color
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} style={{ color: '#ffa116' }}>{part.slice(2, -2)}</strong>;
      }
      // Otherwise, handle normal text and convert \n to <br/> tags
      return (
        <span key={index}>
          {part.split('\n').map((line, i) => (
            <React.Fragment key={i}>
              {line}
              {i !== part.split('\n').length - 1 && <br />}
            </React.Fragment>
          ))}
        </span>
      );
    });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isAiTyping) return;

    const userMessage = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setChatInput('');
    setIsAiTyping(true);

    try {
      const isPrivate = !userData?.matchedUser?.submitStats;
      const statsArray = userData?.matchedUser?.submitStats?.acSubmissionNum || [];
      const ranking = userData?.userContestRanking;

      // Package the user's stats so the AI has context
      const contextData = {
        username: username,
        totalSolved: isPrivate ? (dbStats?.total_solved || 0) : (statsArray.find(s => s.difficulty === 'All')?.count || dbStats?.total_solved || 0),
        easy: isPrivate ? (dbStats?.easy_solved || 0) : (statsArray.find(s => s.difficulty === 'Easy')?.count || dbStats?.easy_solved || 0),
        medium: isPrivate ? (dbStats?.medium_solved || 0) : (statsArray.find(s => s.difficulty === 'Medium')?.count || dbStats?.medium_solved || 0),
        hard: isPrivate ? (dbStats?.hard_solved || 0) : (statsArray.find(s => s.difficulty === 'Hard')?.count || dbStats?.hard_solved || 0),
        rating: ranking ? Math.round(ranking.rating) : 'Unrated',
        topPercentage: ranking?.topPercentage || 'N/A'
      };

      const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:10000';
      
      const response = await fetch(`${backendUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: userMessage, 
          context: contextData 
        })
      });

      const data = await response.json();

      if (response.ok) {
        setChatMessages(prev => [...prev, { sender: 'ai', text: data.reply }]);
      } else {
        setChatMessages(prev => [...prev, { sender: 'ai', text: `⚠️ Error: ${data.error}` }]);
      }

    } catch (err) {
      console.error("Chat API Error:", err);
      setChatMessages(prev => [...prev, { sender: 'ai', text: '⚠️ Connection error. Make sure your backend server is running and restarted!' }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

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
    if (attended.length === 0) return <p style={{color: '#888', fontStyle: 'italic', textAlign: 'center'}}>No contest history available</p>;

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
    if (!calendarStr || calendarStr === "null") return <p style={{color: '#888', fontStyle: 'italic', textAlign: 'center'}}>No submission data visible for private profiles</p>;
    
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

  const totalSolved = isPrivate ? (dbStats?.total_solved || 0) : (stats.find(s => s.difficulty === 'All')?.count || dbStats?.total_solved || 0);
  const easySolved = isPrivate ? (dbStats?.easy_solved || 0) : (stats.find(s => s.difficulty === 'Easy')?.count || dbStats?.easy_solved || 0);
  const mediumSolved = isPrivate ? (dbStats?.medium_solved || 0) : (stats.find(s => s.difficulty === 'Medium')?.count || dbStats?.medium_solved || 0);
  const hardSolved = isPrivate ? (dbStats?.hard_solved || 0) : (stats.find(s => s.difficulty === 'Hard')?.count || dbStats?.hard_solved || 0);

  return (
    <div className="main-wrapper" style={{ padding: '40px', boxSizing: 'border-box' }}>
      <div className="stats-container" style={{ backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '12px', border: '1px solid #333', maxWidth: '1200px', margin: '0 auto', width: '100%', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
        
        {/* --- MAIN 2-COLUMN LAYOUT WRAPPER --- */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px' }}>

          {/* ====  LEFT COLUMN: STATS DASHBOARD  ==== */}
          <div style={{ flex: '2 1 650px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* --- Header Profile Section --- */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <img src={profile.userAvatar || 'https://assets.leetcode.com/users/avatars/avatar_default.jpg'} alt="Profile Avatar" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #ffa116' }} />
              <div>
                <h1 style={{ color: 'white', margin: '0 0 5px 0', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {profile.realName || matchedUser.username}
                  {isPrivate ? (
                    <span style={{ backgroundColor: '#ef4743', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '0.5em', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
                      🔒 Private Profile
                    </span>
                  ) : (
                    <span style={{ backgroundColor: '#4ade80', color: '#1a1a1a', padding: '4px 10px', borderRadius: '12px', fontSize: '0.5em', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
                      🔓 Public Profile
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

            {/* --- Problem Solving & Contest Details Grid --- */}
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

            {/* --- Contest Rating History --- */}
            <div style={{ backgroundColor: '#2c2c2c', padding: '20px', borderRadius: '8px', border: '1px solid #444' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#ffa116' }}>Contest Rating History</h3>
              {renderRatingGraph(userContestRankingHistory)}
            </div>

            {/* --- Submissions Heatmap --- */}
            <div style={{ backgroundColor: '#2c2c2c', padding: '20px', borderRadius: '8px', border: '1px solid #444' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#ffa116' }}>Submissions (Past Year)</h3>
              {renderHeatmap(matchedUser.userCalendar?.submissionCalendar)}
            </div>
          </div>

          {/* =========================================
              RIGHT COLUMN: STICKY AI CHATBOT
          ========================================= */}
          <div style={{ flex: '1 1 350px', position: 'relative' }}>
            {/* The sticky wrapper ensures it stays visible while scrolling the left column */}
            <div className="chatbot-container" style={{ position: 'sticky', top: '20px', height: 'calc(100vh - 120px)', maxHeight: '750px', minHeight: '500px', margin: 0, display: 'flex', flexDirection: 'column' }}>
              
              <div className="chatbot-header">⚡ Ask CodeX AI about @{matchedUser.username}</div>
              
              <div className="chatbot-messages" style={{ flexGrow: 1, maxHeight: 'none', overflowY: 'auto' }}>
                {chatMessages.map((msg, index) => (
                  <div key={index} className={`chat-message ${msg.sender === 'ai' ? 'ai-msg' : 'user-msg'}`}>
                    {/* Re-implemented dynamic markdown formatting */}
                    {msg.sender === 'ai' ? formatMessage(msg.text) : msg.text}
                  </div>
                ))}
                
                {isAiTyping && (
                  <div className="chat-message ai-msg typing-indicator">
                    <span className="dot"></span><span className="dot"></span><span className="dot"></span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <form className="chatbot-input-area" onSubmit={handleSendMessage}>
                <input 
                  type="text" 
                  className="chatbot-input" 
                  placeholder={`Ask AI to analyze ${matchedUser.username}...`} 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />
                <button type="submit" className="chatbot-send-btn">➤</button>
              </form>

            </div>
          </div>

        </div>

        {/* --- Back Button --- */}
        <div style={{ marginTop: '40px', textAlign: 'center' }}>
          <Link to="/" style={{ color: '#888', textDecoration: 'none', display: 'inline-block', padding: '10px 20px', backgroundColor: '#2c2c2c', borderRadius: '5px' }}>
            ← Back to Leaderboard
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Stats;