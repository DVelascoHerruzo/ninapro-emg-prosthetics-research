# DESIGN.md — Ninapro EMG → AI HTML Slideshow

## 1. Purpose

This document is the design specification for the project's **HTML slideshow**.

It is **not the slideshow itself**.

An AI coding agent should use this document to build the final presentation when the project has enough experimental results, plots, model outputs, and conclusions.

The presentation should communicate:

> **How can patterns in multi-channel EMG reveal and predict human hand movement, and what does the model actually learn?**

The presentation is a research/technical presentation, not a product landing page and not a generic AI pitch.

The visual language should make the audience feel that they are moving through a signal:

```text
Human hand
    ↓
Muscle activation
    ↓
EMG signal
    ↓
Temporal patterns
    ↓
Machine learning
    ↓
Predicted movement
    ↓
What the model learned
```

---

# 2. Primary Audience

Assume a mixed audience:

- technical students/researchers
- ML/AI practitioners
- biomedical/EMG audience
- clinicians or healthcare-adjacent audience
- instructors evaluating the project

The audience should be able to understand the core idea without knowing PyTorch.

Technical details should appear when they explain an important design choice, not merely to demonstrate implementation skill.

---

# 3. Presentation Technology

## Required stack

Use:

- **HTML**
- **reveal.js** for presentation/navigation
- **Tailwind CSS** for styling
- modern JavaScript / ES modules
- SVG for custom diagrams
- Canvas/SVG/D3-style visualizations where interactive plots are useful

The recommended architecture is:

```text
Vite
  │
  ├── reveal.js
  │
  ├── Tailwind CSS
  │
  ├── JavaScript / TypeScript
  │
  └── assets/
       ├── figures/
       ├── diagrams/
       └── icons/
```

reveal.js is deliberately preferred because the presentation is intended to be a real web-native slideshow. It supports HTML slides, nested slides, fragments, Auto-Animate, speaker notes, syntax highlighting, touch interaction, and PDF export. Official documentation: https://revealjs.com/ citeturn0search0turn0search2

Tailwind CSS should be used as the design system rather than writing a large collection of one-off CSS rules. Tailwind's current v4 workflow is designed for modern browsers and integrates with Vite. Official documentation: https://tailwindcss.com/docs/installation/framework-guides citeturn0search3turn0search6

Do not use the Tailwind Play CDN for the final presentation. It is intended for development rather than production. citeturn0search10

---

# 4. Core Design Concept

## "From Signal to Movement"

The presentation should have a visual identity based on **biological signals becoming structured information**.

The visual progression should be:

### Opening

Organic / biological:

```text
hand → muscle → electrical activity
```

### Middle

Scientific / analytical:

```text
waveforms → windows → features → representations
```

### Model

Computational:

```text
EMG → neural network → latent representation → prediction
```

### Results

Evidence-focused:

```text
prediction ↔ ground truth
confusion ↔ error
subject ↔ generalization
```

### Ending

Interpretive:

```text
What patterns did the AI discover?
What can we actually conclude?
What remains uncertain?
```

---

# 5. Visual Direction

## Overall aesthetic

Use:

- dark scientific interface
- high contrast
- restrained color palette
- subtle gradients
- thin grid lines
- waveform-inspired decorative elements
- glass/transparent cards sparingly
- generous whitespace
- large typography
- strong data visualization

Avoid:

- generic corporate blue templates
- excessive rounded cards
- stock photos of robots
- cliché glowing-brain graphics
- excessive neon
- random 3D AI imagery
- dense walls of text
- PowerPoint-style bullet lists
- decorative elements that do not communicate information

The deck should look closer to:

```text
scientific visualization
+
modern AI lab
+
premium technical dashboard
```

than:

```text
business presentation
```

---

# 6. Color System

Use CSS variables so the entire presentation can be recolored consistently.

Suggested palette:

