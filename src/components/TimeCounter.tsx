
import { useState, useEffect } from "react";

interface TimeCounterProps {
  startTime: string | Date;
  label: string;
  className?: string;
}

const TimeCounter = ({ startTime, label, className = "" }: TimeCounterProps) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const start = new Date(startTime).getTime();
    
    const updateTime = () => {
      const now = new Date().getTime();
      const elapsed = Math.floor((now - start) / 1000);
      setElapsedTime(Math.max(0, elapsed));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const minutes = Math.floor(elapsedTime / 60);
  const seconds = elapsedTime % 60;

  return (
    <div className={`text-center ${className}`}>
      <div className="text-2xl font-bold text-black mb-1">
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </div>
      <p className="text-gray-600 text-sm">{label}</p>
    </div>
  );
};

export default TimeCounter;
