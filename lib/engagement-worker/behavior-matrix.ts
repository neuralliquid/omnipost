/**
 * Weighted Behavior Matrix
 * Defines probability distributions for human-like behaviors during engagement
 */

import {
  BehaviorWeight,
  BehaviorCategory,
  BehaviorProfile,
  BehaviorModifiers,
  HumanErrorType,
  EngagementAction,
  Platform,
} from './types';
import {
  random,
  weightedChoice,
  shouldOccur,
} from './random-utils';

/**
 * Master Behavior Matrix
 * Each behavior has a base weight (0-1) that can be modified by account profile
 */
export const BEHAVIOR_MATRIX: BehaviorWeight[] = [
  // ============================================
  // TIMING BEHAVIORS
  // ============================================
  {
    name: 'natural_delay',
    description: 'Natural pause before taking action (reading/thinking)',
    weight: 0.95, // Almost always some delay
    category: 'timing',
    subBehaviors: [
      {
        name: 'quick_glance',
        description: 'Brief look before engaging (1-3 seconds)',
        weight: 0.3,
        category: 'timing',
      },
      {
        name: 'casual_read',
        description: 'Normal reading time (3-10 seconds)',
        weight: 0.45,
        category: 'timing',
      },
      {
        name: 'thorough_read',
        description: 'Carefully reading content (10-30 seconds)',
        weight: 0.2,
        category: 'timing',
      },
      {
        name: 'distracted_delay',
        description: 'Got distracted, longer delay (30-120 seconds)',
        weight: 0.05,
        category: 'timing',
      },
    ],
  },
  {
    name: 'typing_pause',
    description: 'Pauses while typing a comment',
    weight: 0.7,
    category: 'timing',
    subBehaviors: [
      {
        name: 'thinking_pause',
        description: 'Brief pause to think (1-3 seconds)',
        weight: 0.5,
        category: 'timing',
      },
      {
        name: 'word_search_pause',
        description: 'Searching for the right word (3-8 seconds)',
        weight: 0.3,
        category: 'timing',
      },
      {
        name: 'distraction_pause',
        description: 'Got distracted mid-typing (8-30 seconds)',
        weight: 0.15,
        category: 'timing',
      },
      {
        name: 'rethinking_pause',
        description: 'Reconsidering entire comment (15-60 seconds)',
        weight: 0.05,
        category: 'timing',
      },
    ],
  },
  {
    name: 'variable_typing_speed',
    description: 'Typing speed varies throughout comment',
    weight: 0.85,
    category: 'timing',
  },
  {
    name: 'burst_typing',
    description: 'Type quickly in bursts, then pause',
    weight: 0.4,
    category: 'timing',
  },
  {
    name: 'slow_start',
    description: 'Start typing slowly, speed up as thoughts form',
    weight: 0.35,
    category: 'timing',
  },

  // ============================================
  // TYPING ERRORS
  // ============================================
  {
    name: 'make_typo',
    description: 'Make a typing mistake',
    weight: 0.35, // 35% chance per comment
    category: 'typing_error',
    subBehaviors: [
      {
        name: 'adjacent_key',
        description: 'Hit adjacent key on keyboard',
        weight: 0.35,
        category: 'typing_error',
      },
      {
        name: 'transposition',
        description: 'Swap two adjacent letters (teh -> the)',
        weight: 0.25,
        category: 'typing_error',
      },
      {
        name: 'double_letter',
        description: 'Type a letter twice (helllo)',
        weight: 0.15,
        category: 'typing_error',
      },
      {
        name: 'missing_letter',
        description: 'Skip a letter (helo)',
        weight: 0.15,
        category: 'typing_error',
      },
      {
        name: 'extra_letter',
        description: 'Add extra letter (helloo)',
        weight: 0.1,
        category: 'typing_error',
      },
    ],
  },
  {
    name: 'autocorrect_fail',
    description: 'Autocorrect changes to wrong word',
    weight: 0.08, // Rare but noticeable
    category: 'typing_error',
  },
  {
    name: 'grammar_mistake',
    description: 'Common grammar error',
    weight: 0.12,
    category: 'typing_error',
    subBehaviors: [
      {
        name: 'their_there_theyre',
        description: 'Confuse their/there/they\'re',
        weight: 0.3,
        category: 'typing_error',
      },
      {
        name: 'your_youre',
        description: 'Confuse your/you\'re',
        weight: 0.25,
        category: 'typing_error',
      },
      {
        name: 'its_its',
        description: 'Confuse its/it\'s',
        weight: 0.2,
        category: 'typing_error',
      },
      {
        name: 'affect_effect',
        description: 'Confuse affect/effect',
        weight: 0.15,
        category: 'typing_error',
      },
      {
        name: 'then_than',
        description: 'Confuse then/than',
        weight: 0.1,
        category: 'typing_error',
      },
    ],
  },
  {
    name: 'capitalization_error',
    description: 'Wrong capitalization',
    weight: 0.15,
    category: 'typing_error',
    subBehaviors: [
      {
        name: 'missing_capital',
        description: 'Forgot to capitalize (start of sentence, proper noun)',
        weight: 0.6,
        category: 'typing_error',
      },
      {
        name: 'accidental_caps',
        description: 'Accidental caps lock (LIKE THIS)',
        weight: 0.2,
        category: 'typing_error',
      },
      {
        name: 'caps_lock_word',
        description: 'Started with caps lock on for one word',
        weight: 0.2,
        category: 'typing_error',
      },
    ],
  },
  {
    name: 'punctuation_error',
    description: 'Punctuation mistakes',
    weight: 0.2,
    category: 'typing_error',
    subBehaviors: [
      {
        name: 'missing_period',
        description: 'Forgot period at end',
        weight: 0.4,
        category: 'typing_error',
      },
      {
        name: 'missing_apostrophe',
        description: 'Forgot apostrophe (dont, cant)',
        weight: 0.3,
        category: 'typing_error',
      },
      {
        name: 'double_punctuation',
        description: 'Double punctuation (!! or ..)',
        weight: 0.15,
        category: 'typing_error',
      },
      {
        name: 'wrong_punctuation',
        description: 'Used wrong punctuation',
        weight: 0.15,
        category: 'typing_error',
      },
    ],
  },
  {
    name: 'spacing_error',
    description: 'Spacing mistakes',
    weight: 0.1,
    category: 'typing_error',
    subBehaviors: [
      {
        name: 'double_space',
        description: 'Typed two spaces',
        weight: 0.5,
        category: 'typing_error',
      },
      {
        name: 'missing_space',
        description: 'Missing space between words',
        weight: 0.35,
        category: 'typing_error',
      },
      {
        name: 'space_before_punctuation',
        description: 'Space before punctuation',
        weight: 0.15,
        category: 'typing_error',
      },
    ],
  },

  // ============================================
  // CORRECTION BEHAVIORS
  // ============================================
  {
    name: 'correct_error',
    description: 'Notice and correct an error after making it',
    weight: 0.65, // Most errors get corrected
    category: 'correction',
    subBehaviors: [
      {
        name: 'immediate_correction',
        description: 'Fix immediately after typing',
        weight: 0.5,
        category: 'correction',
      },
      {
        name: 'delayed_correction',
        description: 'Notice and fix while still typing',
        weight: 0.3,
        category: 'correction',
      },
      {
        name: 'final_review_correction',
        description: 'Fix during final review before posting',
        weight: 0.15,
        category: 'correction',
      },
      {
        name: 'partial_correction',
        description: 'Fix some errors but miss others',
        weight: 0.05,
        category: 'correction',
      },
    ],
  },
  {
    name: 'rewrite_phrase',
    description: 'Delete and rewrite a phrase',
    weight: 0.25,
    category: 'correction',
  },
  {
    name: 'backspace_word',
    description: 'Backspace over last word to retype',
    weight: 0.3,
    category: 'correction',
  },

  // ============================================
  // ACTION PATTERNS
  // ============================================
  {
    name: 'hover_before_action',
    description: 'Hover over button before clicking',
    weight: 0.6,
    category: 'action_pattern',
  },
  {
    name: 'scroll_past_then_back',
    description: 'Scroll past content, then scroll back',
    weight: 0.15,
    category: 'action_pattern',
  },
  {
    name: 'read_comments_first',
    description: 'Read other comments before engaging',
    weight: 0.4,
    category: 'action_pattern',
  },
  {
    name: 'check_profile',
    description: 'Check author\'s profile before engaging',
    weight: 0.1,
    category: 'action_pattern',
  },
  {
    name: 'multiple_reaction_changes',
    description: 'Change reaction type before settling (FB)',
    weight: 0.08,
    category: 'action_pattern',
  },

  // ============================================
  // ENGAGEMENT STYLE
  // ============================================
  {
    name: 'short_comment',
    description: 'Write a short comment (1-5 words)',
    weight: 0.4,
    category: 'engagement_style',
  },
  {
    name: 'medium_comment',
    description: 'Write a medium comment (6-20 words)',
    weight: 0.45,
    category: 'engagement_style',
  },
  {
    name: 'long_comment',
    description: 'Write a longer comment (20+ words)',
    weight: 0.15,
    category: 'engagement_style',
  },
  {
    name: 'use_emoji',
    description: 'Include emoji in comment',
    weight: 0.35,
    category: 'engagement_style',
  },
  {
    name: 'use_hashtag',
    description: 'Include hashtag in comment (Twitter)',
    weight: 0.15,
    category: 'engagement_style',
  },
  {
    name: 'mention_author',
    description: 'Mention the original author',
    weight: 0.1,
    category: 'engagement_style',
  },

  // ============================================
  // ABANDONMENT BEHAVIORS
  // ============================================
  {
    name: 'abandon_action',
    description: 'Start but abandon an action entirely',
    weight: 0.05, // Rare but human
    category: 'abandonment',
    subBehaviors: [
      {
        name: 'abandon_before_typing',
        description: 'Click to comment but leave empty',
        weight: 0.4,
        category: 'abandonment',
      },
      {
        name: 'abandon_mid_typing',
        description: 'Start typing but abandon',
        weight: 0.35,
        category: 'abandonment',
      },
      {
        name: 'abandon_before_submit',
        description: 'Type full comment but don\'t submit',
        weight: 0.25,
        category: 'abandonment',
      },
    ],
  },
  {
    name: 'second_thoughts',
    description: 'Submit, then immediately regret/wish to change',
    weight: 0.08,
    category: 'abandonment',
  },
  {
    name: 'skip_action',
    description: 'Decide not to engage at all',
    weight: 0.1,
    category: 'abandonment',
  },
];

