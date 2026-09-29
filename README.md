# Ninapro EMG Movement Analysis: Disabled vs. Non-disabled Cohort Comparison

## Purpose

This project studies whether temporal patterns in multi-channel surface electromyography (sEMG) predict recorded hand-movement labels. It uses Ninapro-style MATLAB recordings in `Database/` and starts with a reproducible, interpretable feature-based baseline before any deep model.

**Research question:** What patterns in multi-channel EMG are predictive of hand-movement labels, and how reliably do they transfer to unseen repetitions or participants?

The intended use is research into movement recognition and, separately, EMG-to-kinematics prediction. This is not a diagnostic model, clinical decision system, or validated prosthetic controller.

**Cohort terminology:** this project studies two Ninapro cohorts. `Database/Intact/` (Ninapro DB1) contains able-bodied participants, referred to in prose as the **Non-disabled cohort**. `Database/Amputee/` (Ninapro DB3) contains participants with limb loss, referred to in prose as the **Disabled cohort**. Folder names, variable names, and experiment IDs keep the original `Intact`/`Amputee` labels for compatibility with the Ninapro documentation and existing scripts; only the narrative language changed. The motivating application is EMG-driven prosthetic control, so every comparison in this project ultimately asks: how much performance is lost moving from a Non-disabled reference to a Disabled/prosthetic-relevant result?

**Table of Contents**
- Project Structure
- Data
- Install
- Quickstart
- Utilities: Data Loading, Splitting, Modeling, and Plots
- Presentation
- Analysis and Evaluation
- Responsible AI and Limitations
- Reproducibility
- Cross-Cohort Action Transfer
- Exercises and Actions Reference
- Rubric Alignment and "So What" Summary
- Troubleshooting
- License and Acknowledgements

## Project Structure

```text
.
├── AGENTS.md             # detailed scientific project guidance
├── PROJECT.md            # course deliverables and rubric
├── DESIGN.md.md          # slideshow design specification
├── README.md             # this file
├── environment.yml       # pinned Conda environment for reproducibility
├── utils.py              # shared data loading, splitting, modeling, and plotting helpers
├── Excercises and sensors.md
├── configs/
│   ├── baseline.yaml
│   └── model.yaml
├── Database/
│   ├── Intact/       # raw XLSX exports (Non-disabled cohort); read-only
│   └── Amputee/      # raw MAT files (Disabled cohort); read-only
├── notebooks/
│   ├── 01_unified_exercise_frequency_classifier.ipynb   # Disabled cohort (Amputee MAT)
│   ├── 02_nondisabled_frequency_classifier.ipynb        # Non-disabled cohort (Intact XLSX), intact-to-intact reference
│   └── 03_responsible_ai_dashboard.ipynb                # Responsible AI Toolbox (Disabled cohort)
├── presentation/
│   ├── README.md
│   ├── package.json
│   ├── index.html
│   └── src/           # Reveal.js deck, theme, and static result data
└── results/
    ├── figures/
    ├── metrics/
    └── models/
```

`data/raw`, `data/interim`, and `data/processed` are optional work areas. Do not copy or edit the original files in `Database/`. Converted `excel_output` workbooks are not used for Amputee training; the Amputee classifier notebook reads the original MAT recordings directly.

## Data

The canonical notebooks read aligned `glove`, `restimulus`, `rerepetition`, `subject`, and `exercise` arrays (Disabled/Amputee MAT files) or `emg`, `restimulus`, `rerepetition`, and `subject` arrays (classical EMG-feature notebook), all through the shared loaders in `utils.py` rather than ad hoc `scipy.io.loadmat()`/`openpyxl` calls in the notebook body.

The primary classification mapping is:

```text
Input:  EMG windows (`emg`) or glove-frequency windows (`glove`)
Target: movement/rest labels (`restimulus`)
```

`glove` contains continuous kinematic measurements. It is never included as a classifier feature alongside EMG in the same model. Non-disabled recordings are read from converter-generated XLSX exports (the original DB1 MAT files are not present in this workspace), which round EMG/glove values; treat Non-disabled results as a lower-fidelity reference until the original MAT files are available.

The glove-frequency notebooks (`01`, `02`) use 400-sample windows with 100-sample stride and 0.80 label purity; the classical EMG-feature notebook (`03`) uses 200-sample windows with 50-sample stride and the same 0.80 purity threshold. Windows crossing an `rerepetition` boundary are discarded in every case (`utils.make_frequency_windows` / `utils.extract_emg_features`).

