import React from 'react';

const RadarChart = ({ data, size = 300 }) => {
  const center = size / 2;
  const radius = (size * 0.35);
  const numberOfSides = data.length;
  
  // Calculate points for the polygon
  const getPoint = (value, index) => {
    const angle = (Math.PI * 2 * index) / numberOfSides - Math.PI / 2;
    const distance = (value / 100) * radius;
    return {
      x: center + Math.cos(angle) * distance,
      y: center + Math.sin(angle) * distance
    };
  };
  
  // Get points for grid lines
  const getGridPoint = (percentage, index) => {
    const angle = (Math.PI * 2 * index) / numberOfSides - Math.PI / 2;
    const distance = (percentage / 100) * radius;
    return {
      x: center + Math.cos(angle) * distance,
      y: center + Math.sin(angle) * distance
    };
  };
  
  // Generate grid circles (20%, 40%, 60%, 80%, 100%)
  const gridCircles = [20, 40, 60, 80, 100].map(percentage => (
    <circle
      key={percentage}
      cx={center}
      cy={center}
      r={(percentage / 100) * radius}
      fill="none"
      stroke="#e2e8f0"
      strokeWidth="1"
    />
  ));
  
  // Generate grid lines from center to each vertex
  const gridLines = data.map((_, index) => {
    const point = getGridPoint(100, index);
    return (
      <line
        key={index}
        x1={center}
        y1={center}
        x2={point.x}
        y2={point.y}
        stroke="#e2e8f0"
        strokeWidth="1"
      />
    );
  });
  
  // Generate the data polygon
  const dataPoints = data.map((item, index) => getPoint(item.percentage, index));
  const polygonPoints = dataPoints.map(point => `${point.x},${point.y}`).join(' ');
  
  // Generate labels
  const labels = data.map((item, index) => {
    const labelPoint = getGridPoint(115, index);
    return (
      <g key={index}>
        <text
          x={labelPoint.x}
          y={labelPoint.y}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-sm font-medium fill-slate-700"
        >
          {item.name}
        </text>
        <text
          x={labelPoint.x}
          y={labelPoint.y + 16}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-xs fill-slate-500"
        >
          {item.sets} sets
        </text>
      </g>
    );
  });
  
  // Generate data points with levels
  const dataPointCircles = dataPoints.map((point, index) => (
    <g key={index}>
      <circle
        cx={point.x}
        cy={point.y}
        r="4"
        fill={data[index].color}
        stroke="white"
        strokeWidth="2"
      />
      <circle
        cx={point.x}
        cy={point.y}
        r="2"
        fill="white"
      />
    </g>
  ));
  
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="overflow-visible">
        {/* Grid */}
        {gridCircles}
        {gridLines}
        
        {/* Data area */}
        <polygon
          points={polygonPoints}
          fill="url(#gradient)"
          stroke="#f97316"
          strokeWidth="2"
          opacity="0.8"
        />
        
        {/* Gradient definition */}
        <defs>
          <radialGradient id="gradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fed7aa" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.3" />
          </radialGradient>
        </defs>
        
        {/* Data points */}
        {dataPointCircles}
        
        {/* Labels */}
        {labels}
      </svg>
    </div>
  );
};

export default RadarChart;
