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
        // Initialize Supabase client to call the Edge Function
        const supabase = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY
        );

        let finalData;

        // Try to invoke the 'get-user-stats' Edge Function
        const { data, error: functionError } = await supabase.functions.invoke('get-user-stats', {
          body: { username },
        });

        if (functionError) {
          console.warn("Edge Function not reached, falling back to local server.js...", functionError);
          // Fallback to the local server.js that is running on port 5000
          try {
            const response = await fetch(`http://localhost:5000/api/user-stats/${username}`);
            if (!response.ok) {
              throw new Error('Failed to fetch user stats from both Edge Function and local server.');
            }
            finalData = await response.json();
          } catch (fallbackError) {
            throw new Error(`Backend unreachable! Edge Function missing AND local server.js is not running.`);
          }
        } else {
          finalData = data;
        }
        
        // Safely handle cases where the response contains an error object
        if (finalData && finalData.error) {
          throw new Error(finalData.error);
        }
        if (!finalData || !finalData.matchedUser) {
          throw new Error('User not found on LeetCode or invalid data received.');
        }

        setUserData(finalData);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchStats();
  }, [username]);

  if (loading) {
    return (
      <div className="main-wrapper" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <h2 style={{ color: '#4ade80' }}>Loading Stats...</h2>
      </div>
    );
  }

  if (error || !userData || !userData.matchedUser) {
    return (
      <div className="main-wrapper" style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
        <h2 style={{ color: '#ef4743' }}>Error: {error || 'User not found'}</h2>
        <Link to="/" style={{ color: '#888', marginTop: '20px', textDecoration: 'none' }}>← Back to Leaderboard</Link>
      </div>
    );
  }

  const { matchedUser, userContestRanking } = userData;
  const profile = matchedUser.profile || {};
  const stats = matchedUser.submitStats?.acSubmissionNum || [];

  const totalSolved = stats.find(s => s.difficulty === 'All')?.count || 0;
  const easySolved = stats.find(s => s.difficulty === 'Easy')?.count || 0;
  const mediumSolved = stats.find(s => s.difficulty === 'Medium')?.count || 0;
  const hardSolved = stats.find(s => s.difficulty === 'Hard')?.count || 0;

  return (
    <div className="main-wrapper" style={{ padding: '40px', boxSizing: 'border-box' }}>
      <div className="stats-container" style={{
        backgroundColor: '#1a1a1a',
        padding: '30px',
        borderRadius: '12px',
        border: '1px solid #333',
        maxWidth: '800px',
        margin: '0 auto',
        width: '100%',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
          <img 
            src={profile.userAvatar} 
            alt="Profile Avatar" 
            style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #ffa116' }} 
          />
          <div>
            <h1 style={{ color: 'white', margin: '0 0 5px 0' }}>{profile.realName || matchedUser.username}</h1>
            <p style={{ color: '#888', margin: 0, fontSize: '1.1em' }}>@{matchedUser.username}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
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
              </>
            ) : (
              <p style={{ color: '#888' }}>No contest data available</p>
            )}
          </div>
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