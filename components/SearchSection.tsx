import React, { useState } from 'react';
import { Search, Sparkles, Command, ChevronDown, Filter } from 'lucide-react';
import { Button } from './ui/Button';
import { EXAMPLE_QUERIES, LANGUAGES, SORT_OPTIONS, STAR_OPTIONS } from '../constants';
import { FilterState } from '../types';

interface SearchSectionProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: FilterState) => void;
  filters: FilterState;
  loading: boolean;
  aiThinking: boolean;
}

export const SearchSection: React.FC<SearchSectionProps> = ({ onSearch, onFilterChange, filters, loading, aiThinking }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSearch(input);
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    onFilterChange({
      ...filters,
      [key]: value
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Main Search Bar */}
      <form onSubmit={handleSubmit} className="relative group z-20">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-secondary rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
        <div className="relative flex items-center glass-card rounded-2xl shadow-2xl overflow-hidden focus-within:border-primary/50 transition-all duration-300">
          <div className="pl-6 text-text-muted">
            {aiThinking ? <Sparkles className="w-6 h-6 animate-pulse text-accent" /> : <Search className="w-6 h-6" />}
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe what you want to build (e.g. 'Beginner React projects')..."
            className="w-full bg-transparent border-none px-6 py-6 text-text-main placeholder-text-muted/60 focus:outline-none focus:ring-0 text-xl font-medium"
            disabled={loading}
          />
          <div className="pr-3">
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="min-w-[120px] py-4 rounded-xl text-lg shadow-xl"
            >
              {loading ? (aiThinking ? 'Thinking...' : 'Scouting...') : 'Scout'}
            </Button>
          </div>
        </div>
      </form>

      {/* Filters Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-700 delay-150">

        {/* Language Select */}
        <div className="relative group">
          <select
            value={filters.language}
            onChange={(e) => handleFilterChange('language', e.target.value)}
            className="w-full appearance-none glass-soft text-text-main hover:border-primary/30 py-3.5 px-5 pr-10 rounded-xl text-sm font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer shadow-sm"
          >
            {LANGUAGES.map(lang => (
              <option key={lang.value} value={lang.value}>{lang.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none transition-transform group-hover:translate-y-[-40%]" />
        </div>

        {/* Min Stars Select */}
        <div className="relative group">
          <select
            value={filters.minStars}
            onChange={(e) => handleFilterChange('minStars', e.target.value)}
            className="w-full appearance-none glass-soft text-text-main hover:border-primary/30 py-3.5 px-5 pr-10 rounded-xl text-sm font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer shadow-sm"
          >
            {STAR_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none transition-transform group-hover:translate-y-[-40%]" />
        </div>

        {/* Sort Select */}
        <div className="relative group">
          <select
            value={filters.sort}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
            className="w-full appearance-none glass-soft text-text-main hover:border-primary/30 py-3.5 px-5 pr-10 rounded-xl text-sm font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer shadow-sm"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none transition-transform group-hover:translate-y-[-40%]" />
        </div>

        {/* Good First Issues Toggle */}
        <button
          onClick={() => handleFilterChange('hasGoodFirstIssues', !filters.hasGoodFirstIssues)}
          className={`flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border text-sm font-semibold transition-all shadow-sm ${filters.hasGoodFirstIssues
            ? 'bg-secondary/10 border-secondary/50 text-secondary'
            : 'glass-soft text-text-muted hover:text-text-main hover:border-primary/30'
            }`}
        >
          <Filter className="w-4 h-4" />
          <span>Good First Issues</span>
        </button>

      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 text-sm pt-4">
        <span className="text-text-muted flex items-center gap-1.5 font-medium">
          <Command className="w-3.5 h-3.5" /> Try:
        </span>
        {EXAMPLE_QUERIES.map((q) => (
          <button
            key={q}
            onClick={() => {
              setInput(q);
              onSearch(q);
            }}
            className="px-4 py-1.5 rounded-full glass-soft text-text-muted hover:text-primary hover:border-primary/30 transition-all text-xs font-semibold shadow-sm"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
};
