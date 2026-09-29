# Ninapro EMG Movement Analysis

## Purpose

This project studies whether temporal patterns in multi-channel surface electromyography (sEMG) predict recorded hand-movement labels. It uses Ninapro-style MATLAB recordings in `Database/` and starts with a reproducible, interpretable feature-based baseline before any deep model.

**Research question:** What patterns in multi-channel EMG are predictive of hand-movement labels, and how reliably do they transfer to unseen repetitions or participants?

The intended use is research into movement recognition and, separately, EMG-to-kinematics prediction. This is not a diagnostic model, clinical decision system, or validated prosthetic controller.

**Cohort terminology:** this project studies two Ninapro cohorts. `Database/Intact/` (Ninapro DB1) contains able-bodied participants, referred to in prose as the **Non-disabled cohort**. `Database/Amputee/` (Ninapro DB3) contains participants with limb loss, referred to in prose as the **Disabled cohort**. Folder names, variable names, and experiment IDs keep the original `Intact`/`Amputee` labels for compatibility with the Ninapro documentation and existing scripts; only the narrative language changed. The motivating application is EMG-driven prosthetic control, so every comparison in this project ultimately asks: how much performance is lost moving from a Non-disabled reference to a Disabled/prosthetic-relevant result?

## Repository Structure

```text
.
├── AGENTS.md
├── README.md
├── environment.yml
├── configs/
│   ├── baseline.yaml
│   └── model.yaml
├── Database/
│   ├── Intact/       # raw MAT files; read-only
│   └── Amputee/      # raw MAT files; read-only
├── notebooks/
│   ├── 01_unified_exercise_frequency_classifier.ipynb   # Disabled cohort (Amputee MAT)
│   └── 02_nondisabled_frequency_classifier.ipynb        # Non-disabled cohort (Intact XLSX), intact-to-intact reference
├── presentation/
│   ├── README.md
│   ├── package.json
│   ├── index.html
│   └── src/           # Reveal.js deck, theme, and static result data
├── results/
│   ├── figures/
│   ├── metrics/
│   └── models/
└── agent files/
    ├── AGENTS.md     # detailed scientific project guidance
    ├── PROJECT.md    # course deliverables and rubric
    └── DESIGN.md.md  # slideshow design specification
```

`data/raw`, `data/interim`, and `data/processed` are optional work areas. Do not copy or edit the original files in `Database/`. Converted `excel_output` workbooks are not used for Amputee training; the Amputee classifier notebook reads the original MAT recordings directly.

## Data

The canonical notebook uses only original Amputee MAT recordings. It reads aligned `glove`, `restimulus`, `rerepetition`, `subject`, and `exercise` arrays directly from the MAT files. Excel exports and Intact files are not used by the canonical experiment.

The primary classification mapping is:

```text
Input:  EMG windows (`emg`)
Target: movement/rest labels (`restimulus`)
```

`glove` contains continuous kinematic measurements. It is never included as a classifier feature. A separate optional regression experiment predicts glove values and reports regression metrics independently.

The Amputee repetition notebook uses 400-sample windows with 100-sample stride and 0.80 label purity. Windows crossing an `rerepetition` boundary are discarded. The model trains on windows, but the primary evaluation averages window probabilities into one decision per complete action repetition.

## Installation

Create the pinned Conda environment from the repository root:

```bash
conda env create -f environment.yml
conda activate ninapro-emg
python -m ipykernel install --user --name ninapro-emg
jupyter lab
```

Open `notebooks/01_unified_exercise_frequency_classifier.ipynb` (Disabled cohort), `notebooks/02_nondisabled_frequency_classifier.ipynb` (Non-disabled cohort), or `notebooks/03_responsible_ai_dashboard.ipynb` (Responsible AI Toolbox) and select the `ninapro-emg` kernel. The environment includes NumPy, SciPy, h5py, openpyxl, pandas, scikit-learn, Matplotlib, Seaborn, JupyterLab, PyYAML, PyTorch, and the Responsible AI Toolbox (`fairlearn`, `responsibleai`, `raiwidgets`, `dice-ml`, `econml`).

## Quickstart