/**
 * Error type weights - probability distribution for each typo type
 */
export const ERROR_TYPE_WEIGHTS: Record<HumanErrorType, number> = {
  typo_adjacent_key: 0.25,
  typo_transposition: 0.2,
  typo_double_letter: 0.12,
  typo_missing_letter: 0.12,
  typo_extra_letter: 0.08,
  autocorrect_wrong: 0.05,
  grammar_their_there: 0.04,
  grammar_your_youre: 0.035,
  grammar_its_its: 0.03,
  capitalization_error: 0.06,
  punctuation_missing: 0.05,
  space_double: 0.025,
  space_missing: 0.02,
};

/**
 * Adjacent key mappings for typo simulation
 */
export const ADJACENT_KEYS: Record<string, string[]> = {
  a: ['q', 'w', 's', 'z'],
  b: ['v', 'g', 'h', 'n'],
  c: ['x', 'd', 'f', 'v'],
  d: ['s', 'e', 'r', 'f', 'c', 'x'],
  e: ['w', 's', 'd', 'r'],
  f: ['d', 'r', 't', 'g', 'v', 'c'],
  g: ['f', 't', 'y', 'h', 'b', 'v'],
  h: ['g', 'y', 'u', 'j', 'n', 'b'],
  i: ['u', 'j', 'k', 'o'],
  j: ['h', 'u', 'i', 'k', 'm', 'n'],
  k: ['j', 'i', 'o', 'l', 'm'],
  l: ['k', 'o', 'p', ';'],
  m: ['n', 'j', 'k', ','],
  n: ['b', 'h', 'j', 'm'],
  o: ['i', 'k', 'l', 'p'],
  p: ['o', 'l', '['],
  q: ['w', 'a'],
  r: ['e', 'd', 'f', 't'],
  s: ['a', 'w', 'e', 'd', 'x', 'z'],
  t: ['r', 'f', 'g', 'y'],
  u: ['y', 'h', 'j', 'i'],
  v: ['c', 'f', 'g', 'b'],
  w: ['q', 'a', 's', 'e'],
  x: ['z', 's', 'd', 'c'],
  y: ['t', 'g', 'h', 'u'],
  z: ['a', 's', 'x'],
};

