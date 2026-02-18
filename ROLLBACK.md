# GitHub Pages Deployment Rollback Procedure

## Overview

This document describes the procedures for rolling back a GitHub Pages deployment if issues are discovered after deployment.

## Automatic Rollback (Failed Deployment)

If the GitHub Actions workflow fails during deployment:
- GitHub Pages will continue serving the last successful deployment
- No manual intervention is required
- Fix the issue and push a new commit to trigger a new deployment

## Manual Rollback (Successful Deployment with Issues)

### Method 1: GitHub UI (Recommended)

1. Navigate to repository Settings
2. Click on "Pages" in the left sidebar
3. Scroll to "Deployments" section
4. Find the deployment you want to revert to
5. Click the "..." menu next to the deployment
6. Select "Revert" if available, or note the commit SHA

### Method 2: Command Line (gh-pages Branch)

```bash
# Step 1: Clone the repository if not already cloned
git clone <repository-url>
cd <repository-name>

# Step 2: Checkout the gh-pages branch
git checkout gh-pages

# Step 3: Find the commit hash of the last good deployment
git log --oneline

# Step 4: Reset to the last good commit
git reset --hard <commit-sha>

# Step 5: Force push to update gh-pages branch
git push origin gh-pages --force
```

### Method 3: Redeploy Previous Main Branch Commit

```bash
# Step 1: Checkout main branch
git checkout main

# Step 2: Find the commit hash of the last good main branch commit
git log --oneline

# Step 3: Checkout that commit
git checkout <commit-sha>

# Step 4: Trigger deployment by pushing to gh-pages locally
npm run build
npx gh-pages -d dist --message "Rollback to commit <commit-sha>"
```

## Verification Steps

After rollback:

1. **Clear browser cache** or open in incognito/private mode
2. **Verify the URL**: https://<username>.github.io/excel-processor/
3. **Check functionality**:
   - Dashboard loads correctly
   - All charts render
   - Data upload works
   - No console errors

## Prevention

To minimize need for rollbacks:

1. **Run tests locally**: `npm run test:run` before pushing
2. **Test build locally**: `npm run build` and `npm run preview`
3. **Check deployment status**: Watch the GitHub Actions workflow run
4. **Monitor error rates**: After deployment, check for any issues

## Deployment History

GitHub Actions maintains a history of all deployments. View them at:
```
https://github.com/<username>/excel-processor/actions/workflows/deploy.yml
```

## Emergency Contact

If rollback procedures fail:
1. Disable GitHub Pages in repository Settings temporarily
2. Contact repository maintainer
3. Create issue describing the problem

## Related Documentation

- SPEC-PERF-DASHBOARD-002: DashboardView Performance Optimization & Deployment
- GitHub Actions Workflow: `.github/workflows/deploy.yml`
- GitHub Pages Documentation: https://docs.github.com/en/pages
