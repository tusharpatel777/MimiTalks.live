import React from 'react';

interface VisualizerProps {
  isActive: boolean;
  mode: 'listening' | 'speaking' | 'idle';
}

const Visualizer: React.FC<VisualizerProps> = ({ isActive, mode }) => {
  // In a real full implementation we would analyze the AudioBuffer frequency data.
  // For this implementation, we will use CSS animations simulated by the state.

  const bars = Array.from({ length: 12 });

  const getBarColor = () => {
    if (mode === 'speaking') return 'bg-accent-pink';
    if (mode === 'listening') return 'bg-accent-cyan';
    return 'bg-studio-500';
  };

  return (
    <div className="flex items-end justify-center gap-1 h-16 w-full max-w-[200px]">
      {bars.map((_, i) => (
        <div
          key={i}
          className={`w-2 rounded-full transition-colors duration-300 ${getBarColor()}`}
          style={{
            height: isActive ? '40%' : '10%',
            animation: isActive 
              ? `wave ${0.5 + Math.random() * 0.5}s ease-in-out infinite` 
              : 'none',
            animationDelay: `-${Math.random()}s`
          }}
        />
      ))}
    </div>
  );
};

export default Visualizer;