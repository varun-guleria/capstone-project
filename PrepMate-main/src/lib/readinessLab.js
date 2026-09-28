import { getLearningSnapshot } from "./adaptiveLearning";
import { getLearningPlan, getRoadmapTasks } from "./studentWorkspace";

const READINESS_KEY = "prepmate-readiness-lab-v1";

const read = () => {
  try { return JSON.parse(localStorage.getItem(READINESS_KEY)) || {}; } catch { return {}; }
};
const write = (value) => localStorage.setItem(READINESS_KEY, JSON.stringify(value));

export const getReadinessLab = () => read();

export const saveReadinessProfile = (profile) => {
  const lab = read();
  const updated = { ...lab, profile: { ...profile, createdAt: lab.profile?.createdAt || new Date().toISOString() } };
  write(updated);
  return updated;
};

export const recordDiagnostic = (score) => {
  const lab = read();
  const updated = { ...lab, diagnostic: { score, completedAt: new Date().toISOString() } };
  write(updated);
  return updated;
};

export const recordMockExam = (mock) => {
  const lab = read();
  const history = [...(lab.mockHistory || []), { ...mock, completedAt: new Date().toISOString() }].slice(-10);
  const updated = { ...lab, mockHistory: history };
  write(updated);
  return updated;
};

export const saveWeeklyPlan = (weeklyPlan) => {
  const lab = read();
  const updated = { ...lab, weeklyPlan, scheduledAt: new Date().toISOString() };
  write(updated);
  return updated;
};

export const createWeeklyPlan = ({ dailyMinutes }) => {
  const plan = getLearningPlan();
  const tasks = getRoadmapTasks().filter((task) => task.status !== "Completed");
  const priorities = tasks.length ? tasks : (plan?.checkpoints || []).filter((item) => item.status !== "Completed").map((item) => ({ name: item.title, estimatedTime: 60 }));
  const fallback = [{ name: "Diagnostic revision", estimatedTime: 30 }, { name: "Mock exam analysis", estimatedTime: 30 }];
  const source = priorities.length ? priorities : fallback;
  const start = new Date(); start.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start); date.setDate(start.getDate() + index);
    const primary = source[index % source.length];
    const secondary = source[(index + 1) % source.length];
    const firstBlock = Math.max(20, Math.round(dailyMinutes * 0.65));
    return {
      date: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }),
      minutes: dailyMinutes,
      blocks: [
        { title: primary.name, minutes: firstBlock, type: "Mastery" },
        { title: secondary.name, minutes: Math.max(15, dailyMinutes - firstBlock), type: index % 3 === 2 ? "Revision" : "Practice" },
      ],
    };
  });
};

export const getReadinessReport = () => {
  const lab = read();
  const plan = getLearningPlan();
  const topics = (plan?.checkpoints || []).map((checkpoint) => ({ checkpoint, snapshot: getLearningSnapshot(checkpoint.title) }));
  const completion = topics.length ? Math.round((topics.filter((topic) => topic.checkpoint.status === "Completed").length / topics.length) * 100) : 0;
  const assessedTopics = topics.filter((topic) => topic.snapshot.isAssessed);
  const mastery = assessedTopics.length ? Math.round(assessedTopics.reduce((sum, topic) => sum + topic.snapshot.proficiency, 0) / assessedTopics.length) : 0;
  const diagnostic = lab.diagnostic?.score || 0;
  const mocks = lab.mockHistory || [];
  const mockAverage = mocks.length ? Math.round(mocks.reduce((sum, mock) => sum + mock.percentage, 0) / mocks.length) : 0;
  const consistency = Math.min(100, topics.reduce((sum, topic) => sum + topic.snapshot.attempts, 0) * 15);
  const score = Math.round((completion * 0.25) + (mastery * 0.3) + (diagnostic * 0.15) + (mockAverage * 0.2) + (consistency * 0.1));
  const priority = [...topics].filter((topic) => topic.checkpoint.status !== "Completed").sort((left, right) => Number(left.snapshot.isAssessed) - Number(right.snapshot.isAssessed) || left.snapshot.proficiency - right.snapshot.proficiency)[0];
  return { lab, plan, topics, completion, mastery, diagnostic, mocks, mockAverage, consistency, score, priority };
};