## Install

Create the pinned Conda environment from the repository root:

```bash
conda env create -f environment.yml
conda activate ninapro-emg
python -m ipykernel install --user --name ninapro-emg
```

Verify the shared utilities import cleanly:

```bash
python -c "import utils; print('utils OK:', len(utils.ACTIONS), 'exercises')"
```

Then launch Jupyter from the repository root (not from inside `notebooks/`), so each notebook's `import utils` resolves:

```bash
jupyter lab
```

Open `notebooks/01_unified_exercise_frequency_classifier.ipynb` (Disabled cohort), `notebooks/02_nondisabled_frequency_classifier.ipynb` (Non-disabled cohort), or `notebooks/03_responsible_ai_dashboard.ipynb` (Responsible AI Toolbox) and select the `ninapro-emg` kernel. The environment includes NumPy, SciPy, h5py, openpyxl, pandas, scikit-learn, Matplotlib, Seaborn, JupyterLab, PyYAML, PyTorch, and the Responsible AI Toolbox (`fairlearn`, `responsibleai`, `raiwidgets`, `dice-ml`, `econml`).

## Quickstart

1. Create the environment and register the kernel (Install, above).
2. Run `notebooks/01_unified_exercise_frequency_classifier.ipynb` top to bottom for the Disabled-cohort (Amputee) reference.
3. Run `notebooks/02_nondisabled_frequency_classifier.ipynb` top to bottom for the matching Non-disabled-cohort (Intact) reference — same pipeline (via `utils.py`), so the two results are directly comparable.
4. Run `notebooks/03_responsible_ai_dashboard.ipynb` for the Responsible AI Toolbox analysis (fairness, error analysis, feature importance, counterfactuals, causal analysis) on the movement-vs-rest prosthetic gating task.
5. Open the presentation (`cd presentation && npm install && npm run dev`) to see the same results as slides.

None of the notebooks write into `Database/`.

## Utilities: Data Loading, Splitting, Modeling, and Plots

`utils.py` at the repository root holds the data loading, labeling, windowing, group-aware splitting, model, and plotting code shared by all three notebooks, so the Disabled- and Non-disabled-cohort pipelines stay identical and any fix only needs to be made once. Import what you need directly:

```python
from utils import (
    ACTIONS, set_seed, find_repo_root, get_data_root,
    load_mat_recording, load_xlsx_recording, load_emg_recording,
    make_frequency_windows, extract_emg_features,
    subject_grouped_holdout, cap_and_shuffle_classes, exercise_labels_from_classes, subject_holdout_split,
    FrequencyMLP, fit_frequency_model, predict_hierarchical,
    classification_summary, per_subject_binary_metrics, save_experiment_json,
    plot_bar, plot_confusion_heatmap,
)
```

- **Taxonomy and labels**
  - `ACTIONS`, `EXERCISE_NAMES`: the shared exercise-letter -> action-name taxonomy (see Exercises and Actions Reference).
  - `action_name(exercise, label)`, `taxonomy_for_file(path, database_exercise)`, `local_action_label(exercise, raw_label, cohort)`: map cohort-specific raw Ninapro labels onto one consistent 0-based local action id.
- **Data loading**
  - `load_mat_recording(path)`: `glove`/`restimulus`/`rerepetition`/`subject`/`exercise` from an Amputee MAT file.
  - `load_xlsx_recording(path)`: the same arrays from a converter-generated Intact XLSX workbook.
  - `load_emg_recording(path)`: `emg`/`restimulus`/`rerepetition`/`subject` from a MAT file, for classical EMG-feature experiments.
- **Windowing and features**
  - `make_frequency_windows(recording, path, cohort=..., window_samples=400, stride_samples=100, fft_bins=32, min_purity=0.80)`: purity-filtered, repetition-boundary-respecting windows over the glove signal, with a log-magnitude FFT feature per window.
  - `extract_emg_features(recording, path, window_samples=200, stride_samples=50, min_purity=0.80)`: MAV/RMS/waveform-length EMG features per window, plus `is_movement`/`action_id`/`repetition_group`.
- **Group-aware split (leakage prevention)**
  - `subject_grouped_holdout(groups, subjects, seed, test_fraction=0.2)`: holds out a fraction of each subject's repetition groups so no window from a held-out repetition appears in training.
  - `cap_and_shuffle_classes(y, train_mask, seed, max_per_class=1000)`: caps training windows per class and shuffles the selection.
  - `exercise_labels_from_classes(classes, y)`: derives the exercise-level label array used by the hierarchical exercise->action model.
  - `subject_holdout_split(subjects, seed, test_fraction=0.25, min_test_subjects=2)`: holds out whole subjects (used for the binary movement-gate experiment).
