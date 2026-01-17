"use client";

import clsx from "clsx";

interface TrendScoreIndicatorProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-red-500";
  if (score >= 60) return "text-orange-500";
  if (score >= 40) return "text-yellow-500";
  return "text-blue-500";
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return "bg-red-500";
  if (score >= 60) return "bg-orange-500";
  if (score >= 40) return "bg-yellow-500";
  return "bg-blue-500";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Hot";
  if (score >= 60) return "Trending";
  if (score >= 40) return "Warm";
  return "Cool";
}

export function TrendScoreIndicator({
  score,
  size = "md",
  showLabel = false,
}: TrendScoreIndicatorProps) {
  const sizes = {
    sm: { circle: "w-10 h-10", text: "text-xs", label: "text-[10px]" },
    md: { circle: "w-14 h-14", text: "text-sm", label: "text-xs" },
    lg: { circle: "w-20 h-20", text: "text-lg", label: "text-sm" },
  };

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className={clsx("relative", sizes[size].circle)}>
        {/* Background circle */}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-tiktok-gray"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={getScoreColor(score)}
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={clsx("font-bold", sizes[size].text, getScoreColor(score))}>
            {Math.round(score)}
          </span>
        </div>
      </div>
      {showLabel && (
        <span className={clsx("mt-1 font-medium", sizes[size].label, getScoreColor(score))}>
          {getScoreLabel(score)}
        </span>
      )}
    </div>
  );
}
