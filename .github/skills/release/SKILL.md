---
name: release
description: Handles the full release lifecycle for bike-weather services — tagging new versions, updating the changelog, and deploying to Kubernetes via the homelab repository. Use this skill whenever the user mentions releasing, deploying, shipping, tagging, bumping versions, or updating bike-weather — even casually like "ship it", "deploy the latest", "push to prod", "update preview", "release what's changed", "bump frontend", or "tag a new version". Also trigger when the user asks about what's pending deployment, what versions are running, or release status.
---

# Release Skill

Full release lifecycle for bike-weather: changelog → tag → deploy to Kubernetes.

## Overview

The bike-weather project has three services (`frontend`, `backend`, `agent`), each independently versioned via git tags (`<service>/v<semver>`). The release process has three phases:

1. **Changelog** — Collect commits since the last tag and append entries to `CHANGELOG.md` in the bike-weather repo.
2. **Tagging** — Create semver git tags in bike-weather to trigger GitHub Actions CI, which builds and pushes container images to `ghcr.io`.
3. **Deploying** — Immediately update Kubernetes deployment manifests in the homelab repo so ArgoCD picks up the new images. Do **not** wait for CI to finish — the image will be available by the time ArgoCD reconciles.

The skill auto-detects which services have unreleased changes and handles the full flow.

## Repositories

| Repo | Path | Purpose |
|------|------|---------|
| bike-weather | `~/code/bike-weather` | Source repo. Git tags = released versions. CI builds images on tag push. |
| homelab | `~/code/homelab` | Kubernetes manifests. ArgoCD syncs from here. |

## Environments

| Environment | Homelab path | Tag pattern | Namespace |
|-------------|-------------|-------------|-----------|
| **Production** | `apps/bike-weather/` | `<service>/v1.2.3` (no suffix) | `bike-weather` |
| **Preview** | `apps/bike-weather-preview/` | `<service>/v1.2.3-preview.N` | `bike-weather-preview` |

## Container Images

- Registry: `ghcr.io/timosur/bike-weather/<service>:<version>`
- Version in image tags does NOT include the `v` prefix (e.g., `0.0.7` not `v0.0.7`).
- Git tags DO include the `v` prefix (e.g., `frontend/v0.0.7`).

## Deployment Files

Each environment has deployment YAMLs with image references:

- `frontend-deployment.yaml` → `image: ghcr.io/timosur/bike-weather/frontend:<version>`
- `backend-deployment.yaml` → `image: ghcr.io/timosur/bike-weather/backend:<version>`

The `agent` service does not currently have a deployment in homelab (it runs as a CLI job), so skip it for deployment manifest updates — but still report if new agent tags exist.

## Phase 1: Changelog

### Collecting changes

For each service being released, gather the commit messages since the last tag:

```bash
cd ~/code/bike-weather

# Get latest stable tag for a service
LATEST_TAG=$(git tag -l "<service>/v[0-9]*" --sort=-v:refname | grep -E "^<service>/v[0-9]+\.[0-9]+\.[0-9]+$" | head -1)

# List commits since that tag, scoped to the service directory
git log "${LATEST_TAG}..HEAD" --oneline -- <service>/
```

### Writing the changelog

The changelog lives at `~/code/bike-weather/CHANGELOG.md`. If it does not exist, create it with a top-level heading.

Prepend a new section for each released service **below** the `# Changelog` heading, keeping the most recent release at the top. Use this format:

```markdown
## <service> v<version> — <YYYY-MM-DD>

- <commit subject line 1>
- <commit subject line 2>
- ...
```

Rules:
- Use the current date for the release heading.
- List each commit as a bullet point using the short commit message (the `--oneline` subject).
- Group by service when multiple services are released at the same time.
- Strip any leading conventional-commit scope that duplicates the service name (e.g., `feat(frontend): add map` → `feat: add map` under the frontend heading).
- After writing the changelog, commit it in the bike-weather repo:

```bash
cd ~/code/bike-weather
git add CHANGELOG.md
git commit -m "docs: update changelog for <service> v<version>"
git push
```

Do this **before** creating the git tags so the changelog commit is included in the tagged history.

## Phase 2: Tagging

### Detecting services that need tagging

For each service, check if there are commits on `main` since the latest tag:

```bash
cd ~/code/bike-weather
git fetch --tags --quiet

# Get latest stable tag for a service
LATEST_TAG=$(git tag -l "<service>/v[0-9]*" --sort=-v:refname | grep -E "^<service>/v[0-9]+\.[0-9]+\.[0-9]+$" | head -1)

# Check for commits in that service's directory since the tag
git log "${LATEST_TAG}..HEAD" --oneline -- <service>/ | head -5
```

If there are commits, the service needs a new tag. For preview tags, use the same approach but check for the latest preview tag.

### Versioning scheme

Tags follow semver: `<service>/v<major>.<minor>.<patch>` with optional `-preview.N` suffix.

- **Stable releases**: `frontend/v1.2.3`
- **Preview releases**: `frontend/v1.2.3-preview.1`, `frontend/v1.2.3-preview.2`, etc.

### Bump logic

To compute the next version from the current latest stable tag:

| Bump type | Example |
|-----------|---------|
| `patch` | `1.2.3` → `1.2.4` |
| `minor` | `1.2.3` → `1.3.0` |
| `major` | `1.2.3` → `2.0.0` |