```css
:root {
  --bg: #070b12;
  --bg-soft: #0d1320;
  --surface: #111927;
  --surface-elevated: #172235;

  --text: #f4f7fb;
  --text-muted: #9aa8ba;
  --text-dim: #66758a;

  --signal: #38d9ff;
  --signal-soft: #38d9ff33;

  --model: #9b8cff;
  --model-soft: #9b8cff33;

  --movement: #65e6a8;
  --movement-soft: #65e6a833;

  --warning: #ffbd66;
  --error: #ff6b7a;

  --grid: #ffffff0d;
}
```

These are starting tokens, not mandatory literal values.

### Semantic color rule

Colors should communicate meaning.

```text
cyan       = EMG / signal
purple     = AI / model
green      = movement / successful prediction
orange     = uncertainty / caution
red        = error / failure
white      = primary evidence
gray       = context
```

Do not use colors merely for decoration.

---

# 7. Typography

Use a modern sans-serif for primary typography.

Preferred:

```text
Inter
IBM Plex Sans
Manrope
```

For technical numbers or code:

```text
IBM Plex Mono
JetBrains Mono
```

Hierarchy:

```text
TITLE
64–96px

SECTION TITLE
44–64px

BODY
22–30px

CAPTION
15–18px

DATA LABEL
14–18px
```

The exact sizes should adapt to the reveal.js viewport.

Do not shrink text below readability simply to fit more information.

---

# 8. Slide Composition

Every slide should have one dominant idea.

Preferred composition:

```text
┌─────────────────────────────────────────────┐
│ small section label                         │
│                                             │
│ BIG STATEMENT                               │
│                                             │
│        visual / graph / diagram             │
│                                             │
│ short interpretation                        │
└─────────────────────────────────────────────┘
```

Avoid:

```text
title
paragraph
paragraph
paragraph
table
three charts
footer
```

on one slide.

---

# 9. Presentation Length

Target:

```text
12–16 primary slides
```

Optional vertical reveal.js slides can contain deeper technical material.

A good structure is:

```text
01  Hook
02  Problem
03  Dataset
04  Signal
05  From signal to training data
06  Experimental design
07  Baseline
08  Neural model
09  Results
10  Generalization
11  Error analysis
12  What the model learned
13  Responsible AI / limitations
14  Key findings
15  Next steps
```

If the actual project requires the course's nine analytical steps, map them onto this narrative rather than making nine visually repetitive slides.

---

# 10. Slide-by-Slide Design Specification

## Slide 01 — Title / Hook

### Goal

Immediately communicate the research question.

### Visual

Large animated EMG waveform flowing across the screen.

The waveform should visually transform into a hand-movement label.

Example:

```text
EMG SIGNAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        ↓

      [ AI ]

        ↓

HAND MOVEMENT
```

### Text

Minimal.

Suggested:

```text
Decoding Hand Movement from Muscle Signals

Learning movement patterns from EMG with AI
```

Add:

```text
Ninapro • EMG • Deep Learning
```

Do not start with methodology.

---

# 11. Slide 02 — Why EMG?

Use a simple causal-looking **process diagram**, while avoiding claims of causality.

```text
HAND MOVEMENT
      ↓
MUSCLE ACTIVATION
      ↓
ELECTRICAL ACTIVITY
      ↓
EMG
      ↓
DIGITAL SIGNAL
```

Animate each stage sequentially.

The audience should understand why EMG can contain information about movement before seeing a neural network.

---

# 12. Slide 03 — The Dataset

Show the Ninapro dataset as a visual data card.

Include only verified facts for the specific database/exercises actually used.

Ninapro describes itself as a publicly available multimodal database for machine-learning research involving human, robotic, and prosthetic hands. Its datasets include modalities such as EMG and kinematic measurements. citeturn0search8

Do not claim that the entire Ninapro collection has the same number of channels, subjects, or movements.

The exact dataset used by this project must be displayed.

Example:

```text
NINAPRO
──────────────

Subjects       XX
Exercises      XX
Movements      XX
EMG channels   XX
Kinematic      XX
Repetitions    XX
```