1. Create the environment and register the kernel (Installation, above).
2. Run `notebooks/01_unified_exercise_frequency_classifier.ipynb` top to bottom for the Disabled-cohort (Amputee) reference.
3. Run `notebooks/02_nondisabled_frequency_classifier.ipynb` top to bottom for the matching Non-disabled-cohort (Intact) reference — same pipeline, so the two results are directly comparable.
4. Run `notebooks/03_responsible_ai_dashboard.ipynb` for the Responsible AI Toolbox analysis (fairness, error analysis, feature importance, counterfactuals, causal analysis) on the movement-vs-rest prosthetic gating task.
5. Open the presentation (`cd presentation && npm install && npm run dev`) to see the same results as slides.

None of the notebooks write into `Database/`.

## Presentation

The Reveal.js deck in `presentation/` opens with the database and movement taxonomy, walks through the Disabled-cohort baseline result, and closes with the Responsible AI Toolbox findings. Start it with:

```bash
cd presentation
npm install
npm run dev
```

Slide content is data-driven: headline comparison numbers (Non-disabled vs. Disabled macro F1, cross-cohort transfer accuracy) live in one file, `presentation/src/config.js`, so a better result only requires changing a number there — every bar and label recomputes from it. Build the static production deck with `npm run build`.

## Analysis and Evaluation

The notebook follows the core analysis themes:

1. Frame the movement-recognition question and its non-clinical decision context.
2. Characterize the cohort, files, signal dimensions, labels, and signal-quality flags.
3. Define deployment-aware subject and repetition splits before windowing.
4. Extract MAV, RMS, and waveform-length features and fit scaling only inside the training pipeline.
5. Compare a prior-only majority baseline with class-balanced logistic regression.
6. Fit sigmoid probability calibration on validation data and report multiclass Brier score and top-label ECE. Validation calibration metrics are apparent because calibration and reporting use the same validation split.
7. Compare full-coverage argmax, a 90%-coverage workload constraint, and an illustrative 0.80 macro-recall floor. The selected confidence threshold is fixed from validation before test scoring.
8. Evaluate the subject-held-out and repetition-held-out test groups, with accuracy, balanced accuracy, macro/weighted F1, per-class metrics, and subject-level variation.
9. Review cohort risks, confusion pairs, validation permutation importance, and limitations.

The cross-subject split represents transfer to participants absent from training. The within-subject split represents new subject–repetition groups for participants who may also appear in other splits. These answer different questions. The test set is not used to fit preprocessing, calibrate probabilities, select a threshold, or tune the model.

The selective policy abstains on low-confidence movement windows. It reports accepted coverage and abstentions per 1,000 windows, not false clinical alerts or missed patients. Movement labels do not define a clinical positive/negative outcome, so patient-impact-per-1,000 metrics and diagnostic thresholds do not apply.

## Responsible AI and Limitations

Subject and repetition IDs support evaluation cohorts, not demographic fairness claims. The recordings do not provide protected attributes for assessing demographic parity or equalized odds. Performance by subject, exercise, repetition, and movement class should be reported where available; do not infer sensitive attributes from IDs.

Permutation importance describes model reliance, not physiology or causality. A channel associated with a prediction is not proof that a particular muscle caused the movement. Counterfactual EMG feature changes are not reported because independent feature edits may not correspond to a possible signal; causal conclusions need an appropriate intervention design.

The local files and experimental protocol may not represent real users, clinical populations, devices, or deployment environments. Transition windows are partly excluded by the purity and repetition-boundary rules. No real-time latency, safety, clinical efficacy, or assistive-device benefit is established. Effects of proposed mitigations remain unquantified until tested in a prespecified follow-up experiment.

Respect the Ninapro data-access and licensing terms that apply to the source files. This repository does not redistribute the database.

## Reproducibility

The default experiment identifier is `EXP-001-intact-e1-logreg`; the seed is 42 across every notebook and experiment. Each run record includes selected files, split IDs, window parameters, preprocessing/model description, metrics, and limitations, stored in `results/metrics/`.

## Cross-Cohort Action Transfer

The question that actually matters for prosthetics is not "can a model recognize a movement it was trained on" but "does a movement pattern learned from one population transfer to the other." `EXP-003`-`EXP-005` test exactly that: train on one cohort's Exercise B/C recordings, calibrate on held-out subjects from both cohorts, and evaluate on the other cohort. This is why the taxonomy is deliberately shared (see Exercises and Actions Reference) rather than treating each cohort's class IDs as unrelated.

