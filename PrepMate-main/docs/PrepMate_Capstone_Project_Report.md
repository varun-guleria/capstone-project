# PREPMATE

## An Explainable AI-Enabled Placement, Skill, and Exam Preparation Platform

### Capstone Project Report

Submitted in partial fulfilment of the requirements for the award of the degree of

**[Bachelor of Technology / Bachelor of Engineering]**

in

**[Computer Science and Engineering / Your Department]**

Submitted by

**[Student Name]**  
**[University Roll Number]**

Under the guidance of

**[Guide Name and Designation]**

**[Department Name]**  
**[College / University Name]**  
**[Month, Year]**

---

## Certificate

This is to certify that the project report entitled **“PrepMate: An Explainable AI-Enabled Placement, Skill, and Exam Preparation Platform”** is a bona fide work carried out by **[Student Name]**, under my supervision, in partial fulfilment of the requirements for the award of **[Degree Name]** from **[University Name]**.

Guide Signature: ____________________  
Head of Department: ____________________  
Date: ____________________

---

## Declaration

I declare that this report describes my original work carried out as part of my capstone project. All sources of information used in preparing this report have been acknowledged in the references. The work has not been submitted previously, in whole or in part, for any other degree or diploma.

Student Signature: ____________________  
Date: ____________________

---

## Acknowledgement

I express my sincere gratitude to **[Guide Name]** for their guidance, feedback, and encouragement throughout the project. I thank the faculty of **[Department]**, my peers, and my family for their support. I also acknowledge the open-source communities behind React, Vite, Express, FastAPI, Sentence Transformers, and the other technologies used in this work.

---

## Abstract

Students preparing for placements, competitive examinations, or a new technical skill often use disconnected tools: video platforms for learning, spreadsheets for planning, generic quiz applications for practice, and past papers for revision. This fragmentation makes it difficult to determine what to study next, whether a learner has actually improved, and which themes are most valuable under limited time. PrepMate is proposed as an explainable AI-enabled preparation platform that unifies personalized roadmaps, adaptive quizzes, progress analytics, question-paper analysis, timed mock examinations, and portfolio evidence review.

The system is implemented as a full-stack web application. The React client provides the learning workspace, while an Express server orchestrates generative AI requests and prediction services. An optional FastAPI embedding service based on the BGE sentence-transformer model provides semantic question similarity. When this service is unavailable, the platform degrades gracefully to a transparent TF-IDF, token-overlap, character n-gram, and question-intent approach. The Question Paper Predictor groups equivalent historical questions and ranks revision themes using historical frequency, year coverage, recency, and trend consistency. It also includes retrospective validation: the latest year is held out, predicted from earlier papers, and evaluated using precision, recall, and F1 score.

PrepMate additionally introduces a Readiness Lab. It captures a learner’s target, diagnostic baseline, roadmap mastery, weekly plan, mock-exam performance, and evidence from a public GitHub repository. Instead of reporting an arbitrary proficiency for an untouched topic, the platform explicitly marks it as **Not assessed** until a diagnostic or quiz produces learner evidence. This makes the analytics more defensible and prevents seeded model outputs from being misrepresented as measured ability.

The project demonstrates how explainable ranking, adaptive practice, and learner-centred analytics can be combined into a practical capstone platform. The report documents the problem, methodology, architecture, algorithms, implementation, test plan, evaluation protocol, limitations, and future work. The project is designed to support both a working demonstration and a measurable academic evaluation.

**Keywords:** adaptive learning, placement preparation, question-paper prediction, semantic similarity, explainable AI, learning analytics, mock examination, skill-gap analysis.

---

## Table of Contents

1. Introduction
2. Literature Review and Background
3. Problem Statement and Requirements Analysis
4. Proposed Methodology
5. System Design and Architecture
6. Implementation Details
7. Algorithms and Data Models
8. Testing and Evaluation
9. Results, Discussion, and Demonstration Plan
10. Conclusion and Future Scope
11. References
12. Appendices

> **Formatting note:** When exported to Word using Times New Roman, 12 pt, 1.5 line spacing, standard margins, individual chapter title pages, tables, diagrams, screenshots, and appendices, this document is structured to expand into an approximately 45–55 page capstone report. Replace all `[bracketed]` placeholders and insert screenshots from the running application before submission.

---