Animate the numbers into view.

---

# 13. Slide 04 — What One Recording Looks Like

This should be one of the most visually impressive slides.

Show:

```text
EMG
CH 01 ─╱╲╱╲╱╲────╱╲╱╲
CH 02 ───╱╲────╱╲────
CH 03 ─╲╱╲╱╲─────────
...
CH 10 ─────────╱╲╱╲─
```

Underneath:

```text
stimulus
───────────────██████████────

repetition
───────────1111111111111111──

movement
             GRASP
```

Use the actual project data where available.

The point is to visually demonstrate that the AI is not receiving a clean image.

It receives a multichannel temporal signal.

---

# 14. Slide 05 — From Continuous Signal to AI Input

Show the transformation:

```text
CONTINUOUS EMG
       ↓
FILTER
       ↓
WINDOW
       ↓
NORMALIZE
       ↓
TENSOR
       ↓
MODEL
```

Then show an actual tensor representation:

```text
(batch, channels, time)

(32, 10, 200)
```

if those dimensions are actually used.

Never invent tensor dimensions.

This is a good place to introduce PyTorch visually.

---

# 15. Slide 06 — Experimental Design

This slide should focus on **preventing leakage**.

Visual:

```text
SUBJECT 01 ─────────────── TRAIN
SUBJECT 02 ─────────────── TRAIN
SUBJECT 03 ─────────────── TRAIN

SUBJECT 04 ─────────────── VALIDATION

SUBJECT 05 ─────────────── TEST
```

Or use repetition-based grouping if that is the actual deployment experiment.

Headline:

```text
The split matters as much as the model.
```

Highlight:

```text
❌ random windows
✓ group-aware split
```

Explain visually why overlapping windows can otherwise make train/test samples nearly identical.

---

# 16. Slide 07 — Baseline Before Deep Learning

Show a simple model first:

```text
EMG
 ↓
FEATURES
 ↓
LOGISTIC REGRESSION / SVM
 ↓
MOVEMENT
```

Then:

```text
baseline
        vs
deep model
```

The baseline exists to answer:

> Does the neural network actually learn something beyond straightforward signal features?

Do not hide the baseline because the deep model looks more impressive.

---

# 17. Slide 08 — The Neural Model

Show the actual architecture.

Example:

```text
10 × T EMG
     │
     ▼
┌──────────┐
│ 1D CNN   │
└──────────┘
     │
     ▼
┌──────────┐
│ Temporal │
│ features │
└──────────┘
     │
     ▼
┌──────────┐
│ LSTM/GRU │
└──────────┘
     │
     ▼
  latent z
     │
     ▼
movement
```

Only show components actually used.

If the final model is a CNN, do not draw an LSTM merely because it looks sophisticated.

---

# 18. PyTorch Visual Language

PyTorch should be shown as the implementation layer, not the story.

Use small code fragments only when useful.

Example:

```python
class EMGModel(nn.Module):
    ...
```

The code should occupy no more than approximately 25% of the slide.

The visual focus should remain on:

```text
input → transformation → output
```

PyTorch's official documentation describes neural networks through `torch.nn`, `nn.Module`, training loops, datasets, and dataloaders; these concepts can be represented visually without dumping implementation details onto slides. citeturn0search13turn0search18

---

# 19. Slide 09 — Results

Do not show a giant table.

Use a primary visual:

```text
              ACTUAL

             A B C D E
PREDICTED A  █ ░ ░ ░ ░
          B  ░ █ ░ ░ ░
          C  ░ ░ █ ░ ░
          D  ░ ░ ░ █ ░
          E  ░ ░ ░ ░ █
```

Next to it:

```text
Macro F1
XX.X%

Balanced accuracy
XX.X%

Test subjects
X
```

Every metric must have its evaluation population and split defined somewhere in the deck.

---

# 20. Slide 10 — Generalization

Make this a major slide.

Compare:

```text
WITHIN SUBJECT

same people
new repetitions


CROSS SUBJECT

new people
```

