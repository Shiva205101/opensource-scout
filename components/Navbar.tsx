import React from 'react';
import { Github, Sparkles, Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="glass-shell sticky top-0 z-50">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between max-w-6xl">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="bg-primary/10 p-2.5 rounded-xl group-hover:bg-primary/20 transition-all duration-300">
            <Github className="w-7 h-7 text-primary" />
          </div>
          <span className="font-display font-bold text-2xl tracking-tight text-text-main">
            OpenSource<span className="text-primary">Scout</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 text-sm font-medium text-text-muted glass-soft px-4 py-2 rounded-full shadow-sm">
            <Sparkles className="w-4 h-4 text-accent animate-pulse" />
            <span>Powered by Gemini + OpenAI</span>
          </div>

          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-surface border border-border text-text-muted hover:text-primary hover:border-primary/30 transition-all duration-300 shadow-sm"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>

          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="bg-primary text-white hover:bg-primary/90 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg shadow-primary/20"
          >
            GitHub Login
          </a>
        </div>
      </div>
    </nav>
  );
};
