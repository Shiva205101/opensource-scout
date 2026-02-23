import { GITHUB_API_BASE } from '../constants';
import { SearchResponse, Repository, SortOption } from '../types';

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