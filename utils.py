"""
Shared utilities for the Ninapro EMG movement-recognition project.

These helpers are used by the notebooks in `notebooks/` so that data loading,
labeling, windowing, splitting, modeling, and plotting logic is written once,
tested, and kept identical across the Disabled (Amputee) and Non-disabled
(Intact) cohort experiments. See `AGENTS.md` for the scientific rationale
behind each choice (leakage prevention, group-aware splits, purity-filtered
window labeling, train-only preprocessing).

Functions
---------
Reproducibility and paths
- set_seed(seed): seeds `random`, `numpy`, and `torch` for one experiment.
- find_repo_root(marker="Database"): walks up from the current working
  directory until a folder containing `marker` is found.
- get_data_root(root=None, marker="Database"): convenience wrapper returning
  `root / marker`.

Taxonomy and label helpers
- action_name(exercise, label): human-readable action name for an
  exercise/label pair.
- taxonomy_for_file(path, database_exercise): maps a raw Ninapro `exercise`
  index (1/2/3) to the shared taxonomy letter (A/B/C/D), based on whether the
  path belongs to the Amputee (Disabled) or Intact (Non-disabled) cohort.
- local_action_label(exercise, raw_label, cohort): normalizes cohort-specific
  raw `restimulus` values onto the 0..N local action id used by `ACTIONS`.
  Amputee Exercise C/D raw labels carry a numeric offset that must be
  subtracted; Intact raw labels do not.

Data loading
- load_mat_recording(path): loads `glove`/`restimulus`/`rerepetition`/
  `subject`/`exercise` arrays from a Ninapro MAT file (Disabled/Amputee
  cohort, 22-channel CyberGlove).
- load_xlsx_recording(path): loads the same arrays from a converter-generated
  XLSX workbook (Non-disabled/Intact cohort).
- load_emg_recording(path): loads `emg`/`restimulus`/`rerepetition`/`subject`
  arrays from a MAT file for classical EMG-feature experiments.

Windowing and features
- make_frequency_windows(...): segments a 22-channel glove signal into
  purity-filtered, non-overlapping-repetition windows and extracts a
  log-magnitude FFT feature per window.
- extract_emg_features(...): segments a 12-channel EMG signal into windows
  and computes MAV/RMS/waveform-length features plus a movement/rest label
  and grouping metadata.

Group-aware split (leakage prevention)
- subject_grouped_holdout(groups, subjects, seed, test_fraction=0.2): holds
  out a fraction of each subject's repetition groups so no window from a
  held-out repetition appears in training.
- cap_and_shuffle_classes(y, train_mask, seed, max_per_class=1000): caps the
  number of training windows per class and shuffles the selection.
- exercise_labels_from_classes(classes, y): derives the exercise-level label
  array from `"EXERCISE:LABEL"`-formatted class names.
- subject_holdout_split(subjects, seed, test_fraction=0.25, min_test_subjects=2):
  splits whole subjects into train/test (used for the binary movement-gate
  experiment, where every window of a held-out subject is unseen).

Model
- FrequencyMLP: small feed-forward classifier over frequency-domain window
  features.
- fit_frequency_model(...): trains a `FrequencyMLP` with AdamW and
  cross-entropy loss and returns the fitted model.
- predict_hierarchical(...): applies an exercise-routing model followed by
  per-exercise action models to produce final action-class predictions.

Evaluation and reporting
- classification_summary(y_true, y_pred): accuracy / balanced accuracy /
  macro-F1 dict for a classification result.
- per_subject_binary_metrics(...): per-subject accuracy / balanced accuracy /
  macro-F1 table, for cohort/fairness review of a binary classifier.
- save_experiment_json(results_dir, experiment_id, payload): writes a
  `results/metrics/*.json` artifact, converting numpy scalars to plain
  Python types first.

Plotting
- plot_bar(...): generic bar chart helper used for class-balance and
  per-exercise-F1 figures.
- plot_confusion_heatmap(...): annotated confusion-matrix heatmap.
"""
from __future__ import annotations

