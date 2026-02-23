# Go Backend Task Plan

## Goal
Build a Go backend for OpenSourceScout that handles:
- GitHub repository search
- Natural language query translation
- Multi-model AI repository analysis (Gemini + OpenAI)
- Model availability based on configured keys

Frontend should call backend APIs only. No AI keys in browser code.

## Deliverables
- `backend/` Go service with API endpoints
- Frontend switched from direct provider calls to `/api/*`
- Env/key handling moved fully server-side
- Updated local dev flow and docs

## Proposed Backend Stack
- Go `1.23+`
- Router: `chi` (or standard `net/http`)
- HTTP client: stdlib `net/http` with timeout + retry wrapper
- Config: env vars
- Logging: structured logs (`log/slog`)

## Environment Variables
- `PORT` (default `8080`)
- `GEMINI_API_KEY` (optional, enables Gemini models)
- `OPENAI_API_KEY` (optional, enables OpenAI models)
- `GITHUB_TOKEN` (optional, for higher GitHub API rate limit)
- `ALLOWED_ORIGINS` (comma-separated CORS origins)

## API Contract

### 1) GET `/api/health`
- Returns service health/version

### 2) GET `/api/models`
- Returns available model list based on configured keys
- Example:
  - `gemini-3-flash-preview`
  - `gemini-3-pro-preview`
  - `gpt-4o`
  - `gpt-4.1`

### 3) POST `/api/search/translate`
- Request:
```json
{ "input": "beginner friendly react repos" }
```
- Response:
```json
{ "query": "react language:typescript good-first-issues:>0" }
```
- Uses Gemini (if key exists). If unavailable, returns input as-is (or 503 based on chosen policy).

### 4) GET `/api/repos/search`
- Query params:
  - `q` (required)
  - `sort` (`best-match|stars|forks|updated`)
  - `per_page` (default 12)
- Response: normalized repository list used by frontend

### 5) POST `/api/repos/analyze`
- Request:
```json
{
  "model": "gpt-4o",
  "repo": {
    "name": "owner/repo",
    "description": "...",
    "language": "TypeScript",
    "topics": ["react", "vite"]
  }
}
```
- Response:
```json
{
  "summary": "...",
  "difficulty": "Beginner",
  "goodFor": ["React", "TypeScript"],
  "gettingStartedTip": "...",
  "potentialImpact": "High",
  "learningCurveData": [
    { "day": "Day 1", "knowledge": 10 },
    { "day": "Day 3", "knowledge": 40 },
    { "day": "Day 7", "knowledge": 70 },
    { "day": "Day 14", "knowledge": 90 }
  ]
}
```

## Backend Project Structure
```text
backend/
  cmd/server/main.go
  internal/config/config.go
  internal/http/router.go
  internal/http/handlers/
    health.go
    models.go
    search.go
    analysis.go
  internal/github/client.go
  internal/ai/
    models.go
    gemini.go
    openai.go
    service.go
  internal/domain/types.go
  internal/middleware/
    cors.go
    logging.go
    recover.go
  go.mod
```

## Migration Tasks

### Phase 1: Scaffold Backend
- [ ] Initialize Go module in `backend/`
- [ ] Add server bootstrap + router + middleware
- [ ] Add `/api/health`
- [ ] Add config loader for env vars

### Phase 2: GitHub Search API
- [ ] Implement GitHub client with timeout + auth header when token exists
- [ ] Implement `/api/repos/search`
- [ ] Normalize fields to existing frontend `Repository` shape
- [ ] Add tests for query validation + error mapping

### Phase 3: AI Provider Abstraction
- [ ] Define `Analyzer` interface
- [ ] Implement Gemini analyzer
- [ ] Implement OpenAI analyzer
- [ ] Implement model router in service layer
- [ ] Add `/api/models`

### Phase 4: Translation + Analysis Endpoints
- [ ] Implement `/api/search/translate`
- [ ] Implement `/api/repos/analyze`
- [ ] Add JSON schema-compatible response validation before returning
- [ ] Add robust provider error messages (401/429/5xx)

### Phase 5: Frontend Integration
- [ ] Replace `services/geminiService.ts` provider calls with backend calls
- [ ] Replace `services/githubService.ts` direct GitHub calls with backend calls
- [ ] Remove `process.env.*` AI key injection from `vite.config.ts`
- [ ] Ensure model dropdown reads from `/api/models`

### Phase 6: Local Dev + Docs
- [ ] Add Vite proxy `/api -> http://localhost:8080`
- [ ] Add `npm` and `go` run instructions to README
- [ ] Add `.env.example` for backend keys
- [ ] Add smoke test script for critical endpoints

## Security + Reliability Checklist
- [ ] CORS restricted by `ALLOWED_ORIGINS`
- [ ] Request payload validation on all POST endpoints
- [ ] Global request timeout
- [ ] Rate limiting on analysis endpoints
- [ ] No secrets returned in errors/logs
- [ ] Graceful shutdown on SIGTERM

## Acceptance Criteria
- Frontend works end-to-end without direct AI/GitHub external calls.
- Selecting any configured model in UI produces valid analysis.
- Missing key for a model is surfaced clearly by backend.
- CLI can also call backend (optional phase).
- Build/run instructions are reproducible on a clean machine.

## Nice-to-Have (After MVP)
- [ ] Caching for repeated repo analysis
- [ ] Parallel multi-model analysis and comparison output
- [ ] Observability: Prometheus metrics + tracing
- [ ] API auth for non-local usage
