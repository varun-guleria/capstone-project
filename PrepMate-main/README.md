# PrepMate

PrepMate is an explainable, AI-assisted placement-preparation platform. It helps learners turn a target role or topic into a roadmap, study tasks, adaptive quizzes, progress insights, and an evidence-based past-paper revision list.

## Final-year-project highlights

- **Explainable Question Paper Predictor:** clusters equivalent questions with BGE embeddings when available and a TF-IDF fallback otherwise. Rankings show historical frequency, paper coverage, recency, and trend consistency.
- **Retrospective validation:** hides the newest paper, predicts it from earlier papers, and reports precision, recall, and F1. This keeps the predictor measurable instead of presenting unsupported certainty.
- **Personalized learning loop:** AI roadmap → automatically created tasks → adaptive quizzes → topic-level proficiency and next-study recommendation.
- **Practical input/output:** import dated `.csv` or `.txt` question records and download a ranked Word revision sheet.
- **Readiness Lab:** target-profile onboarding, diagnostic baseline, competency map, 7-day spaced revision plan, timed negative-marking mock exam, and public-GitHub portfolio evidence rubric.

## Architecture

| Layer | Technology | Responsibility |
| --- | --- | --- |
| Web client | React, Vite, Tailwind, Framer Motion | Learning workspace and visual analytics |
| API | Express | AI orchestration, resources, prediction and validation endpoints |
| Semantic service | FastAPI, Sentence Transformers (BGE) | Optional local text embeddings |
| Resilience | TF-IDF + lexical/intention signals | Prediction remains usable if the embedding service is offline |

## Run locally

1. Install JavaScript dependencies: `npm install`
2. Copy `.env.example` to `.env`.
3. Copy `server/.env.example` to `server/.env` and add Groq keys if you want AI roadmaps and quizzes.
4. Install the optional semantic-service dependencies:

   ```bash
   python -m pip install -r server/embedding-service/requirements.txt
   ```

5. Run all services with `npm start`.

The client opens at the Vite URL, the Express API runs on port `5000`, and the embedding service runs on port `8000`. The predictor automatically uses its standard TF-IDF model if the embedding service is unavailable.

## Readiness Lab workflow

Open **Readiness Lab** from the home page to create an exam, skill, or placement target. The module persists the target profile, diagnostic, planner, and mock history locally in the browser. Its readiness index combines roadmap coverage, adaptive-quiz mastery, diagnostic confidence, mock performance, and practice consistency.

The portfolio evidence review accepts a public `github.com/owner/repository` URL and scores observable repository metadata plus evidence supplied by the learner (deployment, tests, and documentation). It deliberately reports evidence gaps instead of pretending to perform an unverifiable code review.

## Question-paper data format

Paste or import one question per line in this format:

```text
2023, Explain gradient descent.
2024, How does gradient descent minimize loss?
2025, Describe gradient descent step by step.
```

Use at least three dated records to rank themes. Use papers from at least two years to run a backtest.

## Quality checks

```bash
npm run lint
npm run build
```

## Evaluation note

The displayed prediction score is a **revision priority**, not a guarantee that a question will appear. Use the built-in latest-paper backtest and report its precision, recall, and F1 alongside your project results.