import json
import random
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Sequence, Tuple

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import torch
from scipy.io import loadmat
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    confusion_matrix,
    f1_score,
)
from torch import nn
from torch.utils.data import DataLoader, TensorDataset

__all__ = [
    "ACTIONS",
    "EXERCISE_NAMES",
    "set_seed",
    "find_repo_root",
    "get_data_root",
    "action_name",
    "taxonomy_for_file",
    "local_action_label",
    "load_mat_recording",
    "load_xlsx_recording",
    "load_emg_recording",
    "make_frequency_windows",
    "extract_emg_features",
    "subject_grouped_holdout",
    "cap_and_shuffle_classes",
    "exercise_labels_from_classes",
    "subject_holdout_split",
    "FrequencyMLP",
    "fit_frequency_model",
    "predict_hierarchical",
    "classification_summary",
    "per_subject_binary_metrics",
    "save_experiment_json",
    "plot_bar",
    "plot_confusion_heatmap",
]

# ---------------------------------------------------------------------------
# Shared movement taxonomy (see "Excercises and sensors.md" for the source list)
# ---------------------------------------------------------------------------

ACTIONS: Dict[str, List[str]] = {
    "A": [
        "Index flexion", "Index extension", "Middle flexion", "Middle extension",
        "Ring flexion", "Ring extension", "Little finger flexion", "Little finger extension",
        "Thumb adduction", "Thumb abduction", "Thumb flexion", "Thumb extension",
    ],
    "B": [
        "Thumb up", "Extension of index and middle flexion of the others",
        "Flexion of ring and little finger, extension of the others",
        "Thumb opposing base of little finger", "Abduction of all fingers",
        "Fingers flexed together in fist", "Pointing index", "Adduction of extended fingers",
        "Wrist supination (axis: middle finger)", "Wrist pronation (axis: middle finger)",
        "Wrist supination (axis: little finger)", "Wrist pronation (axis: little finger)",
        "Wrist flexion", "Wrist extension", "Wrist radial deviation", "Wrist ulnar deviation",
        "Wrist extension with closed hand",
    ],
    "C": [
        "Large diameter grasp", "Small diameter grasp (power grip)", "Fixed hook grasp",
        "Index finger extension grasp", "Medium wrap", "Ring grasp",
        "Prismatic four fingers grasp", "Stick grasp", "Writing tripod grasp",
        "Power sphere grasp", "Three finger sphere grasp", "Precision sphere grasp",
        "Tripod grasp", "Prismatic pinch grasp", "Tip pinch grasp", "Quadpod grasp",
        "Lateral grasp", "Parallel extension grasp", "Extension type grasp",
        "Power disk grasp", "Open a bottle with a tripod grasp",
        "Turn a screw (grasp the screwdriver with a stick grasp)",
        "Cut something (grasp the knife with an index finger extension grasp)",
    ],
    "D": [
        "Flexion of the little finger", "Flexion of the ring finger", "Flexion of the middle finger",
        "Flexion of the index finger", "Abduction of the thumb", "Flexion of the thumb",
        "Flexion of index and little finger", "Flexion of ring and middle finger",
        "Flexion of index finger and thumb",
    ],
}

EXERCISE_NAMES: Dict[str, str] = {
    "A": "Finger basics",
    "B": "Hand configurations and wrist",
    "C": "Grasps and functional movements",
    "D": "Combined finger actions",
    "R": "Rest",
}


# ---------------------------------------------------------------------------
# Reproducibility and paths
# ---------------------------------------------------------------------------

def set_seed(seed: int) -> None:
    """Seed `random`, `numpy`, and `torch` for one experiment."""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)


def find_repo_root(marker: str = "Database") -> Path:
    """Walk up from the current working directory until `marker` exists."""
    root = Path.cwd()
    if not (root / marker).exists():
        root = root.parent
    return root


def get_data_root(root: Optional[Path] = None, marker: str = "Database") -> Path:
    """Return `root / marker`, resolving `root` with `find_repo_root` if omitted."""
    root = root if root is not None else find_repo_root(marker)
    return root / marker