**So what:** a model that recognizes actions well within one cohort but degrades sharply when applied to the other cohort is telling you that residual-limb and intact-limb EMG differ enough that a prosthetic controller cannot simply be trained on able-bodied volunteers and shipped to amputee users. Quantifying that gap (see the presentation's "So what" slide) is the concrete, falsifiable research finding this project produces for future prosthetics engineering.

**Data caveat:** the original DB1 Intact MAT files are not present in this workspace; Non-disabled recordings are read from converter-generated XLSX exports, which round EMG values. Treat Non-disabled results as a lower-fidelity reference until the original MAT files are available.

The existing Intact-only and Amputee-only experiments are separate cohort-specific references. Do not interpret differences between them as a causal effect of amputation: database, sensor, class, data-volume, and held-out-subject conditions differ.

Raw recordings and generated model checkpoints are ignored by `.gitignore`. Keep generated artifacts separate from source code, and do not commit secrets or raw participant data.

## Exercises and Actions Reference

The full Ninapro movement taxonomy used across the notebooks and experiments (see `Excercises and sensors.md` for the original list and `results/metrics/EXP-005-two-part-action-study.json` for the machine-readable `action_mapping`):

| Exercise | Cohort availability | Action count | Example named actions |
|---|---|---|---|
| A | Non-disabled (E1) | 12 finger actions + Rest | Index flexion/extension, Thumb adduction/abduction/flexion/extension |
| B | Non-disabled (E2), Disabled (E1) | 17 hand/wrist configurations + Rest | Thumb up, Fist, Pointing index, Wrist flexion/extension, Wrist supination/pronation |
| C | Non-disabled (E3), Disabled (E2) | 23 grasps/functional actions + Rest | Large diameter grasp, Tripod grasp, Open a bottle, Turn a screw, Cut something |
| D | Disabled (E3) only; no `glove` channel | 9 combined finger actions + Rest | Flexion of index/ring/middle/little finger, Abduction of the thumb |

**So what:** Exercises B and C are the only taxonomy shared by both cohorts (with a raw-label offset: Disabled E1 -> B, Disabled E2 -> C), which is why the cross-cohort transfer experiments (`EXP-003`-`EXP-005`) are restricted to those actions. Exercise D actions (e.g., isolated little-finger flexion) are exactly the kind of fine motor control a dexterous prosthetic hand needs, but they currently require a separate EMG/force-only model because the Disabled E3 MAT files carry no glove ground truth.

## Rubric Alignment and "So What" Summary

Each `PROJECT.md` rubric category maps onto this repository's artifacts, read through the prosthetic-control motivation:

| Rubric category | Implemented in | So what for prosthetics |
|---|---|---|
| 1. Clinical problem framing | README purpose, notebook intros | Defines the decision context up front: recognizing an intended hand action from muscle/kinematic signal, as a precursor to prosthetic command generation, not a diagnosis |
| 2. Data characterization | `results/metrics/*_data_validation.json`, notebook Graph 1 | Shows class/window imbalance per cohort and exercise before any model is trusted |
| 3. Experimental design/splits | Subject- and repetition-group-aware splits in every notebook/script | Matches the real deployment question (new repetitions, new subjects) instead of an inflated random split |
| 4. Pipelines/leakage controls | Scaling/feature-fit inside train-only pipelines; identical pipeline reused across cohorts | Makes Non-disabled vs. Disabled comparisons attributable to the data, not to inconsistent preprocessing |
| 5. Metrics | Accuracy, balanced accuracy, macro/weighted F1, per-class reports (`EXP-001`, `EXP-002`, `EXP-006`) | Surfaces rare-but-important actions (e.g., precision grasps) that overall accuracy would hide |
| 6. Calibration | `*_calibration.csv`, validation-only sigmoid calibration | A miscalibrated "confident" wrong prediction is worse in an assistive device than a model that abstains |
| 7. Threshold/decision analysis | `*_decision_policies.csv` (workload-constrained and recall-floor policies) | A prosthetic controller can trade coverage for reliability; this quantifies that trade-off instead of asserting it |
| 8. Final test/generalization | Subject-held-out and repetition-held-out test metrics | Distinguishes "generalizes to new attempts by a known user" from "generalizes to a new person", which is the actual open question for prosthetic fitting |
| 9. Responsible AI | `*_risk_review.csv`, `*_feature_importance.csv`, confusion-matrix graphs | Flags cohort-specific and action-specific failure modes as concrete, monitorable risks rather than a single pass/fail claim |

**Overall so what:** none of these experiments certify a prosthetic controller. What they do is quantify, cohort by cohort and action by action, where an EMG/kinematic classification approach is currently reliable and where it is not — the exact information a prosthetics engineering team needs before deciding which movements to support first and which failure modes require a manual override.
