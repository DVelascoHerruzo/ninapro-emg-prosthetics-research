export function buildRaiSlides(rai) {
  const footer = (number, time, tag) => `
    <div class="slide-footer"><span>${tag}</span><span>${time} min</span><span>${String(number).padStart(2, "0")} / 14</span></div>`;
  const notes = (text) => `<aside class="notes">${text}</aside>`;
  const hasNumbers = rai.overallTest && rai.overallTest.accuracyPercent !== null;
  const percentOrDash = (value) => (value === null || value === undefined ? "—" : `${Number(value).toFixed(1)}%`);
  const mitigationItems = (rai.mitigations || []).map((item) => `<li>${item}</li>`).join("");
  const topFeatureItems = (rai.topFeatures || [])
    .map((item) => `<li><b>${item.name}</b> <span>${item.value}</span></li>`)
    .join("") || "<li>Run notebooks/03_responsible_ai_dashboard.ipynb to populate this list.</li>";

  return [
    `<section class="slide slide-ink" data-background-color="#10191d">
      <div class="section-head"><p class="eyebrow">RESPONSIBLE AI TOOLKIT</p><h2>Is the prosthetic gate<br><em>fair, safe, and stable?</em></h2></div>
      <div class="measurement-grid">
        <div class="measurement-copy">
          <p class="lead">${rai.cohort}. Built with <code>RAIInsights</code> and explored with <code>ResponsibleAIDashboard</code>: data analysis, model overview &amp; fairness, error analysis, feature importance, counterfactuals, and causal analysis.</p>
          <div class="hero-stats">
            <div><b>${percentOrDash(rai.overallTest && rai.overallTest.accuracyPercent)}</b><span>overall held-out accuracy</span></div>
            <div><b>${percentOrDash(rai.overallTest && rai.overallTest.balancedAccuracyPercent)}</b><span>overall balanced accuracy</span></div>
            <div><b>${percentOrDash(rai.worstSubject && rai.worstSubject.balancedAccuracyPercent)}</b><span>worst-subject balanced accuracy</span></div>
          </div>
          ${hasNumbers ? "" : '<p class="boundary-note"><strong>Numbers pending:</strong> run notebooks/03_responsible_ai_dashboard.ipynb and copy results/metrics/EXP-007-rai-insights-movement-detection_summary.json into presentation/src/rai-summary.json.</p>'}
        </div>
        <div class="transfer-taxonomy">
          <div class="transfer-taxonomy-head"><span>TOP FEATURE IMPORTANCE</span></div>
          <ul>${topFeatureItems}</ul>
        </div>
      </div>
      ${footer(13, "0:50", "RESPONSIBLE AI")}
      ${notes("This slide summarizes the RAI Toolbox notebook. Per-subject cohorts expose whether the movement-vs-rest gate is equally reliable across held-out prosthetic users. If a specific subject's balanced accuracy is far below the rest, that is the fairness-relevant finding to lead with.")}
    </section>`,

    `<section class="slide slide-light" data-background-color="#e9eee6">
      <div class="section-head"><p class="eyebrow">RESPONSIBLE AI · MITIGATIONS</p><h2>Concrete, testable<br><em>next steps.</em></h2></div>
      <div class="measurement-copy">
        <p class="lead">Draft mitigations from the error-analysis, feature-importance, counterfactual, and causal views, to validate before any hardware deployment:</p>
        <ul class="mitigation-list">${mitigationItems}</ul>
        <p class="boundary-note">This remains an offline research analysis of a binary movement-vs-rest simplification. It is not a validated, safety-certified prosthetic controller.</p>
      </div>
      ${footer(14, "0:40", "RESPONSIBLE AI")}
      ${notes("Close the RAI section with what an engineering/clinical team should do next, not just what the dashboard showed. Each mitigation should map back to one of the five RAI views discussed on the previous slide.")}
    </section>`,
  ];
}