# ---------------------------------------------------------------------------
# Taxonomy and label helpers
# ---------------------------------------------------------------------------

def action_name(exercise: str, label: int) -> str:
    """Human-readable action name for an exercise/label pair (label 0 = Rest)."""
    if int(label) == 0:
        return "Rest"
    return ACTIONS[exercise][int(label) - 1]


def taxonomy_for_file(path, database_exercise: int) -> str:
    """Map a raw Ninapro `exercise` index (1/2/3) to the shared taxonomy letter.

    The Amputee (Disabled) and Intact (Non-disabled) cohorts assign different
    exercise letters to the same raw index: Amputee E1/E2/E3 -> B/C/D, Intact
    E1/E2/E3 -> A/B/C. Cohort is inferred from the file path.
    """
    cohort = "Amputee" if "Amputee" in str(path) else "Intact"
    mapping = {1: "B", 2: "C", 3: "D"} if cohort == "Amputee" else {1: "A", 2: "B", 3: "C"}
    return mapping[database_exercise]


def local_action_label(exercise: str, raw_label: int, cohort: str) -> int:
    """Normalize a raw `restimulus` value onto the local 0..N action id.

    Amputee Exercise C raw labels start at 18 and Exercise D raw labels start
    at 41; both are offset back to a 0-based local id. Intact raw labels (and
    Amputee Exercise B) are already 0-based and returned unchanged. Rest (0)
    is always 0 regardless of cohort or exercise.
    """
    raw_label = int(raw_label)
    if raw_label == 0:
        return 0
    if cohort == "Amputee" and exercise == "C":
        return raw_label - 17
    if cohort == "Amputee" and exercise == "D":
        return raw_label - 40
    return raw_label


# ---------------------------------------------------------------------------
# Data loading
# ---------------------------------------------------------------------------

def load_mat_recording(path) -> Dict[str, np.ndarray]:
    """Load `glove`/`restimulus`/`rerepetition`/`subject`/`exercise` from a MAT file.

    Used for the Disabled (Amputee) cohort's original 22-channel CyberGlove
    recordings. Raises `ValueError` if any required key is missing.
    """
    data = loadmat(path, simplify_cells=True)
    required = ("glove", "restimulus", "rerepetition", "subject", "exercise")
    missing = [key for key in required if key not in data]
    if missing:
        raise ValueError(f"{path.name} has no 22-sensor glove input; missing {missing}")
    return {key: np.asarray(data[key]) for key in required}


def load_xlsx_recording(path) -> Dict[str, np.ndarray]:
    """Load `glove`/`restimulus`/`rerepetition`/`subject`/`exercise` from a converter XLSX.

    Used for the Non-disabled (Intact) cohort, where only converter-generated
    XLSX exports are available in this workspace (no original DB1 MAT files).
    """
    from openpyxl import load_workbook

    workbook = load_workbook(path, read_only=True, data_only=True)
    if "glove" not in workbook.sheetnames:
        raise ValueError(f"{path.name} has no glove worksheet")

    def array(sheet: str) -> np.ndarray:
        rows = list(workbook[sheet].iter_rows(min_row=2, values_only=True))
        return np.asarray([[float(value) for value in row[1:]] for row in rows], dtype=np.float32)

    metadata = {
        str(row[0]): row[1]
        for row in workbook["metadata"].iter_rows(min_row=2, values_only=True)
        if row[0] is not None
    }
    result = {
        "glove": array("glove"),
        "restimulus": array("restimulus")[:, 0],
        "rerepetition": array("rerepetition")[:, 0],
        "subject": np.array([metadata["subject"]]),
        "exercise": np.array([metadata["exercise"]]),
    }
    workbook.close()
    return result


