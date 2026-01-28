import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const ActivityGraph = ({ data }) => {
  return (
    <div style={{ 
      width: '100%', 
      height: '300px', 
      backgroundColor: '#1e1e1e', 
      borderRadius: '10px', 
      padding: '20px', 
      boxSizing: 'border-box', 
      marginTop: '0px',
      marginBottom: '0px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
      border: '1px solid #333',
      display: 'flex',          /* 👈 ADDED: Flexbox helps stack title and chart */
      flexDirection: 'column'   /* 👈 ADDED: Vertical stacking */
    }}>
      <h3 style={{ color: 'white', textAlign: 'center', marginBottom: '5px', marginTop: 0 }}>
        📈 Group Progress (7 Days)
      </h3>
      <p style={{ color: '#888', textAlign: 'center', fontSize: '0.8em', marginBottom: '10px' }}>
        Total questions solved by everyone
      </p>
      
      {/* We wrap ResponsiveContainer in a div with flex: 1 
         so it fills the remaining vertical space perfectly 
      */}
      <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            data={data} 
            /* 👇 CHANGED: Added 'bottom: 25' to reserve space for the dates! */
            margin={{ top: 10, right: 10, left: -20, bottom: 25 }} 
          >
            <defs>
              <linearGradient id="colorSolved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ffa116" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ffa116" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              tick={{ fill: '#888', fontSize: 11 }} 
              axisLine={false}
              tickLine={false}
              dy={10} /* Pushes text down slightly (now inside the safe margin) */
            />
            <YAxis 
              tick={{ fill: '#888', fontSize: 11 }} 
              axisLine={false}
              tickLine={false}
            />
            <CartesianGrid vertical={false} stroke="#333" strokeDasharray="5 5" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#222', border: '1px solid #444', color: '#fff', borderRadius: '5px' }}
              cursor={{ stroke: '#ffa116', strokeWidth: 1 }}
            />
            <Area 
              type="monotone" 
              dataKey="solved" 
              stroke="#ffa116" 
              fillOpacity={1} 
              fill="url(#colorSolved)" 
              strokeWidth={3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ActivityGraph;