# Chapter 1: Introduction

## 1.1 Background

Preparation for employment and examinations has become increasingly personalized but remains poorly integrated. A learner preparing for a software placement may need to study data structures, aptitude, computer science fundamentals, communication, projects, and interview practice. A learner preparing for an academic examination may need to cover a prescribed syllabus, solve previous papers, revise weak units, and practise under time pressure. Although many resources are available online, the learner must manually choose resources, maintain a plan, infer weaknesses, and decide whether they are ready.

The difficulty is not merely the lack of content. It is the lack of a closed learning loop. A useful preparation platform should accept a goal, establish a baseline, generate a feasible learning path, collect evidence through practice, analyse that evidence, and recommend the next action. It should also be transparent about what its predictions mean. A score that appears intelligent but cannot be explained or evaluated is unsuitable for a high-stakes learning decision.

PrepMate addresses this need through an integrated web application. It combines AI-assisted roadmaps and quizzes with a locally explainable Question Paper Predictor, learner progress storage, gamified achievement indicators, time management, a Readiness Lab, and a portfolio evidence rubric. The platform is intended as a preparation companion rather than a replacement for teachers, official syllabi, or mentors.

## 1.2 Motivation

The principal motivations for the project are as follows:

1. **Fragmented preparation workflows:** Students commonly switch among notes, YouTube, past papers, coding websites, calendars, and generic AI chat tools.
2. **Lack of evidence-based prioritisation:** Students may revise familiar topics instead of high-value or weak topics.
3. **One-size-fits-all quizzes:** Static quizzes neither adapt to a learner’s recent performance nor inform a realistic next step.
4. **Opaque prediction claims:** “Question prediction” systems often present unsupported guesses. A capstone project should expose its signals, assumptions, and validation method.
5. **Missing readiness measurement:** Completion of content does not necessarily imply preparedness. Readiness should combine coverage, performance, consistency, and time-bound practice.
6. **Portfolio quality is difficult to assess:** Placement candidates frequently need practical evidence such as documented, tested, deployed projects. A structured rubric makes this requirement visible.

## 1.3 Aim

The aim of PrepMate is to develop an explainable AI-enabled platform that helps a learner prepare for a technical skill, placement role, or examination through personalized planning, adaptive assessment, historical question analysis, readiness analytics, and evidence-based recommendations.

## 1.4 Objectives

The project objectives are:

- To generate personalized learning roadmaps from a learner’s topic, target outcome, and self-declared level.
- To transform roadmap checkpoints into actionable study tasks and quiz topics.
- To generate adaptive multiple-choice quizzes and track performance by topic.
- To avoid assigning a proficiency percentage before learner evidence exists.
- To analyse dated historical questions, merge equivalent themes, and rank revision priorities using explainable signals.
- To validate historical question ranking retrospectively using a held-out latest paper.
- To create a Readiness Lab that provides a diagnostic baseline, competency map, weekly plan, timed mock examination, and readiness index.
- To review public GitHub repository evidence using an observable rubric for deployment, tests, documentation, licensing, and repository metadata.
- To provide a responsive, usable, and extensible web application suitable for demonstration and future research.

## 1.5 Scope

The current implementation supports browser-based individual learning data. The learner can create and continue a roadmap on the same device, generate quizzes when the configured AI service is available, analyse question datasets, and use readiness features. The system supports public GitHub repository metadata review but does not claim to perform a complete static code audit.

The project does not currently include institutional single sign-on, multi-user database synchronization, proctored examinations, plagiarism detection, official university data integration, or a statistically calibrated forecast of an actual future examination paper. These are intentionally treated as future extensions rather than unsupported claims.

## 1.6 Contributions

The main contributions of the project are:

- An integrated preparation workflow spanning roadmap creation, tasks, quizzes, analytics, and readiness.
- An explainable question-theme ranking method with a semantic-embedding path and a non-neural fallback.
- A latest-paper holdout backtest for reporting precision, recall, and F1.
- An explicit “Not assessed” representation for new skills, preventing a seeded machine-learning prior from being presented as learner evidence.
- A practical Readiness Lab that combines diagnostic, planning, timed practice, and portfolio evidence.
- A transparent public-GitHub evidence rubric rather than an unverifiable claim of AI code understanding.

## 1.7 Organisation of the Report

