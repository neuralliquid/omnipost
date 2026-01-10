/**
 * Human Behavior Simulator
 * Generates realistic human-like typing, errors, and timing patterns
 */

import {
  BehaviorProfile,
  BehaviorModifiers,
  HumanError,
  HumanErrorType,
  BehavioralEvent,
  BehavioralEventType,
} from './types';
import {
  BEHAVIOR_MATRIX,
  ERROR_TYPE_WEIGHTS,
  ADJACENT_KEYS,
  AUTOCORRECT_MISTAKES,
  CONTRACTION_ERRORS,
  TIME_OF_DAY_WEIGHTS,
  DAY_OF_WEEK_WEIGHTS,
  selectWeightedBehavior,
  shouldBehaviorOccur,
  getAdjustedWeight,
  applyModifiers,
  getBehaviorByName,
} from './behavior-matrix';

/**
 * Human Simulator
 * Generates realistic human-like behavior for engagement actions
 */
export class HumanSimulator {
  private readonly profile: BehaviorProfile;
  private readonly modifiers: Partial<BehaviorModifiers>;
  private events: BehavioralEvent[] = [];

  constructor(
    profile: BehaviorProfile,
    modifiers: Partial<BehaviorModifiers> = {}
  ) {
    this.profile = profile;
    this.modifiers = modifiers;
  }

  /**
   * Get all behavioral events that occurred during simulation
   */
  getEvents(): BehavioralEvent[] {
    return [...this.events];
  }

  /**
   * Clear recorded events
   */
  clearEvents(): void {
    this.events = [];
  }

  /**
   * Record a behavioral event
   */
  private recordEvent(type: BehavioralEventType, details: Record<string, unknown> = {}): void {
    this.events.push({
      timestamp: new Date().toISOString(),
      type,
      details,
    });
  }

  /**
   * Generate natural delay before an action
   */
  async generatePreActionDelay(): Promise<number> {
    const naturalDelayBehavior = getBehaviorByName('natural_delay');
    if (!naturalDelayBehavior) return 1000;

    const weight = getAdjustedWeight(naturalDelayBehavior.weight, naturalDelayBehavior, this.profile);
    const adjusted = applyModifiers(weight, 'timing', this.modifiers);

    if (!shouldBehaviorOccur(adjusted)) {
      return 500; // Minimum delay
    }

    // Select sub-behavior for delay type
    const subBehaviors = naturalDelayBehavior.subBehaviors || [];
    const selected = selectWeightedBehavior(subBehaviors);

    let delayMs: number;
    switch (selected?.name) {
      case 'quick_glance':
        delayMs = this.randomInRange(1000, 3000);
        break;
      case 'casual_read':
        delayMs = this.randomInRange(3000, 10000);
        break;
      case 'thorough_read':
        delayMs = this.randomInRange(10000, 30000);
        break;
      case 'distracted_delay':
        delayMs = this.randomInRange(30000, 120000);
        this.recordEvent('scrolled_away', { delayMs });
        break;
      default:
        delayMs = this.randomInRange(2000, 5000);
    }

    // Adjust by reading speed
    const speedMultiplier = 200 / this.profile.readingSpeedWpm;
    delayMs *= speedMultiplier;

    // Add jitter
    delayMs += this.randomInRange(-500, 500);

    return Math.max(delayMs, 500);
  }

