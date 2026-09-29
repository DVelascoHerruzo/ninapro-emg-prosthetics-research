## Project Overview

This project uses the **Ninapro Database** to study human hand and muscle movement from surface electromyography (sEMG/EMG) signals and to develop machine-learning/deep-learning models that can identify movement patterns.

The long-term goal is to determine whether patterns in EMG activity can be mapped reliably to hand movements and/or hand kinematics, and to provide representations that can later be consumed by an AI system for movement recognition, prediction, or analysis.

The project should be treated as a **biomedical signal-processing and machine-learning research project**, not merely as a generic classification problem.

The main priorities are:

1. Preserve the scientific meaning of the Ninapro data.
2. Prevent subject/repetition leakage.
3. Build reproducible preprocessing and experiments.
4. Establish strong, interpretable baselines before using complex neural networks.
5. Separate movement recognition from continuous hand-kinematics prediction.
6. Evaluate generalization across repetitions and, where possible, across subjects.
7. Analyze what the model has actually learned from the EMG.
8. Clearly communicate limitations and avoid overclaiming clinical or human-performance conclusions.

---

## Source Data

The current sample `.mat` files follow the Ninapro-style structure and contain:

- `emg`: EMG recordings. The provided samples contain **10 channels**.
- `stimulus`: movement/exercise labels.
- `glove`: continuous hand/kinematic measurements. The provided samples contain **22 channels**.
- `subject`: subject identifier.
- `exercise`: exercise identifier.
- `repetition`: repetition identifier over time.
- `restimulus`: re-labeled/processed stimulus signal.
- `rerepetition`: re-labeled/processed repetition signal.

Do not assume that every Ninapro database/exercise has identical dimensions, sampling rates, labels, or sensor configurations. Always inspect the metadata and dataset documentation before writing preprocessing code.

### Important distinction

`stimulus` and `restimulus` are labels/annotations, while `glove` is a continuous sensor/kinematic signal. Do not treat the glove measurements as interchangeable with the movement class labels.

The project may support two related prediction tasks:

### Task A — Movement classification

Input:

```text
EMG window -> movement/class label
```

Example:

```text
[10-channel EMG window] -> grasp/movement class
```

### Task B — Continuous movement/kinematic prediction

Input:

```text
EMG window -> 22-dimensional glove/kinematic output
```

This is a regression/sequential prediction problem and should be evaluated separately from classification.

Do not mix these objectives in a single metric or claim.

---

## Current Research Question

The default research question is:

> **What reproducible patterns in multi-channel EMG signals correspond to human hand movements, and how reliably can machine-learning models identify or predict those movements from EMG?**

Secondary questions:

- Which EMG features contain the most information about movement?
- How stable are those patterns across repetitions?
- How well do they generalize to unseen subjects?
- Does temporal context improve prediction?
- Which errors are systematic rather than random?
- Does the model learn physiologically meaningful signal structure or dataset-specific artifacts?
- For continuous prediction, which aspects of hand kinematics can be recovered from EMG?
- How much performance is lost when moving from within-subject to cross-subject evaluation?

---

# Development Principles

## 1. Scientific correctness over model complexity

Do not introduce a more complex model merely because it is newer.

The project should progress approximately as:

```text
Data inspection
    ↓
Signal quality checks
    ↓
Baseline preprocessing
    ↓
Feature-based baseline
    ↓
Simple temporal baseline
    ↓
Deep temporal model
    ↓
Error analysis
    ↓
Interpretability / pattern analysis
```

Every increase in model complexity should answer a research question.

---

## 2. Reproducibility is mandatory

Every experiment must record:

- dataset/database version
- subject IDs
- exercise IDs
- repetitions used
- preprocessing parameters
- window length
- window stride
- sampling rate
- normalization method
- feature set
- model architecture
- hyperparameters
- random seeds
- train/validation/test split
- software/environment version
- evaluation metrics