- **Model**
  - `FrequencyMLP`: small feed-forward classifier over frequency-domain window features.
  - `fit_frequency_model(features, labels, n_classes, device, epochs=200, ...)`: trains a `FrequencyMLP` with AdamW/cross-entropy.
  - `predict_hierarchical(exercise_model, action_models, exercise_ids, X_test, device)`: routes each window through an exercise model, then the matching exercise-specific action model.
- **Evaluation and reporting**
  - `classification_summary(y_true, y_pred)`: accuracy / balanced accuracy / macro-F1 dict.
  - `per_subject_binary_metrics(test_df, feature_columns, target_column, model, test_subjects)`: per-subject metrics table, for the fairness/cohort review in notebook `03`.
  - `save_experiment_json(results_dir, experiment_id, payload, suffix="experiment")`: writes a numpy-safe `results/metrics/*.json` artifact.
- **Plots**
  - `plot_bar(...)`: generic bar chart for class-balance and per-exercise-F1 figures.
  - `plot_confusion_heatmap(...)`: annotated confusion-matrix heatmap.

Minimal example (outside the notebooks):

```python
import numpy as np
import torch
from utils import (
    set_seed, find_repo_root, get_data_root, load_mat_recording, make_frequency_windows,
    subject_grouped_holdout, cap_and_shuffle_classes, exercise_labels_from_classes,
    fit_frequency_model,
)

SEED = 42
set_seed(SEED)
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
data_root = get_data_root(find_repo_root())

paths = sorted((data_root / 'Amputee').glob('*_E*_A1.mat'))
records = [make_frequency_windows(load_mat_recording(p), p, cohort='Amputee') for p in paths]
X = np.concatenate([r[0] for r in records])
target_names = np.concatenate([r[1] for r in records])
groups = np.concatenate([r[2] for r in records])
classes = sorted(np.unique(target_names))
y = np.asarray([classes.index(t) for t in target_names])

subjects = np.asarray([g.split(':', 1)[0] for g in groups])
train_mask, test_mask, _, _ = subject_grouped_holdout(groups, subjects, SEED)
selected = cap_and_shuffle_classes(y, train_mask, SEED)
exercise_ids, _, y_exercise = exercise_labels_from_classes(classes, y)
exercise_model = fit_frequency_model(X[selected], y_exercise[selected], len(exercise_ids), device)
```

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

The default experiment identifier is `EXP-001-intact-e1-logreg`; the seed is 42 across every notebook and experiment (`utils.set_seed`). Splits are always group-aware, by subject and repetition (`utils.subject_grouped_holdout`, `utils.subject_holdout_split`); never a plain random split over overlapping windows. Each run record includes selected files, split IDs, window parameters, preprocessing/model description, metrics, and limitations, stored in `results/metrics/`.

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

## Troubleshooting

- **`ModuleNotFoundError: No module named 'utils'`:** start Jupyter from the repository root (not from inside `notebooks/`), or confirm the notebook's first cell inserts the repo root onto `sys.path` before `import utils`.
- **Widget/dashboard not showing:** trust the notebook (File -> Trust Notebook) and prefer JupyterLab over classic Notebook; confirm the `ninapro-emg` conda env is the active Jupyter kernel.
- **Import errors (`fairlearn`, `responsibleai`, `raiwidgets`):** recreate the environment: `conda env remove -n ninapro-emg && conda env create -f environment.yml`.
- **`.mat`/`.xlsx` load errors:** confirm `Database/Amputee/` and `Database/Intact/` are present and unmodified; `utils.load_mat_recording` / `utils.load_xlsx_recording` / `utils.load_emg_recording` validate required keys/worksheets and raise a descriptive `ValueError` naming the missing field.
- **Plots not appearing:** ensure the Matplotlib backend is interactive (default inline backend in Jupyter) and that cells are not in a skipped state.

## License and Acknowledgements

- Respect the Ninapro database's own data-access and licensing terms; this repository does not redistribute the database.
- Notebook and Responsible AI Toolbox structure informed by Microsoft's Responsible AI toolbox examples and standard scikit-learn documentation.
- See `AGENTS.md` for the full scientific and reproducibility guidance this project follows, and `PROJECT.md` for the course rubric this repository targets.