def load_emg_recording(path) -> Dict[str, np.ndarray]:
    """Load `emg`/`restimulus`/`rerepetition`/`subject` from a MAT file.

    Used for classical EMG-feature experiments (e.g., the movement-vs-rest
    Responsible AI notebook), which use the 12-channel EMG signal rather than
    the 22-channel glove signal.
    """
    data = loadmat(path, simplify_cells=True)
    required = ("emg", "restimulus", "rerepetition", "subject")
    missing = [key for key in required if key not in data]
    if missing:
        raise ValueError(f"{path.name} missing {missing}")
    return {key: np.asarray(data[key]) for key in required}


# ---------------------------------------------------------------------------
# Windowing and features
# ---------------------------------------------------------------------------

def make_frequency_windows(
    recording: Dict[str, np.ndarray],
    path,
    *,
    cohort: str,
    channels: int = 22,
    window_samples: int = 400,
    stride_samples: int = 100,
    fft_bins: int = 32,
    min_purity: float = 0.80,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """Segment a glove signal into purity-filtered windows and extract FFT features.

    Windows are majority-labeled with a `min_purity` threshold and discarded
    if they cross an `rerepetition` boundary (see AGENTS.md "Window Labeling"
    and "Data Leakage Prevention"). Each window's feature is the log-magnitude
    FFT of the mean-centered signal, truncated to `fft_bins` per channel.

    Returns
    -------
    (features, target_names, group_ids, action_names) : four aligned arrays,
    one row per retained window. `target_names` are `"EXERCISE:LABEL"`
    strings; `group_ids` are `"subject:exercise:rep<id>"` strings used for the
    group-aware split.
    """
    glove = np.asarray(recording["glove"], dtype=np.float32)
    raw_labels = np.asarray(recording["restimulus"]).reshape(-1).astype(int)
    groups = np.asarray(recording["rerepetition"]).reshape(-1).astype(int)
    database_exercise = int(np.asarray(recording["exercise"]).reshape(-1)[0])
    exercise = taxonomy_for_file(path, database_exercise)
    subject_prefix = "Amputee" if cohort == "Amputee" else "NonDisabled"
    subject = f"{subject_prefix}:S{int(np.asarray(recording['subject']).reshape(-1)[0])}"
    if glove.shape[1] != channels:
        raise ValueError(f"{path.name} expected {channels} glove channels, got {glove.shape[1]}")

    labels = np.asarray([local_action_label(exercise, value, cohort) for value in raw_labels])
    if np.any(labels < 0) or np.any(labels > len(ACTIONS[exercise])):
        raise ValueError(f"{path.name} labels do not fit {exercise} taxonomy")

    values, targets, group_ids, names = [], [], [], []
    for start in range(0, len(glove) - window_samples + 1, stride_samples):
        stop = start + window_samples
        block = labels[start:stop]
        rep = groups[start:stop]
        counts = np.bincount(block, minlength=50)
        label = int(counts.argmax())
        if counts[label] / window_samples < min_purity or np.any(rep != rep[0]):
            continue
        signal = glove[start:stop].astype(np.float32)
        signal = signal - np.mean(signal, axis=0, keepdims=True)
        spectrum = np.abs(np.fft.rfft(signal, axis=0))[:fft_bins]
        spectrum = np.log1p(spectrum).T.reshape(-1)
        values.append(spectrum)
        targets.append(f"{exercise}:{label}")
        group_ids.append(f"{subject}:{exercise}:rep{int(rep[window_samples // 2])}")
        names.append(action_name(exercise, label))
    return (
        np.asarray(values, dtype=np.float32),
        np.asarray(targets),
        np.asarray(group_ids),
        np.asarray(names),
    )


def extract_emg_features(
    recording: Dict[str, np.ndarray],
    path,
    *,
    emg_channels: int = 12,
    window_samples: int = 200,
    stride_samples: int = 50,
    min_purity: float = 0.80,
) -> List[dict]:
    """Segment an EMG signal into windows and compute MAV/RMS/waveform-length features.

    Also assigns a binary `is_movement` label (`restimulus > 0`) alongside the
    finer-grained `action_id`, and a `repetition_group` id for a subject-aware
    split. Feature extraction runs on raw EMG only; scaling must be fit inside
    the training pipeline (see AGENTS.md "Preprocessing").
    """
    emg = np.asarray(recording["emg"], dtype=np.float32)
    labels = np.asarray(recording["restimulus"]).reshape(-1).astype(int)
    groups = np.asarray(recording["rerepetition"]).reshape(-1).astype(int)
    subject = int(np.asarray(recording["subject"]).reshape(-1)[0])
    if emg.shape[1] != emg_channels:
        raise ValueError(f"{path.name} expected {emg_channels} EMG channels, got {emg.shape[1]}")

    rows = []
    for start in range(0, len(emg) - window_samples + 1, stride_samples):
        stop = start + window_samples
        block = labels[start:stop]
        rep = groups[start:stop]
        counts = np.bincount(block, minlength=18)
        label = int(counts.argmax())
        if counts[label] / window_samples < min_purity or np.any(rep != rep[0]):
            continue
        window = emg[start:stop]
        mav = np.mean(np.abs(window), axis=0)
        rms = np.sqrt(np.mean(window ** 2, axis=0))
        wl = np.sum(np.abs(np.diff(window, axis=0)), axis=0)
        row = {f"ch{ch + 1}_mav": mav[ch] for ch in range(emg_channels)}
        row.update({f"ch{ch + 1}_rms": rms[ch] for ch in range(emg_channels)})
        row.update({f"ch{ch + 1}_wl": wl[ch] for ch in range(emg_channels)})
        row["action_id"] = label
        row["is_movement"] = int(label > 0)
        row["subject"] = f"S{subject}"
        row["repetition_group"] = f"S{subject}:rep{int(rep[window_samples // 2])}"
        rows.append(row)
    return rows


# ---------------------------------------------------------------------------
# Group-aware split (leakage prevention)
# ---------------------------------------------------------------------------

def subject_grouped_holdout(
    groups: np.ndarray,
    subjects: np.ndarray,
    seed: int,
    test_fraction: float = 0.2,
) -> Tuple[np.ndarray, np.ndarray, set, set]:
    """Hold out a fraction of each subject's repetition groups for testing.

    Splitting by whole repetition-group id (not by window) ensures no window
    from a held-out repetition appears in training, preventing the
    overlapping-window leakage described in AGENTS.md.

    Returns `(train_mask, test_mask, train_groups, test_groups)`, all aligned
    to the input `groups` array.
    """
    rng = np.random.default_rng(seed)
    train_groups, test_groups = set(), set()
    for subject in np.unique(subjects):
        values = np.unique(groups[subjects == subject])
        rng.shuffle(values)
        split = max(1, round(len(values) * test_fraction))
        test_groups.update(values[:split])
        train_groups.update(values[split:])
    train_mask = np.isin(groups, list(train_groups))
    test_mask = np.isin(groups, list(test_groups))
    return train_mask, test_mask, train_groups, test_groups


def cap_and_shuffle_classes(
    y: np.ndarray,
    train_mask: np.ndarray,
    seed: int,
    max_per_class: int = 1000,
) -> np.ndarray:
    """Cap training windows per class at `max_per_class` and shuffle the selection.

    Returns the selected training indices (a subset of `np.flatnonzero(train_mask)`).
    """
    rng = np.random.default_rng(seed)
    selected: List[int] = []
    for label in np.unique(y[train_mask]):
        indices = np.flatnonzero(train_mask & (y == label))
        selected.extend(rng.choice(indices, min(max_per_class, len(indices)), replace=False))
    selected_array = np.asarray(selected)
    rng.shuffle(selected_array)
    return selected_array


def exercise_labels_from_classes(
    classes: Sequence[str],
    y: np.ndarray,
) -> Tuple[List[str], Dict[str, int], np.ndarray]:
    """Derive the exercise-level label array from `"EXERCISE:LABEL"` class names."""
    exercise_names = np.asarray([classes[index].split(":")[0] for index in y])
    exercise_ids = sorted(np.unique(exercise_names))
    exercise_to_id = {name: index for index, name in enumerate(exercise_ids)}
    y_exercise = np.asarray([exercise_to_id[name] for name in exercise_names])
    return exercise_ids, exercise_to_id, y_exercise


def subject_holdout_split(
    subjects: np.ndarray,
    seed: int,
    test_fraction: float = 0.25,
    min_test_subjects: int = 2,
) -> set:
    """Select whole subjects to hold out entirely (subject-level generalization split).

    Used for the movement-vs-rest binary gate, where the deployment question
    is "does this work for a person unseen during training" rather than "does
    this work for a new repetition by a known person".
    """
    rng = np.random.default_rng(seed)
    unique_subjects = np.asarray(subjects)
    rng.shuffle(unique_subjects)
    n_test_subjects = max(min_test_subjects, round(len(unique_subjects) * test_fraction))
    return set(unique_subjects[:n_test_subjects])


# ---------------------------------------------------------------------------
# Model
# ---------------------------------------------------------------------------

class FrequencyMLP(nn.Module):
    """Small feed-forward classifier over frequency-domain window features."""

    def __init__(self, n_features: int, n_classes: int):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(n_features, 512), nn.GELU(), nn.Dropout(0.05),
            nn.Linear(512, 256), nn.GELU(),
            nn.Linear(256, n_classes),
        )

    def forward(self, values: torch.Tensor) -> torch.Tensor:
        return self.net(values)


