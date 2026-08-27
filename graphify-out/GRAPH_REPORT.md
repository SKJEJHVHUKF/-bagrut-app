# Graph Report - .  (2026-08-06)

## Corpus Check
- Large corpus: 389 files · ~907,034 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 2616 nodes · 6509 edges · 130 communities (116 shown, 14 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 61 edges (avg confidence: 0.65)
- Token cost: 137,890 input · 0 output

## Community Hubs (Navigation)
- Solution Analysis API
- Chat Grading & Tutor API
- Errors & AI Tutor Actions
- Bagrut Archive Browsing
- Local Math Solve Engine
- Explain & Hint APIs
- Teach Session Flow
- Math Problem Classification
- Learn Page Components
- Topic Demo Page
- Lesson Content Index
- Past Bagrut Exam Content
- Advanced Patterns & Diagrams
- Ghost Replay Walkthroughs
- Practice Exercise Pages
- Scan Page UI
- Advanced Exam Entry Gate
- Questions & Thinking APIs
- Math Scan Cost Metering
- OCR Engine Chain
- Insights Dashboard
- Scan Question Tutor
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 61
- Community 62
- Community 63
- Community 64
- Community 65
- Community 66
- Community 67
- Community 68
- Community 69
- Community 70
- Community 71
- Community 72
- Community 73
- Community 74
- Community 75
- Community 76
- Community 77
- Community 78
- Community 79
- Community 80
- Community 81
- Community 82
- Community 83
- Community 84
- Community 85
- Community 86
- Community 87
- Community 88
- Community 89
- Community 90
- Community 91
- Community 92
- Community 93
- Community 94
- Community 95
- Community 96
- Community 97
- Community 98
- Community 99
- Community 100
- Community 101
- Community 102
- Community 103
- Community 104
- Community 105
- Community 106
- Community 107
- Community 108
- Community 109
- Community 110
- Community 111
- Community 112
- Community 113
- Community 114
- Community 115
- Community 116
- Community 117
- Community 121
- Community 122
- Community 123
- Community 124
- Community 125
- Community 126
- Community 127

## God Nodes (most connected - your core abstractions)
1. `MathText()` - 61 edges
2. `isProUser()` - 42 edges
3. `getLesson()` - 39 edges
4. `createClient()` - 34 edges
5. `createClient()` - 33 edges
6. `getSubTopic()` - 30 edges
7. `scripts` - 30 edges
8. `allLessonKeys()` - 28 edges
9. `buttonTap` - 26 edges
10. `Quiz()` - 25 edges

## Surprising Connections (you probably didn't know these)
- `Complex numbers: cis and degrees only, never e^{iθ} or radians` --semantically_similar_to--> `5-unit bagrut math conventions (cis degrees, y²=2px, c²=a²−b²)`  [INFERRED] [semantically similar]
  content/learning-paths/STYLE_GUIDE.md → CLAUDE.md
- `Separating "he is weak" from "we don't know"` --semantically_similar_to--> `verify-mcq-distinct coverage honesty ("0 problems" ≠ correct)`  [INFERRED] [semantically similar]
  plans/cognitive-map-complex.md → CLAUDE.md
- `Next-best-step single arbitrator` --semantically_similar_to--> `Progressive hint reveal + reviewIfStuck linkage`  [INFERRED] [semantically similar]
  plans/cognitive-map-complex.md → content/learning-paths/STYLE_GUIDE.md
- `No Hebrew inside math (learned in analytic geometry, 2026-06-10)` --semantically_similar_to--> `Never put Hebrew inside KaTeX`  [INFERRED] [semantically similar]
  content/learning-paths/STYLE_GUIDE.md → CLAUDE.md
- `Diagram rules: DiagramSpec, custom raw SVG only, no fn: closures` --semantically_similar_to--> `Dark-ink-on-light SVG diagram palette + custom-SVG-only rule`  [INFERRED] [semantically similar]
  content/learning-paths/STYLE_GUIDE.md → CLAUDE.md

## Import Cycles
- 3-file cycle: `content/cognition/types.ts -> lib/roadmap-levels.ts -> content/ghost-replay/types.ts -> content/cognition/types.ts`
- 4-file cycle: `content/cognition/types.ts -> lib/roadmap-levels.ts -> content/ghost-replay/index.ts -> content/ghost-replay/types.ts -> content/cognition/types.ts`
- 5-file cycle: `content/cognition/types.ts -> lib/roadmap-levels.ts -> content/ghost-replay/index.ts -> content/ghost-replay/math5/complex-numbers.ts -> content/ghost-replay/types.ts -> content/cognition/types.ts`

## Hyperedges (group relationships)
- **buildCognitiveState pipeline (observe → trace → misconceptions → diagnose → next-step → insight)** — plans_cognitive_map_complex_build_cognitive_state, plans_cognitive_map_complex_bkt_lite, plans_cognitive_map_complex_forgetting_decay, plans_cognitive_map_complex_misconception_detection, plans_cognitive_map_complex_diagnose_weakest_link, plans_cognitive_map_complex_next_best_step, plans_cognitive_map_complex_insight_templates [EXTRACTED 1.00]
- **Hebrew/KaTeX bidi safety system (rules, render contract, CSS floor, enforcing gate)** — claude_hebrew_katex_prohibition, claude_mathtext_contract, claude_unscoped_katex_floor, claude_verify_content_gate, content_learning_paths_style_guide_hebrew_in_math_ban, content_learning_paths_style_guide_bidi_fixed_at_render, content_learning_paths_style_guide_mathtext_contract [INFERRED 0.85]
- **The npm run check gate chain (typecheck, content, concept, mcq-distinct, cognition, tests, build)** — claude_build_typecheck_gate, claude_verify_content_gate, claude_verify_concept_gate, claude_verify_mcq_distinct, plans_cognitive_map_complex_verify_cognition, plans_cognitive_map_complex_test_cognition [INFERRED 0.95]

## Communities (130 total, 14 thin omitted)

### Community 0 - "Solution Analysis API"
Cohesion: 0.06
Nodes (61): ALLOWED_MIME, AUDIT_SCHEMA, AUDIT_SYSTEM_PROMPT, buildTopicReference(), ERROR_CATEGORY_ENUM, isAllowedOrigin(), maxDuration, POST() (+53 more)

### Community 1 - "Chat Grading & Tutor API"
Cohesion: 0.07
Nodes (55): maxDuration, POST(), NOTE: we do NOT blacklist-reject the solution itself. A student's work is, maxDuration, POST(), POST(), AGENT_HOURLY_LIMIT, AgentKind (+47 more)

### Community 2 - "Errors & AI Tutor Actions"
Cohesion: 0.06
Nodes (50): ErrorsPage(), ActionKey, ActionState, AITutorActions(), AITutorActionsProps, INITIAL_STATE, SimilarQuestionResult, AnswerInput() (+42 more)

### Community 3 - "Bagrut Archive Browsing"
Cohesion: 0.06
Nodes (34): AuthState, BagruyotArchivePage(), AuthState, BagruyotLandingPage(), stripMath(), LoginForm(), formatHebrewDate(), MyPlanPage() (+26 more)

### Community 4 - "Local Math Solve Engine"
Cohesion: 0.10
Nodes (57): antiderivative(), bilinearCoefficients(), concludeRoots(), dedupeRoots(), deflate(), describeDoubleRoot(), divisors(), ENGINE_ID (+49 more)

### Community 5 - "Explain & Hint APIs"
Cohesion: 0.06
Nodes (46): ExplainResponse, maxDuration, POST(), RESPONSE_SCHEMA, HintHelpResponse, maxDuration, POST(), RESPONSE_SCHEMA (+38 more)

### Community 6 - "Teach Session Flow"
Cohesion: 0.07
Nodes (42): maxDuration, NOTE: the student's explanation is deliberately NOT blacklist-rejected., Turn, Wall, FREE_DAILY_TEACH, MAX_TEACH_MESSAGE_LEN, PRO_DAILY_TEACH, TEACH_HISTORY_TURNS (+34 more)

### Community 7 - "Math Problem Classification"
Cohesion: 0.06
Nodes (39): classifyDomain(), ClassifyInput, classifyProblem(), CueRule, DOMAIN_CUES, extractBounds(), extractSectionLabels(), KIND_CUES (+31 more)

### Community 8 - "Learn Page Components"
Cohesion: 0.08
Nodes (33): BagrutPartCard(), BagrutQuestionBlock(), DIFF_META, GuidedExampleCard(), ConceptsView(), FormulaSheetView(), IntuitionView(), PitfallsView() (+25 more)

### Community 9 - "Topic Demo Page"
Cohesion: 0.09
Nodes (29): metadata, CommonMistakesSection(), ExamConnectionSection(), FormalDefinitionSection(), IntuitionSection(), KeyConceptsSection(), PracticeCard(), PracticeSection() (+21 more)

### Community 10 - "Lesson Content Index"
Cohesion: 0.14
Nodes (26): LESSONS, math5Algebra, math5AnalyticGeometry, math5ComplexNumbers, math5Derivatives, math5EuclideanGeometry, math5ExpFunctions, math5Functions (+18 more)

### Community 11 - "Past Bagrut Exam Content"
Cohesion: 0.11
Nodes (21): bagrut2020Summer582, bagrut2021Summer582, bagrut2021Summer582MoedA, bagrut2021Summer582MoedB, bagrut2022Summer571MoedA, bagrut2022Summer582, bagrut2022Summer582MoedB, bagrut2022Winter582 (+13 more)

### Community 12 - "Advanced Patterns & Diagrams"
Cohesion: 0.10
Nodes (15): TechniqueCard(), DiagramRenderer(), FormulaCard(), isMathOnly(), MathText(), Props, NextSubTopicRef, SubTopicLesson() (+7 more)

### Community 13 - "Ghost Replay Walkthroughs"
Cohesion: 0.12
Nodes (30): ExaminerTrapBadge(), FailureBranch(), GhostReplayLevel(), GhostStepCard(), getGhostReplays(), getGhostReplaysForSubTopic(), hasGhostReplay(), key() (+22 more)

### Community 14 - "Practice Exercise Pages"
Cohesion: 0.10
Nodes (30): ExercisePage(), SUBJECT_LABELS, LessonPage(), BagrutQuestion, BagrutQuestionView(), Difficulty, LessonView(), QuestionPart (+22 more)

### Community 15 - "Scan Page UI"
Cohesion: 0.08
Nodes (28): Access, CostFooter(), OCR_STAGE_LABEL, RecognisedQuestion(), ScanPage(), Band, bandFor(), ConfidenceMeter() (+20 more)

### Community 16 - "Advanced Exam Entry Gate"
Cohesion: 0.10
Nodes (27): PartPracticeCard(), EntryGate(), MCQ_LABELS, ExamPartCard(), ExamQuestionCard(), ExamSimulation(), Phase, CommitPrompt() (+19 more)

### Community 17 - "Questions & Thinking APIs"
Cohesion: 0.09
Nodes (27): maxDuration, SUBJECTS, GEN_SCHEMA, maxDuration, buildConceptPrompt(), conceptPoolKind(), levelBlock(), unitsLabel() (+19 more)

### Community 18 - "Math Scan Cost Metering"
Cohesion: 0.13
Nodes (29): CostMeter, costOfCall(), CostSummary, ModelId, now(), RATES, readTraces(), recordTrace() (+21 more)

### Community 19 - "OCR Engine Chain"
Cohesion: 0.09
Nodes (25): FREE_CHAIN, OcrChainOptions, PAID_CHAIN, DEFAULT_LANGUAGES, getWorker(), hasWasmSimd(), tesseractEngine, TesseractLine (+17 more)

### Community 20 - "Insights Dashboard"
Cohesion: 0.13
Nodes (32): barColor(), Habit, InsightsPage(), pctColor(), SUBJECT_NAMES, SubjectData, subTopicTitle(), currentStreak() (+24 more)

### Community 21 - "Scan Question Tutor"
Cohesion: 0.12
Nodes (28): QuestionTutor(), Rich(), allLevels(), COMMON_KINDS, DOMAIN_TO_TOPICS, LEVEL_SCOPES, LevelScope, MATH5_TOPICS (+20 more)

### Community 22 - "Community 22"
Cohesion: 0.15
Nodes (29): AdvancedCourseView(), PatternMapView(), CourseTracks(), LearningPathView(), hasAdvancedCourse(), AdvancedTopicProgress, getAdvancedProgress(), getCompletedAdvancedSections() (+21 more)

### Community 23 - "Community 23"
Cohesion: 0.15
Nodes (16): math5AlgebraConcepts, math5AnalyticGeometryConcepts, math5ComplexNumbersConcepts, math5DerivativesConcepts, math5EuclideanGeometryConcepts, math5ExpFunctionsConcepts, math5FunctionsConcepts, math5GrowthDecayConcepts (+8 more)

### Community 24 - "Community 24"
Cohesion: 0.11
Nodes (28): ALLOWED_MIME, costOf(), GET(), handleJson(), handleTranscribe(), isAllowedOrigin(), json(), KNOWN_TOPICS (+20 more)

### Community 25 - "Community 25"
Cohesion: 0.12
Nodes (25): AppChrome(), HIDDEN_PREFIXES, initialsOf(), isHiddenPath(), Profile, MAX_EVENTS, eventKey(), initSync() (+17 more)

### Community 26 - "Community 26"
Cohesion: 0.11
Nodes (22): buildInsight(), hePrefix(), InsightInput, MIN_HITS_TO_NAME, MIN_OBSERVATIONS_FOR_INSIGHT, bktUpdate(), classify(), decay() (+14 more)

### Community 27 - "Community 27"
Cohesion: 0.14
Nodes (24): adaptBankQuestion(), MIXED_EXCLUDED_TOPICS, Quiz(), shuffleInPlace(), SUBJECTS, ConceptLevel, LEVEL_META, hasQuestionBank() (+16 more)

### Community 28 - "Community 28"
Cohesion: 0.13
Nodes (25): RoadmapPage(), allRoadmap582Nodes(), allRoadmapNodes(), allTopicsWithSubTopics(), buildRoadmap(), buildRoadmap582(), buildRoadmapFromPlan(), DEFAULT_PAPER (+17 more)

### Community 29 - "Community 29"
Cohesion: 0.07
Nodes (30): scripts, bench:match, build, build:brand, check, dev, generate-pool, lint (+22 more)

### Community 30 - "Community 30"
Cohesion: 0.07
Nodes (29): @anthropic-ai/sdk, canvas-confetti, framer-motion, katex, lucide-react, mathjs, next, dependencies (+21 more)

### Community 31 - "Community 31"
Cohesion: 0.11
Nodes (19): WorkedExamView(), allAdvancedCourseKeys(), COURSES, math5AnalyticGeometryAdvanced, math5ComplexNumbersAdvanced, math5ExpFunctionsAdvanced, math5LnFunctionAdvanced, ADVANCED_SECTIONS (+11 more)

### Community 32 - "Community 32"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 33 - "Community 33"
Cohesion: 0.12
Nodes (25): LibraryPage(), countScans(), deleteScan(), getScan(), getScans(), readAll(), saveScan(), Scan (+17 more)

### Community 34 - "Community 34"
Cohesion: 0.19
Nodes (25): SubTopicLadder(), isSubTopicDone(), ClearResult, computeCoreDone(), countCompleted(), hasLevelProgress(), isBrowser(), isLevelCleared() (+17 more)

### Community 35 - "Community 35"
Cohesion: 0.14
Nodes (25): dedupe(), delimitedSegments(), extractMathSegments(), FUNCTION_WORDS, hasMathDelimiters(), isMeaningfulMath(), passThroughDelimited(), prettyMath() (+17 more)

### Community 36 - "Community 36"
Cohesion: 0.09
Nodes (11): dynamic, HistoryPage(), scoreClass(), Session, SessionRow(), timeAgoHebrew(), metadata, metadata (+3 more)

### Community 37 - "Community 37"
Cohesion: 0.18
Nodes (21): Card, ReviewPage(), backfillFromMistakes(), BOX_INTERVAL_DAYS, dueAtForBox(), dueCountBySubTopic(), dueItems(), gradeReview() (+13 more)

### Community 38 - "Community 38"
Cohesion: 0.16
Nodes (23): cognitionEntries(), bandFromWrong(), coarseWeaknesses(), DetectInput, detectWeaknesses(), dominantCategory(), findMisconception(), findWeakness() (+15 more)

### Community 39 - "Community 39"
Cohesion: 0.15
Nodes (20): buildFixPath(), decideNext(), dismissReteach(), FixSummary, HEAL_STREAK, MAX_MISSES, MIN_ANSWERED_TO_HEAL, rankQuota() (+12 more)

### Community 40 - "Community 40"
Cohesion: 0.11
Nodes (19): ChatMessage, ChatPage(), ChatSidebar(), Conversation, relativeDate(), SUGGESTIONS, utcDayStartIso(), ADMIN_EMAILS (+11 more)

### Community 41 - "Community 41"
Cohesion: 0.13
Nodes (18): DateStep(), Math5TopicsByPaper(), PracticePage(), SubjectKey, SUBJECTS, BagrutBadge(), BannerBadge(), InlineBadge() (+10 more)

### Community 42 - "Community 42"
Cohesion: 0.13
Nodes (18): HelpLadder(), SKIN, LETTERS, PracticeQuestion, CheckResult, buildHelpLadder(), HelpLadder, HelpTier (+10 more)

### Community 43 - "Community 43"
Cohesion: 0.12
Nodes (20): conceptBankEntries(), conceptLevelCounts(), getConceptBank(), getConceptQuestions(), hasConceptBank(), REGISTRY, CONCEPT_MATH5, ConceptQuestion (+12 more)

### Community 44 - "Community 44"
Cohesion: 0.21
Nodes (18): TeachPage(), ThinkingPage(), currentTopicFromPath(), formulasForTopic(), FormulaSheet(), shouldShow(), SHOW_PREFIXES, TopicFormulas (+10 more)

### Community 45 - "Community 45"
Cohesion: 0.13
Nodes (19): DEPTH_ORDER, SolutionPanel(), SOURCE_BADGE, TIER_BADGE, buildHint(), containsHebrew(), DOMAIN_LABEL, domainLabel() (+11 more)

### Community 46 - "Community 46"
Cohesion: 0.16
Nodes (22): ALL_PAST_BAGRUYOT, getQuestionById(), summarizeCost(), checkScope(), scopeFor(), topicForDomain(), hasHebrewInsideMath(), unbalancedDollars() (+14 more)

### Community 47 - "Community 47"
Cohesion: 0.17
Nodes (18): fingerprint(), jaccard(), tokenSet(), buildIndex(), corpusIdf(), fromBagrut(), fromPractice(), index() (+10 more)

### Community 48 - "Community 48"
Cohesion: 0.10
Nodes (15): RoadmapLevelKind, computeStars(), didPass(), DIFFICULTY_RANK, GATEWAY_LEVELS, PASS_RATIO, requiredCorrect(), retrySet() (+7 more)

### Community 49 - "Community 49"
Cohesion: 0.14
Nodes (19): buildMatchIndex(), findMatch(), FindMatchOptions, idfOverlap(), IndexedEntry, isSameQuestion(), jaccardSets(), MATCH_MARGIN (+11 more)

### Community 50 - "Community 50"
Cohesion: 0.18
Nodes (21): assertBrowser(), canvasToBlob(), CropBox, cropPlane(), detectContentBox(), estimateSkew(), estimateVisionTokens(), loadBitmap() (+13 more)

### Community 51 - "Community 51"
Cohesion: 0.13
Nodes (17): BAND_LABEL, FixIntroCard(), FixSummary(), SupplyItem, SupplyOptions, TIER, Difficulty, DIFFICULTY_RANK (+9 more)

### Community 52 - "Community 52"
Cohesion: 0.12
Nodes (17): CONCEPT_LEVELS, Counts, err(), errors, EXEMPT_TOPICS, exemptShort, EXPLANATION_FIELDS, gated() (+9 more)

### Community 53 - "Community 53"
Cohesion: 0.10
Nodes (21): dotenv, eslint, eslint-config-next, devDependencies, dotenv, eslint, eslint-config-next, tailwindcss (+13 more)

### Community 54 - "Community 54"
Cohesion: 0.19
Nodes (18): buildTriggerIndex(), getCognitionMap(), hasCognitionMap(), key(), getQuestions(), buildCognitiveState(), BuildInput, getCognitiveState() (+10 more)

### Community 55 - "Community 55"
Cohesion: 0.18
Nodes (17): AnswerSpec, checkAnswer(), Cx, eq(), evalCx(), expandPm(), fmt(), math (+9 more)

### Community 56 - "Community 56"
Cohesion: 0.18
Nodes (19): abandonFix(), consumeReteach(), submitFixAnswer(), summarise(), clearActiveFix(), clearFixStore(), EMPTY, FixStore (+11 more)

### Community 57 - "Community 57"
Cohesion: 0.10
Nodes (17): bank, bankCall, bankCode, cacheCall, errors, match, matchCode, panel (+9 more)

### Community 58 - "Community 58"
Cohesion: 0.16
Nodes (18): add(), checkString(), dollarCount(), EMOJI_ALLOW, files, Finding, findings, locate() (+10 more)

### Community 59 - "Community 59"
Cohesion: 0.14
Nodes (13): add(), approx(), cross(), dot(), mAdd(), mCross(), mDot(), mj (+5 more)

### Community 60 - "Community 60"
Cohesion: 0.12
Nodes (14): Difficulty, DIFFICULTY_HINT, isAllowedOrigin(), maxDuration, SUBJECTS, Difficulty, DIFFICULTY_HINT, isAllowedOrigin() (+6 more)

### Community 61 - "Community 61"
Cohesion: 0.16
Nodes (14): FORMS, TutorWorkbenchPage(), UNIT_LEVELS, GradeReport(), scoreTone(), Props, TutorChat(), topicsForActivePaper() (+6 more)

### Community 62 - "Community 62"
Cohesion: 0.22
Nodes (14): TopicJourney(), clearPlan(), createPlan(), findTopicIndex(), getPlan(), getTopicLevel(), isBrowser(), markStep() (+6 more)

### Community 63 - "Community 63"
Cohesion: 0.14
Nodes (14): clamp(), LEVEL_PRIOR, midpoint(), OverallPrediction, PAPER_WEIGHTS, PaperPrediction, predictPaper(), PROB (+6 more)

### Community 64 - "Community 64"
Cohesion: 0.14
Nodes (13): frankRuhlLibre, geistMono, geistSans, heebo, metadata, plusJakarta, viewport, ServiceWorkerRegistration() (+5 more)

### Community 65 - "Community 65"
Cohesion: 0.27
Nodes (10): BagrutLevel(), LevelClearedPanel(), LevelFailedPanel(), StarRow(), LearnLevel(), RoadmapLevelRunner(), RoadmapLevel, XP (+2 more)

### Community 66 - "Community 66"
Cohesion: 0.18
Nodes (14): A, B, client(), eq(), failures, FakeSupabase, longEnough, main() (+6 more)

### Community 67 - "Community 67"
Cohesion: 0.16
Nodes (14): ALLOWED_MIME, buildTopicReference(), isAllowedOrigin(), KNOWN_TOPICS, maxDuration, POST(), RESPONSE_SCHEMA, scansToday() (+6 more)

### Community 68 - "Community 68"
Cohesion: 0.18
Nodes (14): buildCandidates(), chooseNextStep(), ladderHref(), NextStepContext, PRIORITY, rankCandidates(), startStep(), CognitiveState (+6 more)

### Community 69 - "Community 69"
Cohesion: 0.22
Nodes (13): Failure, FixPage(), QuestionRunnerCard(), getSubTopic(), answeredIds(), detectInput(), getTopWeakness(), getWeaknesses() (+5 more)

### Community 70 - "Community 70"
Cohesion: 0.19
Nodes (15): Strict CSP in next.config.ts (self + *.supabase.co), localStorage-only client state (works without login, $0), Monetization: free base, Pro depth (lib/access.ts), PROTECTED_PREFIXES middleware and the public /practice, /roadmap surfaces, MCQ authoring: write the correct answer first (correct: 0), buildCognitiveState(events, catalog, now) — the single public entry point, CognitiveInsightCard (phase 4 UI on /roadmap), Diagnose the weakest link in the prerequisite graph (+7 more)

### Community 71 - "Community 71"
Cohesion: 0.27
Nodes (14): getSubTopics(), topicResume(), buildSubTopicLevels(), err(), findCycle(), Finding, findings, inventory() (+6 more)

### Community 72 - "Community 72"
Cohesion: 0.15
Nodes (6): math5Trigonometry, Case, CASES, DEG_SUBTOPICS, fails, RAD_SUBTOPICS

### Community 73 - "Community 73"
Cohesion: 0.26
Nodes (7): REGISTRY, complexNumbersCognition, Misconception, MisconceptionId, Skill, SkillId, TopicCognitionMap

### Community 74 - "Community 74"
Cohesion: 0.24
Nodes (9): C(), check(), cis(), eq(), fails, mul(), powN(), quadHolds() (+1 more)

### Community 75 - "Community 75"
Cohesion: 0.17
Nodes (5): ALL_TOPICS, LEVEL_LABELS, SelectedTopic, TopicsStep(), UnitLevel

### Community 76 - "Community 76"
Cohesion: 0.17
Nodes (11): BIBLE, CHEM, Difficulty, DIFFICULTY_HINT, ENGLISH, HISTORY, MATH4, MATH5 (+3 more)

### Community 77 - "Community 77"
Cohesion: 0.36
Nodes (11): ghostEntries(), checkSoftBreaks(), err(), Finding, findings, main(), questionIds(), shuffleBalance() (+3 more)

### Community 78 - "Community 78"
Cohesion: 0.18
Nodes (11): getBagrutQuestionsForSubTopic(), getCapstoneBagrutQuestions(), getLesson(), getNextSubTopic(), all, clean, corpus(), dupe (+3 more)

### Community 79 - "Community 79"
Cohesion: 0.21
Nodes (10): MATH_FORMAT_RULES, buildScanTutorSystem(), MAX_QUESTION_CHARS, MAX_STEP_CHARS, MAX_STEPS, SCAN_TUTOR_CORE, SOURCE_NOTE, TutorPromptGrounding (+2 more)

### Community 80 - "Community 80"
Cohesion: 0.18
Nodes (9): subTopicTargetId(), MAX_STEPS, MIN_STEPS, BANDS, errors, fakeWeakness(), Row, rows (+1 more)

### Community 81 - "Community 81"
Cohesion: 0.31
Nodes (9): GlobalSearch(), KIND_ORDER, buildIndex(), KIND_LABELS, searchAll(), SearchItem, SearchKind, SearchResult (+1 more)

### Community 82 - "Community 82"
Cohesion: 0.22
Nodes (9): ACTIVE_RATE, ACTIVE_WINDOW_DAYS, recencyWeight(), scoreMisconceptions(), STATUS_FACTOR, statusOf(), MisconceptionEvidence, DECAY_HALF_LIFE_DAYS (+1 more)

### Community 83 - "Community 83"
Cohesion: 0.25
Nodes (10): clamp(), computePacing(), countCoreRungs(), Pacing, PacingStatus, REVISION_BUFFER_DAYS, TopicGroup, CORE_LEVELS (+2 more)

### Community 84 - "Community 84"
Cohesion: 0.22
Nodes (5): check(), checkRoot(), failures, math, residual()

### Community 85 - "Community 85"
Cohesion: 0.18
Nodes (3): failures, math, IMPORTANT: answer-check + this app evaluate sin/cos in RADIANS. Where the

### Community 86 - "Community 86"
Cohesion: 0.24
Nodes (10): Next.js Agent Rules (this is NOT the Next.js you know), Build + typecheck before every push, IP boundary — no publisher solution books, MathUp (Hebrew RTL bagrut math-5 study platform), "Premium white" light-only design system, Dark-ink-on-light SVG diagram palette + custom-SVG-only rule, Only two question types exist (MCQ + open), Diagram rules: DiagramSpec, custom raw SVG only, no fn: closures (+2 more)

### Community 87 - "Community 87"
Cohesion: 0.29
Nodes (5): LearnPage(), RoadmapLessonPage(), PracticeShell(), resolveRoadmapNode(), getLearningPath()

### Community 88 - "Community 88"
Cohesion: 0.33
Nodes (9): BankHit, BankRow, candidates(), QualityTier, searchBank(), toHit(), upsertIntoBank(), MATCH_THRESHOLD (+1 more)

### Community 89 - "Community 89"
Cohesion: 0.33
Nodes (8): isProtected(), isPublic(), PROTECTED_PREFIXES, PUBLIC_PREFIXES, IMPORTANT: do not run code between createServerClient() and getUser()., updateSession(), config, middleware()

### Community 90 - "Community 90"
Cohesion: 0.22
Nodes (9): ~$5/month Anthropic budget ceiling, Deliberate model routing (Sonnet grounded / Haiku generic), Pathspec-only git commits (never git add . / -A), Prompt caching on large static system prompts (cache_control: ephemeral), Vercel Hobby 60s serverless cap (maxDuration = 60), Cognitive Map layer, Phase 1 (complex numbers), Super-principle: don't move state — derive it, Synthetic-student replay as the real proof (+1 more)

### Community 91 - "Community 91"
Cohesion: 0.31
Nodes (9): concept-quiz registry keyed `${subject}:${topic}`, 5-unit bagrut math conventions (cis degrees, y²=2px, c²=a²−b²), npm run verify:concept (shape-only gate + inventory table), verify-mcq-distinct coverage honesty ("0 problems" ≠ correct), Bagrut parts mapped to skills under `${questionId}-${partLabel}`, Skill type (id, prereqs, band), Complex-numbers skill prerequisite graph (18 planned / 22 built), TopicCognitionMap catalog (content/cognition/) (+1 more)

### Community 92 - "Community 92"
Cohesion: 0.33
Nodes (7): BagrutQuestionBlock(), Props, SubTopicPractice(), StaticBagrutQuestion, orderQuestions(), Tier, tierLabel()

### Community 93 - "Community 93"
Cohesion: 0.31
Nodes (6): ancestors(), depthOf(), findWeakestLink(), MIN_GAP, MIN_ROOT_CONFIDENCE, RECENT_WINDOW_DAYS

### Community 94 - "Community 94"
Cohesion: 0.31
Nodes (5): approx(), num(), offCurve(), onCurve(), P

### Community 95 - "Community 95"
Cohesion: 0.25
Nodes (8): lib/answer-check.ts deterministic mathjs grading, Trigonometry degrees/radians split (owner decision 2026-07-28), BKT-lite knowledge tracing, Separating "he is weak" from "we don't know", Forgetting decay (21-day half-life, applied at read time), MIN_CONFIDENCE raised to 0.5 (deviation from plan), ResultEvent.selfReported — who graded the answer, Silence is a valid render (return null)

### Community 96 - "Community 96"
Cohesion: 0.32
Nodes (8): Bulk authoring: one agent per file, verify independently, Never put Hebrew inside KaTeX, MathText single-element contract (2026-07-28), The deliberate unscoped .katex floor in globals.css, npm run verify:content (scripts/verify-content.ts), Bidi fixed at the rendering layer (2026-07-28) — no more content workarounds, No Hebrew inside math (learned in analytic geometry, 2026-06-10), MathText contract as stated in the style guide (one element, flex rule)

### Community 97 - "Community 97"
Cohesion: 0.25
Nodes (8): Photo-scan caching: answer library first, AI last, Static-first content architecture (zero API cost), Supabase tables created in dashboard; code degrades gracefully, hePrefix — Hebrew definite-article prefixing, Insight sentences from templates, not AI, 200KB payload guards (byte-identical skip + 15s debounce), `repeat` is re-derived on merge, never merged, Results-log sync to Supabase by set union, not max-wins

### Community 100 - "Community 100"
Cohesion: 0.36
Nodes (6): approx(), binom(), fact(), math, nCr(), num()

### Community 102 - "Community 102"
Cohesion: 0.33
Nodes (5): COMPARISON, Plan, PLANS, PricingPage(), Row

### Community 103 - "Community 103"
Cohesion: 0.57
Nodes (5): ShareCardButton(), heeboFamily(), renderShareCard(), ShareCardInput, shareOrDownload()

### Community 104 - "Community 104"
Cohesion: 0.29
Nodes (7): Adding a new learning path (4-step procedure), Atoms, not blocks (7 small concepts beat 3 big ones), keyPoints ("לזכור") = triggers and traps, not formula repetition, LearningPath 8-section structure (fixed order), methodChoice — knowing WHEN to pick a method, Progressive hint reveal + reviewIfStuck linkage, Zero step-skipping (אפס קפיצות)

### Community 105 - "Community 105"
Cohesion: 0.33
Nodes (7): Bagrut focus + Hebrew male-form, no decorative emoji, Complex numbers: cis and degrees only, never e^{iθ} or radians, Gold-standard topic: math5/complex-numbers.ts, Always double backslashes in LaTeX source strings, בר האיכות — the four-rule quality bar for every solution, ErrorCategory collapses to 'אחר' — why misconceptionId stays separate, Misconception type (triggers, rootSkill, remedy, insight)

### Community 106 - "Community 106"
Cohesion: 0.38
Nodes (6): client, countSystem(), main(), ModelName, MODELS, usd()

### Community 109 - "Community 109"
Cohesion: 0.33
Nodes (3): files, offenders, ROOTS

### Community 111 - "Community 111"
Cohesion: 0.40
Nodes (4): emblem, out, side, TILE

### Community 112 - "Community 112"
Cohesion: 0.50
Nodes (3): approx(), math, num()

### Community 113 - "Community 113"
Cohesion: 0.70
Nodes (4): approx(), d2num(), dnum(), num()

### Community 115 - "Community 115"
Cohesion: 0.50
Nodes (3): csp, nextConfig, securityHeaders

### Community 116 - "Community 116"
Cohesion: 0.50
Nodes (3): name, private, version

### Community 117 - "Community 117"
Cohesion: 0.67
Nodes (3): cx(), eq(), math

## Knowledge Gaps
- **643 isolated node(s):** `maxDuration`, `ALLOWED_MIME`, `ERROR_CATEGORY_ENUM`, `AUDIT_SYSTEM_PROMPT`, `AUDIT_SCHEMA` (+638 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `MathText()` connect `Advanced Patterns & Diagrams` to `Errors & AI Tutor Actions`, `Bagrut Archive Browsing`, `Teach Session Flow`, `Learn Page Components`, `Topic Demo Page`, `Ghost Replay Walkthroughs`, `Practice Exercise Pages`, `Scan Page UI`, `Advanced Exam Entry Gate`, `Scan Question Tutor`, `Community 22`, `Community 27`, `Community 28`, `Community 31`, `Community 33`, `Community 42`, `Community 44`, `Community 45`, `Community 51`, `Community 61`, `Community 65`, `Community 92`, `Community 110`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Why does `isProUser()` connect `Solution Analysis API` to `Errors & AI Tutor Actions`, `Community 67`, `Bagrut Archive Browsing`, `Explain & Hint APIs`, `Community 40`, `Scan Page UI`, `Questions & Thinking APIs`, `Insights Dashboard`, `Community 22`, `Community 24`, `Community 25`, `Community 62`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **What connects `maxDuration`, `ALLOWED_MIME`, `ERROR_CATEGORY_ENUM` to the rest of the system?**
  _643 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Solution Analysis API` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Chat Grading & Tutor API` be split into smaller, more focused modules?**
  _Cohesion score 0.0679563492063492 - nodes in this community are weakly interconnected._
- **Should `Errors & AI Tutor Actions` be split into smaller, more focused modules?**
  _Cohesion score 0.059907834101382486 - nodes in this community are weakly interconnected._
- **Should `Bagrut Archive Browsing` be split into smaller, more focused modules?**
  _Cohesion score 0.06174863387978142 - nodes in this community are weakly interconnected._