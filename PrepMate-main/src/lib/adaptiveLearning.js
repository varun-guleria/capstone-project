const STORAGE_KEY = "prepmate-adaptive-progress-v1";

const DEFAULT_MODEL = {
  weights1: [
    [0.6, 0.15, 0.3],
    [0.3, 0.55, -0.25],
    [-0.4, 0.25, 0.7],
    [0.4, -0.4, 0.5],
  ],
  bias1: [0.05, 0.1, -0.05, 0.08],
  weights2: [0.45, 0.4, -0.25, 0.3],
  // Conservative initial confidence: new learners start with accessible questions.
  bias2: -1.0,
};

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const sigmoid = (value) => 1 / (1 + Math.exp(-value));
const relu = (value) => Math.max(0, value);

const normaliseTopic = (topic) => topic.trim().toLowerCase();

const cloneModel = () => ({
  weights1: DEFAULT_MODEL.weights1.map((row) => [...row]),
  bias1: [...DEFAULT_MODEL.bias1],
  weights2: [...DEFAULT_MODEL.weights2],
  bias2: DEFAULT_MODEL.bias2,
});

const defaultTopicData = () => ({
  model: cloneModel(),
  attempts: 0,
  correctAnswers: 0,
  totalQuestions: 0,
  currentStreak: 0,
  bestStreak: 0,
  history: [],
});

const readStore = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const writeStore = (store) => localStorage.setItem(STORAGE_KEY, JSON.stringify(store));

const getTopicData = (topic) => {
  const key = normaliseTopic(topic);
  if (!key) return defaultTopicData();
  const stored = readStore()[key];
  return stored
    ? { ...defaultTopicData(), ...stored, model: { ...cloneModel(), ...stored.model } }
    : defaultTopicData();
};

const featuresFor = (topicData, difficulty) => {
  const recent = topicData.history.slice(-5);
  const recentAccuracy = recent.length
    ? recent.reduce((sum, item) => sum + item.accuracy, 0) / recent.length
    : 0.5;
  const paceScore = recent.length
    ? recent.reduce((sum, item) => sum + item.paceScore, 0) / recent.length
    : 0.5;
  return [recentAccuracy, paceScore, difficultyToValue(difficulty)];
};

const forward = (model, inputs) => {
  const hiddenPreActivation = model.weights1.map((row, index) =>
    row.reduce((sum, weight, inputIndex) => sum + weight * inputs[inputIndex], model.bias1[index])
  );
  const hidden = hiddenPreActivation.map(relu);
  const output = sigmoid(
    hidden.reduce((sum, value, index) => sum + value * model.weights2[index], model.bias2)
  );
  return { hiddenPreActivation, hidden, output };
};

const train = (model, inputs, target) => {
  const learningRate = 0.08;
  // A small one-hidden-layer network is trained after each completed quiz.
  for (let epoch = 0; epoch < 30; epoch += 1) {
    const { hiddenPreActivation, hidden, output } = forward(model, inputs);
    const outputGradient = 2 * (output - target) * output * (1 - output);
    const oldOutputWeights = [...model.weights2];

    model.weights2 = model.weights2.map((weight, index) =>
      weight - learningRate * outputGradient * hidden[index]
    );
    model.bias2 -= learningRate * outputGradient;

    model.weights1 = model.weights1.map((row, hiddenIndex) => {
      const hiddenGradient = hiddenPreActivation[hiddenIndex] > 0
        ? outputGradient * oldOutputWeights[hiddenIndex]
        : 0;
      return row.map((weight, inputIndex) =>
        weight - learningRate * hiddenGradient * inputs[inputIndex]
      );
    });
    model.bias1 = model.bias1.map((bias, index) =>
      bias - learningRate * (hiddenPreActivation[index] > 0 ? outputGradient * oldOutputWeights[index] : 0)
    );
  }
};

export const difficultyToValue = (difficulty) => ({ Beginner: 0.25, Intermediate: 0.55, Advanced: 0.85 })[difficulty] ?? 0.25;

export const levelFromScore = (score) => {
  if (score < 0.42) return "Beginner";
  if (score < 0.74) return "Intermediate";
  return "Advanced";
};

export const getLearningSnapshot = (topic) => {
  const data = getTopicData(topic);
  // A brand-new topic has no learner evidence. Do not expose the neural
  // model's seeded prior as if it were a measured student proficiency.
  if (!data.attempts) {
    return {
      attempts: 0,
      accuracy: 0,
      proficiency: null,
      isAssessed: false,
      recommendedDifficulty: "Beginner",
      currentStreak: 0,
      bestStreak: 0,
    };
  }
  const lastDifficulty = data.history.at(-1)?.difficulty ?? "Beginner";
  const input = featuresFor(data, lastDifficulty);
  const proficiency = forward(data.model, input).output;
  const recommendedDifficulty = levelFromScore(proficiency);
  const accuracy = data.totalQuestions
    ? Math.round((data.correctAnswers / data.totalQuestions) * 100)
    : 0;

  return {
    attempts: data.attempts,
    accuracy,
    proficiency: Math.round(proficiency * 100),
    isAssessed: true,
    recommendedDifficulty,
    currentStreak: data.currentStreak,
    bestStreak: data.bestStreak,
  };
};

export const recordQuizAttempt = ({ topic, correctAnswers, totalQuestions, difficulty, durationSeconds }) => {
  const key = normaliseTopic(topic);
  if (!key || !totalQuestions) return getLearningSnapshot(topic);

  const store = readStore();
  const data = store[key]
    ? { ...defaultTopicData(), ...store[key], model: { ...cloneModel(), ...store[key].model } }
    : defaultTopicData();
  const accuracy = clamp(correctAnswers / totalQuestions);
  const secondsPerQuestion = durationSeconds / totalQuestions;
  const paceScore = clamp(1 - (secondsPerQuestion - 20) / 100);
  const inputs = featuresFor(data, difficulty);
  train(data.model, inputs, accuracy);

  data.attempts += 1;
  data.correctAnswers += correctAnswers;
  data.totalQuestions += totalQuestions;
  data.currentStreak = accuracy >= 0.6 ? data.currentStreak + 1 : 0;
  data.bestStreak = Math.max(data.bestStreak, data.currentStreak);
  data.history = [...data.history, {
    accuracy,
    paceScore,
    difficulty,
    completedAt: new Date().toISOString(),
  }].slice(-20);
  store[key] = data;
  writeStore(store);
  return getLearningSnapshot(topic);
};

export const resetLearningProgress = (topic) => {
  const key = normaliseTopic(topic);
  const store = readStore();
  delete store[key];
  writeStore(store);
  return getLearningSnapshot(topic);
};
