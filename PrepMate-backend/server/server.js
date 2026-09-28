import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { evaluatePrediction, predictQuestions } from "./predictionEngine.js";
import sampleQuestionPapers from "./data/sampleQuestionPapers.json" with { type: "json" };
import HTMLToDOCX from "html-to-docx";

// Always load the backend's credentials, even when `node server/server.js`
// is launched from the project root.
const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(serverDirectory, ".env") });
const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/prediction-demo", (_req, res) => res.json({ records: sampleQuestionPapers }));

app.post("/predict-questions", async (req, res) => {
  try {
    const result = await predictQuestions(req.body.records || [], Number(req.body.currentYear) || new Date().getFullYear());
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/evaluate-prediction", async (req, res) => {
  try {
    const evaluation = await evaluatePrediction(req.body.records || []);
    res.json({ evaluation });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/generate-docx", async (req, res) => {
  try {
    const htmlString = req.body.html;
    if (!htmlString) {
      return res.status(400).json({ error: "Missing HTML content" });
    }
    const fileBuffer = await HTMLToDOCX(htmlString, null, {
      table: { row: { cantSplit: true } },
      footer: true,
      pageNumber: true,
    });
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", "attachment; filename=PrepMate-Most-Probable-Questions.docx");
    res.send(fileBuffer);
  } catch (error) {
    console.error("DOCX generation error:", error);
    res.status(500).json({ error: "Failed to generate DOCX" });
  }
});

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
// The previous Llama 4 Scout ID was deprecated for Groq free/developer tiers
// in July 2026. Keep the model configurable so deployments can select an
// account-available model without editing source code.
const GROQ_MODEL = process.env.GROQ_MODEL || "qwen/qwen3.6-27b";

// A generic function to interact with the Groq API
const callGroqAPI = async (messages, max_tokens, apiKey, options = {}) => {
  if (!apiKey) {
    throw new Error("Groq API key is missing. Add it to server/.env.");
  }
  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: GROQ_MODEL,
        messages,
        max_tokens,
        ...options,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    const status = error.response?.status;
    const providerMessage = error.response?.data?.error?.message
      || error.response?.data?.error
      || error.message;
    console.error(
      "Error calling Groq API:",
      status ? `HTTP ${status}: ${providerMessage}` : `${providerMessage || error.code || "No response from Groq"} (${error.code || "unknown error"})`
    );
    throw new Error(`AI service request failed${status ? ` (${status})` : ""}: ${providerMessage || error.code || "No response from Groq"}`);
  }
};

// A helper to safely parse JSON from the model
const parseJsonFromModel = (rawContent) => {
  const text = String(rawContent || "").trim();
  const candidates = [text];
  const fenced = [...text.matchAll(/```(?:json)?\s*([\s\S]*?)\s*```/gi)].map((match) => match[1]);
  candidates.push(...fenced);

  // Extract balanced object/array candidates. Unlike a greedy regex, this can
  // recover a valid final JSON payload when surrounding model prose contains
  // earlier draft objects or examples.
  for (let start = 0; start < text.length; start += 1) {
    if (text[start] !== "{" && text[start] !== "[") continue;
    const stack = [text[start] === "{" ? "}" : "]"];
    let inString = false;
    let escaped = false;
    for (let end = start + 1; end < text.length; end += 1) {
      const character = text[end];
      if (inString) {
        if (escaped) escaped = false;
        else if (character === "\\") escaped = true;
        else if (character === '"') inString = false;
        continue;
      }
      if (character === '"') { inString = true; continue; }
      if (character === "{" ) stack.push("}");
      else if (character === "[") stack.push("]");
      else if (character === stack.at(-1)) {
        stack.pop();
        if (!stack.length) { candidates.push(text.slice(start, end + 1)); break; }
      }
    }
  }

  for (const candidate of [...candidates].reverse()) {
    try { return JSON.parse(candidate.trim()); } catch { /* Try the next candidate. */ }
  }
  console.error("Invalid JSON from model:", text.slice(0, 1200));
  throw new Error("The AI response was not valid JSON. Please try again.");
};

/** Generate quiz */
app.post("/generate-quiz", async (req, res) => {
  const { topic, difficulty = "Beginner", proficiency } = req.body;
  const questionCount = Math.max(5, Math.min(15, Number(req.body.questionCount) || 5));
  if (!topic) {
    return res.status(400).json({ error: "Topic is required." });
  }

  const messages = [
    {
      role: "system",
      content: "You are a quiz generator. Respond ONLY in valid JSON, no extra text.",
    },
    {
      role: "user",
      content: `Generate exactly ${questionCount} multiple-choice questions on ${topic} at a ${difficulty} difficulty level.
            The learner's current estimated proficiency is ${Number.isFinite(proficiency) ? `${Math.round(proficiency)}%` : "unknown"}. Match the questions to the requested level; do not mix levels.
            STRICTLY return this JSON format (NO extra text, no backticks):
            [
              {
                "question": "string",
                "options": ["string","string","string","string"],
                "correct_answer": "string"
              }
            ]`,
    },
  ];

  try {
    const rawContent = await callGroqAPI(messages, questionCount * 180, process.env.GROQ_API_KEY);
    const quiz = parseJsonFromModel(rawContent);
    if (!Array.isArray(quiz)) {
      throw new Error("AI response was not a JSON array.");
    }
    res.json({ quiz });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ quiz: [], error: `Failed to generate quiz: ${err.message}` });
  }
});