Use paired visualizations rather than a ranking.

Example:

```text
Performance by subject

S01  ━━━━━━━━━━━
S02  ━━━━━━━━━
S03  ━━━━━━━
S04  ━━━━━━━━━━
...
```

The objective is to reveal variability.

Do not hide difficult subjects behind an aggregate average.

---

# 21. Slide 11 — What Did the Model Get Wrong?

Show the top confusion patterns.

Example:

```text
MOVEMENT A
     ↘
      MOVEMENT B

Why?

similar activation pattern
transition overlap
low signal amplitude
```

Use actual error-analysis findings.

Do not invent physiological explanations.

If an explanation is a hypothesis, label it:

```text
Possible explanation
```

not:

```text
The model fails because...
```

unless demonstrated.

---

# 22. Slide 12 — What Did the AI Learn?

This is the project's signature slide.

Use one or more:

- channel importance
- saliency
- activation maps
- latent-space visualization
- feature distributions
- frequency-domain patterns
- temporal attention

Suggested composition:

```text
             LATENT SPACE

       ● ● ●
     ● ● ● ●

                    ▲ ▲ ▲
                  ▲ ▲ ▲ ▲

    ■ ■ ■
  ■ ■ ■
```

Then show:

```text
What separates movements?

timing
amplitude
channel combinations
frequency structure
```

Only list factors supported by the actual analysis.

---

# 23. Slide 13 — Responsible AI / Limitations

Use a clean three-column structure:

```text
WHAT WE KNOW       WHAT WE DON'T KNOW       RISK
────────────       ────────────────         ────

model performance  clinical efficacy        overclaiming
within dataset     real-world robustness     distribution shift
signal patterns    biological causality      misinterpretation
```

This should not be a generic ethics slide.

Every limitation should connect to this specific experiment.

---

# 24. Slide 14 — The "So What?"

This is required by the project brief.

Large statement:

```text
So what did we actually learn?
```

Then 3–4 evidence-backed findings.

Example format:

```text
01
EMG contains enough temporal structure
to distinguish [documented movements].

02
Performance changes when the subject
is unseen.

03
The largest errors occur around
[documented failure condition].
```

Every statement must be supported by the project's results.

---

# 25. Slide 15 — Next Step

End with a research roadmap:

```text
TODAY
signal → movement classification

NEXT
signal → continuous kinematics

THEN
cross-subject representation learning

LATER
real-time inference
```

Do not imply that future stages have already been validated.

---

# 26. Motion Design

Motion should communicate structure.

Use:

- fade
- slide
- scale
- draw-on waveform
- progressive reveal
- Auto-Animate for transformations

Avoid:

- bouncing objects
- spinning logos
- excessive zoom
- constant movement

Recommended reveal.js features:

```text
Fragments
Auto-Animate
Slide transitions
Data-state
Speaker notes
```

reveal.js supports Auto-Animate and fragment-based progressive disclosure, which are particularly useful for showing signal transformations and model pipelines. citeturn0search0turn0search5

Use:

```text
transition: "fade"
```

as the default.

Use stronger transitions only for section boundaries.

---

# 27. Signal Animation

Create a reusable SVG waveform component.

Example conceptual behavior:

```text
────────────────────────────
     ╱╲      ╱╲
────╱──╲────╱──╲───────────
         ↓
```

The waveform should subtly animate horizontally.

Do not use high-frequency animation that becomes visually tiring.

The animation should be disabled/reduced when:

```css
@media (prefers-reduced-motion: reduce)
```

---

# 28. Data Visualization Rules

Use data visualizations instead of decorative charts.

Every chart must answer a question.

### Good

```text
How does performance vary by subject?
```

### Bad

```text
Here is a colorful chart of accuracy.
```

Prefer:

- direct labels
- minimal legends
- meaningful annotations
- consistent axes
- uncertainty intervals where available
- raw observations when useful

Do not use 3D charts.

Do not use pie charts for model performance.

Do not distort axes.

