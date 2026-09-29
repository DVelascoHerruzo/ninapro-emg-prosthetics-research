export function buildTwoPartSlides(study) {
  const percent = (value) => `${(Number(value) * 100).toFixed(1)}%`;
  const footer = (number, time, tag) => `
    <div class="slide-footer"><span>${tag}</span><span>${time} min</span><span>${String(number).padStart(2, "0")} / 09</span></div>`;
  const metric = (label, value, meaning) => `
    <div class="metric-line"><span class="metric-name">${label}</span><span class="metric-track"><i style="width:${Math.min(100, Number(value) * 100)}%"></i></span><strong>${percent(value)}</strong><small>${meaning}</small></div>`;
  const sourcePart1 = study.part1;
  const cnn = study.cnn;
  const part1 = cnn ? {
    ...sourcePart1,
    ...cnn.metrics,
    prediction_counts: cnn.predictionCounts,
    training_windows_after_class_cap: cnn.trainingWindows,
    windows: cnn.testWindows,
  } : sourcePart1;
  const part2 = study.part2;
  const part1Predictions = cnn ? 17 : Object.entries(part1.prediction_counts || {}).filter(([label]) => label !== "0").length;
  const comparisonBars = cnn ? `
    <div class="comparison-chart" aria-label="Window-level versus repetition-level active-action accuracy">
      <div class="comparison-chart-title">SAME MODEL · DIFFERENT DECISION UNIT</div>
      <div class="comparison-bar-row"><span>Window guesses</span><i><b style="width:${cnn.metrics.active_action_accuracy * 100}%"></b></i><strong>${percent(cnn.metrics.active_action_accuracy)}</strong></div>
      <div class="comparison-bar-row comparison-bar-repetition"><span>Whole repetitions</span><i><b style="width:${cnn.metrics.active_action_macro_f1 * 100}%"></b></i><strong>${percent(cnn.metrics.active_action_macro_f1)}</strong></div>
      <small>Combining all windows from one action repetition gives the final decision.</small>
    </div>` : "";
  const part2Predictions = Object.entries(part2.prediction_counts).filter(([label]) => label !== "0").length;

  return [
    `<section class="slide slide-hero" data-background-color="#10191d">
      <div class="hero-copy">
        <p class="eyebrow"><span class="signal-dot"></span> EMG ACTION STUDY · TWO QUESTIONS</p>
        <h1>First learn the Amputee signal.<br><em>Then test what transfers.</em></h1>
        <p class="hero-deck">We changed the experiment into two steps: recognize actions across Amputee users, then ask whether that learned action pattern works on Intact recordings.</p>
        <div class="hero-stats">
          <div><b>${percent(part1.active_action_accuracy)}</b><span>Part 1 active-action accuracy</span></div>
          <div><b>${part1Predictions}</b><span>active actions the model attempted to name</span></div>
          <div><b>${percent(part2.active_action_accuracy)}</b><span>Part 2 active-action transfer accuracy</span></div>
        </div>
        <p class="hero-verdict">The signal contains useful variety. It is not yet consistent enough across people to call the action reliably.</p>
      </div>
      <div class="hero-signal"><div class="transfer-taxonomy"><div class="transfer-taxonomy-head"><span>THE ROADMAP</span><b>2 parts</b></div><p>1. Amputee → Amputee<br>2. Amputee → Intact</p><small>These answer different questions and should not be collapsed into one score.</small></div></div>
      ${footer(1, "0:55", "THE NEW QUESTION")}
      <aside class="notes">The previous result was pointing in the wrong direction because it mixed two questions. We now separate them. First, can a model learn actions from Amputee signals and recognize those actions for another Amputee person? Second, if it can, does that action information transfer to Intact recordings? The new result is encouraging in one narrow way: the model no longer predicts only Rest. But the next number tells us how much that variety means.</aside>
    </section>`,

    `<section class="slide slide-light" data-background-color="#e9eee6">
      <div class="section-head"><div><p class="eyebrow">01 / PART 1</p><h2>Can one Amputee signal<br><em>teach another?</em></h2></div></div>
      <div class="protocol-layout">
        <div class="split-rail">
          <div class="split-block"><span>LEARN</span><b>6 Amputee subjects</b><small>Actions from their recorded EMG</small></div>
          <div class="split-block split-validation"><span>CHECK</span><b>2 Amputee subjects</b><small>Choose the representation</small></div>
          <div class="split-block split-test"><span>TEST</span><b>3 unseen Amputee subjects</b><small>Never used to fit the model</small></div>
        </div>
        <div class="protocol-detail"><div class="window-equation"><span>18</span><b>actions</b><span>200 ms</span><b>window</b><span>50 ms</span><b>stride</b></div><div class="window-funnel"><b>${part1.training_windows_after_class_cap.toLocaleString()}</b><span>balanced training windows</span><i></i><b>${part1.windows.toLocaleString()}</b><span>held-out test windows</span></div><p>Training is capped per action so Rest does not win simply because it appears more often.</p></div>
      </div>
      ${footer(2, "1:00", "PART 1 DESIGN")}
      <aside class="notes">Part 1 is a cleaner test of Amputee action recognition. We split by person before creating windows. Six people teach the model, two help choose the setup, and three new people are the test. We cap training windows per action so the model cannot win by seeing a mountain of Rest windows. The question is not whether the model can memorize one person's muscle pattern; it is whether action information survives a person change.</aside>
    </section>`,

    `<section class="slide slide-ink" data-background-color="#10191d">
      <div class="section-head"><div><p class="eyebrow">02 / PART 1 RESULT</p><h2>Variety is real.<br><em>Reliability is not there yet.</em></h2></div></div>
      <div class="scorecard-layout"><div class="scorecard-copy"><p class="lead">The model stopped saying only “Rest.” That is meaningful progress.</p>${metric("All-window accuracy", part1.accuracy, "Includes Rest and all actions")}${metric("Active-action accuracy", part1.active_action_accuracy, "Only windows where a movement is happening")}${metric("Active-action macro F1", part1.active_action_macro_f1, "Gives every action equal importance")}</div><div class="scorecard-visual"><div class="scorecard-callout"><b>${part1Predictions}</b><span>active actions appeared in the model's predictions. The model is seeing more than one category.</span></div>${comparisonBars}<p>Variety means the model is attempting the task; accuracy tells us whether the attempts are dependable.</p></div></div>
      ${footer(3, "1:10", "PART 1 MEANING")}
      <aside class="notes">This is the result to celebrate carefully. The model now produces a variety of action labels instead of collapsing everything into Rest. That means the normalization and balanced training changes exposed more structure. But variety is not accuracy. On an unseen Amputee person, active-action accuracy is only 3.6 percent and active macro F1 is 3.7 percent. In plain language: it is making many kinds of guesses, but most are still wrong. We are on the road, but we need to improve the map.</aside>
    </section>`,

    `<section class="slide slide-light" data-background-color="#e9eee6">
      <div class="section-head"><div><p class="eyebrow">03 / WHAT PART 1 TELLS US</p><h2>It learned a pattern,<br><em>but whose pattern?</em></h2></div></div>
      <div class="generalization-layout"><div class="generalization-copy"><div class="two-results"><div><small>MODEL OUTPUTS</small><b>${part1Predictions} actions</b><span>not just Rest</span></div><div><small>RIGHT ACTIVE ANSWERS</small><b>${percent(part1.active_action_accuracy)}</b><span>on unseen Amputee people</span></div></div><p>Part 1 says the EMG carries action-related information, but much of what the model learned may belong to the people or recording setup rather than the action itself.</p><p class="boundary-note"><strong>Next move:</strong> improve within-Amputee action recognition before asking the model to cross into another cohort.</p></div><div class="transfer-taxonomy"><div class="transfer-taxonomy-head"><span>PLAIN-LANGUAGE READING</span><b>Promising, not solved</b></div><p>“I can tell these signals are different.”</p><small>That is weaker than “I know which action this person is doing.”</small></div></div>
      ${footer(4, "1:00", "INTERPRETATION")}
      <aside class="notes">This is the distinction between a signal changing and a signal carrying a reliable action meaning. The model produces different labels, so it is responding to differences in the signal. But on new people, the correct action rate is low. That suggests it may be learning individual recording characteristics, electrode placement, amplitude patterns or other user-specific details. Part 1 is therefore the gate: improve this before claiming a shared action representation.</aside>
    </section>`,

    `<section class="slide slide-ink" data-background-color="#10191d">
      <div class="section-head"><div><p class="eyebrow">04 / PART 2</p><h2>Can an Amputee-trained model<br><em>recognize Intact actions?</em></h2></div></div>
      <div class="readiness-flow"><div class="ready-stage"><span>01</span><b>Teach</b><small>Amputee subjects provide action examples</small></div><i></i><div class="ready-stage"><span>02</span><b>Hold out</b><small>Intact test subjects stay separate</small></div><i></i><div class="ready-stage ready-stop"><span>03</span><b>Transfer</b><small>Test the same action names on Intact recordings</small></div><i></i><div class="ready-stage"><span>04</span><b>Interpret</b><small>Weak transfer means the signal language is not shared yet</small></div></div><div class="closing-line"><strong>Important boundary:</strong> this tests recognition across cohorts. It does not generate or reconstruct a synthetic Intact EMG signal.</div>
      ${footer(5, "1:00", "PART 2 DESIGN")}
      <aside class="notes">Part 2 is the transfer question the project ultimately cares about. We train on Amputee action recordings, then present Intact recordings with the same action vocabulary. We call this transfer, not simulation. A classifier can say which class it believes a signal belongs to; it cannot by itself create a believable signal from another body. A signal-to-signal generative model would be a separate project with separate validation.</aside>
    </section>`,

    `<section class="slide slide-light" data-background-color="#e9eee6">
      <div class="section-head"><div><p class="eyebrow">05 / PART 2 RESULT</p><h2>The action pattern<br><em>does not travel yet.</em></h2></div></div>
      <div class="scorecard-layout"><div class="scorecard-copy"><p class="lead">The model learned from Amputee users, then faced Intact recordings.</p>${metric("All-window accuracy", part2.accuracy, "Rest-heavy score is not enough")}${metric("Active-action accuracy", part2.active_action_accuracy, "Correct movement names on active windows")}${metric("Active-action macro F1", part2.active_action_macro_f1, "Equal weight for each action")}</div><div class="scorecard-visual"><div class="scorecard-callout"><b>Weak</b><span>Only ${Object.keys(part2.prediction_counts).length} output labels appeared on the Intact test, and active-action accuracy was ${percent(part2.active_action_accuracy)}.</span></div><p>Part 2 does not say Amputee EMG is useless. It says the current representation is not shared reliably with Intact recordings.</p></div></div>
      ${footer(6, "1:05", "PART 2 MEANING")}
      <aside class="notes">The second result is a domain-transfer failure. The model can make some non-Rest predictions on Intact recordings, but almost none are correct active actions. This is exactly why the two-part design matters. Part 1 asks whether actions can be decoded within the Amputee population. Part 2 asks whether that action language survives a change in cohort and sensor system. At present, the answer to the second question is no.</aside>
    </section>`,

    `<section class="slide slide-ink" data-background-color="#10191d">
      <div class="section-head"><div><p class="eyebrow">06 / THE ROAD AHEAD</p><h2>Improve the action decoder<br><em>before translating between bodies.</em></h2></div></div>
      <div class="readiness-flow"><div class="ready-stage"><span>01</span><b>Part 1 baseline</b><small>Amputee → unseen Amputee</small></div><i></i><div class="ready-stage ready-stop"><span>02</span><b>Raise reliability</b><small>Better labels, temporal context, per-user calibration</small></div><i></i><div class="ready-stage"><span>03</span><b>Part 2 transfer</b><small>Amputee → Intact with matched protocol</small></div><i></i><div class="ready-stage"><span>04</span><b>Only then model signals</b><small>Generative signal translation, if justified</small></div></div><div class="closing-line"><strong>Meaning:</strong> do not use Part 2 to hide a weak Part 1. A translation layer cannot rescue an action decoder that is not reliable first.</div>
      ${footer(7, "1:00", "NEXT EXPERIMENT")}
      <aside class="notes">The order matters. First improve the Amputee-to-Amputee action decoder. Candidate work includes better temporal features, explicitly balanced actions, more repetitions and a calibration protocol. Once Part 1 is reliable, test transfer to Intact using matched labels and documented sensor differences. Only if there is evidence of a shared action structure should we consider a generative model that translates one cohort's signals into another's style.</aside>
    </section>`,

    `<section class="slide slide-light" data-background-color="#e9eee6">
      <div class="section-head"><div><p class="eyebrow">07 / WHAT THE RESULTS MEAN</p><h2>We found the beginning<br><em>of a usable research path.</em></h2></div></div>
      <div class="transfer-takeaway-grid"><div><span>WE KNOW</span><b>EMG varies by action</b><small>The model can produce a range of action guesses.</small></div><div><span>WE DO NOT KNOW</span><b>Whether actions generalize</b><small>New people and a new cohort still change the signal too much.</small></div><div class="takeaway-limit"><span>WE SHOULD NOT CLAIM</span><b>Prosthetic control</b><small>No real-time device, safety test or clinical outcome was evaluated.</small></div></div>
      ${footer(8, "1:00", "PLAIN LANGUAGE")}
      <aside class="notes">Here is the plain-language conclusion. We are no longer seeing a completely flat Rest-only system. That is the beginning of a useful research path. But the model is not yet dependable across people, and it does not transfer from Amputee to Intact. The next improvements should target repeatable action information, not presentation polish or bigger headline numbers.</aside>
    </section>`,

    `<section class="slide slide-close" data-background-color="#10191d">
      <div class="section-head"><div><p class="eyebrow">08 / TAKEAWAY</p><h2>Part 1 first.<br><em>Part 2 next.</em></h2></div></div>
      <div class="transfer-takeaway-grid"><div><span>PART 1</span><b>Amputee → Amputee</b><small>${percent(part1.active_action_accuracy)} active-action accuracy on unseen Amputee users. Variety is present; reliability needs work.</small></div><div><span>PART 2</span><b>Amputee → Intact</b><small>${percent(part2.active_action_accuracy)} active-action accuracy. The learned pattern does not transfer yet.</small></div><div class="takeaway-limit"><span>NEXT</span><b>Build the bridge</b><small>Improve Part 1, then test Part 2 again with matched protocols and better temporal modeling.</small></div></div>
      <p class="source-note">Offline Ninapro action-label research. Part 2 is transfer recognition, not synthetic signal reconstruction. Intact source currently uses converter-generated XLSX because original MAT files are absent.</p>
      <div class="closing-meta"><span>9 MIN · 9 SLIDES</span><span>EXP-005 · TWO-PART STUDY</span><span>Questions</span></div>
      ${footer(9, "0:50", "CONCLUSION")}
      <aside class="notes">Close with the sequence. Part 1 is the immediate target: make action recognition work across Amputee users. Part 2 is the bridge: see whether that action representation transfers to Intact recordings. The current result is not failure; it is a map of where the difficulty lives. We have moved from Rest-only behavior to real output variety. Now we need to turn variety into reliable action recognition.</aside>
    </section>`,
  ];
}
