ID	Phase	Priority	Epic	Task	Acceptance Criteria	Owner(AI)	Est(days)	Dependencies	Notes
T-001	P0	Must	Foundation	Repo init (Next.js TS, lint, prettier)	CI build/test passes	Copilot	0.5		
T-002	P0	Must	Foundation	Supabase schema apply (v3)	All tables exist; local env connects	Copilot	0.5	T-001	Use 07_DB_Schema_v3.sql
T-003	P0	Must	YouTube	parseYouTubeVideoId(url)	Unit tests cover watch/shorts/youtu.be/embed; invalid->null	Copilot	0.5	T-001	
T-004	P0	Must	YouTube	YouTube Data API client (videos.list)	Handles quota/404; returns snippet/contentDetails	Copilot	0.5	T-003	Mock tests
T-005	P0	Must	Extraction	description cleaner + chapter extractor	Unit tests for URL removal + timestamps	Copilot	1	T-004	
T-006	P0	Must	Extraction	LLM wrapper (Prompt A) + zod validation	Retries invalid JSON; logs extraction_runs	Copilot	1	T-005	
T-007	P0	Must	API	POST /api/recipes/import (stores card)	Creates video_sources, recipes, ingredients, steps	Copilot	1.5	T-002,T-004,T-006	
T-008	P0	Must	UI	Home screen (paste URL + recent list)	Paste/import works; shows recent cards	Copilot	1	T-007	
T-009	P0	Must	UI	RecipeDetail (ingredients/steps + nutrition box placeholder)	Shows card; confidence badge; video link	Copilot	1	T-007	
T-010	P0	Must	UI	CookMode (step-by-step + timer)	Mobile-friendly; checklist works; timer works	Copilot	2	T-009	
T-011	P0	Must	Nutrition	Ingest food DB (MEXT)	food_items and nutrients populated; search works	Copilot	1.5	T-002	Use 16_Runbook
T-012	P0	Must	Nutrition	matchFoodItem + parseQuantity + computeNutrition	Returns totals+confidence+coverage+unresolved	Copilot	2	T-011	Unit tests
T-013	P0	Must	API	POST /api/recipes/{id}/nutrition	Computes and caches nutrition; returns unresolved list	Copilot	1	T-012	
T-014	P0	Must	UI	NutritionFix screen (quick edits)	Candidate select + grams input; saves overrides	Copilot	2	T-013	
T-015	P0	Must	API	PATCH /api/ingredients/{ingredient_id}/match	Stores manual match+grams; triggers recompute	Copilot	1	T-014	
T-016	P0	Should	Growth	Share slug + public page	Share page includes embed+credit; slug rotation	Copilot	1.5	T-009	
T-017	P0	Must	Testing	Playwright E2E 3 scenarios	E2E passes in CI	Copilot	2	T-008,T-010,T-014	
T-018	P1	Should	Quality	Channel-specific parser (e.g., Ryuji)	Improves extraction on 10 sample URLs	Copilot	1.5	T-005	
T-019	P1	Could	Search	Tags + nutrition filter	Filter by protein density etc	Copilot	2	T-012	
T-020	P0	Must	Compliance	Terms/Privacy pages + disclaimers	YouTube links + nutrition disclaimers present	Copilot	1	T-008	