Do not rely on undocumented notebook state.

Use configuration files where practical.

Example:

```text
configs/
    baseline.yaml
    cnn.yaml
    lstm.yaml
```

---

# Repository Structure

Prefer a structure similar to:

```text
.
├── AGENTS.md
├── README.md
├── PROJECT.md
├── environment.yml
├── requirements.txt
├── configs/
│   ├── baseline.yaml
│   └── model.yaml
├── data/
│   ├── raw/
│   ├── interim/
│   └── processed/
├── notebooks/
│   ├── 01_data_exploration.ipynb
│   ├── 02_signal_processing.ipynb
│   ├── 03_baseline.ipynb
│   ├── 04_deep_model.ipynb
│   └── 05_error_analysis.ipynb
├── src/
│   ├── data.py
│   ├── preprocessing.py
│   ├── segmentation.py
│   ├── features.py
│   ├── models.py
│   ├── evaluation.py
│   └── visualization.py
├── scripts/
│   ├── prepare_data.py
│   ├── train.py
│   └── evaluate.py
├── tests/
│   ├── test_data.py
│   ├── test_preprocessing.py
│   └── test_segmentation.py
├── results/
│   ├── figures/
│   ├── metrics/
│   └── models/
└── reports/
```

Keep raw Ninapro files immutable.

Never modify raw `.mat` files in place.

---

# Data Loading Rules

Use a dedicated loader rather than repeatedly writing `scipy.io.loadmat()` calls inside notebooks.

Example conceptual API:

```python
data = load_ninapro_file(path)

emg = data["emg"]
stimulus = data["stimulus"]
glove = data["glove"]
subject = data["subject"]
exercise = data["exercise"]
repetition = data["repetition"]
```

The loader must validate:

- expected keys
- dimensionality
- finite values
- matching sample counts
- channel counts
- subject/exercise metadata
- label ranges

For example:

```text
len(emg) == len(stimulus)
len(emg) == len(glove)
len(emg) == len(repetition)
```

must be checked before segmentation.

---

# Data Validation

Before model training, always report:

### Signal dimensions

```text
number of samples
number of EMG channels
number of glove channels
```

### Signal integrity

Check for:

- NaN
- infinite values
- constant channels
- abnormal amplitude
- clipping
- missing segments
- unexpected discontinuities

### Labels

Inspect:

- unique stimulus values
- class frequencies
- transitions between classes
- rest periods
- repetitions per class
- classes missing from a split

### Subject structure

Report:

```text
subjects
exercises
repetitions
samples per subject
samples per exercise
samples per class
```

Never infer class balance from raw sample counts alone when windows are overlapping.

---

# Segmentation

EMG should generally be transformed from a continuous stream into temporal windows.

For example:

```text
continuous EMG
      ↓
windowing
      ↓
EMG[t : t + window]
      ↓
model input
```

Always document:

- window duration
- number of samples per window
- stride
- overlap
- label assignment strategy

Example:

```text
window = 200 ms
stride = 50 ms
```

is only an example. Do not use these values without experimentation or justification.

---

## Window Labeling

Never silently assign a label to a window.

Possible strategies include:

### Majority label

Assign the class occurring most frequently inside the window.

### Center label

Use the label at the center of the window.

### Purity threshold

Accept the window only if a specified proportion of samples share the same label.

For example:

```text
purity >= 0.80
```

The choice must be documented because transition windows can contain multiple movements.

---

# Data Leakage Prevention

This is one of the most important rules in the project.

## Never randomly split overlapping windows before grouping by subject/repetition.

If windows overlap, neighboring samples can be nearly identical.

A split such as:

```python
train_test_split(all_windows)
```

can create severe leakage.

Instead, split using the unit that represents the intended deployment scenario.

Examples:

### Generalization to new repetitions

Group by repetition.

### Generalization to new subjects

Group by subject.

Example:

```text
Train:
    S1, S2, S3, S4

Validation:
    S5

Test:
    S6
```

