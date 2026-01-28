import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const AdminPanel = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Function to Add User
  const handleAddUser = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('https://leetcode-leaderboards.onrender.com/api/add-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(`✅ Success: ${data.message}`);
        setUsername('');
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage('❌ Network Error: Could not connect to server.');
    }
    setIsLoading(false);
  };

  // 👇 Function to Trigger Update
  const handleTriggerUpdate = async () => {
    if (!password) {
        setMessage("❌ Please enter the password first!");
        return;
    }
    
    setIsLoading(true);
    setMessage('⏳ Triggering Update...');

    try {
        const response = await fetch('https://leetcode-leaderboards.onrender.com/api/trigger-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        
        const data = await response.json();
        if (response.ok) {
            setMessage(data.message);
        } else {
            setMessage(`❌ Error: ${data.error}`);
        }
    } catch (error) {
        setMessage('❌ Network Error');
    }
    setIsLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0d0d0d', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ backgroundColor: '#1a1a1a', padding: '40px', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', maxWidth: '400px', width: '100%', textAlign: 'center', border: '1px solid #333' }}>
        
        <h1 style={{ color: '#ffa116', margin: '0 0 20px 0' }}>🛡️ Admin Panel</h1>
        
        {/* ADD USER FORM */}
        <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            type="text" placeholder="LeetCode Username" value={username} onChange={(e) => setUsername(e.target.value)} required
            style={{ padding: '12px', borderRadius: '5px', border: '1px solid #333', backgroundColor: '#2c2c2c', color: 'white', outline: 'none' }}
          />
          <input 
            type="password" placeholder="Admin Password" value={password} onChange={(e) => setPassword(e.target.value)} required
            style={{ padding: '12px', borderRadius: '5px', border: '1px solid #333', backgroundColor: '#2c2c2c', color: 'white', outline: 'none' }}
          />
          <button type="submit" disabled={isLoading} style={{ padding: '12px', background: isLoading ? '#555' : '#ffa116', color: 'black', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: isLoading ? 'not-allowed' : 'pointer' }}>
            {isLoading ? 'Processing...' : 'ADD USER'}
          </button>
        </form>

        {/* 👇 NEW "FORCE UPDATE" BUTTON */}
        <div style={{ marginTop: '20px', borderTop: '1px solid #333', paddingTop: '20px' }}>
             <button 
                onClick={handleTriggerUpdate} 
                disabled={isLoading}
                style={{ 
                    width: '100%', 
                    padding: '12px', 
                    backgroundColor: '#ef4743', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '5px', 
                    fontWeight: 'bold', 
                    cursor: isLoading ? 'not-allowed' : 'pointer' 
                }}
             >
                ⚡ FORCE UPDATE LEADERBOARD
             </button>
        </div>

        {message && (
          <div style={{ marginTop: '20px', padding: '10px', borderRadius: '5px', backgroundColor: message.includes('Success') || message.includes('Started') ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: message.includes('Success') || message.includes('Started') ? '#4ade80' : '#ef4743' }}>
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