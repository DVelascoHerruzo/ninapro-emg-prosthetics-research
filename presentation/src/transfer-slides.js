export function buildTransferSlides(transfer, results) {
  const image = (name, alt) => `
    <figure class="evidence-figure">
      <img src="/figures/${transfer.experimentId}_${name}.png" alt="${alt}" />
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
  const footer = (number, time, tag) => `
    <div class="slide-footer"><span>${tag}</span><span>${time} min</span><span>${String(number).padStart(2, "0")} / 09</span></div>`;
  const example = transfer.randomPrediction;
  const exampleState = example.correct ? "MATCH" : "MISMATCH";
  const perSubject = [...transfer.perSubject].sort((left, right) => left.activeMacroF1Percent - right.activeMacroF1Percent);
  const medianSubjectF1 = perSubject[Math.floor(perSubject.length / 2)]?.activeMacroF1Percent ?? 0;
  const classRows = [...transfer.perClass].filter((row) => row.actionId > 0).sort((left, right) => right.f1Percent - left.f1Percent);
  const bestClasses = classRows.slice(0, 3);
  const worstClasses = classRows.slice(-3).reverse();

  return [
    `<section class="slide slide-hero" data-background-color="#10191d">
      <div class="hero-copy">
        <p class="eyebrow"><span class="signal-dot"></span> NINAPRO · ZERO-SHOT COHORT TRANSFER</p>
        <h1>Can an Intact-trained model read an Amputee signal?</h1>
        <p class="hero-deck">Train on Intact data plus Amputee calibration subjects. Give it an unseen Amputee EMG window. Ask it to name the recorded action.</p>
        <div class="hero-stats">
          <div><b>${percent(transfer.activeActionAccuracyPercent)}</b><span>active-action accuracy</span></div>
          <div><b>${percent(transfer.activeMacroF1Percent)}</b><span>macro F1 across 17 actions</span></div>
          <div><b>${transfer.targetSubjects}</b><span>Amputee participants held out</span></div>
        </div>
        <p class="hero-verdict">${transfer.sourceNote} This is a cross-database test, not a prosthetic-control trial.</p>
      </div>
      <div class="hero-signal">${image("amputee_confusion", "Action confusion matrix for the Intact-trained model on Amputee recordings")}</div>
      ${footer(1, "0:55", "THE QUESTION")}
      <aside class="notes">We changed the question from training and testing within the Amputee cohort to transfer: can a model trained only on Intact people label an Amputee recording? The source is Ninapro DB1 Exercise 2 and the target is DB3 Exercise 1, selected because the official movement taxonomy aligns these as group B. Amputee recordings are kept outside fitting, feature selection, calibration, and model selection. This is still offline label prediction, not a prosthetic controller.</aside>
    </section>`,

    `<section class="slide slide-light" data-background-color="#e9eee6">
      <div class="section-head"><div><p class="eyebrow">01 / ACTIONS AND SIGNALS</p><h2>Match the movement vocabulary.<br><em>Do not fake electrode equivalence.</em></h2></div></div>
      <div class="measurement-grid">
        <div class="measurement-copy">
          <p class="lead">DB1 E2 and DB3 E1 share the group-B actions: rest plus 17 named hand and wrist movements.</p>
          <div class="channel-compare">
            <div class="channel-row"><span>DB1</span><b>Intact · 10 EMG channels</b><i class="channels" style="--count:10"></i><small>source</small></div>
            <div class="channel-row channel-row-amp"><span>DB3</span><b>Amputee · 12 EMG channels</b><i class="channels" style="--count:12"></i><small>target</small></div>
          </div>
          <p class="boundary-note"><strong>Features:</strong> MAV, RMS, waveform length, pooled across channels. No channel-by-channel anatomical correspondence is assumed. Glove kinematics never enter the classifier.</p>
        </div>
        <div class="transfer-taxonomy">
          <div class="transfer-taxonomy-head"><span>SHARED LABEL SET</span><b>18 classes</b></div>
          <p>Rest · thumb up · finger extension/flexion · opposition · abduction · fist · pointing · wrist rotation, flexion, extension and deviation</p>
          <small>The action names follow Ninapro's group-B taxonomy; integer labels alone are not treated as proof of semantic equivalence.</small>
        </div>
      </div>
      ${footer(2, "1:00", "HARMONIZATION")}
      <aside class="notes">These databases are not interchangeable sensor systems. DB1 records 10 channels and DB3 records up to 12 using different electrode configurations. We therefore map labels using the published movement taxonomy and pool features over each recording's channel set. Pooling loses spatial identity; it makes a fixed-size representation possible but does not solve domain shift. The task includes rest and 17 actions. Kinematic glove measurements are excluded so the model must predict from EMG.</aside>
    </section>`,

    `<section class="slide slide-ink" data-background-color="#10191d">
      <div class="section-head"><div><p class="eyebrow">02 / EVALUATION DESIGN</p><h2>People split first.<br><em>Amputee stays unseen.</em></h2></div></div>
      <div class="protocol-layout">
        <div class="split-rail">
          <div class="split-block"><span>FIT</span><b>Intact + Amputee train subjects</b><small>Scaler and class-weighted logistic model</small></div>
          <div class="split-block split-validation"><span>SELECT / CALIBRATE</span><b>Intact + Amputee validation subjects</b><small>Choose feature scaling and calibrate probabilities</small></div>
          <div class="split-block split-test"><span>EXTERNAL DB3 TEST</span><b>${transfer.targetSubjects} Amputee subjects</b><small>Never used during model selection</small></div>
        </div>
        <div class="protocol-detail">
          <div class="window-equation"><span>${transfer.windowDurationMs} ms</span><b>window</b><span>${transfer.windowStrideMs} ms</span><b>stride</b><span>80%</span><b>label purity</b></div>
          <div class="window-funnel"><b>${Number(transfer.targetWindows).toLocaleString()}</b><span>retained external-test windows</span><i></i><b>${transfer.selectedRepresentation}</b><span>representation selected on Intact validation</span></div>
          <p>DB3 EMG is resampled by repetition to DB1's published 100 Hz rate. Windows crossing repetition boundaries are excluded.</p>
        </div>
      </div>
      ${footer(3, "1:05", "NO TARGET LEAKAGE")}
      <aside class="notes">We split both cohorts by participant before making windows. Intact and Amputee training subjects fit the scaler and classifier. Validation subjects from both cohorts decide between raw and per-window scale-normalized pooled features and calibrate confidence. Three Amputee participants remain locked for final test. Windows are 200 milliseconds long with 50 milliseconds stride and require at least 80 percent label purity. The DB1 rate is published as 100 Hz; the local XLSX export does not preserve that metadata. DB3's 2 kHz signal is polyphase-resampled per repetition.</aside>
    </section>`,

    `<section class="slide slide-light" data-background-color="#e9eee6">
      <div class="section-head"><div><p class="eyebrow">03 / EXTERNAL TEST</p><h2>${transfer.accuracyPercent === transfer.majorityAccuracyPercent ? "The transfer model ties" : "Compare against the prior"}<br><em>before celebrating accuracy.</em></h2></div></div>
      <div class="scorecard-layout">
        <div class="scorecard-copy">
          <p class="lead">DB3 Amputee · all participants external</p>
          ${metric("Accuracy", transfer.accuracyPercent, `source-majority baseline: ${percent(transfer.majorityAccuracyPercent)}`)}
          ${metric("Balanced accuracy", transfer.balancedAccuracyPercent, "Weights each action equally")}
          ${metric("Macro F1", transfer.macroF1Percent, "Rest plus all 17 actions")}
          ${metric("Active accuracy", transfer.activeActionAccuracyPercent, "Only windows with a movement label")}
        </div>
        <div class="scorecard-visual">
          <div class="match-label">AGGREGATE DOES NOT EQUAL ACTION QUALITY</div>
          <div class="scorecard-callout"><b>${percent(transfer.activeMacroF1Percent)}</b><span>active-action macro F1. Each action contributes equally, exposing failures hidden by the most frequent class.</span></div>
          <p>Model output is evaluated against DB3's refined movement labels. Overlapping windows are correlated; participants, not windows, are the unit for generalization.</p>
        </div>
      </div>
      ${footer(4, "1:10", "READ THE METRICS")}
      <aside class="notes">Start with the four metrics. Accuracy describes the fraction of windows correct, but is sensitive to class prevalence. Balanced accuracy averages recall across classes. Macro F1 weights each action equally and includes rest. Active accuracy removes rest windows and asks whether a movement window is named correctly. Compare accuracy to the source-majority prediction, but do not use it alone. The user-level question needs participant results and per-action behavior as well.</aside>
    </section>`,

    `<section class="slide slide-ink" data-background-color="#10191d">
      <div class="section-head"><div><p class="eyebrow">04 / ERROR SHAPE</p><h2>Which actions transfer?<br><em>Which ones collapse?</em></h2></div></div>
      <div class="confusion-layout">
        <div class="confusion-image">${image("amputee_confusion", "Row-normalized action confusion matrix: actual DB3 actions versus Intact-model predictions")}</div>
        <div class="confusion-copy">
          <div class="readout"><b>${bestClasses.map((row) => row.action).join(" · ") || "No clear leaders"}</b><span>highest active-action F1 scores in this test</span></div>
          <div class="readout readout-accent"><b>${worstClasses.map((row) => row.action).join(" · ") || "No clear tail"}</b><span>lowest active-action F1 scores</span></div>
          <p>Rows are recorded actions; columns are model predictions. Class-by-class failures tell us what a single overall score hides.</p>
        </div>
      </div>
      ${footer(5, "1:00", "ACTION-LEVEL EVIDENCE")}
      <aside class="notes">Read the confusion matrix by rows: each row is a true action and each column is a model output. A diagonal cell is a correct recognition; off-diagonal cells identify systematic confusion. We surface the best and worst classes by F1 as a guide, not as a post-hoc claim of clinical importance. Every action's support is reported in the output artifacts. Class frequency and the exact split matter when interpreting any apparent wins.</aside>
    </section>`,

    `<section class="slide slide-light" data-background-color="#e9eee6">
      <div class="section-head"><div><p class="eyebrow">05 / ONE RANDOM WINDOW</p><h2>A concrete prediction.<br><em>Not the whole result.</em></h2></div></div>
      <div class="transfer-example-layout">
        <div class="transfer-example-meta"><span>AMPUTEE SUBJECT ${example.subject} · DB3 E1</span><b>${example.window_duration_ms} ms EMG window</b><small>Common-rate sample ${Number(example.common_rate_sample_start).toLocaleString()}</small></div>
        <div class="transfer-example-pair">
          <div><small>RECORDED ACTION</small><b>${example.actual_action}</b><span>label ${example.actual_action_id}</span></div>
          <i>${example.correct ? "=" : "≠"}</i>
          <div class="${example.correct ? "example-match" : "example-miss"}"><small>MODEL PREDICTION</small><b>${example.predicted_action}</b><span>label ${example.predicted_action_id} · ${percent(example.confidence * 100)} confidence · ${exampleState}</span></div>
        </div>
        <p>This seeded random active-action window makes the task tangible. The aggregate test metrics, not this single example, determine whether transfer is useful.</p>
      </div>
      ${footer(6, "1:00", "A SAMPLE, NOT A DEMO CLAIM")}
      <aside class="notes">Here is one reproducibly selected active-action window from a held-out Amputee recording. The experiment artifact reports its actual DB3 label, predicted group-B action and calibrated confidence. A single correct or incorrect example is not representative evidence. The model has no access to this user's labels during training or calibration. Confidence is a probability estimate under the Intact validation distribution, not a safety guarantee under Amputee domain shift.</aside>
    </section>`,

    `<section class="slide slide-ink" data-background-color="#10191d">
      <div class="section-head"><div><p class="eyebrow">06 / PEOPLE, NOT WINDOWS</p><h2>Transfer may vary<br><em>from one person to another.</em></h2></div></div>
      <div class="generalization-layout">
        <div class="generalization-figure">${image("amputee_subject_transfer", "Active-action macro F1 by held-out Amputee participant")}</div>
        <div class="generalization-copy">
          <div class="two-results"><div><small>ALL AMPUTEE WINDOWS</small><b>${percent(transfer.activeMacroF1Percent)}</b><span>active-action macro F1</span></div><div><small>MIDDLE PARTICIPANT</small><b>${percent(medianSubjectF1)}</b><span>median subject-level macro F1</span></div></div>
          <p>Subject-level scores make population spread visible. A model that works for some participants and fails for others still needs adaptation and a larger validation cohort.</p>
          <p class="boundary-note"><strong>Design implication:</strong> report each participant and action; do not let thousands of overlapping windows masquerade as thousands of independent users.</p>
        </div>
      </div>
      ${footer(7, "1:00", "GENERALIZATION")}
      <aside class="notes">This plot changes the statistical lens. Although there may be many windows, they are overlapping segments from only 11 Amputee participants. Windows are not independent people. The participant-level macro F1 distribution shows whether transfer is consistent or concentrated in a few users. A useful follow-up would prespecify participant-specific calibration on a small, separate calibration session and evaluate on later repetitions, with the participant as the unit of analysis.</aside>
    </section>`,

    `<section class="slide slide-light" data-background-color="#e9eee6">
      <div class="section-head"><div><p class="eyebrow">07 / WHAT THIS MEANS FOR PROSTHETIC RESEARCH</p><h2>A gate for the next study,<br><em>not a command source.</em></h2></div></div>
      <div class="readiness-flow">
        <div class="ready-stage"><span>01</span><b>Align</b><small>Restore raw DB1 MAT data; verify action mapping and signal provenance</small></div>
        <i></i><div class="ready-stage"><span>02</span><b>Measure transfer</b><small>More held-out users, per-action and subject-level uncertainty</small></div>
        <i></i><div class="ready-stage ready-stop"><span>03</span><b>Personalize offline</b><small>Prespecified calibration session; later repetitions stay locked</small></div>
        <i></i><div class="ready-stage"><span>04</span><b>Then test hardware</b><small>Real-time latency, fail-safe behavior, supervised usability</small></div>
      </div>
      <div class="closing-line"><strong>Current boundary:</strong> the model predicts dataset action labels from EMG; it has not demonstrated reliable prosthetic actuation or patient benefit.</div>
      ${footer(8, "1:00", "RESEARCH IMPLICATION")}
      <aside class="notes">The practical use of this result is to define the next experiment, not to drive a device. First recover the Intact raw MAT files and preserve signal precision. Then measure zero-shot transfer across more people with confidence intervals at participant level. If zero-shot transfer is weak, test user-specific calibration with held-out repetitions. Only after offline performance is stable should researchers test real-time causal filtering, end-to-end delay, human-in-the-loop safety and supervised hardware operation. No clinical efficacy is implied.</aside>
    </section>`,

    `<section class="slide slide-close" data-background-color="#10191d">
      <div class="section-head"><div><p class="eyebrow">08 / TAKEAWAY</p><h2>Cross-cohort recognition<br><em>is the right question.</em></h2></div></div>
      <div class="transfer-takeaway-grid">
        <div><span>WE TESTED</span><b>Intact DB1 E2 → Amputee DB3 E1</b><small>Shared B actions · participant-held-out external test</small></div>
        <div><span>WE LEARNED</span><b>${percent(transfer.activeMacroF1Percent)} active-action macro F1</b><small>${percent(transfer.activeActionAccuracyPercent)} active-window accuracy · ${transfer.targetSubjects} Amputee users</small></div>
        <div class="takeaway-limit"><span>WE DID NOT TEST</span><b>Prosthetic control</b><small>No device actuation, real-time safety, clinical outcome or functional benefit</small></div>
      </div>
      <p class="source-note">DB1 Intact source uses converter-generated XLSX because original MAT files are absent; values are rounded. DB1 100 Hz and DB3 2 kHz are reported dataset rates. Electrode layouts differ.</p>
      <div class="closing-meta"><span>9 MIN · 9 SLIDES</span><span>EXP-004 · BOTH-COHORT TRANSFER</span><span>Questions</span></div>
      ${footer(9, "0:50", "CONCLUSION")}
      <aside class="notes">Close on two points. First, the revised experiment answers the user's transfer question more directly than an Amputee-only baseline. Second, a named action prediction is not automatically a usable prosthetic command. The available Intact Excel exports lose numeric precision, so this run is exploratory until the raw DB1 files are restored and the result reproduced. The next threshold is reliable subject-level offline transfer, followed by controlled calibration and hardware safety studies. Thank you; questions.</aside>
    </section>`,
  ];
}