  /**
   * Generate typing simulation with realistic timing and errors
   */
  async simulateTyping(text: string): Promise<{
    finalText: string;
    totalDurationMs: number;
    errors: HumanError[];
    keystrokes: TypedKeystroke[];
  }> {
    this.recordEvent('started_typing', { originalLength: text.length });

    const keystrokes: TypedKeystroke[] = [];
    const errors: HumanError[] = [];
    let currentText = '';
    let totalDurationMs = 0;

    // Calculate base typing speed (ms per character)
    const baseCharTimeMs = 60000 / (this.profile.typingSpeedWpm * 5); // 5 chars per word average

    // Process each character
    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      // Check for typing pause
      if (this.shouldPause(currentText, i)) {
        const pauseResult = await this.simulateTypingPause();
        totalDurationMs += pauseResult.duration;
        this.recordEvent(pauseResult.type, { duration: pauseResult.duration });
      }

      // Calculate variable typing speed
      const charTime = this.calculateCharTime(baseCharTimeMs, char, currentText);
      totalDurationMs += charTime;

      // Check if we should make an error
      const shouldError = this.shouldMakeError(char, currentText);
      if (shouldError) {
        const errorResult = this.generateTypingError(char, currentText, i);
        errors.push(errorResult.error);

        // Type the error first
        keystrokes.push({
          char: errorResult.error.errorText,
          timeMs: charTime,
          isError: true,
        });
        currentText += errorResult.error.errorText;

        // Maybe correct it
        if (this.shouldCorrectError()) {
          const correctionDelay = this.randomInRange(200, 800);
          totalDurationMs += correctionDelay;

          // Backspace the error
          const backspaceTime = errorResult.error.errorText.length * 50;
          totalDurationMs += backspaceTime;

          keystrokes.push({
            char: '\b'.repeat(errorResult.error.errorText.length),
            timeMs: backspaceTime,
            isCorrection: true,
          });

          currentText = currentText.slice(0, -errorResult.error.errorText.length);
          errorResult.error.corrected = true;
          errorResult.error.correctionDelay = correctionDelay;

          this.recordEvent('corrected_typo', {
            original: errorResult.error.errorText,
            corrected: char,
          });

          // Type the correct character
          keystrokes.push({ char, timeMs: charTime, isError: false });
          currentText += char;
        }
      } else {
        keystrokes.push({ char, timeMs: charTime, isError: false });
        currentText += char;
      }
    }

    // Maybe rewrite parts
    if (this.shouldRewritePhrase()) {
      const rewriteResult = this.simulateRewrite(currentText);
      totalDurationMs += rewriteResult.duration;
      currentText = rewriteResult.newText;
      this.recordEvent('rewrote_text', {
        originalLength: text.length,
        newLength: currentText.length,
      });
    }

    // Apply uncorrected grammar/punctuation errors
    const grammarResult = this.applyGrammarErrors(currentText);
    currentText = grammarResult.text;
    errors.push(...grammarResult.errors);

    // Maybe apply spacing errors
    const spacingResult = this.applySpacingErrors(currentText);
    currentText = spacingResult.text;
    errors.push(...spacingResult.errors);

    this.recordEvent('submitted', {
      finalLength: currentText.length,
      errorCount: errors.filter((e) => !e.corrected).length,
    });

