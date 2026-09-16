import type { Course } from './types';

export const probabilityCourse: Course = {
  slug: 'probability',
  title: 'Probability Foundations',
  topic: 'Random Signals',
  tagline:
    'Sets, axioms, counting, and conditioning — the toolkit behind every "what are the chances" question, built from EEE 5543 Random Signal Principles and aimed squarely at solving problems, not just reading them.',
  units: [
    {
      id: 'events-and-axioms',
      title: 'Events & Axioms',
      lessons: [
        {
          slug: 'sets-events-and-venn-diagrams',
          title: 'Sets, Events & Venn Diagrams',
          summary:
            'Sample spaces, the three operations everything else is built from, and how to write "exactly one of three events" using nothing but union, intersection, and complement.',
        },
        {
          slug: 'axioms-and-inclusion-exclusion',
          title: 'The Axioms & Inclusion–Exclusion',
          summary:
            'Three axioms, why the additive rule breaks for overlapping events, and how to fix it — both the textbook way and the subtraction-free way.',
        },
        {
          slug: 'conditional-probability-and-independence',
          title: 'Conditional Probability & Independence',
          summary:
            'Joint, marginal, conditional — the 2×2 table that turns word problems into arithmetic, and the one equation that decides independence.',
        },
        {
          slug: 'total-probability-and-trees',
          title: 'Total Probability & Tree Diagrams',
          summary:
            'Partition the world, weight each branch, add them up. The law of total probability and the Bayes flip that follows from it.',
        },
      ],
    },
    {
      id: 'counting',
      title: 'Counting',
      lessons: [
        {
          slug: 'counting-permutations-and-combinations',
          title: 'Permutations & Combinations',
          summary:
            'The product rule, ordered vs. unordered selection, and the binomial coefficient — with code sequences over alphabets of any size.',
        },
        {
          slug: 'partitions-and-multinomials',
          title: 'Partitions & Multinomial Counting',
          summary:
            'Splitting a class into groups, why labeled and unlabeled groups differ by a factorial, and how "at least one each" changes the count.',
        },
        {
          slug: 'sequential-draws-and-cards',
          title: 'Sequential Draws & Card Problems',
          summary:
            'Dealing without replacement: position-specific questions like "the 4th card was the first spade" solved by ordered counting, not guesswork.',
        },
      ],
    },
    {
      id: 'applied-models',
      title: 'Applied Models',
      lessons: [
        {
          slug: 'geometric-probability',
          title: 'Geometric Probability',
          summary:
            'When the sample space is a region instead of a list: probability as area, and why a probability of exactly zero does not mean impossible.',
        },
        {
          slug: 'reliability-networks',
          title: 'Reliability Networks',
          summary:
            'Series and parallel blocks, the complement trick, and collapsing a whole block diagram down to one number.',
        },
        {
          slug: 'repeated-trials-and-guessing',
          title: 'Repeated Trials & Guessing Games',
          summary:
            'With replacement vs. without, the geometric distribution, and why a rolling code changes the math of the third attempt.',
        },
      ],
    },
  ],
};
