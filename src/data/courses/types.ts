export interface Lesson {
  slug: string;
  title: string;
  summary: string;
}

export interface Unit {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  slug: string;
  title: string;
  topic: string;
  tagline: string;
  units: Unit[];
}

export function flattenLessons(course: Course) {
  return course.units.flatMap((unit) => unit.lessons.map((lesson) => ({ ...lesson, unit })));
}

export function lessonNav(course: Course, lessonSlug: string) {
  const flat = flattenLessons(course);
  const index = flat.findIndex((lesson) => lesson.slug === lessonSlug);
  if (index === -1) {
    throw new Error(`Unknown lesson slug for ${course.slug}: ${lessonSlug}`);
  }
  return {
    current: flat[index],
    prev: index > 0 ? flat[index - 1] : null,
    next: index < flat.length - 1 ? flat[index + 1] : null,
    index,
    total: flat.length,
  };
}

export function lessonSlugs(course: Course): string[] {
  return course.units.flatMap((unit) => unit.lessons.map((l) => l.slug));
}