def fit_frequency_model(
    features: np.ndarray,
    labels: np.ndarray,
    n_classes: int,
    device: torch.device,
    epochs: int = 200,
    batch_size: int = 512,
    lr: float = 1e-3,
    weight_decay: float = 1e-5,
    log_every: int = 10,
) -> FrequencyMLP:
    """Train a `FrequencyMLP` with AdamW and cross-entropy loss."""
    fitted = FrequencyMLP(features.shape[1], n_classes).to(device)
    optimizer = torch.optim.AdamW(fitted.parameters(), lr=lr, weight_decay=weight_decay)
    dataset = TensorDataset(torch.from_numpy(features), torch.from_numpy(labels).long())
    loader = DataLoader(dataset, batch_size=batch_size, shuffle=True)
    for epoch in range(epochs):
        fitted.train()
        for batch_x, batch_y in loader:
            batch_x, batch_y = batch_x.to(device), batch_y.to(device)
            optimizer.zero_grad()
            nn.functional.cross_entropy(fitted(batch_x), batch_y).backward()
            optimizer.step()
        if (epoch + 1) % log_every == 0:
            print("model epochs", epoch + 1, "classes", n_classes)
    return fitted


def predict_hierarchical(
    exercise_model: FrequencyMLP,
    action_models: Dict[str, Tuple[FrequencyMLP, List[int]]],
    exercise_ids: Sequence[str],
    X_test: np.ndarray,
    device: torch.device,
) -> Tuple[np.ndarray, np.ndarray]:
    """Predict exercise, then route each window to its exercise-specific action model.

    Returns `(predicted_exercises, predictions)`, where `predictions` are
    global class indices (aligned to the `classes` array used at feature time).
    """
    exercise_model.eval()
    with torch.no_grad():
        predicted_exercises = exercise_model(torch.from_numpy(X_test).to(device)).argmax(1).cpu().numpy()
    predictions = np.empty(len(X_test), dtype=int)
    for exercise_index, exercise in enumerate(exercise_ids):
        keep = predicted_exercises == exercise_index
        if not keep.any():
            continue
        action_model, global_ids = action_models[exercise]
        action_model.eval()
        with torch.no_grad():
            local_predictions = action_model(torch.from_numpy(X_test[keep]).to(device)).argmax(1).cpu().numpy()
        predictions[keep] = np.asarray(global_ids)[local_predictions]
    return predicted_exercises, predictions


