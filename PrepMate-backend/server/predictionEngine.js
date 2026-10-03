import axios from "axios";

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "do", "does", "for", "from", "in", "is", "it", "of", "on", "or", "the", "to", "with", "you", "your",
  "which", "following", "what", "how", "why", "when", "where", "who", "whom", "whose", "type", "true", "false", "statement", "statements", "consider", "among"
]);

const INTENTS = [
  ["compare", /differentiate|compare|distinguish|contrast|relation|versus|vs\.?/i],
  ["explain", /explain|describe|discuss|working of|mechanism|how does|how do|why is|why does/i],
  ["define", /define|what is|what are|what do you mean by|what is meant by/i],
  ["list", /list|enumerate|mention|name the/i],
  ["evaluate", /evaluate|critically analyze|assess|pros and cons|advantages and disadvantages|merits and demerits/i],
  ["apply", /calculate|solve|implement|write a program|design|derive|find the|application of|use case/i],
  ["cause-effect", /what causes|what are the effects of|reason for/i],
  ["example", /give an example|illustrate with an example/i],
];

const normalize = (value = "") => value.toLowerCase()
  .replace(/[^a-z0-9\s]/g, " ")
  .replace(/\b(ing|tion|ions|ment|ness|ed|es|s)\b/g, "")
  .replace(/\s+/g, " ")
  .trim();

const tokensFor = (question) => normalize(question).split(" ")
  .filter((token) => token.length > 2 && !STOP_WORDS.has(token));



const intentFor = (question) => INTENTS.find(([, pattern]) => pattern.test(question))?.[0] || "other";



const chooseCanonical = (members) => [...members].sort((a, b) => a.question.length - b.question.length)[0];

// Read at call time so that env‑var updates on Render / Netlify take effect
// without a cold restart.
function getGeminiApiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY is missing in environment variables. " +
      "Set it in your .env file or in your hosting dashboard (Render / Netlify)."
    );
  }
  return key;
}

