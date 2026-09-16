import type { Course } from './types';
import { imageProcessingCourse } from './image-processing';
import { probabilityCourse } from './probability';

export const courses: Record<string, Course> = {
  [imageProcessingCourse.slug]: imageProcessingCourse,
  [probabilityCourse.slug]: probabilityCourse,
};

export function getCourse(slug: string): Course {
  const course = courses[slug];
  if (!course) throw new Error(`Unknown course slug: ${slug}`);
  return course;
}