---

# 29. Tables

Tables should be used sparingly.

Use a table only when exact values need comparison.

Maximum:

```text
5–7 rows
4–5 columns
```

If a table becomes dense, replace it with a visualization.

---

# 30. Code

Code should be rare.

Rules:

- maximum ~8–12 lines
- syntax highlighted
- monospaced font
- annotate the important line
- never paste entire training scripts

Good:

```python
x = emg[:, start:end]
logits = model(x)
loss = criterion(logits, y)
```

Then visually explain:

```text
EMG window → model → movement prediction
```

---

# 31. Diagrams

Prefer diagrams built with HTML/SVG instead of exported screenshots.

Why:

- responsive
- crisp at any resolution
- easier to animate
- accessible
- editable

Use SVG for:

- EMG channels
- model architecture
- data pipeline
- split strategy
- signal-to-movement flow

---

# 32. Icons

Use one consistent icon set.

Recommended:

```text
Lucide
```

Use icons as semantic accents, not decoration.

Examples:

```text
database
activity
brain
layers
target
alert-triangle
users
shield
```

Avoid mixing several icon families.

---

# 33. Layout Components

Create reusable presentation components.

Recommended:

```text
<TitleSlide />
<SectionSlide />
<MetricCard />
<SignalPlot />
<PipelineDiagram />
<ModelDiagram />
<ConfusionMatrix />
<InsightCard />
<WarningCard />
<Footer />
```

The exact implementation may use HTML components, template functions, or framework components.

Do not duplicate large blocks of markup.

---

# 34. Slide Design Tokens

Create a small design system.

Example:

```css
.slide {
  --radius: 18px;
  --border: 1px solid rgba(255,255,255,.08);
  --shadow: 0 20px 60px rgba(0,0,0,.25);
}

.eyebrow {
  ...
}

.display {
  ...
}

.muted {
  ...
}

.metric {
  ...
}

.signal {
  ...
}
```

Do not scatter arbitrary values across the presentation.

---

# 35. Background System

Use mostly dark backgrounds.

Possible visual texture:

```text
very subtle grid
+
very subtle radial gradient
+
occasional waveform
```

Example:

```text
background:
  radial-gradient(...)
  linear-gradient(...)
```

Keep background decoration below approximately 5–10% visual prominence.

---

# 36. Responsive Behavior

The presentation must work at:

```text
1920 × 1080
1440 × 900
1280 × 720
laptop viewport
```

Reveal.js is responsible for slide scaling.

Do not hard-code content to one monitor resolution.

Use:

```text
CSS clamp()
flex
grid
responsive sizing
```

Charts must remain readable when scaled.

---

# 37. Accessibility

Required:

- semantic headings
- alt text for meaningful images
- sufficient contrast
- keyboard navigation
- reduced-motion support
- no color-only meaning
- readable text sizes

If a chart uses:

```text
green = correct
red = error
```

also provide a label or pattern.

---

# 38. Navigation

Use reveal.js navigation.

Recommended:

```text
Arrow keys
Space
Esc overview
F fullscreen
S speaker notes
```

The presentation should also include a small progress indicator.

Do not add a large persistent navigation bar.

---

# 39. Speaker Notes

Every major slide should have speaker notes.

Notes should answer:

```text
What should I say?
What does this graph mean?
What caveat should I mention?
What question might the audience ask?
```

Notes should not simply repeat slide text.

---

# 40. Sources

The final deck should have a final references slide.

At minimum cite:

### Ninapro

Official database:

https://ninapro.hevs.ch/

Ninapro describes the project as a publicly available multimodal database supporting machine-learning research involving human, robotic, and prosthetic hands. citeturn0search8

### Dataset-specific documentation

Use the exact Ninapro database page corresponding to the dataset actually analyzed.

For example, DB5 documentation describes sEMG and kinematic data from intact subjects performing hand movements and directs users to the associated publication. citeturn0search12

Do not cite DB5 if the project is actually using another database.

### PyTorch

