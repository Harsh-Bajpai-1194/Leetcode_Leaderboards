import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { calculateCodeComplexity } from './utils/complexityCalculator';

const SubmissionDetail = () => {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const paramUser = searchParams.get('user') || searchParams.get('username') || '';

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showSolutionModal, setShowSolutionModal] = useState(false);
  const [showComplexityDetails, setShowComplexityDetails] = useState(false);

  useEffect(() => {
    const fetchSubmissionData = async () => {
      setLoading(true);
      try {
        const query = paramUser ? `?user=${encodeURIComponent(paramUser)}` : '';
        const res = await fetch(`/api/submission/${submissionId || '2096549016'}${query}`);
        if (res.ok) {
          const data = await res.json();
          if (paramUser && (!data.user_name || data.user_name === 'Community Coder')) {
            data.user_name = paramUser;
          }
          if (!data.user_name) {
            data.user_name = "Aradhy Bajpai";
          }
          setSubmission(data);
        } else {
          throw new Error("Failed to load");
        }
      } catch (err) {
        console.warn("Using default submission detail fallback:", err);
        const resolvedName = paramUser || "Aradhy Bajpai";
        setSubmission({
          submission_id: submissionId || "2096549016",
          problem_title: "Delete Node in a Linked List",
          problem_url: "https://leetcode.com/problems/delete-node-in-a-linked-list/",
          status: "Accepted",
          passed_testcases: "41 / 41",
          user_name: resolvedName,
          timestamp: "Aug 06, 2026 16:44",
          runtime: "0 ms",
          runtime_beats: "100.00%",
          memory: "45.40 MB",
          memory_beats: "24.57%",
          language: "Java",
          code: `/**
 * Definition for singly-linked list.
 * public class ListNode {
 *     int val;
 *     ListNode next;
 *     ListNode(int x) { val = x; }
 * }
 */
class Solution {
    public void deleteNode(ListNode node) {
        node.val = node.next.val;
        node.next = node.next.next;
    }
}`,
          runtime_distribution: [
            { label: '0ms', percentage: 100, is_user: true },
            { label: '1ms', percentage: 12, is_user: false },
            { label: '2ms', percentage: 8, is_user: false },
            { label: '3ms', percentage: 5, is_user: false },
            { label: '4ms', percentage: 15, is_user: false }
          ],
          memory_distribution: [
            { label: '44MB', percentage: 20, is_user: false },
            { label: '45.4MB', percentage: 75, is_user: true },
            { label: '46MB', percentage: 40, is_user: false },
            { label: '47MB', percentage: 10, is_user: false }
          ],
          time_complexity: "O(1)",
          space_complexity: "O(1)",
          explanation: "Since we do not have access to the head of the linked list, we copy the value from the next node into the current node, then bypass the next node by setting node.next = node.next.next. Time complexity is O(1) and space complexity is O(1)."
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissionData();
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

  if (loading) {
    return (
      <div className="submission-page-wrapper">
        <div className="submission-loading-box">
          <div className="submission-spinner"></div>
          <p>Fetching submission details for #{submissionId || '2096549016'}...</p>
        </div>
      </div>
    );
  }

  const codeLines = (submission?.code || '').split('\n');

  return (
    <div className="submission-page-wrapper">
      <div className="submission-container">
        
        {/* Navigation back bar */}
        <div className="submission-nav-bar">
          <div className="submission-id-badge">
            Submission #{submission?.submission_id}
          </div>
        </div>

        {/* Title Header */}
        <div className="submission-header">
          <h1 className="submission-title">
            Submissions Detail - {submission?.problem_title}
          </h1>

          <div className="submission-sub-header">
            <div className="status-badge-wrapper">
              <span className="accepted-badge">
                <span className="dot"></span> Accepted
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

        {/* Performance Metrics Cards */}
        <div className="performance-card">
          <div className="metrics-grid">
            
            {/* Runtime Box */}
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

            {/* Memory Box */}
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

          {/* Runtime Bar Graph Distribution */}
          <div className="distribution-chart-container">
            <div className="chart-header">
              <span>Runtime Distribution</span>
              <span className="chart-user-mark">🔵 Their Submission ({submission?.runtime})</span>
            </div>

            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={submission?.runtime_distribution || []}>
                  <XAxis dataKey="label" stroke="#777" tick={{ fontSize: 12 }} />
                  <YAxis hide={true} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #444', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                    formatter={(value) => [`${value}% of submissions`, 'Frequency']}
                  />
                  <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                    {(submission?.runtime_distribution || []).map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.is_user ? '#007aff' : '#334155'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Code Box Container */}
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

          {/* Code Editor view */}
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

        {/* Bottom Navigation button */}
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

      {/* Complexity Calculator Breakdown Modal */}
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

      {/* Solution Explanation Modal */}
      {showSolutionModal && (
        <div className="solution-modal-overlay" onClick={() => setShowSolutionModal(false)}>
          <div className="solution-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Solution Explanation - {submission?.problem_title}</h3>
              <button className="close-modal-btn" onClick={() => setShowSolutionModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="explanation-text">{submission?.explanation}</p>
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
