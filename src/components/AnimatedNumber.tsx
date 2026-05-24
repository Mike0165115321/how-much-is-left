import React, { useState, useEffect } from 'react';

interface AnimatedNumberProps {
  value: number;
  formatter: (val: number) => string;
  className?: string;
  duration?: number; // duration in ms
}

export default function AnimatedNumber({ 
  value, 
  formatter, 
  className = '', 
  duration = 1000 
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = displayValue;
    const endValue = value;

    if (startValue === endValue) return;

    let rAFId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // easeOutExpo function: 1 - 2^(-10 * x)
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      const current = startValue + (endValue - startValue) * easeProgress;
      setDisplayValue(current);

      if (progress < 1) {
        rAFId = window.requestAnimationFrame(step);
      } else {
        setDisplayValue(endValue);
      }
    };

    rAFId = window.requestAnimationFrame(step);
    return () => {
      if (rAFId) {
        window.cancelAnimationFrame(rAFId);
      }
    };
  }, [value, duration]);

  return <span className={className}>{formatter(displayValue)}</span>;
}
