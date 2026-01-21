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
      marginTop: '20px',
      marginBottom: '30px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
      border: '1px solid #333'
    }}>
      <h3 style={{ color: 'white', textAlign: 'center', marginBottom: '5px' }}>📈 Group Progress (7 Days)</h3>
      <p style={{ color: '#888', textAlign: 'center', fontSize: '0.8em', marginBottom: '20px' }}>Total questions solved by everyone</p>
      
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorSolved" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ffa116" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#ffa116" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="date" 
            tick={{ fill: '#888', fontSize: 12 }} 
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            tick={{ fill: '#888', fontSize: 12 }} 
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
  );
};

export default ActivityGraph;