/**
 * Common autocorrect mistakes
 */
export const AUTOCORRECT_MISTAKES: Record<string, string[]> = {
  its: ["it's", 'its'],
  your: ["you're", 'tour', 'our'],
  their: ["they're", 'there', 'the'],
  were: ["we're", 'where', 'wear'],
  well: ["we'll", 'wall', 'will'],
  ill: ["I'll", 'ill', 'all'],
  cant: ["can't", 'cant', 'rant'],
  dont: ["don't", 'font', 'dint'],
  wont: ["won't", 'want', 'font'],
  hell: ["he'll", 'hell', 'help'],
  shell: ["she'll", 'shell', 'shall'],
  duck: ['duck', 'luck', 'tuck'],
  shot: ['shot', 'shoot', 'short'],
  shut: ['shut', 'shirt', 'short'],
  count: ['count', 'mount', 'county'],
};

/**
 * Common word contractions that get apostrophe errors
 */
export const CONTRACTION_ERRORS: Record<string, string> = {
  "don't": 'dont',
  "can't": 'cant',
  "won't": 'wont',
  "isn't": 'isnt',
  "aren't": 'arent',
  "wasn't": 'wasnt',
  "weren't": 'werent',
  "hasn't": 'hasnt',
  "haven't": 'havent',
  "hadn't": 'hadnt',
  "doesn't": 'doesnt',
  "didn't": 'didnt',
  "wouldn't": 'wouldnt',
  "couldn't": 'couldnt',
  "shouldn't": 'shouldnt',
  "I'm": 'Im',
  "I'll": 'Ill',
  "I've": 'Ive',
  "I'd": 'Id',
  "you're": 'youre',
  "you'll": 'youll',
  "you've": 'youve',
  "you'd": 'youd',
  "we're": 'were',
  "we'll": 'well',
  "we've": 'weve',
  "we'd": 'wed',
  "they're": 'theyre',
  "they'll": 'theyll',
  "they've": 'theyve',
  "they'd": 'theyd',
  "it's": 'its',
  "that's": 'thats',
  "what's": 'whats',
  "who's": 'whos',
  "here's": 'heres',
  "there's": 'theres',
  "where's": 'wheres',
  "let's": 'lets',
};

