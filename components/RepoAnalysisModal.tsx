import React, { useEffect, useMemo, useState } from 'react';
import { AnalysisModel, RepoIssue, Repository } from '../types';
import { analyzeIssueInsights, analyzeRepository, getAllAnalysisModels, getAvailableAnalysisModels, IssueInsights, RepoAnalysis } from '../services/geminiService';
import { fetchLatestIssueSnapshots } from '../services/githubService';
import { X, Sparkles, Award, Target, BookOpen, ExternalLink, Activity } from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface RepoAnalysisModalProps {
  repo: Repository;
  onClose: () => void;
}

export const RepoAnalysisModal: React.FC<RepoAnalysisModalProps> = ({ repo, onClose }) => {
  const modelOptions = useMemo(() => getAllAnalysisModels(), []);
  const availableModelValues = useMemo(
    () => new Set(getAvailableAnalysisModels().map((option) => option.value)),
    []
  );
  const [analysis, setAnalysis] = useState<RepoAnalysis | null>(null);
  const [selectedModel, setSelectedModel] = useState<AnalysisModel>(
    getAvailableAnalysisModels()[0]?.value ?? modelOptions[0]?.value ?? AnalysisModel.GEMINI_FLASH
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showIssuePopup, setShowIssuePopup] = useState(false);
  const [issueLoading, setIssueLoading] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [latestOpenIssue, setLatestOpenIssue] = useState<RepoIssue | null>(null);
  const [latestClosedIssue, setLatestClosedIssue] = useState<RepoIssue | null>(null);
  const [issueInsights, setIssueInsights] = useState<IssueInsights | null>(null);
  const selectedModelLabel = modelOptions.find((option) => option.value === selectedModel)?.label || selectedModel;
  const formatDate = (value?: string | null) => value ? new Date(value).toLocaleDateString() : 'N/A';

  useEffect(() => {
    let mounted = true;
    const fetchAnalysis = async () => {
      if (mounted) {
        setShowIssuePopup(false);
        setIssueError(null);
        setIssueInsights(null);
        setLatestOpenIssue(null);
        setLatestClosedIssue(null);
      }

      const modelIsConfigured = availableModelValues.has(selectedModel);
      if (!modelIsConfigured) {
        if (mounted) {
          const selectedProvider = modelOptions.find((option) => option.value === selectedModel)?.provider;
          const requiredKey = selectedProvider === "OpenAI" ? "OPENAI_API_KEY" : "GEMINI_API_KEY";
          setError(`${selectedModelLabel} is not configured. Add ${requiredKey} in .env.local and restart dev server.`);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await analyzeRepository(repo.name, repo.description, repo.language, repo.topics, selectedModel);
        if (mounted) setAnalysis(result);
      } catch (err) {
        if (mounted) setError(`Could not generate AI analysis with ${selectedModelLabel}.`);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAnalysis();
    return () => { mounted = false; };
  }, [repo, selectedModel, selectedModelLabel, modelOptions, availableModelValues]);

  const handleOpenIssuePopup = async () => {
    if (showIssuePopup) {
      setShowIssuePopup(false);
      return;
    }

    setShowIssuePopup(true);
    setIssueLoading(true);
    setIssueError(null);
    setIssueInsights(null);

    try {
      const { latestOpenIssue: openIssue, latestClosedIssue: closedIssue } = await fetchLatestIssueSnapshots(repo.full_name);
      setLatestOpenIssue(openIssue);
      setLatestClosedIssue(closedIssue);
      const aiInsights = await analyzeIssueInsights(selectedModel, repo.full_name, openIssue, closedIssue);
      setIssueInsights(aiInsights);
    } catch (err) {
      setIssueError('Could not load issue insights for this repository.');
    } finally {
      setIssueLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30 backdrop-blur-md animate-in fade-in duration-300">
      <div className="glass-shell w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-300">

        {/* Header */}
        <div className="p-8 border-b border-[rgba(var(--glass-border-raw),0.22)] flex items-start justify-between bg-[rgba(var(--glass-bg-raw),0.34)] backdrop-blur-2xl">
          <div>
            <h2 className="text-3xl font-display font-bold flex items-center gap-3 text-text-main">
              {repo.full_name}
              <a href={repo.html_url} target="_blank" rel="noreferrer" className="text-text-muted hover:text-primary transition-colors">
                <ExternalLink className="w-6 h-6" />
              </a>
            </h2>
            <div className="flex gap-3 mt-3">
              <Badge variant="outline" className="font-bold border-primary/20 text-primary">{repo.language}</Badge>
              <Badge variant="warning" className="font-bold">{repo.open_issues_count} open issues</Badge>
            </div>
            <div className="mt-4">
              <label htmlFor="analysis-model" className="text-xs uppercase tracking-[0.2em] text-text-muted font-black">
                Analysis Model
              </label>
              <select
                id="analysis-model"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as AnalysisModel)}
                className="mt-2 w-full max-w-xs h-11 rounded-xl border border-border bg-surface px-4 font-medium text-text-main focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
              >
                {modelOptions.map((option) => (
                  <option key={option.value} value={option.value} disabled={!availableModelValues.has(option.value)}>
                    {option.label}{!availableModelValues.has(option.value) ? ' (not configured)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button onClick={onClose} className="bg-surface-hover text-text-muted hover:text-text-main p-2.5 rounded-xl border border-border transition-all duration-300">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-8 pb-12 flex-grow custom-scrollbar space-y-10 bg-[rgba(var(--glass-bg-raw),0.22)] backdrop-blur-xl">
          {loading ? (
            <div className="h-80 flex flex-col items-center justify-center text-text-muted gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-accent blur-3xl opacity-30 animate-pulse"></div>
                <Sparkles className="w-16 h-16 text-accent relative z-10 animate-pulse" />
              </div>
              <p className="font-display text-xl font-medium animate-pulse">{selectedModelLabel} is analyzing the repository...</p>
            </div>
          ) : error ? (
            <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-center font-bold">
              {error}
            </div>
          ) : analysis ? (
            <div className="space-y-10">
              {/* Summary Section */}
              <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                  <div className="glass-card p-6 rounded-2xl shadow-sm">
                    <h3 className="text-xs uppercase tracking-[0.2em] text-text-muted font-black mb-4 flex items-center gap-3">
                      <Sparkles className="w-4 h-4 text-accent" /> AI Insights
                    </h3>
                    <p className="text-text-main text-xl leading-relaxed font-medium">{analysis.summary}</p>
                    <Button
                      className="mt-6 h-10 px-5 rounded-xl border border-primary/40 shadow-lg shadow-primary/20 hover:brightness-110"
                      style={{ backgroundColor: 'var(--primary)', color: 'var(--text-inverse)' }}
                      onClick={handleOpenIssuePopup}
                    >
                      {showIssuePopup ? 'Hide Issue Insights' : 'Latest Issue Insights'}
                    </Button>

                    {showIssuePopup && (
                      <div className="mt-6 rounded-2xl glass-card">
                        <div className="p-5 border-b border-border">
                          <h4 className="font-display font-bold text-lg text-text-main">Issue Insights</h4>
                          <p className="text-sm text-text-muted">Generated with {selectedModelLabel}</p>
                        </div>
                        <div className="p-5 space-y-5">
                          {issueLoading ? (
                            <div className="py-8 text-center font-semibold text-text-main">Loading latest open/closed issues...</div>
                          ) : issueError ? (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl font-medium">
                              {issueError}
                            </div>
                          ) : (
                            <>
                              <div className="grid md:grid-cols-2 gap-4">
                                <div className="min-w-0 border rounded-xl p-4 glass-soft border-border">
                                  <p className="text-xs uppercase tracking-widest font-black mb-2 text-text-main">Latest Open Issue</p>
                                  {latestOpenIssue ? (
                                    <div className="space-y-2">
                                      <a
                                        href={latestOpenIssue.html_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block text-primary font-bold hover:underline leading-snug [overflow-wrap:anywhere]"
                                      >
                                        #{latestOpenIssue.number} {latestOpenIssue.title}
                                      </a>
                                      <p className="text-sm text-text-main">Updated: {formatDate(latestOpenIssue.updated_at)}</p>
                                      <p className="text-sm text-text-main">By: {latestOpenIssue.user.login}</p>
                                    </div>
                                  ) : (
                                    <p className="text-text-main">No open issues found.</p>
                                  )}
                                </div>
                                <div className="min-w-0 border rounded-xl p-4 glass-soft border-border">
                                  <p className="text-xs uppercase tracking-widest font-black mb-2 text-text-main">Latest Solved Issue</p>
                                  {latestClosedIssue ? (
                                    <div className="space-y-2">
                                      <a
                                        href={latestClosedIssue.html_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block text-secondary font-bold hover:underline leading-snug [overflow-wrap:anywhere]"
                                      >
                                        #{latestClosedIssue.number} {latestClosedIssue.title}
                                      </a>
                                      <p className="text-sm text-text-main">Closed: {formatDate(latestClosedIssue.closed_at || latestClosedIssue.updated_at)}</p>
                                      <p className="text-sm text-text-main">By: {latestClosedIssue.user.login}</p>
                                    </div>
                                  ) : (
                                    <p className="text-text-main">No solved issues found.</p>
                                  )}
                                </div>
                              </div>

                              {issueInsights && (
                                <div className="space-y-3">
                                  <div className="p-4 rounded-xl border glass-soft border-border">
                                    <p className="text-xs uppercase tracking-widest font-black mb-2 text-text-main">AI Insight on Open Issue</p>
                                    <p className="font-semibold leading-relaxed text-text-main">{issueInsights.openIssueInsight}</p>
                                  </div>
                                  <div className="p-4 rounded-xl border glass-soft border-border">
                                    <p className="text-xs uppercase tracking-widest font-black mb-2 text-text-main">AI Insight on Solved Issue</p>
                                    <p className="font-semibold leading-relaxed text-text-main">{issueInsights.closedIssueInsight}</p>
                                  </div>
                                  <div className="p-4 rounded-xl border border-primary/25 bg-primary/10">
                                    <p className="text-xs uppercase tracking-widest text-primary font-black mb-2">Suggested Next Step</p>
                                    <p className="font-semibold leading-relaxed text-text-main">{issueInsights.contributionHint}</p>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="glass-card p-6 rounded-2xl group transition-all duration-300 hover:border-primary/20 shadow-sm">
                      <h4 className="text-text-muted text-sm font-bold mb-2 flex items-center gap-2 tracking-wide"><Target className="w-4 h-4" /> Difficulty</h4>
                      <span className={`text-2xl font-display font-black ${analysis.difficulty === 'Beginner' ? 'text-secondary' :
                          analysis.difficulty === 'Intermediate' ? 'text-amber-500' : 'text-red-500'
                        }`}>{analysis.difficulty}</span>
                    </div>
                    <div className="glass-card p-6 rounded-2xl group transition-all duration-300 hover:border-primary/20 shadow-sm">
                      <h4 className="text-text-muted text-sm font-bold mb-2 flex items-center gap-2 tracking-wide"><Award className="w-4 h-4" /> Potential Impact</h4>
                      <span className="text-2xl font-display font-black text-primary">{analysis.potentialImpact}</span>
                    </div>
                  </div>
                </div>

                {/* Learning Curve Chart */}
                <div className="glass-card p-6 rounded-2xl flex flex-col shadow-sm">
                  <h4 className="text-text-muted text-sm font-bold mb-6 flex items-center gap-2 tracking-wide">
                    <Activity className="w-4 h-4" /> Learning Curve
                  </h4>
                  <div className="h-44 w-full mt-auto">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analysis.learningCurveData}>
                        <defs>
                          <linearGradient id="colorKnowledge" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="day" hide />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--surface)',
                            borderColor: 'var(--border)',
                            color: 'var(--text-main)',
                            borderRadius: '12px',
                            borderWidth: '1px',
                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                          }}
                          itemStyle={{ color: 'var(--accent)', fontWeight: 'bold' }}
                        />
                        <Area type="monotone" dataKey="knowledge" stroke="var(--accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorKnowledge)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[10px] uppercase font-black tracking-widest text-center text-text-muted mt-4">Growth over time</p>
                </div>
              </div>

              {/* Actionable Tips */}
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-display font-bold text-xl text-text-main flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-secondary" /> Roadmap to Contribute
                  </h3>
                  <div className="glass-soft border border-secondary/20 p-6 rounded-2xl text-secondary font-medium leading-relaxed">
                    {analysis.gettingStartedTip}
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-display font-bold text-xl text-text-main flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-primary" /> Tech Proficiency
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {analysis.goodFor.map((skill, idx) => (
                      <Badge key={idx} variant="outline" className="text-sm px-4 py-2 font-bold glass-soft shadow-sm hover:border-primary/40 transition-all">{skill}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[rgba(var(--glass-border-raw),0.22)] bg-[rgba(var(--glass-bg-raw),0.34)] backdrop-blur-2xl flex justify-end gap-4 shadow-[0_-14px_28px_-18px_rgba(0,0,0,0.45)]">
          <Button variant="outline" onClick={onClose} className="font-bold px-6 h-12 rounded-xl border border-border text-text-main bg-surface hover:bg-surface-hover">Close</Button>
          <a href={repo.html_url} target="_blank" rel="noreferrer">
            <Button
              className="font-bold px-8 h-12 rounded-xl shadow-xl shadow-primary/20 hover:brightness-110"
              style={{ backgroundColor: 'var(--primary)', color: 'var(--text-inverse)' }}
            >
              Visit Repository
            </Button>
          </a>
        </div>

      </div>
    </div>
  );
};