async function getNeuralEmbeddings(questions) {
  const apiKey = getGeminiApiKey();
  const BATCH_LIMIT = 100; // Gemini allows at most 100 requests per batch call
  const embeddingMap = new Map();
  
  // Split questions into chunks of BATCH_LIMIT
  for (let start = 0; start < questions.length; start += BATCH_LIMIT) {
    const chunk = questions.slice(start, start + BATCH_LIMIT);
    const requests = chunk.map(q => ({
      model: "models/gemini-embedding-2",
      content: { parts: [{ text: q.question }] }
    }));
    
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:batchEmbedContents?key=${apiKey}`,
        { requests },
        { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
      );
      
      if (response.data && response.data.embeddings) {
        chunk.forEach((q, i) => embeddingMap.set(q.id, response.data.embeddings[i].values));
      } else {
        throw new Error("Invalid response from Gemini embedding service.");
      }
    } catch (error) {
      // Surface the real error from the Gemini API so it can be diagnosed.
      const geminiDetail =
        error.response?.data?.error?.message   // structured Gemini error
        || JSON.stringify(error.response?.data) // raw body fallback
        || error.message;                       // network / timeout error
      const status = error.response?.status;
      console.error("Gemini Embedding service error:", status || "", geminiDetail);
      throw new Error(
        `Neural embedding service failed${status ? ` (HTTP ${status})` : ""}: ${geminiDetail}`
      );
    }
  }
  
  return embeddingMap;
}

const vectorCosineSimilarity = (vecA, vecB) => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i += 1) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

export async function predictQuestions(inputRecords, currentYear = new Date().getFullYear()) {
  const records = inputRecords
    .map((record, index) => ({
      id: record.id || `${record.year || "unknown"}-${index}`,
      question: String(record.question || "").trim(),
      year: Number(record.year),
    }))
    .filter((record) => record.question.length >= 10 && Number.isFinite(record.year));

  if (records.length < 3) throw new Error("Add at least three dated questions to generate a prediction.");

  const recordMap = new Map(records.map(r => [r.id, r]));

  const modelUsed = "Neural (Gemini 004) + Cosine Similarity";
  const candidateThreshold = 0.82; // Threshold for semantic match
  const topK = 5;

  let links = [];
  try {
    const embeddingMap = await getNeuralEmbeddings(records);
    
    // Calculate cosine similarities and add to links
    for (let i = 0; i < records.length; i++) {
      for (let j = i + 1; j < records.length; j++) {
        const sim = vectorCosineSimilarity(embeddingMap.get(records[i].id), embeddingMap.get(records[j].id));
        if (sim >= candidateThreshold) {
          links.push({
            left: records[i].id,
            right: records[j].id,
            similarity: sim
          });
        }
      }
    }
  } catch (error) {
    console.error("Predict links error:", error.message);
    throw error;
  }

  const validLinks = new Set();
  links.forEach(l => {
    validLinks.add(`${l.left}:${l.right}`);
    validLinks.add(`${l.right}:${l.left}`);
  });

  // Complete-link merging prevents an ambiguous question from chaining unrelated themes together.
  const WEIGHTS = {
    frequency: 46,
    coverage: 24,
    recency: 18,
    trend: 12,
  };

  const groups = [];
  const assigned = new Map();

  links.sort((left, right) => right.similarity - left.similarity).forEach((link) => {
    const leftId = link.left;
    const rightId = link.right;
    const leftRecord = recordMap.get(leftId);
    const rightRecord = recordMap.get(rightId);
    
    if (assigned.has(leftId) && assigned.has(rightId)) return;
    
    if (!assigned.has(leftId) && !assigned.has(rightId)) {
        const gIdx = groups.length;
        groups.push({ representative: leftId, members: [leftRecord, rightRecord] });
        assigned.set(leftId, gIdx);
        assigned.set(rightId, gIdx);
    } else if (assigned.has(leftId) && !assigned.has(rightId)) {
        const gIdx = assigned.get(leftId);
        const rep = groups[gIdx].representative;
        if (rep === leftId || validLinks.has(`${rep}:${rightId}`)) {
            groups[gIdx].members.push(rightRecord);
            assigned.set(rightId, gIdx);
        }
    } else if (!assigned.has(leftId) && assigned.has(rightId)) {
        const gIdx = assigned.get(rightId);
        const rep = groups[gIdx].representative;
        if (rep === rightId || validLinks.has(`${rep}:${leftId}`)) {
            groups[gIdx].members.push(leftRecord);
            assigned.set(leftId, gIdx);
        }
    }
  });

  // Assign any unassigned records to their own group
  records.forEach(r => {
    if (!assigned.has(r.id)) {
      groups.push({ representative: r.id, members: [r] });
      assigned.set(r.id, groups.length - 1);
    }
  });

  const grouped = groups.map(g => g.members);
  const yearSet = new Set(records.map((record) => record.year));
  const yearCount = yearSet.size;
  let clusters = grouped.map((members) => {
    const years = [...new Set(members.map((member) => member.year))].sort((a, b) => a - b);
    const latestYear = Math.max(...years);
    const frequency = members.length;
    const coverage = years.length / yearCount;
    const recency = Math.exp(-(Math.max(0, currentYear - latestYear)) / 3);
    const yearlyCounts = years.map((year) => members.filter((member) => member.year === year).length);
    const trend = yearlyCounts.length > 1 && yearlyCounts.at(-1) >= yearlyCounts[0] ? 1 : 0.45;
    return {
      id: chooseCanonical(members).id,
      question: chooseCanonical(members).question,
      intent: intentFor(chooseCanonical(members).question),
      frequency,
      years,
      latestYear,
      coverage: Math.round(coverage * 100),
      recency: Math.round(recency * 100),
      variants: members.map((member) => ({ question: member.question, year: member.year })),
      trend, // Store trend for scoring
    };
  });

  if (clusters.length > 0) {
    const maxFrequency = Math.max(1, ...clusters.map((c) => c.frequency));
    clusters = clusters.map((cluster) => {
      const normFreq = Math.log1p(cluster.frequency) / Math.log1p(maxFrequency);
      const normCoverage = cluster.coverage / 100;
      const normRecency = cluster.recency / 100;
      const normTrend = cluster.trend;

      const rawScore = (normFreq * WEIGHTS.frequency) + (normCoverage * WEIGHTS.coverage) + (normRecency * WEIGHTS.recency) + (normTrend * WEIGHTS.trend);
      return { ...cluster, rawScore };
    }).sort((a, b) => b.rawScore - a.rawScore);
  }

  // Normalize scores for confidence display
  const maxScore = clusters[0]?.rawScore || 1;
  const predictions = clusters.map((cluster, index) => ({
    ...cluster,
    rank: index + 1,
    confidence: Math.max(18, Math.min(96, Math.round((cluster.rawScore / maxScore) * 84 + (cluster.frequency > 1 ? 9 : 0)))),
    score: Math.round(cluster.rawScore * 10) / 10,
  }));
  const mergedCount = records.length - predictions.length;
  return {
    summary: {
      sourceQuestions: records.length,
      uniquePredictions: predictions.length,
      mergedCount,
      yearCount,
      threshold: candidateThreshold,
      modelType: modelUsed,
    },
    predictions,
    signals: [
      { label: "Historical frequency", weight: WEIGHTS.frequency }, { label: "Year coverage", weight: WEIGHTS.coverage },
      { label: "Recency decay", weight: WEIGHTS.recency }, { label: "Trend consistency", weight: WEIGHTS.trend },
    ],
    links,
  };
}

/**
 * Retrospective validation keeps the predictor honest: it hides the latest
 * paper, ranks themes from earlier papers, and checks whether those themes
 * were represented in the held-out paper. It is an evaluation aid, not an
 * assertion that future papers can be guaranteed.
 */
export async function evaluatePrediction(inputRecords) {
  const records = inputRecords
    .map((record, index) => ({
      id: `evaluation-${record.id || index}`,
      question: String(record.question || "").trim(),
      year: Number(record.year),
    }))
    .filter((record) => record.question.length >= 10 && Number.isFinite(record.year));

  const years = [...new Set(records.map((record) => record.year))].sort((left, right) => left - right);
  if (years.length < 2) throw new Error("Add questions from at least two years to run a backtest.");

  const heldOutYear = years.at(-1);
  const trainingRecords = records.filter((record) => record.year !== heldOutYear);
  const heldOutRecords = records.filter((record) => record.year === heldOutYear);
  if (trainingRecords.length < 3) throw new Error("The earlier papers need at least three valid questions for a backtest.");

  const predictionResult = await predictQuestions(trainingRecords, heldOutYear);
  const predicted = predictionResult.predictions.slice(0, 10).map((prediction, index) => ({
    id: `predicted-${index}`,
    question: prediction.question,
  }));
  const actual = heldOutRecords.map((record, index) => ({
    id: `actual-${index}`,
    question: record.question,
  }));
  const comparisonRecords = [...predicted, ...actual];
  const neuralEmbeddings = await getNeuralEmbeddings(comparisonRecords);
  const threshold = 0.72;

  const comparisonSimilarity = (left, right) => {
    return vectorCosineSimilarity(neuralEmbeddings.get(left.id), neuralEmbeddings.get(right.id));
  };

  const matches = actual.map((question) => {
    const best = predicted.reduce((current, prediction) => {
      const similarity = comparisonSimilarity(prediction, question);
      return !current || similarity > current.similarity ? { prediction, similarity } : current;
    }, null);
    return {
      actualQuestion: question.question,
      predictedQuestion: best?.prediction.question || "No ranked theme",
      similarity: Math.round((best?.similarity || 0) * 100),
      hit: Boolean(best && best.similarity >= threshold),
    };
  });
  const matchedPredictionCount = new Set(matches.filter((match) => match.hit).map((match) => match.predictedQuestion)).size;
  const matchedQuestionCount = matches.filter((match) => match.hit).length;
  const precision = predicted.length ? matchedPredictionCount / predicted.length : 0;
  const recall = actual.length ? matchedQuestionCount / actual.length : 0;
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;

  return {
    heldOutYear,
    trainingYears: years.slice(0, -1),
    evaluatedPredictions: predicted.length,
    actualQuestions: actual.length,
    matchedPredictions: matchedPredictionCount,
    matchedQuestions: matchedQuestionCount,
    precision: Math.round(precision * 100),
    recall: Math.round(recall * 100),
    f1: Math.round(f1 * 100),
    matchMethod: "Semantic BGE similarity",
    threshold: Math.round(threshold * 100),
    matches,
  };
}