For preview tags, append `-preview.N` to the next version, auto-incrementing N:
```bash
# Count existing preview tags for the target version
PREVIEW_COUNT=$(git tag -l "<service>/v<next_version>-preview.*" | wc -l | tr -d ' ')
PREVIEW_NUM=$((PREVIEW_COUNT + 1))
```

### Creating tags

Ask the user for the bump type (patch/minor/major) and whether it's a preview release. Default to `patch` if the user doesn't specify. Then:

```bash
cd ~/code/bike-weather
git tag -a "<service>/v<version>" -m "release: <service> v<version>"
git push origin "<service>/v<version>"
```

This triggers GitHub Actions to build the container image. **Do not wait for CI to finish** — proceed directly to the deploy phase.

The workflow files are:
- `.github/workflows/frontend.yml` — triggers on `frontend/v*` tags
- `.github/workflows/backend.yml` — triggers on `backend/v*` tags
- `.github/workflows/agent.yml` — triggers on `agent/v*` tags

If stable release: CI checks for an existing preview image with the same base version and retags it instead of rebuilding. This means preview → stable promotion is fast.

## Phase 3: Deploying

### Step 1: Detect what needs deploying

For each service (`frontend`, `backend`):

1. **Get the latest git tag** from the bike-weather repo:
   ```bash
   cd ~/code/bike-weather
   # Latest stable tag (production)
   git tag -l "<service>/v[0-9]*" --sort=-v:refname | grep -E "^<service>/v[0-9]+\.[0-9]+\.[0-9]+$" | head -1
   # Latest preview tag
   git tag -l "<service>/v[0-9]*" --sort=-v:refname | grep -E "^<service>/v[0-9]+\.[0-9]+\.[0-9]+-preview\." | head -1
   ```

2. **Get the currently deployed version** from homelab:
   ```bash
   grep "image: ghcr.io/timosur/bike-weather/<service>:" ~/code/homelab/apps/bike-weather/<service>-deployment.yaml
   grep "image: ghcr.io/timosur/bike-weather/<service>:" ~/code/homelab/apps/bike-weather-preview/<service>-deployment.yaml
   ```

3. **Compare** — if the latest tag version differs from the deployed version, that service needs updating.

### Step 2: Confirm with user

Present a summary table:

```
Service   | Environment | Deployed    | Available   | Action
----------|-------------|-------------|-------------|-------
frontend  | production  | 0.0.6       | 0.0.7       | UPDATE
frontend  | preview     | 0.0.5-pre.2 | 0.0.7-pre.1 | UPDATE
backend   | production  | 0.0.2       | 0.0.2       | up to date
backend   | preview     | 0.0.2-pre.1 | 0.0.3-pre.1 | UPDATE
agent     | —           | (no deploy) | 1.0.0       | info only
```

Ask the user to confirm before making changes.

### Step 3: Update homelab manifests

For each service that needs updating:

1. `cd ~/code/homelab`
2. Edit the `image:` line in the relevant deployment YAML, replacing only the tag portion.
   - Production: `apps/bike-weather/<service>-deployment.yaml`
   - Preview: `apps/bike-weather-preview/<service>-deployment.yaml`

### Step 4: Commit and push homelab

```bash
cd ~/code/homelab
git add apps/bike-weather/ apps/bike-weather-preview/
git commit -m "chore(bike-weather): deploy <summary of updates>"
git push
```

Example commit message:
```
chore(bike-weather): deploy frontend 0.0.7, backend 0.0.3-preview.1
```

### Step 5: Confirm

Tell the user the push is done and ArgoCD will pick up the changes. Note that CI is still running in the background — if it fails, the image won't be available and ArgoCD will show an image-pull error until CI is re-run or fixed.

## User Intent Handling

| User says | Action |
|-----------|--------|
| "release" / "ship it" / "deploy" | Full flow: detect → changelog → tag → deploy |
| "tag frontend patch" / "bump backend minor" | Phase 1 + 2: changelog + create tag, push |
| "deploy to prod" / "update preview" | Phase 3 only: update homelab manifests for that environment |
| "what's deployed?" / "release status" | Show comparison table only, no changes |
| "release frontend 0.1.0" | Use the specified version, skip auto-detection for that service |
| "preview release" | Tag with `-preview.N` suffix, deploy to preview environment |

## Feature Tracking

After a successful release, update feature tracking if the release includes work on a tracked feature:

1. Read `project/features/INDEX.md` to check if any features are "In Review"
2. For features included in this release, update their spec file:
   - Append or update the "## Deployment" section with version, date, and environment
3. Update `project/features/INDEX.md` status from "In Review" → "Deployed"
4. After making non-trivial changes, suggest running the `spec-docs` skill to update technical docs

## Edge Cases

- **No changes detected**: Tell the user everything is up to date. Show the current versions.
- **User asks for a specific version**: Skip auto-detection for that service and use the requested version.
- **User says "deploy to preview" or "deploy to prod"**: Only update that environment.
- **Agent service**: Report tag info but note there's no Kubernetes deployment to update.
- **No commits since last tag**: Skip that service in the tagging phase — it doesn't need a new release.
- **CI failure after deploy**: If the image hasn't been built yet, ArgoCD will show an `ImagePullBackOff`. The user should check CI status and re-run the workflow if needed. This is expected and self-healing once CI succeeds.
- **CHANGELOG.md doesn't exist**: Create it with a `# Changelog` heading before appending entries.
