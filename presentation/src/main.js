import Reveal from "reveal.js";
import Notes from "reveal.js/plugin/notes";
import results from "./results.json";
import raiSummary from "./rai-summary.json";
import { buildTransferSlides } from "./transfer-slides";
import { buildTwoPartSlides } from "./two-part-slides";
import { buildRaiSlides } from "./rai-slides";
import { buildDatabaseSlides } from "./database-slides";
import { mountHandFlare } from "./hand-flare";
import "reveal.js/reveal.css";
import "./style.css";

const intact = results.experiments.find((item) => item.cohort === "Intact");
const amputee = results.experiments.find((item) => item.cohort === "Amputee");
const amp = amputee;
const image = (cohort, name, alt) => `
  <figure class="evidence-figure">
    <img src="/figures/${cohort.experimentId}_${name}.png" alt="${alt}" />
    <figcaption>${alt}</figcaption>
  </figure>`;
const percent = (value) => `${Number(value).toFixed(1)}%`;
const metric = (label, value, detail = "") => `
  <div class="metric-line">
    <span class="metric-name">${label}</span>
    <span class="metric-track"><i style="width:${Math.max(0, Math.min(100, value))}%"></i></span>
    <strong>${percent(value)}</strong>
    ${detail ? `<small>${detail}</small>` : ""}
  </div>`;
const notes = (text) => `<aside class="notes">${text}</aside>`;
const footer = (number, time, tag) => `
  <div class="slide-footer"><span>${tag}</span><span>${time} min</span><span>${String(number).padStart(2, "0")} / 14</span></div>`;

const crossSubjectRows = [
  ["Macro F1", "macroF1Percent"],
  ["Balanced accuracy", "balancedAccuracyPercent"],
  ["Accuracy", "accuracyPercent"],
];
const cohortBars = (cohort) => crossSubjectRows.map(([label, key]) =>
  metric(label, cohort.crossSubject[key]),
).join("");