or use a documented subject-level cross-validation scheme.

The exact split must be determined by the research question.

---

# Deployment-Aware Splits

The project should report at least two generalization settings when data availability permits:

## Within-subject evaluation

The model sees training data from the same subjects as the test data but different repetitions.

This answers:

> Can the system learn movement patterns for people it has already observed?

## Cross-subject evaluation

The test subject is completely unseen during training.

This answers:

> Can the learned EMG representation generalize to a new person?

Do not call within-subject performance "generalization to new users."

---

# Preprocessing

Preprocessing must be fitted only on training data when it has learned parameters.

Examples:

- standardization
- normalization
- dimensionality reduction
- learned artifact removal

Bad:

```text
fit scaler on all data
↓
split into train/test
```

Correct:

```text
split
↓
fit scaler on train
↓
transform train
↓
transform validation
↓
transform test
```

---

# EMG Signal Processing

Potential preprocessing steps may include:

- DC offset removal
- band-pass filtering
- notch filtering where justified
- rectification
- envelope extraction
- normalization
- artifact detection
- temporal smoothing

Do not automatically apply every possible filter.

For every transformation, document:

1. Why it is needed.
2. Its parameters.
3. Whether it could alter movement information.
4. Whether it is applied identically to train/validation/test.

Avoid preprocessing that introduces future information into a real-time prediction setting.

---

# Feature Engineering

For classical ML baselines, consider established EMG features such as:

- Mean Absolute Value (MAV)
- Root Mean Square (RMS)
- waveform length
- zero crossings
- slope sign changes
- variance
- integrated EMG
- Willison amplitude
- autoregressive coefficients
- frequency-domain statistics

Feature selection must occur inside the training pipeline.

Do not select features using the test set.

---

# Baseline Models

Always establish simple baselines before deep learning.

For classification, possible baselines:

```text
Majority classifier
Logistic regression
Linear SVM
Random forest
Gradient boosting
```

For regression:

```text
Mean predictor
Linear regression
Ridge regression
Random forest regression
```

The baseline must be difficult enough to be meaningful but simple enough to interpret.

---

# Deep Learning Models

Potential architectures include:

```text
1D CNN
CNN + LSTM
Temporal CNN
GRU
Transformer / temporal attention model
```

Start with a small model.

A deep network should not be introduced until:

- labels are validated
- leakage checks pass
- baseline performance exists
- preprocessing is reproducible

For sequence models, document:

- input window
- receptive field
- number of layers
- hidden dimensions
- dropout
- optimizer
- learning rate
- batch size
- epochs
- early stopping
- random seed

---

# Classification Metrics

Accuracy alone is insufficient.

Report, as appropriate:

- accuracy
- balanced accuracy
- precision
- recall
- F1
- macro F1
- weighted F1
- confusion matrix
- per-class performance

For imbalanced movement classes, prioritize metrics that reveal minority-class behavior.

Always report per-class metrics where feasible.

---

# Regression Metrics

For glove/kinematic prediction, consider:

- MAE
- RMSE
- R²
- correlation
- per-output error
- normalized error where justified

Do not report a single aggregate number without showing which glove dimensions are difficult to predict.

For sequence prediction, also inspect:

- temporal lag
- phase alignment
- error during transitions
- error during steady movement
- qualitative predicted-vs-actual traces

---

# Evaluation Protocol

Evaluation must be performed on data that was not used to:

- fit preprocessing
- choose features
- tune hyperparameters
- choose the final architecture
- select the final threshold

The final test set must remain locked until the experiment is finalized.

Do not repeatedly evaluate the test set while tuning.

---

# Statistical Reporting

Where appropriate, report variability across:

- subjects
- repetitions
- folds
- random seeds

Prefer:

```text
mean ± standard deviation
```

or confidence intervals over a single number.

Do not treat individual windows as independent experimental subjects.

The statistical unit should match the scientific question.

