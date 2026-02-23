export interface Repository {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string;
  stargazers_count: number;
  language: string;
  forks_count: number;
  open_issues_count: number;
  owner: {
    avatar_url: string;
    login: string;
  };
  topics: string[];
  updated_at: string;
}

export interface SearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: Repository[];
}

export interface RepoIssue {
  id: number;
  number: number;
  title: string;
  html_url: string;
  state: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  closed_at?: string | null;
  user: {
    login: string;
  };
}

export enum GeminiModel {
  FLASH_PREVIEW = 'gemini-3-flash-preview',
  PRO_PREVIEW = 'gemini-3-pro-preview'
}

export enum AnalysisModel {
  GEMINI_FLASH = 'gemini-3-flash-preview',
  GEMINI_PRO = 'gemini-3-pro-preview',
  OPENAI_GPT_4O = 'gpt-4o',
  OPENAI_GPT_4_1 = 'gpt-4.1'
}

export type AIProvider = 'Gemini' | 'OpenAI';

export interface AnalysisModelOption {
  value: AnalysisModel;
  label: string;
  provider: AIProvider;
}

export type SortOption = 'best-match' | 'stars' | 'forks' | 'updated';

export interface FilterState {
  language: string;
  minStars: string;
  sort: SortOption;
  hasGoodFirstIssues: boolean;
}
