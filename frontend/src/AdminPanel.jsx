import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const AdminPanel = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddUser = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      // 👇 This points to your LIVE server so you can update the real database
      const response = await fetch('https://leetcode-leaderboards.onrender.com/api/add-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(`✅ Success: ${data.message}`);
        setUsername(''); // Clear input on success
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage('❌ Network Error: Could not connect to server.');
    }
    
    setIsLoading(false);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0d0d0d', 
      color: 'white', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px'
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
        <h1 style={{ color: '#ffa116', margin: '0 0 20px 0' }}>🛡️ Admin Panel</h1>
        <p style={{ color: '#888', marginBottom: '30px' }}>Add a new LeetCode user to the leaderboard.</p>

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
          <input 
            type="password" 
            placeholder="Admin Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
              background: isLoading ? '#555' : '#ffa116', 
              color: 'black', 
              border: 'none', 
              borderRadius: '5px', 
              fontWeight: 'bold', 
              cursor: isLoading ? 'not-allowed' : 'pointer',
              marginTop: '10px'
            }}
          >
            {isLoading ? 'Adding...' : 'ADD USER'}
          </button>
        </form>

        {message && (
          <div style={{ 
            marginTop: '20px', 
            padding: '10px', 
            borderRadius: '5px', 
            backgroundColor: message.includes('Success') ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: message.includes('Success') ? '#4ade80' : '#ef4743'
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