---

# Error Analysis

Every serious experiment must include error analysis.

For classification inspect:

- most confused classes
- false positives
- false negatives
- transition windows
- low-amplitude movements
- subject-specific failures
- repetition-specific failures

For regression inspect:

- glove channels with highest error
- movement phases with highest error
- subject-specific errors
- temporal lag
- failure during rapid transitions

Ask:

> What pattern explains this failure?

Do not stop at:

> The model made a mistake.

---

# Pattern Analysis

The project's core scientific objective is not merely classification accuracy.

Look for meaningful EMG patterns.

Useful analyses include:

- channel activation patterns
- correlation between EMG channels
- time-frequency representations
- feature distributions by movement
- dimensionality reduction
- clustering
- class separability
- activation heatmaps
- saliency/attribution
- learned latent representations

Potential methods:

```text
PCA
UMAP
t-SNE
spectrograms
wavelets
SHAP (where appropriate)
integrated gradients
occlusion analysis
```

Dimensionality-reduction visualizations must not be interpreted as proof of biological separability by themselves.

---

# Physiological Interpretation

Be conservative.

A model finding that:

```text
channel 4 is important
```

does not automatically prove:

```text
muscle X causes movement Y
```

unless the channel-to-muscle mapping and experimental evidence justify that interpretation.

Use language such as:

```text
"associated with"
"predictive of"
"correlated with"
"the model relied heavily on"
```

rather than:

```text
"causes"
"controls"
"proves"
```

unless causality has actually been established.

---

# AI Input Representation

The project should clearly define what is fed to the AI.

Example:

```text
Input:
    10 EMG channels
    ×
    T temporal samples

Output:
    movement class
```

or:

```text
Input:
    10 EMG channels
    ×
    T temporal samples

Output:
    22 glove channels
```

Document tensor shapes explicitly.

Example:

```text
(batch, channels, time)
```

or:

```text
(batch, time, channels)
```

Do not silently transpose tensors.

---

# Real-Time Considerations

If the eventual objective is real-time movement recognition, report:

- window length
- stride
- algorithmic latency
- preprocessing latency
- inference time
- computational requirements
- causal vs non-causal filtering

Do not use future samples in a real-time model.

For example, centered smoothing may be acceptable for offline analysis but invalid for causal real-time inference.

---

# Responsible AI

Although this is primarily a signal-processing project, responsible-AI analysis is required.

Analyze whether performance varies by:

- subject
- exercise
- repetition
- movement class
- signal quality
- other available cohort variables

The project brief specifically expects responsible-AI analysis, error analysis, feature importance, counterfactual/causal analysis where appropriate, cohort analysis, mitigation proposals, and clinician-ready recommendations.

Do not invent demographic variables that are not present in the dataset.

Do not infer sensitive attributes from names, IDs, or model behavior.

---

# Clinical Claims

The Ninapro EMG dataset is a research dataset.

Do not claim:

```text
"This model can diagnose patients."
```

unless the project actually includes appropriate clinical data and validation.

Prefer:

```text
"This experiment evaluates whether EMG patterns can predict/recognize hand movements under the specified experimental conditions."
```

Clearly distinguish:

```text
movement recognition
```

from:

```text
clinical diagnosis
```

and:

```text
assistive-device control
```

---

# Reproducibility Requirements

Set explicit seeds where supported:

```python
random.seed(SEED)
numpy.random.seed(SEED)
```

and configure framework-specific seeds.

Record:

- Python version
- package versions
- hardware
- CUDA version if relevant
- model seed
- data split seed

The environment should be captured in `environment.yml`.

Pin versions when practical.

---

# Notebook Requirements

The project brief requires a well-documented notebook covering the required analytical steps.

Every major notebook section should contain:

1. What was done.
2. What was learned.
3. Why it matters.
4. Clinical/domain implication where appropriate.

Keep explanations concise.

The notebook should repeatedly answer:

