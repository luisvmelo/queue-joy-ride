
import { useState, useEffect } from "react";

interface TimeDisplayProps {
  initialMinutes: number;
  label: string;
  isCountdown?: boolean;
  className?: string;
}

const TimeDisplay = ({ initialMinutes, label, isCountdown = false, className = "" }: TimeDisplayProps) => {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);

  useEffect(() => {
    if (!isCountdown) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isCountdown]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className={`text-center ${className}`}>
      <div className="text-2xl font-bold text-blue-600 mb-1">
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </div>
      <p className="text-gray-600">{label}</p>
    </div>
  );
};

export default TimeDisplay;