const legacySlides = [
  `<section class="slide slide-hero" data-background-color="#10191d">
    <div class="hero-copy">
      <p class="eyebrow"><span class="signal-dot"></span> NINAPRO · AMPUTEE COHORT · EXERCISE 1</p>
      <h1>Reading the signal<br><em>is not control.</em></h1>
      <p class="hero-deck">Can surface EMG identify a recorded hand movement well enough to inform a prosthetic-control study?</p>
      <div class="hero-stats">
        <div><b>${percent(amp.crossSubject.accuracyPercent)}</b><span>cross-subject accuracy</span></div>
        <div><b>${percent(amp.crossSubject.macroF1Percent)}</b><span>macro F1 across 18 classes</span></div>
        <div><b>${amp.testSubjects}</b><span>held-out people</span></div>
      </div>
      <p class="hero-verdict">Accuracy matched the majority-only baseline. The model did not demonstrate useful new-user movement decoding.</p>
    </div>
    <div class="hero-signal">${image(amp, "raw_emg", "Twelve measured EMG channels over sample index")}</div>
    ${footer(4, "0:55", "THE RESULT")}
    ${notes("Opening: In a prosthetic research context, the promise is to translate muscle activity into a useful movement intention. We tested a much narrower question: can windows from recorded surface EMG predict the dataset's movement label for a participant absent from training? The answer is not yet. Cross-subject accuracy was 33.1%, macro F1 was 2.8%, and the majority-only baseline scored exactly the same. Emphasize that this is an offline baseline, not a prosthetic controller.")}
  </section>`,

  `<section class="slide slide-light" data-background-color="#e9eee6">
    <div class="section-head"><p class="eyebrow">01 / THE MEASUREMENT</p><h2>What entered the model?</h2></div>
    <div class="measurement-grid">
      <div class="measurement-copy">
        <p class="lead">Electrical activity recorded at the forearm was mapped to the dataset's <code>restimulus</code> labels.</p>
        <div class="channel-compare">
          <div class="channel-row"><span>Intact</span><b>${intact.emgChannels[0]} EMG channels</b><i class="channels" style="--count:${intact.emgChannels[0]}"></i><small>${intact.movementClasses} labels</small></div>
          <div class="channel-row channel-row-amp"><span>Amputee</span><b>${amp.emgChannels[0]} EMG channels</b><i class="channels" style="--count:${amp.emgChannels[0]}"></i><small>${amp.movementClasses} labels</small></div>
        </div>
        <p class="boundary-note"><strong>Input:</strong> EMG only. <strong>Target:</strong> movement annotation. The 22-channel glove is kept separate as kinematic data, never used as a classifier input.</p>
      </div>
      <div>${image(amp, "amplitude", "Recorded EMG amplitude distributions differ by channel")}</div>
    </div>
    ${footer(5, "1:00", "MEASUREMENT")}
    ${notes("The database contains two cohorts, handled as separate experiments because the signal layouts and label vocabularies differ. The Intact recordings used here have 10 EMG channels and 13 labels; the Amputee recordings have 12 channels and 18 labels. Both examples have 22 glove channels. The classifier sees only EMG and predicts restimulus. Glove measurements are not classifier features. Mention that sampling rate was unavailable in these local files, so windows are reported in samples rather than milliseconds.")}
  </section>`,

  `<section class="slide slide-ink" data-background-color="#10191d">
    <div class="section-head"><p class="eyebrow">02 / THE EXPERIMENT</p><h2>Separate people<br><em>before windows.</em></h2></div>
    <div class="protocol-layout">
      <div class="split-rail">
        <div class="split-block"><span>TRAIN</span><b>${amp.trainSubjects} people</b><small>Fit the scaler and classifier here</small></div>
        <div class="split-block split-validation"><span>VALIDATION</span><b>${amp.validationSubjects} people</b><small>Calibrate probabilities; choose abstention cutoff</small></div>
        <div class="split-block split-test"><span>LOCKED TEST</span><b>${amp.testSubjects} people</b><small>${amp.testSubjectIds.join(" · ")}</small></div>
      </div>
      <div class="protocol-detail">
        <div class="window-equation"><span>200 samples</span><b>window</b><span>50 samples</span><b>stride</b><span>80%</span><b>label purity</b></div>
        <div class="window-funnel"><b>${amp.candidateWindows.toLocaleString()}</b><span>candidate windows</span><i></i><b>${amp.acceptedWindows.toLocaleString()}</b><span>retained after label-purity and repetition-boundary rules</span></div>
        <p>Sampling rate was not present in the inspected MAT metadata; these are sample counts, not milliseconds.</p>
      </div>
    </div>
    ${footer(6, "1:05", "EXPERIMENT")}
    ${notes("Explain the split: the primary test withholds whole people, matching the question of transfer to someone the model did not train on. Seven Amputee participants train the model, two are used for validation, and two are locked for testing. The second analysis holds out subject-repetition groups, which answers a different, easier question. Windows are 200 samples with a 50-sample stride and majority-label purity of at least 80%; windows crossing repetition boundaries are rejected. Overlap means windows are not independent people.")}
  </section>`,

  `<section class="slide slide-light" data-background-color="#e9eee6">
    <div class="section-head"><p class="eyebrow">03 / THE SCORECARD</p><h2>EMG did not beat<br>“always predict rest.”</h2></div>
    <div class="scorecard-layout">
      <div class="scorecard-copy">
        <p class="lead">Amputee · cross-subject locked test</p>
        ${metric("Accuracy", amp.crossSubject.accuracyPercent, "same score as prior-only baseline")}
        ${metric("Balanced accuracy", amp.crossSubject.balancedAccuracyPercent, "chance reference for 18 balanced classes ≈ 5.6%")}
        ${metric("Macro F1", amp.crossSubject.macroF1Percent, "class-level performance collapses")}
        <div class="scorecard-callout"><b>0.0%</b><span>recall for each of the 17 movement classes in the cross-subject test</span></div>
      </div>
      <div class="scorecard-visual">
        <div class="match-label">THE TWO SYSTEMS LAND ON THE SAME RESULT</div>
        <div class="versus"><div><small>Prior-only</small><b>${percent(amp.crossSubject.majorityBaseline.accuracyPercent)}</b><em>accuracy</em><b>${percent(amp.crossSubject.majorityBaseline.macroF1Percent)}</b><em>macro F1</em></div><span>=</span><div class="versus-model"><small>EMG logistic</small><b>${percent(amp.crossSubject.accuracyPercent)}</b><em>accuracy</em><b>${percent(amp.crossSubject.macroF1Percent)}</b><em>macro F1</em></div></div>
        <p>Most test windows belong to rest/class 0 (${percent(amp.restSharePercent)}). Accuracy alone made the failure look better than it was.</p>
      </div>
    </div>
    ${footer(7, "1:10", "RESULT")}
    ${notes("This is the central finding. The held-out Amputee test contains 18 classes, but class 0 accounts for 33.1% of windows. The EMG logistic classifier gets 33.1% accuracy, exactly matching the prior-only majority classifier. Balanced accuracy is 5.6%, the uniform 18-class reference, and macro F1 is only 2.8%. For every non-rest movement class, test recall is zero. Therefore the model has not shown useful cross-subject movement decoding in this experiment. Do not call this '33% prosthetic control accuracy.'")}
  </section>`,

  `<section class="slide slide-ink" data-background-color="#10191d">
    <div class="section-head"><p class="eyebrow">04 / WHERE IT FAILS</p><h2>Movement is being<br><em>collapsed into rest.</em></h2></div>
    <div class="confusion-layout">
      <div class="confusion-image">${image(amp, "test_confusion", "Row-normalized confusion matrix for Amputee cross-subject test")}</div>
      <div class="confusion-copy">
        <div class="readout"><b>17 / 17</b><span>movement classes had zero cross-subject test recall</span></div>
        <div class="readout readout-accent"><b>${percent(amp.crossSubject.coveragePercent)}</b><span>of test windows passed the validation-set confidence cutoff</span></div>
        <p>The selective policy barely abstained on the locked test: confidence did not flag the errors. Calibration alone did not make the output safe to act on.</p>
      </div>
    </div>
    ${footer(8, "1:00", "ERROR PROFILE")}
    ${notes("Walk the row-normalized matrix: rows are the recorded movement classes and columns are model predictions. The predictions concentrate in class zero, rest. The validation-set confidence threshold was intended to target 90% coverage; it accepted 99.8% of the held-out test windows and did not prevent the collapse. This shows why calibration and thresholding must be checked under distribution shift; confidence is not a safety guarantee.")}
  </section>`,

  `<section class="slide slide-light" data-background-color="#e9eee6">
    <div class="section-head"><p class="eyebrow">05 / A SECOND QUESTION</p><h2>Known user ≠ new user.</h2></div>
    <div class="generalization-layout">
      <div class="generalization-figure">${image(amp, "subject_performance", "Macro F1 varies across held-out Amputee participants and repetition groups")}</div>
      <div class="generalization-copy">
        <div class="two-results"><div><small>NEW PARTICIPANTS</small><b>${percent(amp.crossSubject.macroF1Percent)}</b><span>macro F1 · 2 test people</span></div><div><small>UNSEEN REPETITIONS</small><b>${percent(amp.withinSubject.macroF1Percent)}</b><span>macro F1 · 8 test people</span></div></div>
        <p>The repetition-held-out model improves over its majority baseline, but macro F1 remains ${percent(amp.withinSubject.macroF1Percent)} and subject scores vary.</p>
        <p class="boundary-note"><strong>Interpretation:</strong> user-specific calibration may matter; two unseen participants are too few to establish transfer to the broader Amputee population.</p>
      </div>
    </div>
    ${footer(9, "1:00", "GENERALIZATION")}
    ${notes("This is a different deployment question. In the within-subject analysis, participants can appear across train and test but complete repetitions are held out; macro F1 reaches 9.0%, higher than the prior-only baseline's 3.2%, but still low. Cross-subject macro F1 is 2.8%. Only two Amputee participants were held out in the new-user test. Also, windows are correlated; the statistical unit for generalization is the person, not the 71,000 windows. A larger participant-level evaluation is required.")}
  </section>`,

  `<section class="slide slide-ink" data-background-color="#10191d">
    <div class="section-head"><p class="eyebrow">06 / BOTH COHORTS, SEPARATELY</p><h2>Same baseline.<br><em>Different evidence.</em></h2></div>
    <div class="cohort-layout">
      <div class="cohort-panel">${image(intact, "test_confusion", "Intact cross-subject test confusion matrix")}
        <div class="cohort-label"><span>INTACT</span><b>${intact.emgChannels[0]} channels · ${intact.movementClasses} classes · ${intact.testSubjects} held-out people</b></div>
        ${cohortBars(intact)}
      </div>
      <div class="cohort-panel cohort-panel-amp">${image(amp, "test_confusion", "Amputee cross-subject test confusion matrix")}
        <div class="cohort-label"><span>AMPUTEE</span><b>${amp.emgChannels[0]} channels · ${amp.movementClasses} classes · ${amp.testSubjects} held-out people</b></div>
        ${cohortBars(amp)}
      </div>
    </div>
    <p class="footnote">Separate runs; labels, channel layouts, class balance, and test population differ. Do not read this as a controlled cohort effect.</p>
    ${footer(10, "1:00", "COHORT COMPARISON")}
    ${notes("The earlier Intact experiment used 10 EMG channels, 13 labels, and four held-out participants. Its cross-subject macro F1 was 18.3%, versus 2.8% for Amputee. This contrast is a research signal, not evidence that amputation caused the difference: the cohorts differ in channel layout, labels, class balance, sample volumes, and number of test participants. Keep experiments separate until a harmonized protocol and adequately powered cohort comparison are designed.")}
  </section>`,

  `<section class="slide slide-light" data-background-color="#e9eee6">
    <div class="section-head"><p class="eyebrow">07 / WHAT THE FEATURES SAY</p><h2>The model uses signal level.<br>That is not muscle causality.</h2></div>
    <div class="feature-layout">
      <div class="feature-image">${image(amp, "feature_importance", "Permutation feature importance on validation data in macro-F1 percentage points")}</div>
      <div class="feature-copy">
        <div class="channel-chip"><b>01</b><span>MAV · channel 7</span><strong>2.4</strong><small>macro-F1 points lost when shuffled</small></div>
        <div class="channel-chip"><b>02</b><span>MAV · channel 1</span><strong>2.3</strong><small>macro-F1 points lost when shuffled</small></div>
        <div class="channel-chip"><b>03</b><span>MAV · channel 4</span><strong>2.0</strong><small>macro-F1 points lost when shuffled</small></div>
        <p>Permutation importance measures model reliance on validation windows. Channel-to-muscle placement is not documented here; correlated channels can share importance.</p>
      </div>
    </div>
    ${footer(11, "1:00", "INTERPRETATION")}
    ${notes("Feature importance is computed by shuffling one validation feature and measuring macro-F1 reduction. In this run mean absolute value on channels 7, 1 and 4 ranks highest, each changing macro-F1 by only a few percentage points. This is a model association, not identification of a specific muscle or proof of causal control. Electrode location, channel mapping, and signal quality must be characterized before physiological interpretation.")}
  </section>`,

  `<section class="slide slide-close" data-background-color="#10191d">
    <div class="section-head"><p class="eyebrow">08 / THE PRACTICAL NEXT STEP</p><h2>Use the result as a<br><em>gate, not a command.</em></h2></div>
    <div class="readiness-flow">
      <div class="ready-stage"><span>01</span><b>Record</b><small>EMG + synchronized intent labels</small></div>
      <i></i><div class="ready-stage"><span>02</span><b>Decode</b><small>subject-held-out, per-class testing</small></div>
      <i></i><div class="ready-stage ready-stop"><span>03</span><b>Do not actuate yet</b><small>Amputee new-user test ≈ majority baseline</small></div>
      <i></i><div class="ready-stage"><span>04</span><b>Next study</b><small>more users · personalization · causal real-time filters · hardware safety tests</small></div>
    </div>
    <div class="closing-line"><strong>Current evidence:</strong> promising as a research pipeline; not reliable enough to translate Amputee EMG into prosthetic movement commands.</div>
    <p class="source-note">Dataset: Ninapro, ninapro.hevs.ch · local recordings: Amputee E1 (EXP-002) and Intact E1 (EXP-001). Offline, group-aware baseline; no prosthetic device was tested.</p>
    <div class="closing-meta"><span>9 MIN · 9 SLIDES</span><span>Offline Ninapro analysis · E1 · seed 42</span><span>Questions</span></div>
    ${footer(12, "0:50", "CONCLUSION")}
    ${notes("Close with an actionable boundary. The data suggests a pipeline for studying EMG-to-movement patterns, but this experiment does not support copying movement into a prosthetic command. Next: evaluate more amputee participants, document electrode/channel placement, improve movement-versus-rest separation, test participant-specific calibration in a prespecified design, then measure causal end-to-end latency and safety on hardware with human oversight. No medical or functional benefit is claimed. Leave the remaining time for questions; total spoken target is about nine minutes.")}
  </section>`,
];

const baseSlides = results.twoPart
  ? buildTwoPartSlides(results.twoPart)
  : results.transfer
    ? buildTransferSlides(results.transfer, results)
    : legacySlides;
const slides = [...buildDatabaseSlides(), ...baseSlides, ...buildRaiSlides(raiSummary)];
document.querySelector("#slides").innerHTML = slides.join("\n");
const deck = new Reveal({
  width: 1600,
  height: 900,
  margin: 0.035,
  minScale: 0.1,
  maxScale: 1,
  controls: true,
  progress: true,
  hash: true,
  slideNumber: false,
  transition: "fade",
  backgroundTransition: "fade",
  center: false,
  plugins: [Notes],
});
await deck.initialize();
mountHandFlare(deck);