> **So what?**

Example:

```text
Technical result:
The model performs poorly on transition windows.

So what?
A real-time prosthetic controller could produce unstable commands during
movement transitions, so transition handling should be treated as a
separate engineering problem.
```

Do not overwhelm the reader with implementation details when a concise explanation communicates the same idea.

---

# Required Project Deliverables

Maintain the following:

```text
README.md
environment.yml
notebooks/
AGENTS.md
```

Also aim for:

```text
src/
utils.py
tests/
results/
```

The project brief additionally expects a presentation covering:

- data analysis
- model overview
- fairness
- error analysis
- feature importance
- counterfactuals
- causal analysis where appropriate
- clinical/domain insights
- mitigation strategies
- recommendations
- policy implications where relevant

---

# README Requirements

The README must include:

## Introduction and purpose

Explain:

- why EMG movement analysis matters
- what Ninapro provides
- the research question
- intended AI application

## Project structure

Explain important files and folders.

## Installation

Provide:

```bash
conda env create -f environment.yml
conda activate <environment-name>
```

and any additional setup commands.

## Quickstart

A new user should be able to reproduce the analysis from the README.

## Data description

Document:

- dataset/version
- exercises
- subjects
- EMG channels
- glove channels
- labels
- repetitions
- exclusions
- preprocessing

## Evaluation

Document:

- split strategy
- metrics
- calibration if relevant
- thresholding if relevant
- uncertainty
- subgroup analysis

## Responsible AI

Document:

- limitations
- fairness
- error analysis
- reproducibility
- licensing
- intended use
- prohibited overinterpretations

---

# Testing

Add tests for critical data transformations.

Examples:

```python
def test_emg_and_labels_have_same_length():
    ...

def test_no_nan_after_preprocessing():
    ...

def test_windows_do_not_cross_split_boundaries():
    ...

def test_train_and_test_subjects_are_disjoint():
    ...
```

The most important tests should protect against silent data leakage.

---

# Git Rules

Do not commit:

```text
raw Ninapro data
large generated datasets
model checkpoints
temporary notebook outputs
secrets
API keys
personal data
```

Use `.gitignore`.

Commit:

```text
source code
configuration
small metadata files
documentation
tests
reproducibility information
```

If large files are required, use an appropriate data/model versioning system rather than ordinary Git.

---

# Code Style

Prefer:

- Python type hints
- small functions
- descriptive names
- docstrings for public functions
- deterministic behavior
- explicit configuration
- vectorized NumPy/PyTorch operations where appropriate

Avoid:

- hidden global state
- magic constants
- duplicated preprocessing
- notebook-only implementations of core logic
- hard-coded local paths

Bad:

```python
data = loadmat("C:/Users/me/Desktop/data/S1_A1_E1.mat")
```

Prefer:

```python
data = load_ninapro_file(config.data_path)
```

---

# Visualization Standards

Every important visualization should have:

- title
- axis labels
- units where known
- legend where needed
- readable font sizes
- clear explanation in surrounding text

Useful figures include:

```text
raw EMG traces
filtered EMG traces
class distribution
repetition distribution
channel correlation matrix
frequency spectra
spectrograms
feature distributions
confusion matrix
per-class metrics
predicted vs actual kinematics
error distributions
subject-level performance
latent-space visualization
```

Do not create plots merely because they look interesting. Each plot should answer a question.

---

# Experiment Tracking

Every experiment should have an identifier.

Example:

```text
EXP-001-baseline-logreg
EXP-002-random-forest
EXP-003-cnn
EXP-004-cnn-lstm
```

Record:

```yaml
experiment:
  id: EXP-003-cnn
  task: classification
  subjects:
  train:
  validation:
  test:
  window_ms:
  stride_ms:
  preprocessing:
  seed:
  model:
  metrics:
```

---

# Common Failure Modes

## Failure: random window split

Problem:

```text
Overlapping windows from the same signal appear in train and test.
```