/**
 * Time of day weights - affects activity likelihood
 */
export const TIME_OF_DAY_WEIGHTS: Record<string, number> = {
  // Hour: Weight (0-1)
  '0': 0.05, // Midnight
  '1': 0.02,
  '2': 0.01,
  '3': 0.01,
  '4': 0.02,
  '5': 0.05,
  '6': 0.15, // Early morning
  '7': 0.35,
  '8': 0.55,
  '9': 0.7, // Morning
  '10': 0.75,
  '11': 0.7,
  '12': 0.8, // Lunch
  '13': 0.75,
  '14': 0.6, // Afternoon
  '15': 0.55,
  '16': 0.6,
  '17': 0.7, // After work
  '18': 0.8,
  '19': 0.85, // Evening peak
  '20': 0.9,
  '21': 0.85,
  '22': 0.6, // Late evening
  '23': 0.3,
};

/**
 * Day of week weights
 */
export const DAY_OF_WEEK_WEIGHTS: Record<number, number> = {
  0: 0.7, // Sunday
  1: 0.85, // Monday
  2: 0.9, // Tuesday
  3: 0.95, // Wednesday
  4: 0.9, // Thursday
  5: 0.8, // Friday
  6: 0.65, // Saturday
};

/**
 * Platform-specific action weights
 */
export const PLATFORM_ACTION_WEIGHTS: Record<Platform, Record<EngagementAction, number>> = {
  twitter: {
    like: 0.45,
    comment: 0.2,
    retweet: 0.25,
    reply: 0.08,
    share: 0.01,
    react: 0.01,
  },
  facebook: {
    like: 0.35,
    react: 0.25,
    comment: 0.25,
    share: 0.1,
    reply: 0.04,
    retweet: 0.01,
  },
};

/**
 * Get adjusted weight based on behavior profile
 */