app.post("/review-portfolio", async (req, res) => {
  const { repoUrl, role = "Target role", deployed, tests, documentation } = req.body;
  let parsedUrl;
  try { parsedUrl = new URL(repoUrl); } catch { return res.status(400).json({ error: "Enter a valid public GitHub repository URL." }); }
  if (parsedUrl.hostname !== "github.com") return res.status(400).json({ error: "Only public github.com repository URLs are supported." });
  const [owner, repository] = parsedUrl.pathname.split("/").filter(Boolean);
  if (!owner || !repository) return res.status(400).json({ error: "Use a repository URL such as https://github.com/owner/repository." });

  try {
    const response = await axios.get(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}`, { headers: { "User-Agent": "PrepMate" } });
    const repo = response.data;
    const checks = [
      { passed: Boolean(repo.description), points: 10, gap: "Add a concise repository description explaining the problem and solution." },
      { passed: Boolean(repo.homepage), points: 10, gap: "Add a live deployment or demo link to the repository homepage." },
      { passed: Boolean(repo.license), points: 10, gap: "Choose an open-source license to clarify reuse." },
      { passed: repo.size > 0, points: 10, gap: "Commit a meaningful, reviewable implementation." },
      { passed: Boolean(repo.language), points: 10, gap: "Ensure the repository exposes a clear primary implementation language." },
      { passed: Boolean(deployed), points: 15, gap: "Deploy the project and include a live-demo link." },
      { passed: Boolean(tests), points: 20, gap: "Add automated tests and show how to run them." },
      { passed: Boolean(documentation), points: 15, gap: "Document setup, architecture, features, and screenshots in the README." },
    ];
    res.json({ review: {
      role,
      score: checks.filter((check) => check.passed).reduce((sum, check) => sum + check.points, 0),
      gaps: checks.filter((check) => !check.passed).map((check) => check.gap),
      repository: { fullName: repo.full_name, language: repo.language, stars: repo.stargazers_count, updatedAt: repo.updated_at },
    } });
  } catch (error) {
    const providerMessage = error.response?.status === 404 ? "Repository not found or not public." : "GitHub could not be reached. Try again shortly.";
    res.status(502).json({ error: providerMessage });
  }
});

/** Basic feedback */
app.post("/personalized-feedback", async (req, res) => {
  const { topic, incorrectQuestions } = req.body;
  if (!topic || !incorrectQuestions) {
    return res.status(400).json({ error: "Topic and incorrectQuestions are required." });
  }

  const messages = [
    { role: "system", content: "You are an expert tutor. Give short constructive advice." },
    {
      role: "user",
      content: `The student attempted a quiz on ${topic}. These are the questions they got wrong: ${JSON.stringify(incorrectQuestions)}.
            Give 3-4 sentences of feedback on what to study next.`
    }
  ];

  try {
    const advice = await callGroqAPI(messages, 300, process.env.GROQ_API_KEY);
    res.json({ advice });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ advice: "Could not generate personalized feedback." });
  }
});
app.post("/generate-roadmap", async (req, res) => {
  const { topic, goal, skillLevel, learningScope = "Topic" } = req.body;
  if (!topic || !goal || !skillLevel) {
    return res.status(400).json({ error: "Topic, goal, and skillLevel are required." });
  }

  const messages = [
    {
      role: "system",
      content: `You are PrepMate's senior learning mentor. You create practical, motivating, and sequential learning roadmaps for students.

Your responsibilities:
- Diagnose the learner's starting level from the supplied skill level and build from fundamentals to applied practice.
- Break the subject into clear checkpoints with one measurable outcome each. Every checkpoint becomes a task and quiz topic, so titles must be specific, concise, and unique.
- For a full-stack scope, cover foundations, core concepts, tooling, practical projects, revision, and interview/readiness practice in a sensible order.
- For a single-topic scope, focus only on the prerequisite concepts and mastery path needed for that topic.
- Give realistic estimated times and only suggest stable, reputable resource URLs when you are confident they are valid.

Return ONLY a valid JSON object matching the requested schema. Do not include markdown, commentary, or code fences.`,
    },
    {
      role: "user",
      content: `Create a complete roadmap for the learner.
Learning scope: ${learningScope}.
Subject: ${topic}.
Goal: ${goal}.
Skill Level: ${skillLevel}.
${learningScope === "Full stack" ? "Create 8 to 10 sequential checkpoints that take the learner from fundamentals to a portfolio-ready or interview-ready outcome." : "Create 5 to 7 focused checkpoints that take the learner from prerequisites to confident practice."}
Respond strictly in this JSON format:
{
  "overview": "string",
  "steps": [
    {
      "title": "string",
      "description": "string",
      "estimated_time": "string",
      "resources": ["string"]
    }
  ]
}`
    }
  ];

  try {
    // Keep roadmap generation separate from quizzes: it uses its dedicated key.
    const apiKey = process.env.GROQ_API_KEY_ROADMAP;
    const rawContent = await callGroqAPI(messages, 3000, apiKey, {
      reasoning_effort: "none",
      response_format: { type: "json_object" },
    });
    const roadmap = parseJsonFromModel(rawContent);
    if (!roadmap || !Array.isArray(roadmap.steps) || !roadmap.steps.length) {
      throw new Error("AI response did not include roadmap steps.");
    }
    res.json({ roadmap });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: `Failed to generate roadmap: ${err.message}` });
  }
});

/** Curated resources from public, topic-relevant sources. */
app.get("/curated-content", async (req, res) => {
  const topic = String(req.query.topic || "").trim();
  if (!topic) return res.status(400).json({ error: "A topic is required." });
  const query = encodeURIComponent(topic);
  const youtube = [{
    title: `${topic} tutorials on YouTube`,
    description: "A focused YouTube search for current tutorials and explanations.",
    url: `https://www.youtube.com/results?search_query=${query}+tutorial`,
    source: "YouTube",
  }];
  const results = { youtube, github: [], books: [], web: [] };

  const [github, books, web] = await Promise.allSettled([
    axios.get("https://api.github.com/search/repositories", {
      params: { q: `${topic} language:javascript`, sort: "stars", order: "desc", per_page: 3 },
      headers: { "User-Agent": "PrepMate" },
    }),
    axios.get("https://www.googleapis.com/books/v1/volumes", {
      params: { q: topic, maxResults: 3, printType: "books" },
    }),
    axios.get("https://en.wikipedia.org/w/api.php", {
      params: { action: "query", list: "search", srsearch: topic, format: "json", srlimit: 3 },
    }),
  ]);

  if (github.status === "fulfilled") results.github = github.value.data.items.map((item) => ({
    title: item.full_name,
    description: item.description || `${item.stargazers_count} stars on GitHub`,
    url: item.html_url,
    source: "GitHub",
  }));
  if (books.status === "fulfilled") results.books = (books.value.data.items || []).map((item) => ({
    title: item.volumeInfo.title,
    description: item.volumeInfo.authors?.join(", ") || "Google Books",
    url: item.volumeInfo.infoLink || item.volumeInfo.previewLink,
    source: "Book",
  }));
  if (web.status === "fulfilled") results.web = web.value.data.query.search.map((item) => ({
    title: item.title,
    description: item.snippet.replace(/<[^>]*>/g, ""),
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, "_"))}`,
    source: "Wikipedia",
  }));
  res.json({ topic, results });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
