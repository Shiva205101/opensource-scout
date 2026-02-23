import { GITHUB_API_BASE } from '../constants';
import { RepoIssue, SearchResponse, Repository, SortOption } from '../types';

export const searchRepositories = async (query: string, sort: SortOption = 'best-match'): Promise<Repository[]> => {
  const encodedQuery = encodeURIComponent(query.trim());
  
  let url = `${GITHUB_API_BASE}/search/repositories?q=${encodedQuery}&per_page=12`;

  if (sort !== 'best-match') {
    url += `&sort=${sort}&order=desc`;
  }

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      // No auth token used here to avoid requiring user setup for this demo.
      // Rate limit is 60 requests/hour for unauth, which is acceptable for a demo.
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `GitHub API Error: ${response.status}`);
  }

  const data: SearchResponse = await response.json();
  return data.items || [];
};

const fetchLatestIssueByState = async (fullRepoName: string, state: 'open' | 'closed'): Promise<RepoIssue | null> => {
  const url = `${GITHUB_API_BASE}/repos/${fullRepoName}/issues?state=${state}&sort=updated&direction=desc&per_page=20`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `GitHub API Error: ${response.status}`);
  }

  const items = await response.json();
  const latestIssue = (items || []).find((item: any) => !item.pull_request);
  return latestIssue || null;
};

export const fetchLatestIssueSnapshots = async (fullRepoName: string): Promise<{
  latestOpenIssue: RepoIssue | null;
  latestClosedIssue: RepoIssue | null;
}> => {
  const [latestOpenIssue, latestClosedIssue] = await Promise.all([
    fetchLatestIssueByState(fullRepoName, 'open'),
    fetchLatestIssueByState(fullRepoName, 'closed')
  ]);

  return { latestOpenIssue, latestClosedIssue };
};
