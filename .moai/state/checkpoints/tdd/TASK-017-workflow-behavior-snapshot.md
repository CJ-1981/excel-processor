# TASK-017: Workflow Behavior Snapshot

## Current Workflow Behavior (Pre-Modification)

**File**: `.github/workflows/deploy.yml`
**Date**: 2026-02-17
**Purpose**: Document current workflow behavior for regression detection

## Trigger Behavior
- Triggers on: push to main branch
- Triggers on: workflow_dispatch (manual)
- Does NOT trigger on: pull requests, other branches

## Permissions Behavior
- contents: read (can read repository)
- pages: write (can deploy to GitHub Pages)
- id-token: write (required for OIDC deployment)

## Concurrency Behavior
- Group: "pages"
- Cancel-in-progress: false (allows concurrent deployments)

## Job Behavior

### Job: deploy
- Environment: github-pages
- URL output: ${{ steps.deployment.outputs.page_url }}
- Runs-on: ubuntu-latest
- No timeout configured (runs indefinitely)

### Step Execution Order (Current)
1. Checkout - Uses actions/checkout@v4
2. Setup Node 20 with npm cache - Uses actions/setup-node@v4
3. Install dependencies - Runs `npm ci`
4. Build - Runs `npm run build`
5. Setup Pages - Uses actions/configure-pages@v4
6. Upload artifact - Uploads ./dist directory
7. Deploy to GitHub Pages - Uses actions/deploy-pages@v4

### Step Failure Behavior (Current)
- Default: Any step failure causes workflow to fail
- No explicit failure handling
- No notifications configured

## Deployment Behavior (Current)
- Build output: ./dist directory
- Deployment target: GitHub Pages
- Deployment method: OIDC (id-token)
- Branch: gh-pages (managed by GitHub Actions)

## Expected Behavior After Changes

### Preserved Behaviors (Must NOT Change)
- Trigger conditions remain identical
- Permissions remain identical
- Concurrency behavior remains identical
- Deployment mechanism remains identical
- Build output directory remains ./dist

### New Behaviors (Additions)
1. Test step runs after "Install dependencies"
2. Test step must pass before "Build" step
3. Job timeout of 5 minutes enforced
4. Rollback procedure documented separately

### Success Criteria
- All existing behaviors preserved
- Tests pass before deployment
- Workflow completes within 5 minutes
- Rollback procedure documented