Use the official PyTorch documentation:

https://pytorch.org/docs/

and tutorials:

https://docs.pytorch.org/tutorials/

The official tutorials document `torch.nn`, `nn.Module`, datasets, dataloaders, and standard neural-network training workflows. citeturn0search13turn0search18

### reveal.js

Official:

https://revealjs.com/

The official documentation covers presentation markup, initialization, configuration, fragments, Auto-Animate, speaker view, code highlighting, and PDF export. citeturn0search0turn0search1

### Tailwind CSS

Official:

https://tailwindcss.com/

Use the version appropriate to the implementation environment. Tailwind v4 is designed for modern browsers and has a Vite integration path. citeturn0search3turn0search6

---

# 41. Scientific Source Policy

The deck must distinguish between:

```text
DATASET FACT
MODEL RESULT
INTERPRETATION
HYPOTHESIS
LIMITATION
```

Use small labels when useful:

```text
DATA
RESULT
INTERPRETATION
LIMITATION
```

Do not present hypotheses as measured facts.

---

# 42. Claims Policy

Every quantitative claim should be traceable to:

```text
experiment ID
dataset split
metric
source figure/table
```

Example:

```text
Macro F1 = 84.2%
```

must have enough context to know:

```text
84.2% on what?
subjects?
exercise?
split?
model?
test set?
```

Avoid standalone percentages.

---

# 43. Avoiding "AI Hype"

Do not use phrases such as:

```text
AI understands the human hand
AI reads your muscles
revolutionary
mind-reading
human-level
perfect
```

unless a specific source and evidence genuinely support such a statement.

Prefer:

```text
The model predicts...
The representation separates...
The experiment suggests...
The signal contains information about...
Performance decreased under...
```

---

# 44. Evidence Hierarchy

When deciding what to show, prioritize:

```text
1. Actual project results
2. Actual dataset observations
3. Experimental methodology
4. Established dataset facts
5. External scientific context
6. Decorative content
```

Never let stock imagery replace evidence.

---

# 45. Presentation Narrative

The complete presentation should feel like one continuous argument:

```text
WE HAVE A SIGNAL
      ↓
THE SIGNAL CONTAINS STRUCTURE
      ↓
WE CAN TURN THAT STRUCTURE INTO TRAINING EXAMPLES
      ↓
A MODEL CAN LEARN FROM IT
      ↓
BUT THE SPLIT DETERMINES WHAT "LEARN" MEANS
      ↓
THE MODEL MAKES PREDICTIONS
      ↓
THE ERRORS REVEAL LIMITATIONS
      ↓
THE REPRESENTATION REVEALS PATTERNS
      ↓
THEREFORE WE CAN SAY...
```

The final "therefore" must be based on actual results.

---

# 46. Required Final Slide

The final slide should not be:

```text
Thank you
Questions?
```

Instead:

```text
FROM MUSCLE SIGNAL
TO MOVEMENT PATTERN

[one-sentence evidence-backed conclusion]

Thank you.
Questions?
```

The one-sentence conclusion must be generated from the completed experiment.

Do not write it in advance if the final results are not known.

---

# 47. Implementation Requirements for the Coding Agent

When implementing the slideshow:

1. Read `AGENTS.md`.
2. Read `PROJECT.md`.
3. Inspect the actual experiment outputs before writing result slides.
4. Never invent metrics.
5. Never invent dataset characteristics.
6. Never invent model architecture.
7. Never fabricate a conclusion.
8. Reuse actual project figures where possible.
9. Recreate simple diagrams as SVG/HTML when practical.
10. Keep data visualization code separate from slide markup.
11. Make the deck runnable locally.
12. Include a build/start command in the presentation README if needed.
13. Verify the deck at 16:9.
14. Check every slide for overflow.
15. Check keyboard navigation.
16. Check reduced-motion behavior.
17. Check contrast.
18. Check speaker notes.
19. Check that all sources are present.
20. Open the actual HTML presentation in a browser before considering it complete.