Fix:

```text
Split by subject/repetition before windowing, or otherwise enforce group
separation according to the deployment scenario.
```

## Failure: normalization before splitting

Problem:

```text
Test-set statistics leak into training.
```

Fix:

```text
Fit preprocessing only on training data.
```

## Failure: using glove as an input without documenting it

Problem:

```text
The model may appear to predict movement from EMG while actually receiving
information that directly represents the hand state.
```

Fix:

```text
Clearly define which signals are model inputs and which are targets.
```

## Failure: reporting only accuracy

Problem:

```text
Class imbalance and per-class failures remain hidden.
```

Fix:

```text
Report class-wise metrics and confusion matrices.
```

## Failure: tuning on the test set

Problem:

```text
The reported test performance becomes optimistic.
```

Fix:

```text
Use train/validation for development and lock the test set.
```

## Failure: overinterpreting feature importance

Problem:

```text
Predictive importance is interpreted as biological causation.
```

Fix:

```text
Describe associations and validate physiological interpretations separately.
```

---

# Definition of Done

A major experiment is not complete until:

- [ ] Data provenance is documented.
- [ ] Data dimensions and labels are validated.
- [ ] Leakage checks pass.
- [ ] Train/validation/test groups are documented.
- [ ] Preprocessing is reproducible.
- [ ] A simple baseline exists.
- [ ] The main model is compared against the baseline.
- [ ] Metrics appropriate to the task are reported.
- [ ] Per-class/per-subject analysis is performed where relevant.
- [ ] Error analysis is included.
- [ ] Important patterns are investigated.
- [ ] Limitations are documented.
- [ ] Random seeds/configuration are recorded.
- [ ] The environment is reproducible.
- [ ] The notebook explains the "So What?"
- [ ] Claims remain within what the data actually supports.

---

# Agent Behavior

When modifying this project, an AI coding agent must:

1. Read `AGENTS.md` and `PROJECT.md` before making substantial changes.
2. Inspect existing code before creating replacement implementations.
3. Preserve the scientific meaning of Ninapro variables.
4. Never silently change labels or preprocessing definitions.
5. Never introduce a random sample split when a grouped split is required.
6. Prefer small, testable changes.
7. Explain assumptions when dataset structure is ambiguous.
8. Run relevant tests after modifying preprocessing or data-loading code.
9. Avoid modifying raw data.
10. Keep experiments reproducible.
11. Report uncertainty and limitations instead of inventing conclusions.
12. Distinguish classification from regression/kinematic prediction.
13. Never claim that a correlation demonstrates causation.
14. Never describe model performance as clinical efficacy unless clinical validation actually exists.
15. When adding a model, also add or update its evaluation procedure.
16. When changing preprocessing, document the reason and potential impact.
17. When changing the split strategy, document what deployment scenario the split represents.
18. Prefer configuration over hard-coded parameters.
19. Keep generated artifacts separate from source code.
20. Preserve a clear path from raw data → preprocessing → windows → model → evaluation → interpretation.

---

# Recommended First Milestone

Before building a sophisticated AI model, complete this minimal end-to-end experiment:

```text
Ninapro .mat
    ↓
Load + validate
    ↓
Inspect EMG / stimulus / glove
    ↓
Choose one exercise
    ↓
Choose a documented set of subjects/repetitions
    ↓
Group-aware train/validation/test split
    ↓
EMG preprocessing
    ↓
Temporal windowing
    ↓
Simple feature extraction
    ↓
Logistic Regression / SVM baseline
    ↓
Confusion matrix + macro F1
    ↓
Subject/repetition error analysis
    ↓
Interpret important EMG patterns
```

Only after this pipeline is correct should the project move to CNN/LSTM/Transformer architectures.

The objective is not to build the largest model.

The objective is to build a pipeline where the model's discovered EMG patterns can be trusted, reproduced, tested, and meaningfully interpreted.
