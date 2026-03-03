---
name: release
description: Handles the full release lifecycle for bike-weather services — tagging new versions, waiting for CI to build images, and deploying to Kubernetes via the homelab repository. Use this skill whenever the user mentions releasing, deploying, shipping, tagging, bumping versions, or updating bike-weather — even casually like "ship it", "deploy the latest", "push to prod", "update preview", "release what's changed", "bump frontend", or "tag a new version". Also trigger when the user asks about what's pending deployment, what versions are running, or release status.
---

# Release Skill

Full release lifecycle for bike-weather: tag → CI build → deploy to Kubernetes.

## Overview

The bike-weather project has three services (`frontend`, `backend`, `agent`), each independently versioned via git tags (`<service>/v<semver>`). The release process has two phases:

1. **Tagging** — Create semver git tags in bike-weather to trigger GitHub Actions CI, which builds and pushes container images to `ghcr.io`.
2. **Deploying** — Update Kubernetes deployment manifests in the homelab repo so ArgoCD picks up the new images.

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

## Phase 1: Tagging

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

This triggers GitHub Actions to build the container image.

### Waiting for CI

After pushing a tag, GitHub Actions builds the image. Use the GitHub MCP server tools to check workflow status:

1. List workflow runs filtered by the tag push event
2. Poll until the run completes (check every 30 seconds)
3. Report success or failure

The workflow files are:
- `.github/workflows/frontend.yml` — triggers on `frontend/v*` tags
- `.github/workflows/backend.yml` — triggers on `backend/v*` tags
- `.github/workflows/agent.yml` — triggers on `agent/v*` tags

If stable release: CI checks for an existing preview image with the same base version and retags it instead of rebuilding. This means preview → stable promotion is fast.

## Phase 2: Deploying

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

Tell the user the push is done and ArgoCD will pick up the changes.

## User Intent Handling

| User says | Action |
|-----------|--------|
| "release" / "ship it" / "deploy" | Full flow: detect → tag if needed → wait for CI → deploy |
| "tag frontend patch" / "bump backend minor" | Phase 1 only: create tag, push, wait for CI |
| "deploy to prod" / "update preview" | Phase 2 only: update homelab manifests for that environment |
| "what's deployed?" / "release status" | Show comparison table only, no changes |
| "release frontend 0.1.0" | Use the specified version, skip auto-detection for that service |
| "preview release" | Tag with `-preview.N` suffix, deploy to preview environment |

## Edge Cases

- **No changes detected**: Tell the user everything is up to date. Show the current versions.
- **User asks for a specific version**: Skip auto-detection for that service and use the requested version.
- **User says "deploy to preview" or "deploy to prod"**: Only update that environment.
- **CI fails**: Report the failure with a link to the workflow run. Do not proceed to deploy.
- **Agent service**: Report tag info but note there's no Kubernetes deployment to update.
- **No commits since last tag**: Skip that service in the tagging phase — it doesn't need a new release.
