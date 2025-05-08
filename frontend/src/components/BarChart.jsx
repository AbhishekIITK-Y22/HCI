import React from 'react';
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { Typography, Box } from '@mui/material';

const colors = ['#1F4E3D', '#2E7D32', '#388E3C', '#43A047', '#4CAF50'];

export default function BarChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height={300}>
        <Typography color="error">No data available</Typography>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ReBarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="label"
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={100}
        />
        <YAxis 
          label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip 
          formatter={(value) => [`${value}%`, 'Response']}
        />
        <Bar
          dataKey="value"
          fill="#2E7D32"
          radius={[5, 5, 0, 0]}
          label={{ position: 'top', formatter: (value) => `${value}%` }}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Bar>
      </ReBarChart>
    </ResponsiveContainer>
  );
}
