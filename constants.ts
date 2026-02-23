export const GITHUB_API_BASE = 'https://api.github.com';

export const EXAMPLE_QUERIES = [
  "Beginner friendly TypeScript projects",
  "High performance Rust tools",
  "React libraries needing help",
  "Machine Learning with Python"
];

export const LANGUAGES = [
  { value: '', label: 'All Languages' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'rust', label: 'Rust' },
  { value: 'go', label: 'Go' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'swift', label: 'Swift' },
];

export const SORT_OPTIONS = [
  { value: 'best-match', label: 'Best Match' },
  { value: 'stars', label: 'Most Stars' },
  { value: 'forks', label: 'Most Forks' },
  { value: 'updated', label: 'Recently Updated' },
];

export const STAR_OPTIONS = [
    { value: '', label: 'Any Stars' },
    { value: '100', label: '> 100 Stars' },
    { value: '1000', label: '> 1k Stars' },
    { value: '5000', label: '> 5k Stars' },
    { value: '10000', label: '> 10k Stars' },
];

export const SYSTEM_INSTRUCTION_SEARCH = `
You are a GitHub Search Query Expert. 
Convert the user's natural language intent into a specific GitHub Search API query string.
- Use qualifiers like \`language:name\`, \`stars:>N\`, \`good-first-issues:>N\`, \`topic:name\`.
- If the user asks for "beginner" or "easy", include \`good-first-issues:>0\`.
- If the user doesn't specify sort, default to sorting by stars if implied "popular", or best match.
- Return ONLY the query string. Do not include markdown formatting or explanations.
`;

export const SYSTEM_INSTRUCTION_ANALYSIS = `
You are a Senior Open Source Maintainer.
Your goal is to analyze a repository based on its description, stats, and metadata to encourage contribution.
Provide a JSON response with the following structure:
{
  "summary": "A 2-sentence hook about why this project is cool.",
  "difficulty": "Beginner | Intermediate | Advanced",
  "goodFor": ["List", "of", "skills", "e.g. React", "CSS"],
  "gettingStartedTip": "One specific actionable tip to start (e.g. 'Check the CONTRIBUTING.md' or 'Look for labels like...').",
  "potentialImpact": "High | Medium | Low",
  "learningCurveData": [
    { "day": "Day 1", "knowledge": 10 },
    { "day": "Day 3", "knowledge": 40 },
    { "day": "Day 7", "knowledge": 70 },
    { "day": "Day 14", "knowledge": 90 }
  ]
}
The learningCurveData is for a visualization. Estimate the learning curve based on project complexity (language, size).
`;