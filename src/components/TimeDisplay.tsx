
import { useState, useEffect } from "react";

interface TimeDisplayProps {
  initialMinutes?: number;
  timeInSeconds?: number; // Direct time in seconds for synced display
  label: string;
  isCountdown?: boolean;
  className?: string;
}

const TimeDisplay = ({ 
  initialMinutes, 
  timeInSeconds, 
  label, 
  isCountdown = false, 
  className = "" 
}: TimeDisplayProps) => {
  const [timeLeft, setTimeLeft] = useState(() => {
    if (timeInSeconds !== undefined) return timeInSeconds;
    return initialMinutes ? initialMinutes * 60 : 0;
  });

  // Use external time if provided (for synced display)
  useEffect(() => {
    if (timeInSeconds !== undefined) {
      setTimeLeft(timeInSeconds);
    }
  }, [timeInSeconds]);

  useEffect(() => {
    if (!isCountdown || timeInSeconds !== undefined) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isCountdown, timeInSeconds]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className={`text-center ${className}`}>
      <div className="text-2xl font-bold text-black mb-1">
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </div>
      <p className="text-gray-600">{label}</p>
    </div>
  );
};

export default TimeDisplay;