Chapter 2 reviews the technical background. Chapter 3 defines the problem and requirements. Chapters 4 and 5 describe the methodology and architecture. Chapters 6 and 7 document implementation and algorithms. Chapters 8 and 9 provide testing, evaluation, and demonstration guidance. Chapter 10 concludes the report and identifies future enhancements.

---

# Chapter 2: Literature Review and Background

## 2.1 Intelligent Tutoring and Adaptive Learning

Intelligent tutoring systems aim to adapt learning content or feedback to an individual learner. A typical system contains a domain model, learner model, pedagogical model, and user interface. Modern web platforms often use lightweight performance models because they are easier to deploy and explain than a large opaque model. PrepMate follows this pragmatic approach: quiz performance, pace, recency, and difficulty influence a topic-level recommendation, while raw learning data remains available on the device.

Adaptive learning should not be confused with merely generating different questions. The adaptation loop must include observation, model update, and an instructional decision. In PrepMate, a completed quiz updates the learner’s topic record, derives a recommended difficulty, and affects the next action displayed in analytics and the Readiness Lab.

## 2.2 Knowledge Tracing and Learner Modelling

Knowledge tracing estimates a learner’s latent mastery from interactions over time. Classical approaches include Bayesian Knowledge Tracing, whereas newer work uses recurrent and attention-based neural models. Such models require extensive labelled interaction data and careful validation. A capstone prototype with small per-user data should avoid claiming clinical precision. PrepMate therefore uses a small feed-forward model as a local adaptive heuristic, labels its output as an estimate after evidence is available, and returns **Not assessed** for topics without attempts.

This design is academically important. It distinguishes an initialized model prior from an observed learner measurement. The first quiz or diagnostic establishes evidence; only then is a numeric estimate shown.

## 2.3 Semantic Similarity for Question Analysis

Historical examination questions can differ in wording while testing the same concept. String equality is therefore insufficient. Semantic sentence embeddings map related textual content into nearby vector representations. PrepMate optionally uses the BAAI BGE base English sentence-transformer model to encode questions into normalized dense vectors. Cosine similarity between vectors supports grouping of semantically similar questions.

Semantic models can be unavailable because of model-download, compute, or deployment constraints. To preserve availability, PrepMate implements a fallback based on TF-IDF cosine similarity, token overlap, character trigrams, phrase overlap, and detected question intent. This hybrid fallback is less semantically rich than BGE but remains inspectable and useful on modest infrastructure.

## 2.4 Explainable AI in Education

Explainability is important when algorithms influence learning priorities. A student should know whether a theme ranks highly because it occurs repeatedly, covers multiple years, appeared recently, or shows a stable trend. PrepMate exposes these scoring signals rather than outputting an unexplained “likely question.” The system also calls the displayed value a revision priority or confidence score rather than a guarantee.

## 2.5 Retrieval-Augmented and Generative AI Support

Large language models can generate learning roadmaps, quizzes, and feedback. Their practical limitations include hallucination, invalid structured output, provider availability, and cost. PrepMate mitigates selected risks by requesting JSON-only outputs, parsing the result on the server, validating expected array/object structure, and providing user-facing error states. Generated resources should still be reviewed; the platform should not claim that every external link is authoritative.

## 2.6 Mock Assessment and Deliberate Practice

Timed assessments provide evidence different from untimed study. They measure retrieval, pacing, and decision-making under constraints. PrepMate’s Readiness Lab includes a timed mock with positive marks for correct answers and a configurable design based on negative marking. Mock outcomes are recorded separately and contribute to the readiness index.

## 2.7 Portfolio Evidence and Employability

For placement preparation, a resume claim is stronger when supported by public work. A well-evidenced project normally includes a description, implementation, documentation, tests, deployment, and a license. PrepMate queries public GitHub repository metadata and combines it with learner-declared evidence. The output identifies missing evidence rather than making a false assertion about code quality from metadata alone.

## 2.8 Research Gap

Many existing tools specialise in only one activity: quiz practice, study scheduling, AI chat, or past-paper search. The gap addressed by PrepMate is an integrated and explainable workflow that connects a target goal to planning, assessment, historical evidence, readiness analytics, and a concrete recommendation. The project’s distinguishing technical element is not merely the presence of a language model; it is the measurable and interpretable question-paper analysis together with learner evidence tracking.

