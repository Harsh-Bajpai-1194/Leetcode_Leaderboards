import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

// 1. Initialize Supabase client
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

const AdminPanel = () => {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 2. Function to Add User directly to Supabase
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsLoading(true);
    setMessage('');

    try {
      // 3. Direct insertion into the 'leaderboard' table
      const { data, error } = await supabase
        .from('leaderboard')
        .insert([
          { 
            leetcode_handle: username.trim(),
            total_solved: 0,
            easy_solved: 0,
            medium_solved: 0,
            hard_solved: 0,
            name: username.trim() // Initial name matches username
          }
        ]);

      if (error) {
        // Handle unique constraint error (Postgres code 23505)
        if (error.code === '23505') {
          setMessage('❌ Error: User already exists in leaderboard.');
        } else {
          setMessage(`❌ Error: ${error.message}`);
        }
      } else {
        setMessage('✅ Success: User added successfully! Sync stats on the main page.');
        setUsername(''); 
      }
    } catch (error) {
      console.error('Admin Error:', error);
      setMessage('❌ Connection Error: Could not connect to database.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      width: '100vw', 
      backgroundColor: '#0d0d0d', 
      display: 'flex', 
      alignItems: 'center',    
      justifyContent: 'center', 
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div style={{ 
        backgroundColor: '#1a1a1a', 
        padding: '40px', 
        borderRadius: '12px', 
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)', 
        maxWidth: '400px', 
        width: '100%', 
        textAlign: 'center', 
        border: '1px solid #333' 
      }}>
        
        <h1 style={{ color: '#4ade80', margin: '0 0 20px 0' }}>🛡️ ADMIN PANEL</h1>
        <p style={{ color: '#888', marginBottom: '30px', fontSize: '0.9em' }}>
            Add new users to the leaderboard.<br/>
            (To force update stats, use the button on the main page)
        </p>
        
        <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            type="text" 
            placeholder="LeetCode Username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required
            style={{ 
              padding: '12px', 
              borderRadius: '5px', 
              border: '1px solid #333', 
              backgroundColor: '#2c2c2c', 
              color: 'white', 
              outline: 'none' 
            }}
          />
          <button 
            type="submit" 
            disabled={isLoading} 
            style={{ 
              padding: '12px', 
              background: isLoading ? '#22543d' : '#4ade80', 
              color: 'black', 
              border: 'none', 
              borderRadius: '5px', 
              fontWeight: 'bold', 
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            {isLoading ? 'PROCESSING...' : 'ADD USER'}
          </button>
        </form>

        {message && (
          <div style={{ 
            marginTop: '20px', 
            padding: '10px', 
            borderRadius: '5px', 
            backgroundColor: message.includes('Success') ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
            color: message.includes('Success') ? '#4ade80' : '#ef4743',
            fontSize: '0.9em'
          }}>
            {message}
          </div>
        )}

        <div style={{ marginTop: '30px' }}>
          <Link to="/" style={{ color: '#888', textDecoration: 'none' }}>← Back to Leaderboard</Link>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
