"use client";

import { useState, useEffect } from "react";
import { Clock, Zap } from "lucide-react";

interface CountdownTimerProps {
  endTime?: Date;
  urgencyLevel?: "low" | "medium" | "high";
  title?: string;
  showSeconds?: boolean;
}

export function CountdownTimer({ 
  endTime, 
  urgencyLevel = "medium",
  title = "Deal ends in",
  showSeconds = true 
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  function calculateTimeLeft() {
    if (!endTime) {
      // Default: 24 hours from now
      const defaultEnd = new Date();
      defaultEnd.setHours(defaultEnd.getHours() + 24);
      endTime = defaultEnd;
    }

    const difference = +endTime - +new Date();
    
    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return null;
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, endTime]);

  if (!isClient || !timeLeft) {
    return null;
  }

  const urgencyColors = {
    low: "from-blue-500/20 to-purple-500/20 border-blue-500/30 text-blue-300",
    medium: "from-orange-500/20 to-red-500/20 border-orange-500/30 text-orange-300",
    high: "from-red-500/20 to-pink-500/20 border-red-500/30 text-red-300 animate-pulse"
  };

  const textColors = {
    low: "text-blue-300",
    medium: "text-orange-300", 
    high: "text-red-300"
  };

  const iconColors = {
    low: "text-blue-400",
    medium: "text-orange-400",
    high: "text-red-400"
  };

  const isUrgent = (timeLeft.days === 0 && timeLeft.hours < 6) || urgencyLevel === "high";
  const isCritical = timeLeft.days === 0 && timeLeft.hours < 1;

  return (
    <div className={`bg-gradient-to-r ${urgencyColors[urgencyLevel]} border rounded-xl p-4 relative overflow-hidden`}>
      {/* Background animation for high urgency */}
      {isUrgent && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
      )}
      
      <div className="relative flex items-center gap-3">
        <div className="flex items-center gap-2">
          {isCritical ? (
            <Zap className={`w-5 h-5 ${iconColors[urgencyLevel]} animate-pulse`} />
          ) : (
            <Clock className={`w-5 h-5 ${iconColors[urgencyLevel]}`} />
          )}
          <span className={`font-bold text-sm ${textColors[urgencyLevel]}`}>
            {isCritical ? "URGENT" : title}
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-white font-mono">
          {timeLeft.days > 0 && (
            <>
              <div className="flex flex-col items-center">
                <span className="text-lg font-bold">{timeLeft.days}</span>
                <span className="text-xs text-gray-400">days</span>
              </div>
              <span className="text-gray-500">:</span>
            </>
          )}
          
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold">{timeLeft.hours.toString().padStart(2, '0')}</span>
            <span className="text-xs text-gray-400">hrs</span>
          </div>
          <span className="text-gray-500">:</span>
          
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold">{timeLeft.minutes.toString().padStart(2, '0')}</span>
            <span className="text-xs text-gray-400">min</span>
          </div>
          
          {showSeconds && (
            <>
              <span className="text-gray-500">:</span>
              <div className="flex flex-col items-center">
                <span className={`text-lg font-bold ${isCritical ? 'animate-pulse' : ''}`}>
                  {timeLeft.seconds.toString().padStart(2, '0')}
                </span>
                <span className="text-xs text-gray-400">sec</span>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Progress bar for last hour */}
      {timeLeft.days === 0 && timeLeft.hours === 0 && (
        <div className="mt-3">
          <div className="w-full bg-gray-700 rounded-full h-1">
            <div 
              className={`bg-gradient-to-r from-red-400 to-red-600 h-1 rounded-full transition-all duration-1000`}
              style={{ width: `${((60 - timeLeft.minutes) / 60) * 100}%` }}
            />
          </div>
          <div className="text-xs text-red-300 mt-1 text-center">
            Last {timeLeft.minutes} minutes!
          </div>
        </div>
      )}
    </div>
  );
}