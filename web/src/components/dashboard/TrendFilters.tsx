"use client";

import { useState } from "react";
import { Filter, X, ChevronDown } from "lucide-react";
import clsx from "clsx";

interface TrendFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  filters: FilterState;
}

export interface FilterState {
  category: string;
  minPrice: number;
  maxPrice: number;
  minScore: number;
  velocity: string[];
  sortBy: string;
}

const categories = [
  { value: "all", label: "All Categories" },
  { value: "electronics", label: "Electronics" },
  { value: "fashion", label: "Fashion" },
  { value: "home", label: "Home & Garden" },
  { value: "beauty", label: "Beauty" },
  { value: "toys", label: "Toys & Games" },
  { value: "sports", label: "Sports" },
  { value: "pets", label: "Pets" },
];

const velocityOptions = [
  { value: "rising", label: "Rising Fast", color: "text-green-400" },
  { value: "stable", label: "Stable", color: "text-yellow-400" },
  { value: "declining", label: "Declining", color: "text-red-400" },
];

const sortOptions = [
  { value: "trend_score", label: "Trend Score" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "newest", label: "Newest First" },
  { value: "margin", label: "Profit Margin" },
];

export function TrendFilters({ onFilterChange, filters }: TrendFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilter = (key: keyof FilterState, value: FilterState[keyof FilterState]) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const toggleVelocity = (velocity: string) => {
    const current = filters.velocity;
    const updated = current.includes(velocity)
      ? current.filter((v) => v !== velocity)
      : [...current, velocity];
    updateFilter("velocity", updated);
  };

  const resetFilters = () => {
    onFilterChange({
      category: "all",
      minPrice: 0,
      maxPrice: 10000,
      minScore: 0,
      velocity: [],
      sortBy: "trend_score",
    });
  };

  const hasActiveFilters =
    filters.category !== "all" ||
    filters.minPrice > 0 ||
    filters.maxPrice < 10000 ||
    filters.minScore > 0 ||
    filters.velocity.length > 0;

  return (
    <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray p-4">
      {/* Main filters row */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* Category */}
        <div className="flex-1 min-w-[200px]">
          <select
            value={filters.category}
            onChange={(e) => updateFilter("category", e.target.value)}
            className="w-full px-4 py-2 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white focus:outline-none focus:border-tiktok-cyan"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="flex-1 min-w-[200px]">
          <select
            value={filters.sortBy}
            onChange={(e) => updateFilter("sortBy", e.target.value)}
            className="w-full px-4 py-2 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white focus:outline-none focus:border-tiktok-cyan"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                Sort: {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Advanced toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
            showAdvanced
              ? "bg-tiktok-cyan/20 text-tiktok-cyan"
              : "bg-tiktok-gray/50 text-gray-400 hover:text-white"
          )}
        >
          <Filter className="w-4 h-4" />
          Filters
          <ChevronDown
            className={clsx(
              "w-4 h-4 transition-transform",
              showAdvanced && "rotate-180"
            )}
          />
        </button>

        {/* Reset */}
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 px-3 py-2 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
            Reset
          </button>
        )}
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-tiktok-gray grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Price Range
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => updateFilter("minPrice", parseInt(e.target.value) || 0)}
                placeholder="Min"
                className="w-full px-3 py-2 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white text-sm focus:outline-none focus:border-tiktok-cyan"
              />
              <span className="text-gray-500">-</span>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => updateFilter("maxPrice", parseInt(e.target.value) || 10000)}
                placeholder="Max"
                className="w-full px-3 py-2 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white text-sm focus:outline-none focus:border-tiktok-cyan"
              />
            </div>
          </div>

          {/* Min Score */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Minimum Trend Score: {filters.minScore}
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={filters.minScore}
              onChange={(e) => updateFilter("minScore", parseInt(e.target.value))}
              className="w-full accent-tiktok-cyan"
            />
          </div>

          {/* Velocity */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Trend Velocity
            </label>
            <div className="flex flex-wrap gap-2">
              {velocityOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => toggleVelocity(opt.value)}
                  className={clsx(
                    "px-3 py-1 rounded-full text-sm font-medium transition-colors",
                    filters.velocity.includes(opt.value)
                      ? "bg-tiktok-cyan/20 text-tiktok-cyan"
                      : "bg-tiktok-gray/50 text-gray-400 hover:text-white"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
