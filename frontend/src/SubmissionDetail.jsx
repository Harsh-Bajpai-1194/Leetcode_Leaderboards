import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { calculateCodeComplexity } from './utils/complexityCalculator';

export function RuntimeGraph({ distributionData, userRuntime }) {
  // 1. Safety check in case data is missing
  if (!distributionData || distributionData.length === 0) {
    return <p style={{ textAlign: 'center', color: '#888' }}>No distribution data available.</p>;
  }

  // 2. Format the data for Recharts
  // Translates: ["2", 0.1675] -> { runtime: 2, percent: 0.1675 }
  const chartData = distributionData.map(([timeStr, percent]) => ({
    runtime: parseInt(timeStr, 10),
    percent: percent
  }));

  // 3. Clean the user's runtime string so we can highlight it (e.g., "9 ms" -> 9)
  const activeRuntime = parseInt(userRuntime, 10);

  return (
    <div style={{ width: '100%', height: 200, marginTop: '20px' }}>
      <ResponsiveContainer>
        <BarChart data={chartData}>
          <XAxis 
            dataKey="runtime" 
            tickFormatter={(tick) => `${tick}ms`} 
            stroke="#888888"
          />
          <YAxis 
            hide={true} 
          />
          <Tooltip 
            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} 
            contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #444', borderRadius: '8px', color: '#fff' }}
            formatter={(value) => [`${value.toFixed(2)}%`, 'Users']}
            labelFormatter={(label) => `Runtime: ${label} ms`}
          />
          <Bar dataKey="percent" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                // Highlight the user's specific runtime in green, keep others gray
                fill={entry.runtime === activeRuntime ? '#10b981' : '#334155'} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const SubmissionDetail = () => {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const paramUser = searchParams.get('user') || searchParams.get('username') || '';

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [minLoadingTimeElapsed, setMinLoadingTimeElapsed] = useState(false);
  const [showSolutionModal, setShowSolutionModal] = useState(false);
  const [showComplexityDetails, setShowComplexityDetails] = useState(false);

  useEffect(() => {
    const fetchSubmissionData = async () => {
      setLoading(true);
      setMinLoadingTimeElapsed(false);
      
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || ''; 
        const query = paramUser ? `?user=${encodeURIComponent(paramUser)}` : '';
        const res = await fetch(`${apiBaseUrl}/api/submission/${submissionId}${query}`);
        
        if (res.ok) {
          const data = await res.json();
          if (paramUser && (!data.user_name || data.user_name === 'Community Coder')) {
            data.user_name = paramUser;
          }
          if (!data.user_name) {
            data.user_name = "Unknown User";
          }
          setSubmission(data);
        }
      } catch (err) {
        console.error("Failed to fetch submission details:", err);
        setSubmission(null);
      } finally {
        // FIXED: Changed from 60000ms (60 seconds) to 600ms (0.6 seconds)
        const minLoadPromise = new Promise(resolve => setTimeout(resolve, 600)); 
        await minLoadPromise;
        
        if (isMounted) {
          setLoading(false);
          setMinLoadingTimeElapsed(true);
        }
      }
    };

    let isMounted = true; 
    fetchSubmissionData();
    return () => { isMounted = false; }; 
  }, [submissionId, paramUser]); 

  const handleCopyCode = () => {
    if (submission?.code) {
      navigator.clipboard.writeText(submission.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const calculated = calculateCodeComplexity(submission?.code, submission?.problem_title);
  const complexities = {
    time: calculated.timeComplexity,
    space: calculated.spaceComplexity,
    timeReason: calculated.timeReason,
    spaceReason: calculated.spaceReason,
    breakdown: calculated.breakdown
  };

  if (loading || !minLoadingTimeElapsed) {
    return (
      <div className="submission-page-wrapper">
        <div className="submission-loading-box">
          <div className="submission-spinner"></div>
          <p>Fetching submission details for #{submissionId}...</p>
        </div>
      </div>
    );
  }

  if (!submission && !loading) {
    return (
      <div className="submission-page-wrapper">
        <div className="submission-loading-box">
          <p>Failed to load submission details.</p>
          <p>Please ensure the submission ID is valid and you are logged into LeetCode on the scraper's environment.</p>
          <button onClick={() => navigate(-1)} className="back-to-home-btn" style={{ marginTop: '20px' }}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const codeLines = (submission?.code || '').split('\n');

  return (
    <div className="submission-page-wrapper">
      <div className="submission-container">
        
        <div className="submission-nav-bar">
          <div className="submission-id-badge">
            Submission #{submission?.submission_id}
          </div>
        </div>

        <div className="submission-header">
          <h1 className="submission-title">
            Submissions Detail - {submission?.problem_title}
          </h1>

          <div className="submission-sub-header">
            <div className="status-badge-wrapper">
              <span className="accepted-badge">
                <span className="dot"></span> {submission?.status || 'Accepted'}
              </span>
              <span className="testcases-info">
                {submission?.passed_testcases} testcases passed
              </span>
            </div>

            <div className="submission-user-meta">
              <div className="user-avatar-small">
                {submission?.user_name?.charAt(0) || 'U'}
              </div>
              <span className="user-text">
                <strong>{submission?.user_name}</strong> submitted at {submission?.timestamp}
              </span>
            </div>

            <button 
              className="solution-btn" 
              onClick={() => setShowSolutionModal(true)}
            >
              📝 Solution & Insight
            </button>
          </div>
        </div>

        <div className="performance-card">
          <div className="metrics-grid">
            
            <div className="metric-box highlighted">
              <div className="metric-label">
                <span className="metric-icon">⏱️</span> Runtime
              </div>
              <div className="metric-value-row">
                <span className="primary-value">{submission?.runtime}</span>
                <span className="beats-badge green">
                  Beats <strong>{submission?.runtime_beats}</strong> 🚀
                </span>
              </div>
            </div>

            <div className="metric-box">
              <div className="metric-label">
                <span className="metric-icon">💾</span> Memory
              </div>
              <div className="metric-value-row">
                <span className="primary-value">{submission?.memory}</span>
                <span className="beats-badge gray">
                  Beats <strong>{submission?.memory_beats}</strong>
                </span>
              </div>
            </div>

          </div>

          <div className="distribution-chart-container">
            <div className="chart-header">
              <span>Runtime Distribution</span>
              <span className="chart-user-mark" style={{color: "#10b981"}}>
                🟢 Their Submission ({submission?.runtime})
              </span>
            </div>

            <div className="chart-wrapper">
              <RuntimeGraph 
                distributionData={submission?.runtime_distribution} 
                userRuntime={submission?.runtime} 
              />
            </div>
          </div>

        </div>

        <div className="code-container">
          <div className="code-header">
            <div className="code-lang-tag">
              <span>Code</span> | <strong className="lang-name">{submission?.language}</strong>
            </div>

            <div className="code-actions">
              <button className="copy-code-btn" onClick={handleCopyCode}>
                {copied ? '✅ Copied!' : '📋 Copy Code'}
              </button>
            </div>
          </div>

          <div className="code-body">
            <div className="line-numbers">
              {codeLines.map((_, i) => (
                <span key={i}>{i + 1}</span>
              ))}
            </div>
            <pre className="code-content">
              <code>{submission?.code}</code>
            </pre>
          </div>

          <div className="code-footer">
            <div 
              className="code-complexity-info clickable" 
              onClick={() => setShowComplexityDetails(true)}
              title="Click to view full complexity calculator analysis"
            >
              <span className="complexity-item">
                <span className="complexity-label">Time Complexity:</span>{' '}
                <strong className="complexity-value">{complexities.time}</strong>
              </span>
              <span className="complexity-divider">•</span>
              <span className="complexity-item">
                <span className="complexity-label">Space Complexity:</span>{' '}
                <strong className="complexity-value">{complexities.space}</strong>
              </span>
              <span className="complexity-calc-badge">🧮 Calculator Details</span>
            </div>
          </div>
        </div>

        <div className="submission-bottom-actions">
          <a 
            href={submission?.problem_url || "https://leetcode.com"} 
            target="_blank" 
            rel="noopener noreferrer"
            className="back-to-problem-btn"
          >
            🔗 Back to LeetCode Problem
          </a>

          <button className="back-to-home-btn" onClick={() => navigate('/')}>
            🏆 Back to Leaderboards
          </button>
        </div>

      </div>

      {showComplexityDetails && (
        <div className="solution-modal-overlay" onClick={() => setShowComplexityDetails(false)}>
          <div className="solution-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🧮 Code Complexity Analysis</h3>
              <button className="close-modal-btn" onClick={() => setShowComplexityDetails(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="complexity-analysis-grid">
                <div className="analysis-box">
                  <div className="analysis-label">⏱️ Calculated Time Complexity</div>
                  <div className="analysis-val-big">{complexities.time}</div>
                  <div className="analysis-reason">{complexities.timeReason}</div>
                </div>

                <div className="analysis-box">
                  <div className="analysis-label">💾 Calculated Space Complexity</div>
                  <div className="analysis-val-big">{complexities.space}</div>
                  <div className="analysis-reason">{complexities.spaceReason}</div>
                </div>
              </div>

              {complexities.breakdown && complexities.breakdown.length > 0 && (
                <div className="analysis-breakdown-section">
                  <h4>Static Code Inspection Breakdown:</h4>
                  <ul className="breakdown-list">
                    {complexities.breakdown.map((item, index) => (
                      <li key={index}>✓ {item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showSolutionModal && (
        <div className="solution-modal-overlay" onClick={() => setShowSolutionModal(false)}>
          <div className="solution-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Solution Explanation - {submission?.problem_title}</h3>
              <button className="close-modal-btn" onClick={() => setShowSolutionModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="explanation-text">{submission?.explanation || "No explanation provided for this submission."}</p>
              <div className="complexity-badge">
                <span><strong>Time Complexity:</strong> {complexities.time}</span>
                <span><strong>Space Complexity:</strong> {complexities.space}</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SubmissionDetail;