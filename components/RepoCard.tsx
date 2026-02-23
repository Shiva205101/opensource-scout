import React from 'react';
import { Repository } from '../types';
import { Star, GitFork, AlertCircle, ExternalLink, Zap } from 'lucide-react';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

interface RepoCardProps {
  repo: Repository;
  onClick: () => void;
}

export const RepoCard: React.FC<RepoCardProps> = ({ repo, onClick }) => {
  return (
    <div className="group relative flex flex-col glass-card rounded-2xl p-6 hover:border-primary/40 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <img
            src={repo.owner.avatar_url}
            alt={repo.owner.login}
            className="w-12 h-12 rounded-xl border border-border glass-soft shadow-sm"
          />
          <div>
            <h3 className="font-display font-bold text-xl leading-tight text-text-main group-hover:text-primary transition-colors line-clamp-1" title={repo.full_name}>
              {repo.name}
            </h3>
            <span className="text-sm text-text-muted font-medium">{repo.owner.login}</span>
          </div>
        </div>
      </div>

      <p className="text-text-muted text-sm mb-6 line-clamp-2 flex-grow leading-relaxed font-medium">
        {repo.description || "No description provided."}
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {repo.language && <Badge variant="outline" className="font-semibold">{repo.language}</Badge>}
        {repo.topics.slice(0, 2).map(t => (
          <Badge key={t} variant="default" className="bg-primary/10 text-primary border-none font-semibold">{t}</Badge>
        ))}
        {repo.topics.length > 2 && <span className="text-xs text-text-muted font-bold self-center">+{repo.topics.length - 2}</span>}
      </div>

      <div className="flex items-center justify-between text-sm text-text-muted pt-5 border-t border-border mt-auto">
        <div className="flex items-center gap-5 font-bold">
          <span className="flex items-center gap-1.5 hover:text-amber-500 transition-colors">
            <Star className="w-4 h-4" /> {repo.stargazers_count.toLocaleString()}
          </span>
          <span className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
            <GitFork className="w-4 h-4" /> {repo.forks_count.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="rounded-xl h-10 w-10 p-0 text-accent hover:text-accent hover:bg-accent/10 border border-transparent hover:border-accent/20 transition-all" onClick={(e) => {
            e.stopPropagation();
            onClick();
          }} title="AI Analysis">
            <Zap className="w-4 h-4 fill-current" />
          </Button>
          <a href={repo.html_url} target="_blank" rel="noreferrer" className="h-10 w-10 flex items-center justify-center rounded-xl hover:text-text-main hover:bg-surface-hover border border-transparent hover:border-border transition-all" onClick={(e) => e.stopPropagation()}>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Decorative glow */}
      <div className="absolute inset-0 border-2 border-primary/0 rounded-2xl group-hover:border-primary/10 transition-all duration-500 pointer-events-none" />
    </div>
  );
};
