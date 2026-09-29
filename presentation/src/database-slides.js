import { HEADLINE, gapPoints } from "./config";

export function buildDatabaseSlides() {
  const footer = (number, time, tag) => `
    <div class="slide-footer"><span>${tag}</span><span>${time} min</span><span>${String(number).padStart(2, "0")} / 14</span></div>`;
  const notes = (text) => `<aside class="notes">${text}</aside>`;
  const bar = (label, valuePercent, extraClass = "") => `
    <div class="metric-line ${extraClass}"><span class="metric-name">${label}</span><span class="metric-track"><i style="width:${Math.max(0, Math.min(100, valuePercent))}%"></i></span><strong>${valuePercent.toFixed(1)}%</strong></div>`;

  const gap = gapPoints(HEADLINE.nonDisabledMacroF1Percent, HEADLINE.disabledMacroF1Percent);
  const transferGap = gapPoints(HEADLINE.disabledToDisabledActiveAccuracyPercent, HEADLINE.disabledToNonDisabledActiveAccuracyPercent);

  return [
    `<section class="slide slide-light" data-background-color="#e9eee6">
      <div class="section-head"><p class="eyebrow">THE DATABASE</p><h2>Ninapro: two cohorts,<br><em>one shared taxonomy.</em></h2></div>
      <div class="measurement-grid">
        <div class="measurement-copy">
          <p class="lead">Every experiment in this project reads from two Ninapro cohorts stored locally:</p>
          <div class="channel-compare">
            <div class="channel-row"><span>Non-disabled</span><b>Database/Intact</b><small>able-bodied participants, DB1 · XLSX exports</small></div>
            <div class="channel-row channel-row-amp"><span>Disabled</span><b>Database/Amputee</b><small>limb-loss participants, DB3 · original MAT files</small></div>
          </div>
          <p class="boundary-note">Each recording carries synchronized EMG, a 22-channel CyberGlove signal, and a movement label (<code>restimulus</code>) grouped by repetition (<code>rerepetition</code>) &mdash; the unit every train/test split respects to avoid leakage.</p>
        </div>
        <div class="transfer-taxonomy">
          <div class="transfer-taxonomy-head"><span>EXERCISES</span><b>4 sets</b></div>
          <ul>
            <li><span>A &mdash; finger basics</span><b>12 actions</b></li>
            <li><span>B &mdash; hand / wrist</span><b>17 actions</b></li>
            <li><span>C &mdash; grasps</span><b>23 actions</b></li>
            <li><span>D &mdash; combined fingers</span><b>9 actions</b></li>
          </ul>
          <small>Every exercise also includes Rest. B and C are the only taxonomy recorded for both cohorts, which is why cross-cohort comparisons focus there.</small>
        </div>
      </div>
      ${footer(1, "0:45", "DATABASE")}
      ${notes("Open by grounding the audience in the data before any model result. Two cohorts, same sensor family, same movement taxonomy where it overlaps. This is what makes a Non-disabled vs Disabled comparison meaningful instead of comparing apples to oranges.")}
    </section>`,

    `<section class="slide slide-ink" data-background-color="#10191d">
      <div class="section-head"><p class="eyebrow">EXERCISES AND ACTIONS</p><h2>Named actions,<br><em>not arbitrary class IDs.</em></h2></div>
      <div class="confusion-layout">
        <div class="confusion-image"><img src="/figures/EXP-006-nondisabled-e1e2e3-frequency_window_classes.png" alt="Retained windows per exercise, Non-disabled cohort" /></div>
        <div class="confusion-copy">
          <div class="readout"><b>Exercise A</b><span>Index/middle/ring/little/thumb flexion, extension, adduction, abduction</span></div>
          <div class="readout readout-accent"><b>Exercise B</b><span>Thumb up, fist, pointing index, wrist flexion/extension/supination/pronation</span></div>
          <div class="readout"><b>Exercise C</b><span>Grasps: power sphere, tripod, lateral, stick, precision pinch, and more</span></div>
          <p class="boundary-note">Windows are retained only above an 80% label-purity threshold inside one repetition, so a transition between two actions is dropped rather than mislabeled.</p>
        </div>
      </div>
      ${footer(2, "0:45", "TAXONOMY")}
      ${notes("Show the actual named movements, not just class numbers, so a clinician or engineer can picture what the model is being asked to recognize. The bar chart shows how many analysis windows survive the purity filter per exercise for the Non-disabled reference notebook.")}
    </section>`,

    `<section class="slide slide-light" data-background-color="#e9eee6">
      <div class="section-head"><p class="eyebrow">SO WHAT</p><h2>The gap between cohorts<br><em>is the engineering problem.</em></h2></div>
      <div class="measurement-grid">
        <div class="measurement-copy">
          ${bar("Non-disabled cross-subject macro F1", HEADLINE.nonDisabledMacroF1Percent)}
          ${bar("Disabled cross-subject macro F1", HEADLINE.disabledMacroF1Percent, "metric-line-accent")}
          <div class="scorecard-callout"><b>${gap.toFixed(1)} pts</b><span>gap between best-case (Non-disabled) and Disabled-cohort performance on the same pipeline</span></div>
          ${bar("Disabled &rarr; Disabled active-action accuracy", HEADLINE.disabledToDisabledActiveAccuracyPercent)}
          ${bar("Disabled &rarr; Non-disabled transfer accuracy", HEADLINE.disabledToNonDisabledActiveAccuracyPercent, "metric-line-accent")}
          <div class="scorecard-callout"><b>${transferGap.toFixed(1)} pts</b><span>further drop when a Disabled-trained model is tested on Non-disabled recordings</span></div>
        </div>
        <div class="transfer-taxonomy">
          <div class="transfer-taxonomy-head"><span>WHY THIS MATTERS</span></div>
          <p>Finding and quantifying the pattern gap between disabled and non-disabled physiology is the specific research question a prosthetic-control program needs answered before it invests in a controller: does a model trained on one population transfer to the other, and by how much does it degrade?</p>
        </div>
      </div>
      <p class="footnote">All four numbers live in one place (<code>presentation/src/config.js</code>) &mdash; update them there when a notebook produces a better result and every bar/label on this slide updates automatically.</p>
      ${footer(3, "1:00", "SO WHAT")}
      ${notes("This is the central so-what for the whole project: the numbers do not say amputee EMG is unusable, they quantify exactly how much a prosthetic-control model has to close the gap between able-bodied training data and the population it must actually serve. That gap, not a single accuracy number, is the engineering target for future prosthetics research.")}
    </section>`,
  ];
}
