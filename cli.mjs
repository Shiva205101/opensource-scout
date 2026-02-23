#!/usr/bin/env node

import fs from "fs";
import path from "path";
import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { GoogleGenAI, Type } from "@google/genai";

const GITHUB_API_BASE = "https://api.github.com";
const SYSTEM_INSTRUCTION_SEARCH = `
You are a GitHub Search Query Expert.
Convert the user's natural language intent into a specific GitHub Search API query string.
- Use qualifiers like language:name, stars:>N, good-first-issues:>N, topic:name.
- If the user asks for "beginner" or "easy", include good-first-issues:>0.
- If the user doesn't specify sort, default to sorting by stars if implied "popular", or best match.
- Return ONLY the query string. Do not include markdown formatting or explanations.
`;
const SYSTEM_INSTRUCTION_ANALYSIS = `
You are a Senior Open Source Maintainer.
Your goal is to analyze a repository based on its description, stats, and metadata to encourage contribution.
Provide a JSON response with the following structure:
{
  "summary": "A 2-sentence hook about why this project is cool.",
  "difficulty": "Beginner | Intermediate | Advanced",
  "goodFor": ["List", "of", "skills", "e.g. React", "CSS"],
  "gettingStartedTip": "One specific actionable tip to start.",
  "potentialImpact": "High | Medium | Low",
  "learningCurveData": [
    { "day": "Day 1", "knowledge": 10 },
    { "day": "Day 3", "knowledge": 40 },
    { "day": "Day 7", "knowledge": 70 },
    { "day": "Day 14", "knowledge": 90 }
  ]
}
`;

const ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    difficulty: { type: "string" },
    goodFor: { type: "array", items: { type: "string" } },
    gettingStartedTip: { type: "string" },
    potentialImpact: { type: "string" },
    learningCurveData: {
      type: "array",
      items: {
        type: "object",
        properties: {
          day: { type: "string" },
          knowledge: { type: "integer" }
        },
        required: ["day", "knowledge"],
        additionalProperties: false
      }
    }
  },
  required: [
    "summary",
    "difficulty",
    "goodFor",
    "gettingStartedTip",
    "potentialImpact",
    "learningCurveData"
  ],
  additionalProperties: false
};

function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    i += 1;
  }
  return args;
}