    return {
      finalText: currentText,
      totalDurationMs,
      errors,
      keystrokes,
    };
  }

  /**
   * Determine if current moment in activity window is good
   */
  isGoodTimeToEngage(): { shouldEngage: boolean; waitMs?: number } {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    // Check if in peak hours
    const inPeakHours = this.profile.peakHours.includes(hour);

    // Get base time weight
    const timeWeight = parseFloat(TIME_OF_DAY_WEIGHTS[hour.toString()] as unknown as string) || 0.5;
    const dayWeight = DAY_OF_WEEK_WEIGHTS[day] || 0.8;

    // Combine weights
    let totalWeight = timeWeight * dayWeight;

    // Boost if in peak hours
    if (inPeakHours) {
      totalWeight = Math.min(totalWeight * 1.5, 1.0);
    }

    // Reduce if outside peak hours for this profile
    if (!inPeakHours && this.profile.peakHours.length > 0) {
      totalWeight *= 0.5;
    }

    const shouldEngage = shouldBehaviorOccur(totalWeight);

    if (!shouldEngage) {
      // Calculate time until a better engagement window
      const nextPeakHour = this.findNextPeakHour(hour);
      const hoursUntilPeak = (nextPeakHour - hour + 24) % 24;
      const waitMs = hoursUntilPeak * 3600000 + this.randomInRange(0, 1800000);

      return { shouldEngage: false, waitMs };
    }

    return { shouldEngage: true };
  }

  /**
   * Simulate hesitation before submitting
   */
  async simulateHesitation(): Promise<{ hesitated: boolean; duration: number }> {
    const behavior = getBehaviorByName('second_thoughts');
    const weight = behavior
      ? getAdjustedWeight(behavior.weight, behavior, this.profile)
      : 0.08;

    if (shouldBehaviorOccur(weight)) {
      const duration = this.randomInRange(2000, 8000);
      this.recordEvent('hesitated', { duration });
      return { hesitated: true, duration };
    }

    return { hesitated: false, duration: 0 };
  }

  /**
   * Determine if action should be abandoned
   */
  shouldAbandon(stage: 'before_typing' | 'mid_typing' | 'before_submit'): boolean {
    const abandonBehavior = getBehaviorByName('abandon_action');
    if (!abandonBehavior) return false;

    const weight = getAdjustedWeight(abandonBehavior.weight, abandonBehavior, this.profile);
    const adjusted = applyModifiers(weight, 'abandonment', this.modifiers);

    if (!shouldBehaviorOccur(adjusted)) return false;

    // Check sub-behaviors
    const subBehaviors = abandonBehavior.subBehaviors || [];
    const stageMapping = {
      before_typing: 'abandon_before_typing',
      mid_typing: 'abandon_mid_typing',
      before_submit: 'abandon_before_submit',
    };

    const relevantSub = subBehaviors.find((sb) => sb.name === stageMapping[stage]);
    if (relevantSub && shouldBehaviorOccur(relevantSub.weight)) {
      this.recordEvent('abandoned', { stage });
      return true;
    }

    return false;
  }

  /**
   * Generate reaction change behavior (Facebook)
   */
  simulateReactionChanges(): { changed: boolean; changes: string[] } {
    const behavior = getBehaviorByName('multiple_reaction_changes');
    const weight = behavior
      ? getAdjustedWeight(behavior.weight, behavior, this.profile)
      : 0.08;

    if (shouldBehaviorOccur(weight)) {
      const reactions = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];
      const numChanges = this.randomInRange(1, 3);
      const changes: string[] = [];

      for (let i = 0; i < numChanges; i++) {
        changes.push(reactions[Math.floor(Math.random() * reactions.length)]);
      }

      this.recordEvent('changed_reaction', { changes });
      return { changed: true, changes };
    }

    return { changed: false, changes: [] };
  }

  // ===========================================
  // Private helper methods
  // ===========================================

  private shouldPause(currentText: string, position: number): boolean {
    // More likely to pause after punctuation or at sentence boundaries
    const lastChar = currentText.slice(-1);
    if (['.', '!', '?', ','].includes(lastChar)) {
      return shouldBehaviorOccur(0.4);
    }

    // Pause every ~10-20 characters
    if (position > 0 && position % this.randomInRange(10, 20) === 0) {
      return shouldBehaviorOccur(0.3);
    }

    return false;
  }

  private async simulateTypingPause(): Promise<{ type: BehavioralEventType; duration: number }> {
    const pauseBehavior = getBehaviorByName('typing_pause');
    const subBehaviors = pauseBehavior?.subBehaviors || [];
    const selected = selectWeightedBehavior(subBehaviors);

    let duration: number;
    let type: BehavioralEventType = 'paused_typing';

    switch (selected?.name) {
      case 'thinking_pause':
        duration = this.randomInRange(1000, 3000);
        break;
      case 'word_search_pause':
        duration = this.randomInRange(3000, 8000);
        break;
      case 'distraction_pause':
        duration = this.randomInRange(8000, 30000);
        type = 'scrolled_away';
        break;
      case 'rethinking_pause':
        duration = this.randomInRange(15000, 60000);
        type = 'hesitated';
        break;
      default:
        duration = this.randomInRange(500, 2000);
    }

    return { type, duration };
  }

  private calculateCharTime(baseTime: number, char: string, currentText: string): number {
    let time = baseTime;

    // Variation factor (humans aren't consistent)
    time *= 0.7 + Math.random() * 0.6; // 70%-130% of base

    // Faster for common letter sequences
    const lastTwo = currentText.slice(-2);
    const commonSequences = ['th', 'he', 'in', 'er', 'an', 're', 'on', 'at', 'en', 'nd'];
    if (commonSequences.includes(lastTwo.toLowerCase())) {
      time *= 0.85;
    }

    // Slower for capitals (need shift key)
    if (char === char.toUpperCase() && char !== char.toLowerCase()) {
      time *= 1.2;
    }

    // Slower for numbers and special characters
    if (/[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(char)) {
      time *= 1.3;
    }

    // Burst typing effect (faster when in flow)
    if (currentText.length > 10 && Math.random() < 0.3) {
      time *= 0.8;
    }

    return Math.max(time, 30); // Minimum 30ms per char
  }

  private shouldMakeError(char: string, currentText: string): boolean {
    // Base error probability from profile
    const baseProb = this.profile.typoFrequency * 0.15; // ~15% max error rate

    // Increase error chance for:
    // - Long typing sessions
    // - Uncommon characters
    // - Fast typing

    let prob = baseProb;

    // More errors in longer text (fatigue)
    if (currentText.length > 100) prob *= 1.2;
    if (currentText.length > 200) prob *= 1.3;

    // More errors for uncommon characters
    if (!/[a-zA-Z\s]/.test(char)) prob *= 1.5;

    return shouldBehaviorOccur(prob);
  }

  private generateTypingError(
    intendedChar: string,
    currentText: string,
    position: number
  ): { error: HumanError } {
    // Select error type based on weights
    const errorTypes = Object.entries(ERROR_TYPE_WEIGHTS).map(([type, weight]) => ({
      type: type as HumanErrorType,
      weight,
    }));

    const selected = selectWeightedBehavior(errorTypes);
    const errorType = selected?.type || 'typo_adjacent_key';

    let errorText: string;

    switch (errorType) {
      case 'typo_adjacent_key':
        errorText = this.getAdjacentKeyError(intendedChar);
        break;
      case 'typo_transposition':
        errorText = intendedChar; // Will be swapped with next char
        break;
      case 'typo_double_letter':
        errorText = intendedChar + intendedChar;
        break;
      case 'typo_missing_letter':
        errorText = ''; // Skip the character
        break;
      case 'typo_extra_letter':
        errorText = intendedChar + this.getRandomLetter();
        break;
      default:
        errorText = this.getAdjacentKeyError(intendedChar);
    }

    return {
      error: {
        type: errorType,
        originalText: intendedChar,
        errorText,
        position,
        corrected: false,
      },
    };
  }

  private getAdjacentKeyError(char: string): string {
    const lower = char.toLowerCase();
    const adjacents = ADJACENT_KEYS[lower];

    if (adjacents && adjacents.length > 0) {
      const adjacent = adjacents[Math.floor(Math.random() * adjacents.length)];
      return char === char.toUpperCase() ? adjacent.toUpperCase() : adjacent;
    }

    return char;
  }

  private getRandomLetter(): string {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    return letters[Math.floor(Math.random() * letters.length)];
  }

  private shouldCorrectError(): boolean {
    const correctionBehavior = getBehaviorByName('correct_error');
    const weight = correctionBehavior
      ? getAdjustedWeight(correctionBehavior.weight, correctionBehavior, this.profile)
      : 0.65;

    return shouldBehaviorOccur(weight);
  }

  private shouldRewritePhrase(): boolean {
    const rewriteBehavior = getBehaviorByName('rewrite_phrase');
    const weight = rewriteBehavior
      ? getAdjustedWeight(rewriteBehavior.weight, rewriteBehavior, this.profile)
      : 0.25;

    return shouldBehaviorOccur(weight);
  }

  private simulateRewrite(text: string): { newText: string; duration: number } {
    // Rewrite ~20-50% of the text
    const rewriteRatio = 0.2 + Math.random() * 0.3;
    const keepLength = Math.floor(text.length * (1 - rewriteRatio));
    const newText = text.slice(0, keepLength);

    // Time to delete and retype
    const deleteTime = (text.length - keepLength) * 50;
    const retypeTime = (text.length - keepLength) * 100;
    const duration = deleteTime + retypeTime + this.randomInRange(1000, 3000);

    return { newText, duration };
  }

  private applyGrammarErrors(text: string): { text: string; errors: HumanError[] } {
    const errors: HumanError[] = [];

    if (!shouldBehaviorOccur(this.profile.grammarErrorFrequency * 0.5)) {
      return { text, errors };
    }

    // Common their/there/they're errors
    const grammarReplacements: [RegExp, string, string][] = [
      [/\btheir\b/gi, 'there', 'grammar_their_there'],
      [/\bthere\b/gi, 'their', 'grammar_their_there'],
      [/\byour\b/gi, "you're", 'grammar_your_youre'],
      [/\byou're\b/gi, 'your', 'grammar_your_youre'],
      [/\bits\b/gi, "it's", 'grammar_its_its'],
      [/\bit's\b/gi, 'its', 'grammar_its_its'],
    ];

    let modifiedText = text;

    for (const [pattern, replacement, errorType] of grammarReplacements) {
      if (shouldBehaviorOccur(0.15)) {
        // Only sometimes apply
        const match = pattern.exec(modifiedText);
        if (match) {
          const position = match.index;
          modifiedText =
            modifiedText.slice(0, position) +
            replacement +
            modifiedText.slice(position + match[0].length);

          errors.push({
            type: errorType as HumanErrorType,
            originalText: match[0],
            errorText: replacement,
            position,
            corrected: false,
          });
          break; // Only one grammar error per text
        }
      }
    }

    return { text: modifiedText, errors };
  }

  private applySpacingErrors(text: string): { text: string; errors: HumanError[] } {
    const errors: HumanError[] = [];

    if (!shouldBehaviorOccur(0.1)) {
      return { text, errors };
    }

    let modifiedText = text;

    // Double space error
    if (shouldBehaviorOccur(0.5)) {
      const position = Math.floor(Math.random() * (text.length - 10)) + 5;
      const spaceIndex = modifiedText.indexOf(' ', position);
      if (spaceIndex !== -1) {
        modifiedText =
          modifiedText.slice(0, spaceIndex) + '  ' + modifiedText.slice(spaceIndex + 1);
        errors.push({
          type: 'space_double',
          originalText: ' ',
          errorText: '  ',
          position: spaceIndex,
          corrected: false,
        });
      }
    }

    return { text: modifiedText, errors };
  }

  private findNextPeakHour(currentHour: number): number {
    if (this.profile.peakHours.length === 0) {
      return 12; // Default to noon
    }

    for (const peakHour of this.profile.peakHours.sort((a, b) => a - b)) {
      if (peakHour > currentHour) {
        return peakHour;
      }
    }

    return this.profile.peakHours[0]; // Wrap to next day
  }

  private randomInRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

/**
 * Typed keystroke record
 */
export interface TypedKeystroke {
  char: string;
  timeMs: number;
  isError?: boolean;
  isCorrection?: boolean;
}

/**
 * Create default behavior profile
 */
export function createDefaultProfile(overrides: Partial<BehaviorProfile> = {}): BehaviorProfile {
  return {
    activityLevel: 'medium',
    peakHours: [9, 10, 11, 12, 13, 17, 18, 19, 20, 21],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    engagementStyle: 'casual',
    preferredActions: ['like', 'comment'],
    typoFrequency: 0.3,
    grammarErrorFrequency: 0.1,
    autocorrectMistakeFrequency: 0.05,
    abandonedActionFrequency: 0.05,
    typingSpeedWpm: 45,
    readingSpeedWpm: 250,
    thinkingDelayMs: { min: 500, max: 3000 },
    scrollBehavior: 'moderate',
    ...overrides,
  };
}

/**
 * Create a "sloppy" behavior profile (more errors)
 */
export function createSloppyProfile(): BehaviorProfile {
  return createDefaultProfile({
    activityLevel: 'high',
    engagementStyle: 'enthusiast',
    typoFrequency: 0.6,
    grammarErrorFrequency: 0.25,
    autocorrectMistakeFrequency: 0.15,
    abandonedActionFrequency: 0.03,
    typingSpeedWpm: 65,
    thinkingDelayMs: { min: 200, max: 1500 },
  });
}

/**
 * Create a "careful" behavior profile (fewer errors)
 */
export function createCarefulProfile(): BehaviorProfile {
  return createDefaultProfile({
    activityLevel: 'low',
    engagementStyle: 'casual',
    typoFrequency: 0.1,
    grammarErrorFrequency: 0.02,
    autocorrectMistakeFrequency: 0.01,
    abandonedActionFrequency: 0.08,
    typingSpeedWpm: 30,
    readingSpeedWpm: 200,
    thinkingDelayMs: { min: 1000, max: 5000 },
    scrollBehavior: 'slow',
  });
}

/**
 * Create a "lurker" behavior profile (rarely engages)
 */
export function createLurkerProfile(): BehaviorProfile {
  return createDefaultProfile({
    activityLevel: 'low',
    engagementStyle: 'lurker',
    preferredActions: ['like'],
    typoFrequency: 0.15,
    grammarErrorFrequency: 0.05,
    abandonedActionFrequency: 0.2,
    typingSpeedWpm: 35,
    thinkingDelayMs: { min: 2000, max: 8000 },
    scrollBehavior: 'slow',
  });
}