# ---------------------------------------------------------------------------
# Evaluation and reporting
# ---------------------------------------------------------------------------

def classification_summary(y_true, y_pred) -> Dict[str, float]:
    """Accuracy / balanced accuracy / macro-F1 dict for a classification result."""
    return {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "balanced_accuracy": float(balanced_accuracy_score(y_true, y_pred)),
        "macro_f1": float(f1_score(y_true, y_pred, average="macro", zero_division=0)),
    }


def per_subject_binary_metrics(
    test_df: pd.DataFrame,
    feature_columns: Sequence[str],
    target_column: str,
    model,
    test_subjects: Iterable[str],
    subject_column: str = "subject",
) -> List[dict]:
    """Per-subject accuracy / balanced accuracy / macro-F1 for a binary classifier.

    Used to check whether a movement-vs-rest gate is equally reliable across
    held-out subjects, rather than only on average (AGENTS.md "Responsible AI").
    """
    rows = []
    for subject_id in sorted(test_subjects):
        subset = test_df[test_df[subject_column] == subject_id]
        if subset.empty:
            continue
        predicted = model.predict(subset[feature_columns])
        row = {
            "subject": subject_id,
            "windows": len(subset),
            "movement_share": float(subset[target_column].mean()),
        }
        row.update(classification_summary(subset[target_column], predicted))
        rows.append(row)
    return rows