async function searchRepositories(query, sort = "best-match") {
  const encodedQuery = encodeURIComponent(query.trim());
  let url = `${GITHUB_API_BASE}/search/repositories?q=${encodedQuery}&per_page=12`;
  if (sort !== "best-match") url += `&sort=${sort}&order=desc`;

  const response = await fetch(url, {
    headers: { Accept: "application/vnd.github.v3+json" }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `GitHub API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.items || [];
}

async function translateNaturalLanguageToQuery(ai, inputText) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `User Intent: "${inputText}"`,
    config: { systemInstruction: SYSTEM_INSTRUCTION_SEARCH, temperature: 0.1 }
  });
  return response.text ? response.text.trim() : inputText;
}

async function analyzeWithGemini(ai, model, repo) {
  const prompt = `
Repository: ${repo.name}
Language: ${repo.language || "Unknown"}
Topics: ${(repo.topics || []).join(", ")}
Description: ${repo.description || "No description"}
`;
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION_ANALYSIS,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          difficulty: { type: Type.STRING },
          goodFor: { type: Type.ARRAY, items: { type: Type.STRING } },
          gettingStartedTip: { type: Type.STRING },
          potentialImpact: { type: Type.STRING },
          learningCurveData: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                day: { type: Type.STRING },
                knowledge: { type: Type.INTEGER }
              }
            }
          }
        }
      }
    }
  });
  if (!response.text) throw new Error("No analysis generated");
  return JSON.parse(response.text);
}

async function analyzeWithOpenAI(openAiApiKey, model, repo) {
  const prompt = `
Repository: ${repo.name}
Language: ${repo.language || "Unknown"}
Topics: ${(repo.topics || []).join(", ")}
Description: ${repo.description || "No description"}
`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAiApiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION_ANALYSIS },
        { role: "user", content: prompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "repo_analysis", strict: true, schema: ANALYSIS_SCHEMA }
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("No analysis generated");
  return JSON.parse(content);
}

function printUsage() {
  console.log(`
OpenSourceScout CLI

Usage:
  npm run cli -- --query "beginner friendly react repos"

Optional flags:
  --model <gemini-3-flash-preview|gemini-3-pro-preview|gpt-4o|gpt-4.1>
  --language <name>
  --min-stars <number>
  --sort <best-match|stars|forks|updated>
  --good-first-issues
  --repo-index <1-based index from search results>
  --help
`);
}

async function main() {
  loadEnvFile();
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    return;
  }

  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
  const openAiApiKey = process.env.OPENAI_API_KEY || "";
  const gemini = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

  const availableModels = [
    ...(gemini ? ["gemini-3-flash-preview", "gemini-3-pro-preview"] : []),
    ...(openAiApiKey ? ["gpt-4o", "gpt-4.1"] : [])
  ];
  if (!availableModels.length) {
    throw new Error("No AI keys configured. Add GEMINI_API_KEY or OPENAI_API_KEY in .env.local");
  }

  const rl = readline.createInterface({ input, output });
  try {
    const queryInput = args.query || args.q || await rl.question("Search query: ");
    if (!queryInput?.trim()) throw new Error("Query is required.");

    let model = args.model;
    if (!model || !availableModels.includes(model)) {
      console.log("\nAvailable models:");
      availableModels.forEach((m, idx) => console.log(`  ${idx + 1}. ${m}`));
      const selected = await rl.question("Select model number: ");
      const index = Number.parseInt(selected, 10) - 1;
      model = availableModels[index];
      if (!model) throw new Error("Invalid model selection.");
    }

    const sort = args.sort || "best-match";
    let finalQuery = queryInput.trim();
    if (gemini && queryInput.includes(" ") && queryInput.length > 10) {
      finalQuery = await translateNaturalLanguageToQuery(gemini, queryInput);
    }
    if (args.language && !finalQuery.includes(`language:${args.language}`)) {
      finalQuery += ` language:${args.language}`;
    }
    if (args["min-stars"]) finalQuery += ` stars:>=${args["min-stars"]}`;
    if (args["good-first-issues"]) finalQuery += " good-first-issues:>=1";

    console.log(`\nResolved query: ${finalQuery}`);
    console.log(`Searching GitHub (sort: ${sort})...\n`);
    const repos = await searchRepositories(finalQuery, sort);
    if (!repos.length) {
      console.log("No repositories found.");
      return;
    }

    repos.forEach((repo, idx) => {
      console.log(
        `${idx + 1}. ${repo.full_name} | ★ ${repo.stargazers_count} | ${repo.language || "Unknown"}`
      );
      if (repo.description) console.log(`   ${repo.description}`);
      console.log(`   ${repo.html_url}`);
    });

    let repoIndex = args["repo-index"] ? Number.parseInt(args["repo-index"], 10) - 1 : -1;
    if (Number.isNaN(repoIndex) || repoIndex < 0 || repoIndex >= repos.length) {
      const selected = await rl.question("\nSelect repository number for AI analysis: ");
      repoIndex = Number.parseInt(selected, 10) - 1;
    }
    if (Number.isNaN(repoIndex) || repoIndex < 0 || repoIndex >= repos.length) {
      throw new Error("Invalid repository selection.");
    }

    const selectedRepo = repos[repoIndex];
    console.log(`\nAnalyzing ${selectedRepo.full_name} with ${model}...\n`);

    const analysis = model.startsWith("gemini")
      ? await analyzeWithGemini(gemini, model, selectedRepo)
      : await analyzeWithOpenAI(openAiApiKey, model, selectedRepo);

    console.log(`Summary: ${analysis.summary}`);
    console.log(`Difficulty: ${analysis.difficulty}`);
    console.log(`Potential Impact: ${analysis.potentialImpact}`);
    console.log(`Good For: ${(analysis.goodFor || []).join(", ")}`);
    console.log(`Getting Started Tip: ${analysis.gettingStartedTip}`);
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
