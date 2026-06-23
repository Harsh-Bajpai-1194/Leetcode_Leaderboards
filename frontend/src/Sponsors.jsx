// frontend/src/Sponsors.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './style.css';

const Sponsors = () => {
  // You can fetch this from Supabase later! For now, it's a static array.
  // Change the array to empty `[]` to see the "Be the first" state!
  const sponsorList = [
    { id: 1, name: "CodeX Fan", amount: "₹500", tier: "gold", message: "Keep up the great work!", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" },
    { id: 2, name: "Anonymous", amount: "₹200", tier: "silver", message: "For the server costs ☕", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka" },
    { id: 3, name: "DevStudent", amount: "₹50", tier: "bronze", message: "Awesome community!", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jocelyn" }
  ];

  return (
    <div className="main-wrapper">
      <div className="sponsors-page-container">
        
        <div className="sponsors-header">
          <h1>🏆 THE HALL OF FAME</h1>
          <p>A massive thank you to the legends keeping our proxy servers alive!</p>
          <Link to="/" className="back-link">← Back to Leaderboard</Link>
        </div>

{/*
        {sponsorList.length === 0 ? (
          <div className="empty-sponsors">
            <div className="sponsor-card tier-gold be-the-first">
              <div className="sponsor-avatar-placeholder">?</div>
              <h3>This could be you!</h3>
              <p>Be the very first sponsor of CodeX Club.</p>
              <button className="sponsor-btn">Donate ₹10</button>
            </div>
          </div>
        ) : (
          <div className="sponsors-grid">
            {sponsorList.map((sponsor) => (
              <div key={sponsor.id} className={`sponsor-card tier-${sponsor.tier}`}>
                <img src={sponsor.avatar} alt="avatar" className="sponsor-avatar" />
                <h3 className="sponsor-name">{sponsor.name}</h3>
                <div className="sponsor-amount">{sponsor.amount}</div>
                {sponsor.message && <p className="sponsor-message">"{sponsor.message}"</p>}
              </div>
            ))}
          </div>
        )}
*/}

        <div className="donate-section">
          <h2>Want to join the Hall of Fame?</h2>
          <p>Scan the QR below. Any amount gets you a permanent spot on this wall!</p>
          <img src="/QR.jpg" alt="Donate QR" className="sponsors-qr" />
        </div>

      </div>
    </div>
  );
};

export default Sponsors;