def _to_jsonable(value):
    """Recursively convert numpy scalars/arrays to plain Python types for JSON."""
    if isinstance(value, dict):
        return {key: _to_jsonable(item) for key, item in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [_to_jsonable(item) for item in value]
    if isinstance(value, np.floating):
        return float(value)
    if isinstance(value, np.integer):
        return int(value)
    if isinstance(value, np.ndarray):
        return _to_jsonable(value.tolist())
    return value


def save_experiment_json(results_dir: Path, experiment_id: str, payload: dict, suffix: str = "experiment") -> Path:
    """Write `results_dir / f"{experiment_id}_{suffix}.json"`, numpy-safe."""
    results_dir.mkdir(parents=True, exist_ok=True)
    out_path = results_dir / f"{experiment_id}_{suffix}.json"
    with open(out_path, "w") as handle:
        json.dump(_to_jsonable(payload), handle, indent=2)
    return out_path


# ---------------------------------------------------------------------------
# Plotting
# ---------------------------------------------------------------------------

def plot_bar(
    categories: Sequence[str],
    values: Sequence[float],
    title: str,
    xlabel: str,
    ylabel: str,
    *,
    colors=None,
    ylim: Optional[Tuple[float, float]] = None,
    figsize: Tuple[float, float] = (6, 4),
    save_path: Optional[Path] = None,
):
    """Generic bar chart used for class-balance and per-exercise-F1 figures."""
    fig, ax = plt.subplots(figsize=figsize)
    ax.bar(categories, values, color=colors)
    ax.set_title(title)
    ax.set_xlabel(xlabel)
    ax.set_ylabel(ylabel)
    if ylim is not None:
        ax.set_ylim(*ylim)
    plt.tight_layout()
    if save_path is not None:
        fig.savefig(save_path, dpi=150)
    plt.show()
    return fig, ax


def plot_confusion_heatmap(
    cm: np.ndarray,
    labels: Sequence[str],
    title: str,
    *,
    figsize: Tuple[float, float] = (4.5, 4),
    save_path: Optional[Path] = None,
):
    """Annotated confusion-matrix heatmap."""
    fig, ax = plt.subplots(figsize=figsize)
    im = ax.imshow(cm, cmap="Blues")
    ax.set_xticks(range(len(labels)))
    ax.set_xticklabels(labels)
    ax.set_yticks(range(len(labels)))
    ax.set_yticklabels(labels)
    ax.set_xlabel("Predicted exercise")
    ax.set_ylabel("True exercise")
    ax.set_title(title)
    half = cm.max() / 2
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            ax.text(j, i, cm[i, j], ha="center", va="center", color="black" if cm[i, j] < half else "white")
    fig.colorbar(im, ax=ax, fraction=0.046)
    plt.tight_layout()
    if save_path is not None:
        fig.savefig(save_path, dpi=150)
    plt.show()
    return fig, ax
