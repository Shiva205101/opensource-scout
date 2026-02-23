import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisModel, AnalysisModelOption, GeminiModel } from '../types';
import { SYSTEM_INSTRUCTION_SEARCH, SYSTEM_INSTRUCTION_ANALYSIS } from '../constants';

const geminiApiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
const openAiApiKey = process.env.OPENAI_API_KEY || '';

// Safely initialize GenAI only if key is present to avoid runtime crashes on init
const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

const REPO_ANALYSIS_SCHEMA = {
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

export const ANALYSIS_MODEL_OPTIONS: AnalysisModelOption[] = [
  { value: AnalysisModel.GEMINI_FLASH, label: "Gemini Flash", provider: "Gemini" },
  { value: AnalysisModel.GEMINI_PRO, label: "Gemini Pro", provider: "Gemini" },
  { value: AnalysisModel.OPENAI_GPT_4O, label: "OpenAI GPT-4o", provider: "OpenAI" },
  { value: AnalysisModel.OPENAI_GPT_4_1, label: "OpenAI GPT-4.1", provider: "OpenAI" }
];

export const getAllAnalysisModels = (): AnalysisModelOption[] => ANALYSIS_MODEL_OPTIONS;

export const getAvailableAnalysisModels = (): AnalysisModelOption[] => {
  return ANALYSIS_MODEL_OPTIONS.filter(({ provider }) => {
    if (provider === "Gemini") return Boolean(geminiApiKey);
    return Boolean(openAiApiKey);
  });
};

export const translateNaturalLanguageToQuery = async (userUnput: string): Promise<string> => {
  if (!ai) throw new Error("API_KEY not found in environment");

  const response = await ai.models.generateContent({
    model: GeminiModel.FLASH_PREVIEW,
    contents: `User Intent: "${userUnput}"`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION_SEARCH,
      temperature: 0.1, // Low temperature for deterministic query generation
    },
  });

  return response.text ? response.text.trim() : userUnput;
};

export interface RepoAnalysis {
  summary: string;
  difficulty: string;
  goodFor: string[];
  gettingStartedTip: string;
  potentialImpact: string;
  learningCurveData: { day: string; knowledge: number }[];
}

const analyzeWithGemini = async (
  model: GeminiModel,
  repoName: string,
  description: string,
  language: string,
  topics: string[]
): Promise<RepoAnalysis> => {
  if (!ai) throw new Error("API_KEY not found");

  const prompt = `
    Repository: ${repoName}
    Language: ${language}
    Topics: ${topics.join(', ')}
    Description: ${description}
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

  if (!response.text) {
    throw new Error("No analysis generated");
  }

  try {
    return JSON.parse(response.text) as RepoAnalysis;
  } catch (e) {
    console.error("Failed to parse JSON analysis", e);
    throw new Error("Failed to parse AI analysis");
  }
};

const analyzeWithOpenAI = async (
  model: AnalysisModel.OPENAI_GPT_4O | AnalysisModel.OPENAI_GPT_4_1,
  repoName: string,
  description: string,
  language: string,
  topics: string[]
): Promise<RepoAnalysis> => {
  if (!openAiApiKey) throw new Error("OPENAI_API_KEY not found");

  const prompt = `
    Repository: ${repoName}
    Language: ${language}
    Topics: ${topics.join(', ')}
    Description: ${description}
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
        json_schema: {
          name: "repo_analysis",
          strict: true,
          schema: REPO_ANALYSIS_SCHEMA
        }
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("No analysis generated");
  }

  try {
    return JSON.parse(content) as RepoAnalysis;
  } catch (e) {
    console.error("Failed to parse OpenAI analysis JSON", e);
    throw new Error("Failed to parse AI analysis");
  }
};

export const analyzeRepository = async (
  repoName: string,
  description: string,
  language: string,
  topics: string[],
  model: AnalysisModel = AnalysisModel.GEMINI_FLASH
): Promise<RepoAnalysis> => {
  if (model === AnalysisModel.GEMINI_FLASH || model === AnalysisModel.GEMINI_PRO) {
    return analyzeWithGemini(model as GeminiModel, repoName, description, language, topics);
  }

  return analyzeWithOpenAI(model, repoName, description, language, topics);
};
