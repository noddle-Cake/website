import type { Course, Unit } from './types';
import { lessonNav, lessonSlugs } from './types';

export type { Lesson, Unit } from './types';

export const imageProcessingCourse: Course = {
  slug: 'image-processing',
  title: 'Image Processing',
  topic: 'Computer Vision',
  tagline:
    'Signals, sampling, and the transforms that turn an image into a set of numbers a computer can compress, filter, and understand — built from EEL 5820 lecture notes.',
  units: [
    {
      id: 'signals-and-sampling',
      title: 'Signals & Sampling',
      lessons: [
        {
          slug: 'what-is-a-signal',
          title: 'What Is a Signal?',
          summary: 'Continuous vs. discrete, analog vs. digital, and how an 8-bit image is really just a quantized 2-D signal.',
        },
        {
          slug: 'the-impulse-and-sampling',
          title: 'The Impulse Function & Sampling',
          summary: 'The Dirac delta, its sifting property, and sampling as multiplying a signal by a train of impulses.',
        },
        {
          slug: 'nyquist-aliasing-and-the-fourier-transform',
          title: 'Nyquist, Aliasing & the Fourier Transform',
          summary: 'Why undersampling folds high frequencies back on themselves, and how the Fourier series becomes the Fourier transform.',
        },
      ],
    },
    {
      id: 'image-transforms',
      title: 'Image Transforms',
      lessons: [
        {
          slug: 'transform-theory-and-the-2d-dft',
          title: 'Transform Theory & the 2-D DFT',
          summary: 'Orthogonal kernels, the general transform/inverse-transform pair, and the discrete Fourier transform of an image.',
        },
        {
          slug: 'discrete-cosine-transform',
          title: 'The Discrete Cosine Transform',
          summary: 'A real-valued cousin of the DFT, its basis images, and why it quietly powers JPEG compression.',
        },
        {
          slug: 'walsh-hadamard-transform',
          title: 'The Walsh–Hadamard Transform',
          summary: 'Trading sinusoids for ±1 rectangular waveforms — sequency, and building the Hadamard matrix recursively.',
        },
        {
          slug: 'haar-transform-and-review',
          title: 'The Haar Transform & Review',
          summary: 'The most localized of the four transforms, plus a side-by-side comparison to tie the unit together.',
        },
      ],
    },
  ] satisfies Unit[],
};

export function findLessonNav(lessonSlug: string) {
  return lessonNav(imageProcessingCourse, lessonSlug);
}

export function allLessonSlugs(): string[] {
  return lessonSlugs(imageProcessingCourse);
}
