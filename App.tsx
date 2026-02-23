import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { SearchSection } from './components/SearchSection';
import { RepoList } from './components/RepoList';
import { RepoAnalysisModal } from './components/RepoAnalysisModal';
import { searchRepositories } from './services/githubService';
import { translateNaturalLanguageToQuery } from './services/geminiService';
import { Repository, FilterState } from './types';
import { Loader2, AlertCircle } from 'lucide-react';

import { ThemeProvider } from './components/ThemeProvider';

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const [naturalInput, setNaturalInput] = useState<string>('');

  // State for manual filters
  const [filters, setFilters] = useState<FilterState>({
    language: '',
    minStars: '',
    sort: 'best-match',
    hasGoodFirstIssues: false
  });

  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [aiThinking, setAiThinking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);

  // Trigger search when filters change, but only if we have some initial data or input
  useEffect(() => {
    // Debounce the filter change slightly to avoid double queries on mount
    const timer = setTimeout(() => {
      if (naturalInput || filters.language || filters.minStars) {
        handleSearch(naturalInput, false);
      } else {
        // Default initial search
        handleSearch("opensource", true);
      }
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleSearch = async (searchQuery: string, directApiQuery: boolean = false) => {
    if (!searchQuery && !filters.language && !filters.minStars) return;

    setLoading(true);
    setError(null);
    try {
      let apiQuery = searchQuery;

      if (!directApiQuery && searchQuery) {
        setAiThinking(true);
        try {
          if (searchQuery.includes(' ') && searchQuery.length > 10) {
            const translated = await translateNaturalLanguageToQuery(searchQuery);
            apiQuery = translated;
          } else {
            apiQuery = searchQuery;
          }
        } catch (e) {
          console.error("AI Translation failed, falling back to raw query", e);
          apiQuery = searchQuery;
        } finally {
          setAiThinking(false);
        }
      }

      let finalQuery = apiQuery;

      if (filters.language) {
        if (!finalQuery.includes(`language:${filters.language}`)) {
          finalQuery += ` language:${filters.language}`;
        }
      }

      if (filters.minStars) {
        finalQuery += ` stars:>=${filters.minStars}`;
      }

      if (filters.hasGoodFirstIssues) {
        finalQuery += ` good-first-issues:>=1`;
      }

      const results = await searchRepositories(finalQuery, filters.sort);
      setRepos(results);
    } catch (err: any) {
      setError(err.message || "Failed to fetch repositories.");
    } finally {
      setLoading(false);
    }
  };

  const onNaturalSearchSubmit = (input: string) => {
    setNaturalInput(input);
    handleSearch(input, false);
  };

  return (
    <div className="min-h-screen bg-background text-text-main font-sans selection:bg-primary/30">
      <Navbar />

      <main className="container mx-auto px-4 py-12 max-w-6xl glass-shell rounded-3xl mt-8">
        <div className="mb-14 space-y-4">
          <h1 className="text-5xl md:text-7xl font-display font-extrabold text-center tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Find Your Next Contribution
          </h1>
          <p className="text-center text-text-muted text-xl max-w-2xl mx-auto font-medium">
            Search naturally using AI and refine results with smart filters.
          </p>
        </div>

        <SearchSection
          onSearch={onNaturalSearchSubmit}
          onFilterChange={setFilters}
          filters={filters}
          loading={loading || aiThinking}
          aiThinking={aiThinking}
        />

        {error && (
          <div className="mt-8 p-4 glass-soft border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 font-medium">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        )}

        {loading && !aiThinking && (
          <div className="mt-20 flex flex-col items-center justify-center text-text-muted glass-soft rounded-2xl py-16">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
            <p className="font-medium">Scouting GitHub...</p>
          </div>
        )}

        {!loading && !error && (
          <RepoList repos={repos} onSelectRepo={setSelectedRepo} />
        )}
      </main>

      {selectedRepo && (
        <RepoAnalysisModal
          repo={selectedRepo}
          onClose={() => setSelectedRepo(null)}
        />
      )}
    </div>
  );
}