export function getAdjustedWeight(
  baseWeight: number,
  behavior: BehaviorWeight,
  profile: BehaviorProfile
): number {
  let weight = baseWeight;

  // Adjust based on activity level
  const activityMultipliers = {
    low: 0.6,
    medium: 1.0,
    high: 1.3,
  };
  weight *= activityMultipliers[profile.activityLevel];

  // Adjust based on engagement style
  const styleMultipliers: Record<string, Record<BehaviorCategory, number>> = {
    lurker: {
      timing: 1.2,
      typing_error: 0.5,
      action_pattern: 0.7,
      engagement_style: 0.5,
      abandonment: 1.5,
      correction: 0.8,
    },
    casual: {
      timing: 1.0,
      typing_error: 1.0,
      action_pattern: 1.0,
      engagement_style: 1.0,
      abandonment: 1.0,
      correction: 1.0,
    },
    active: {
      timing: 0.8,
      typing_error: 1.1,
      action_pattern: 1.2,
      engagement_style: 1.2,
      abandonment: 0.7,
      correction: 0.9,
    },
    enthusiast: {
      timing: 0.6,
      typing_error: 1.3,
      action_pattern: 1.4,
      engagement_style: 1.5,
      abandonment: 0.5,
      correction: 0.7,
    },
  };

  weight *= styleMultipliers[profile.engagementStyle][behavior.category];

  // Adjust error-related behaviors by profile
  if (behavior.category === 'typing_error') {
    weight *= profile.typoFrequency + 0.5; // 0.5-1.5 multiplier
  }

  // Cap at 1.0
  return Math.min(weight, 1.0);
}

/**
 * Apply behavior modifiers to a weight
 * @param behaviorName - Optional behavior name for more specific abandonment handling
 */
export function applyModifiers(
  weight: number,
  category: BehaviorCategory,
  modifiers: Partial<BehaviorModifiers>,
  behaviorName?: string
): number {
  let adjusted = weight;

  if (category === 'typing_error' && modifiers.errorMultiplier !== undefined) {
    adjusted *= modifiers.errorMultiplier;
  }

  if (category === 'timing' && modifiers.delayMultiplier !== undefined) {
    adjusted *= modifiers.delayMultiplier;
  }

  if (category === 'abandonment') {
    // Apply specific abandonment modifier based on behavior name
    if (behaviorName === 'abandon_action' || behaviorName?.startsWith('abandon_')) {
      if (modifiers.abandonMidwayProbability !== undefined) {
        adjusted = modifiers.abandonMidwayProbability;
      }
    } else if (behaviorName === 'second_thoughts') {
      if (modifiers.secondThoughtsProbability !== undefined) {
        adjusted = modifiers.secondThoughtsProbability;
      }
    } else {
      // For generic abandonment category, combine both modifiers multiplicatively
      if (modifiers.abandonMidwayProbability !== undefined) {
        adjusted *= modifiers.abandonMidwayProbability / weight || 1;
      }
      if (modifiers.secondThoughtsProbability !== undefined) {
        adjusted *= modifiers.secondThoughtsProbability / weight || 1;
      }
    }
  }

  return Math.min(adjusted, 1.0);
}

/**
 * Select a behavior based on weighted probability
 * Uses non-cryptographic PRNG - see random-utils.ts for security rationale
 */
export function selectWeightedBehavior<T extends { weight: number }>(
  options: T[]
): T | null {
  return weightedChoice(options);
}

/**
 * Check if a behavior should occur based on its weight
 * Uses non-cryptographic PRNG - see random-utils.ts for security rationale
 */
export function shouldBehaviorOccur(weight: number): boolean {
  return shouldOccur(weight);
}

/**
 * Get behaviors by category
 */
export function getBehaviorsByCategory(category: BehaviorCategory): BehaviorWeight[] {
  return BEHAVIOR_MATRIX.filter((b) => b.category === category);
}

/**
 * Get a specific behavior by name
 */
export function getBehaviorByName(name: string): BehaviorWeight | undefined {
  for (const behavior of BEHAVIOR_MATRIX) {
    if (behavior.name === name) return behavior;
    if (behavior.subBehaviors) {
      const sub = behavior.subBehaviors.find((sb) => sb.name === name);
      if (sub) return sub;
    }
  }
  return undefined;
}
