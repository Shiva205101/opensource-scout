import React from 'react';
import { Repository } from '../types';
import { RepoCard } from './RepoCard';

interface RepoListProps {
  repos: Repository[];
  onSelectRepo: (repo: Repository) => void;
}

export const RepoList: React.FC<RepoListProps> = ({ repos, onSelectRepo }) => {
  if (repos.length === 0) {
    return (
      <div className="mt-12 text-center text-text-muted">
        <p>No repositories found. Try a different search.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {repos.map((repo) => (
        <RepoCard key={repo.id} repo={repo} onClick={() => onSelectRepo(repo)} />
      ))}
    </div>
  );
};
