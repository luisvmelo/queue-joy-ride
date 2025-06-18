import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface ToleranceTimerProps {
  notifiedAt: string;
  toleranceMinutes: number;
  onTimeout: () => void;
  className?: string;
}

const ToleranceTimer = ({ 
  notifiedAt, 
  toleranceMinutes, 
  onTimeout,
  className = ""
}: ToleranceTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const notifiedTime = new Date(notifiedAt).getTime();
      const toleranceTime = (toleranceMinutes * 60 * 1000) + (30 * 1000); // tolerance + 30s in ms
      const targetTime = notifiedTime + toleranceTime;
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((targetTime - now) / 1000));
      
      console.log('🏪 Receptionist timer sync:', {
        notifiedAt,
        toleranceMinutes,
        notifiedTime: new Date(notifiedTime).toISOString(),
        targetTime: new Date(targetTime).toISOString(),
        now: new Date(now).toISOString(),
        remaining,
        formattedRemaining: `${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, '0')}`
      });
      
      setTimeLeft(remaining);
      
      if (remaining === 0 && !isExpired) {
        setIsExpired(true);
        onTimeout();
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [notifiedAt, toleranceMinutes, onTimeout, isExpired]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getColorClass = () => {
    if (timeLeft === 0) return "text-red-600 bg-red-100";
    if (timeLeft <= 60) return "text-red-600 bg-red-50"; // Last minute
    if (timeLeft <= 180) return "text-orange-600 bg-orange-50"; // Last 3 minutes
    return "text-green-600 bg-green-50";
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getColorClass()} ${className}`}>
      <Clock className="w-4 h-4" />
      {isExpired ? (
        <span>Tempo esgotado</span>
      ) : (
        <span>Tolerância: {formatTime(timeLeft)}</span>
      )}
    </div>
  );
};

export default ToleranceTimer;