// Single source of truth for the deck's headline comparison numbers.
// Update these when a notebook produces a better result; every slide/bar below reads from here.
export const HEADLINE = {
  // EXP-001: Non-disabled (Intact) tabular baseline, cross-subject held-out test.
  nonDisabledMacroF1Percent: 18.3,
  // EXP-002: Disabled (Amputee) tabular baseline, cross-subject held-out test.
  disabledMacroF1Percent: 2.8,
  // EXP-006: Non-disabled (Intact) frequency/MLP reference, held-out repetitions, all exercises pooled.
  nonDisabledFrequencyMacroF1Percent: 24.9,
  // EXP-005 part 1: Disabled-to-Disabled active-action accuracy (unseen Disabled subjects).
  disabledToDisabledActiveAccuracyPercent: 3.6,
  // EXP-005 part 2: Disabled-trained model applied to Non-disabled recordings (cross-cohort transfer).
  disabledToNonDisabledActiveAccuracyPercent: 0.3,
};

export const gapPoints = (a, b) => Math.round((a - b) * 10) / 10;
