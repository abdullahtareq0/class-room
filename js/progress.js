// ★ YOUR FEATURE (10): progress out of 100 — per task, per student, whole class.
// Pure functions over tasks, members and completions (read from task_completions).

function pct(done, total) {
  if (!total) return 0;
  return Math.round((done / total) * 100);
}

// % of students who completed a given task.
export function taskProgress(taskId, completions, studentCount) {
  const done = completions.filter((c) => c.taskId === taskId && c.completed).length;
  return pct(done, studentCount);
}

// % of tasks a given student has completed.
export function studentProgress(studentId, completions, taskCount) {
  const done = completions.filter((c) => c.studentId === studentId && c.completed).length;
  return pct(done, taskCount);
}

// Overall class completion across every (student × task) pair.
export function classProgress(taskCount, studentCount, completions) {
  const total = taskCount * studentCount;
  const done = completions.filter((c) => c.completed).length;
  return pct(done, total);
}