---

# Chapter 3: Problem Statement and Requirements Analysis

## 3.1 Problem Statement

Students lack an integrated system that can convert a learning or placement goal into a personalized plan, gather performance evidence, identify weak areas, prioritize historical question themes transparently, and communicate readiness without overstating certainty. Existing workflows are fragmented, manually maintained, and often fail to distinguish between content completion and actual preparedness.

## 3.2 Proposed Solution

PrepMate is a modular preparation platform with the following modules:

| Module | Primary user value | Evidence produced |
| --- | --- | --- |
| Personalized Learning | Goal-specific roadmap | Checkpoints and resources |
| Time Management | Actionable study plan | Task status and study-time budget |
| Adaptive Quiz | Topic practice | Accuracy, pace, attempts, estimated level |
| Progress Analytics | Visible learning state | Completion, topic status, next action |
| Question Predictor | Past-paper prioritisation | Theme clusters, scoring signals, backtest metrics |
| Curated Content | Resource discovery | Topic-specific public resources |
| Achievements | Motivation | Milestones based on actual activity |
| Readiness Lab | End-to-end readiness | Diagnostic, weekly plan, mock result, portfolio evidence |

## 3.3 Functional Requirements

**FR1:** The system shall allow a learner to define a learning topic, goal, level, and scope.  
**FR2:** The system shall generate a structured roadmap with checkpoints and resources.  
**FR3:** The system shall create tasks from roadmap checkpoints and allow their state to be updated.  
**FR4:** The system shall generate topic-specific multiple-choice quizzes.  
**FR5:** The system shall record quiz accuracy, duration, difficulty, streak, and topic history locally.  
**FR6:** The system shall mark a topic as not assessed until evidence exists.  
**FR7:** The system shall accept dated historical questions through demo data, pasted text, CSV, or TXT import.  
**FR8:** The system shall merge similar historical questions and rank themes using visible scoring signals.  
**FR9:** The system shall support a holdout backtest against the newest available year.  
**FR10:** The system shall allow a Readiness Lab profile for exam, skill, or placement preparation.  
**FR11:** The system shall generate a seven-day plan based on daily study minutes and unfinished tasks.  
**FR12:** The system shall conduct a timed mock with negative marking and update readiness records.  
**FR13:** The system shall review a public GitHub URL using an evidence rubric.  

## 3.4 Non-Functional Requirements

| Category | Requirement |
| --- | --- |
| Usability | Clear navigation, responsive layout, dark mode, concise feedback, useful empty states |
| Reliability | Graceful failure if AI, embedding, or public-resource services are unavailable |
| Explainability | Visible question-ranking signals and clear distinction between prediction and guarantee |
| Performance | Fast local rendering; embedding service is optional and bounded by timeout |
| Security | API keys are stored server-side in environment files; public GitHub URL is validated |
| Maintainability | Separated client, Express API, embedding service, and reusable local data libraries |
| Portability | Runs in local development and can be built for GitHub Pages frontend hosting |

## 3.5 User Personas

### Persona A: Placement Candidate

Riya is a final-year student targeting a frontend developer role. She needs to improve React, data structures, projects, and interview readiness. She uses the target profile, roadmap, adaptive quizzes, timed mock, and GitHub portfolio review.

### Persona B: Competitive Examination Learner

Arjun is preparing for a computer science examination. He imports dated questions, uses the predictor to identify recurring themes, schedules revision, and takes timed mocks before the examination date.

### Persona C: Faculty Mentor

A faculty mentor can demonstrate the system with a curated past-paper dataset, explain the predictor signals, and use the learner’s exported results as a basis for mentoring. A full cohort dashboard is future scope.

## 3.6 Use Cases

| Actor | Use case | Outcome |
| --- | --- | --- |
| Learner | Create roadmap | Sequential checkpoints and tasks |
| Learner | Take adaptive quiz | Measured topic evidence and next level |
| Learner | Analyse past papers | Ranked revision themes and backtest |
| Learner | Create readiness profile | Goal, date, daily budget, role context |
| Learner | Generate weekly plan | Time-boxed study and revision blocks |
| Learner | Take mock examination | Timed, negative-marked performance result |
| Learner | Submit GitHub URL | Portfolio evidence score and gaps |
| Mentor | Inspect demonstration output | Explainable project workflow |