---

# 48. Suggested Presentation Project Structure

```text
presentation/
├── DESIGN.md
├── README.md
├── package.json
├── index.html
├── src/
│   ├── main.js
│   ├── deck.js
│   ├── theme.css
│   ├── components/
│   │   ├── SignalPlot.js
│   │   ├── MetricCard.js
│   │   ├── ModelDiagram.js
│   │   └── ConfusionMatrix.js
│   ├── slides/
│   │   ├── 01-title.html
│   │   ├── 02-problem.html
│   │   ├── 03-dataset.html
│   │   ├── 04-signal.html
│   │   ├── 05-pipeline.html
│   │   ├── 06-experiment.html
│   │   ├── 07-baseline.html
│   │   ├── 08-model.html
│   │   ├── 09-results.html
│   │   ├── 10-generalization.html
│   │   ├── 11-errors.html
│   │   ├── 12-patterns.html
│   │   ├── 13-responsible-ai.html
│   │   ├── 14-so-what.html
│   │   └── 15-next.html
│   └── data/
│       └── results.json
├── public/
│   ├── figures/
│   └── assets/
└── dist/
```

If the implementation uses a component framework, preserve the same conceptual separation.

---

# 49. Data → Presentation Contract

The slideshow should consume a structured results object rather than hard-coding experiment values throughout the HTML.

Example:

```json
{
  "dataset": {
    "name": "Ninapro",
    "database": "DBx",
    "subjects": 0,
    "emg_channels": 0,
    "kinematic_channels": 0
  },
  "experiment": {
    "task": "classification",
    "split": "subject_grouped",
    "seed": 42
  },
  "results": {
    "baseline": {},
    "model": {},
    "per_subject": {},
    "confusion_matrix": []
  },
  "insights": [],
  "limitations": []
}
```

Zeros/placeholders should be replaced only with verified values.

This makes it possible to regenerate the presentation when experiments change.

---

# 50. Quality Gate

Before the presentation is considered finished, verify:

## Narrative

- [ ] The research question is clear in the first 30 seconds.
- [ ] The audience understands the EMG signal before seeing the model.
- [ ] The experimental split is obvious.
- [ ] Baseline and deep model are both explained.
- [ ] Results are tied to the research question.
- [ ] Errors are shown.
- [ ] Model patterns are interpreted carefully.
- [ ] Limitations are explicit.
- [ ] The "So What?" is clear.

## Scientific integrity

- [ ] No invented values.
- [ ] No unsupported physiological claims.
- [ ] No leakage hidden by presentation design.
- [ ] No test-set tuning presented as validation.
- [ ] Dataset facts are sourced.
- [ ] Quantitative results identify their population/split.
- [ ] Future work is clearly labeled as future work.

## Design

- [ ] 16:9 layout.
- [ ] Consistent typography.
- [ ] Consistent semantic colors.
- [ ] No overflowing elements.
- [ ] No unreadable charts.
- [ ] No giant paragraphs.
- [ ] Minimal bullet lists.
- [ ] Animation is purposeful.
- [ ] Reduced motion works.
- [ ] Keyboard navigation works.
- [ ] Speaker notes exist.

## Technical

- [ ] `npm run dev` or equivalent works.
- [ ] Production build works.
- [ ] No console errors.
- [ ] Assets resolve.
- [ ] Charts render.
- [ ] Presentation opens from a clean install.
- [ ] PDF export is usable if required.

---

# 51. Design Philosophy

The final deck should make the audience think:

```text
"I can see the signal."

"I understand what the model receives."

"I understand how the experiment tests generalization."

"I can see where the model succeeds."

"I can see where it fails."

"I understand what patterns the model found."

"I understand what we still cannot conclude."
```

The presentation succeeds when the AI model becomes the **middle of the story**, rather than the entire story.

The subject is not:

> "Look at the neural network we built."

The subject is:

> **"What can EMG actually tell us about hand movement, and what evidence do we have that our model has learned a meaningful pattern?"**
