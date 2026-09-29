## Minimum Expected Deliverables

1. Well documented Jupyter notebook 
	* A Jupyter notebook documenting all the 9 steps (see [[Notebook reference]], discussed in class; 9 steps described in the rubric) 
	* Each step should contain a **brief and to-the-point** description (Code commented or/ and markdown) on the **learnings, insights and clinical implications** derived from the analysis **at each step** 
	* Focus on your ability to **translate the technical aspects of ML/AI to a non-technical audience** e.g. clinicians, lawmakers, patients, etc. – **“So What!?”** 
2. A README.md with all general details 
	* Introduction and purpose – describe motivation, goals, and clinical or domain context 
	* Project structure – list key files, scripts, and their roles 
	* **Install** and environment – specify dependencies, environment file, and setup steps 
	* **Quickstart** workflow – explain how to run the notebook or pipeline (any one should be able to run ti from it) 
	* **Data description** – summarize dataset, target variable, features, and any caveats (e.g., synthetic) 
	* **Evaluation** and **thresholding** – explain metrics, calibration, trade offs, and decision policies 
	* **Responsible** AI and **reproducibility** – cover interpretability, error analysis, governance, random seed, and license 
3. An environment.yml 
	* Includes all **required libraries** for your project 
	* Even better if all library versions are “baked” in the environment.yml 
4. A “Power Point” presentation with your RAI toolkit analysis 
	* Slides with screenshots and brief and to-the-point explanations with the **learnings, insights and clinical implications** derived from your analysis 
	* Covering Data analysis, Model overview and fairness, Error analysis, Feature importance, Counterfactuals and Causal analysis extracting clinical insights and recommendations . Highlighting **non-trivial insights**, with **mitigations and clinician-ready recommendations** 
	* Policy **implications Pros, Cons, consequences, implications, etc.** 
5. Extra points for a utils.py (nice to have) 
	* Ideally, you should set up aside a “utils.py” file with all the functions or scripts you call often, transformations or plots you apply to the data, and don’t need to be shown in the Notebook 
	* i.e. you make it easier for your audience to follow and read the analysis on your notebook, w/ out the noise of ancillary script
## Project Rubric and Expectations

| Category                                                 | Expectations                                                                                                                                                                                                                                                                                                                                                                               | Weight |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| **1. Clinical problem framing  <br>and study objective** | **Clear clinical question**, target population, decision context, success criteria, constraints and potential harms                                                                                                                                                                                                                                                                        | 10%    |
| **2. Data characterization and  <br>representativeness** | **Describe** sources, inclusion and exclusion, missingness, label quality, temporal span, class imbalance, cohort tables and plots, discussion of sampling bias and external validity                                                                                                                                                                                                      | 10%    |
| **3. Experimental design and  <br>splits**               | **Split** matches **deployment** reality, e.g. temporal, site or  group-aware where appropriate, seeds fixed, environment.yml captured, assumptions and limits stated                                                                                                                                                                                                                      | 5%     |
| **4. Pipelines, baselines and  <br>leakage controls**    | All prep and feature engineering inside pipelines, **leakage  <br>checks, baseline** defined before tuning, stratification  <br>aligned to **prevalence** and cohorts                                                                                                                                                                                                                      | 10%    |
| **5. Metrics and discrimination  <br>analysis**          | Metrics fit the clinical task and prevalence, subgroup metrics reported, trade-offs quantified, harms for false positives and false negatives explained                                                                                                                                                                                                                                    | 15%    |
| **6. Probability calibration and  <br>uncertainty**      | **Calibrates**, shows reliability plot and calibration **metric** such as Brier score or expected calibration error, explains **clinical implications** of improved calibration                                                                                                                                                                                                            | 8%     |
| **7. Threshold selection and  <br>decision analysis**    | Compares at **least two methods**. Quantifies **operational  <br>load**, and patient **impact** e.g. missed cases. Chooses and<br>**justifies** final threshold with a clear **so-what**                                                                                                                                                                                                   | 8%     |
| **8. Final test evaluation and  <br>generalization**     | Locks **threshold before test**, reports test **performance**,  subgroup **fairness checks**, clear insights and implications for healthcare stakeholders                                                                                                                                                                                                                                  | 4%     |
| **9. Responsible AI analysis (RAI  <br>Toolbox**         | Builds RAIInsights and explores with ResponsibleAIDashboard. Uses **Data analysis, Model overview and fairness, Error analysis, Feature importance, Counterfactuals and Causal analysis** to extract **further clinical insights and recommendations.** Forms at **least one cohort**, surfaces **non-trivial insights**, proposes **mitigations** and **clinician-ready** recommendations | 30%    |

## Guidelines and Tips
1. **Tell a Compelling Clinical Story**  
	 * Open with the specific patient, the clinical decision, and the success criteria before showing any models  
	 * Present a clear cohort table detailing data sources, time frames, inclusion/exclusion criteria, and outcome prevalence  
2. **Build a Reproducible & Leak-Proof Pipeline**  
	 * Place all preprocessing and feature engineering inside a scikit-learn Pipeline with fixed seeds to ensure full reproducibility  
	 * Use a data split that mirrors real-world deployment (e.g., temporal or by site) and explain precisely how it prevents data leakage  
3. **Translate Performance into Patient Impact**  
	 * For every key metric, report the impact in clinical terms: false alerts per 1000 patients, number of missed cases, and expected staff workload  
	 * Provide subgroup results for key patient cohorts and add a one-sentence "so what" explaining the clinical implication of any performance gaps  
4. **Justify Your Operating Point with Evidence**  
	 * Calibrate probabilities on the **validation set only** and show a reliability plot with a Brier score to prove your model's outputs are trustworthy  
	 * Compare at least two thresholding methods (e.g., workload-constrained vs. recall-floor) and justify your final choice with a clear impact table  
5. **Use Responsible AI to Plan for Deployment**  
	 * Go beyond exploration and use the ResponsibleAIDashboard to identify the top three deployment risks (e.g., bias, error in a key group)  
	 * For each risk, propose a concrete mitigation, estimate its potential effect, and outline a simple monitoring plan with alert triggers
## Taking it to the next Level
This section focuses on some ideas to develop the project further, chose **one** of the Following
### Analyse Each Group's Data 
* Study each patient cohort's training data **separately** 
* Check if data **patterns** explain the model's behaviour 
* Confirm if the scoring difference is a **real** pattern
### Set Different Thresholds for Each Group  
 * Use tools like **Fairlearn** to find subgroup-specific thresholds  
 * Select cutoffs that ensure **fairness** across the groups  
 * This is a fast way to **reduce** immediate harm  
### Build Smarter or Separate Models  
 * Train **different** models for each distinct patient population  
 * Use **complex** models that can learn interaction effects  
 * This addresses the root cause of scoring differences  
### Find and Add Better Features  
 * The model is relying on a **biased** proxy for risk  
 * Advocate for collecting more **meaningful** patient data  
 * Focus on features that capture true **causal** factors  
### Analyse Fairness Metrics  
 * Disaggregate performance metrics across patient groups  
 * Use tools like Fairlearn to measure disparity  
 * Check for Equalized Odds or Opportunity