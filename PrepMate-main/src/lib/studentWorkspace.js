const PLAN_KEY = "prepmate-learning-plan-v1";
const TASKS_KEY = "prepmate-roadmap-tasks-v1";

const safeRead = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const idFor = (prefix, index) => `${prefix}-${Date.now()}-${index}`;

export const getLearningPlan = () => safeRead(PLAN_KEY, null);
export const getRoadmapTasks = () => {
  const tasks = safeRead(TASKS_KEY, []);
  const plan = getLearningPlan();
  let changed = false;
  const repairedTasks = tasks.map((task) => {
    const checkpoint = plan?.checkpoints?.find((item) => item.id === task.checkpointId);
    if (!checkpoint || task.source !== "roadmap") return task;
    const correctedMinutes = minutesFrom(checkpoint.estimatedTime);
    const wasUntouched = task.remainingTime === task.estimatedTime;
    const needsRepair = task.estimatedTime !== correctedMinutes || task.roadmapEstimate !== checkpoint.estimatedTime;
    if (!needsRepair) return task;
    changed = true;
    return {
      ...task,
      roadmapEstimate: checkpoint.estimatedTime,
      estimatedTime: correctedMinutes,
      remainingTime: wasUntouched ? correctedMinutes : Math.min(task.remainingTime, correctedMinutes),
    };
  });
  if (changed) write(TASKS_KEY, repairedTasks);
  return repairedTasks;
};

export const saveLearningPlan = ({ subject, goal, skillLevel, roadmap }) => {
  const checkpoints = (roadmap.steps || []).map((step, index) => ({
    id: idFor("checkpoint", index),
    title: step.title || `Checkpoint ${index + 1}`,
    description: step.description || "",
    estimatedTime: step.estimated_time || "45 min",
    resources: Array.isArray(step.resources) ? step.resources : [],
    status: "Not Started",
  }));
  const plan = {
    id: `plan-${Date.now()}`,
    subject: subject.trim(),
    goal: goal.trim(),
    skillLevel,
    overview: roadmap.overview || "Your personal learning roadmap.",
    checkpoints,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const tasks = checkpoints.map((checkpoint, index) => ({
    id: idFor("task", index),
    checkpointId: checkpoint.id,
    name: checkpoint.title,
    estimatedTime: minutesFrom(checkpoint.estimatedTime),
    remainingTime: minutesFrom(checkpoint.estimatedTime),
    roadmapEstimate: checkpoint.estimatedTime,
    status: "Not Started",
    source: "roadmap",
  }));
  write(PLAN_KEY, plan);
  write(TASKS_KEY, tasks);
  return plan;
};

export const minutesFrom = (estimate) => {
  const text = String(estimate).toLowerCase();
  const found = text.match(/\d+(?:\.\d+)?/);
  const amount = found ? Number(found[0]) : 45;
  // Convert broad roadmap estimates into realistic total study-time budgets.
  // One learning week is treated as five focused one-hour study blocks.
  if (/week/.test(text)) return Math.max(60, Math.round(amount * 5 * 60));
  if (/day/.test(text)) return Math.max(30, Math.round(amount * 60));
  if (/hour|hr/.test(text)) return Math.max(30, Math.round(amount * 60));
  if (/min/.test(text)) return Math.max(15, Math.round(amount));
  return Math.max(30, Math.round(amount * 60));
};

export const setCheckpointStatus = (checkpointId, status) => {
  const plan = getLearningPlan();
  if (!plan) return null;
  const checkpoints = plan.checkpoints.map((checkpoint) =>
    checkpoint.id === checkpointId ? { ...checkpoint, status } : checkpoint
  );
  const updated = { ...plan, checkpoints, updatedAt: new Date().toISOString() };
  write(PLAN_KEY, updated);
  const syncedTasks = getRoadmapTasks().map((task) =>
    task.checkpointId === checkpointId ? { ...task, status } : task
  );
  write(TASKS_KEY, syncedTasks);
  return updated;
};

export const setTaskStatus = (taskId, status) => {
  const tasks = getRoadmapTasks().map((task) =>
    task.id === taskId ? { ...task, status } : task
  );
  write(TASKS_KEY, tasks);
  const task = tasks.find((entry) => entry.id === taskId);
  if (task?.checkpointId) setCheckpointStatus(task.checkpointId, status);
  return tasks;
};

export const addPersonalTask = ({ name, estimatedTime }) => {
  const task = {
    id: idFor("personal-task", 0),
    name: name.trim(),
    estimatedTime: Number(estimatedTime),
    remainingTime: Number(estimatedTime),
    status: "Not Started",
    source: "personal",
  };
  const tasks = [...getRoadmapTasks(), task];
  write(TASKS_KEY, tasks);
  return tasks;
};

export const updateTaskTime = (taskId, amount) => {
  const tasks = getRoadmapTasks().map((task) => task.id === taskId
    ? { ...task, remainingTime: Math.max(0, task.remainingTime + amount) }
    : task);
  write(TASKS_KEY, tasks);
  return tasks;
};

export const removeTask = (taskId) => {
  const tasks = getRoadmapTasks().filter((task) => task.id !== taskId);
  write(TASKS_KEY, tasks);
  return tasks;
};

export const getPlanProgress = (plan = getLearningPlan()) => {
  if (!plan?.checkpoints?.length) return { completed: 0, total: 0, percentage: 0, nextCheckpoint: null };
  const completed = plan.checkpoints.filter((checkpoint) => checkpoint.status === "Completed").length;
  return {
    completed,
    total: plan.checkpoints.length,
    percentage: Math.round((completed / plan.checkpoints.length) * 100),
    nextCheckpoint: plan.checkpoints.find((checkpoint) => checkpoint.status !== "Completed") || null,
  };
};
