const STORAGE_PREFIX = 'course-progress:';

function key(courseSlug: string): string {
  return `${STORAGE_PREFIX}${courseSlug}`;
}

function readCompleted(courseSlug: string): Set<string> {
  try {
    const raw = localStorage.getItem(key(courseSlug));
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function writeCompleted(courseSlug: string, completed: Set<string>) {
  try {
    localStorage.setItem(key(courseSlug), JSON.stringify([...completed]));
  } catch {
    // localStorage unavailable — progress just won't persist
  }
}

export function isLessonComplete(courseSlug: string, lessonSlug: string): boolean {
  return readCompleted(courseSlug).has(lessonSlug);
}

export function markLessonComplete(courseSlug: string, lessonSlug: string) {
  const completed = readCompleted(courseSlug);
  completed.add(lessonSlug);
  writeCompleted(courseSlug, completed);
}

export function toggleLessonComplete(courseSlug: string, lessonSlug: string): boolean {
  const completed = readCompleted(courseSlug);
  const next = !completed.has(lessonSlug);
  if (next) {
    completed.add(lessonSlug);
  } else {
    completed.delete(lessonSlug);
  }
  writeCompleted(courseSlug, completed);
  return next;
}

export function completedCount(courseSlug: string, lessonSlugs: string[]): number {
  const completed = readCompleted(courseSlug);
  return lessonSlugs.filter((slug) => completed.has(slug)).length;
}
