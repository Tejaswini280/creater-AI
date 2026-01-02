# Branch Strategy & Workflow

## Branch Structure

```
main (production)
├── dev (staging)
│   ├── feature/ai-content-generator
│   ├── feature/enhanced-scheduler
│   ├── feature/analytics-dashboard
│   ├── bugfix/websocket-connection
│   └── bugfix/auth-flow
└── hotfix/security-patch
```

## Branch Definitions

### `main` - Production Branch
- **Purpose**: Live production code
- **Deployment**: Automatic to Railway Production
- **Protection**: Requires PR review, passing tests
- **Merge Strategy**: Squash and merge from `dev`

### `dev` - Staging Branch  
- **Purpose**: Integration and staging testing
- **Deployment**: Automatic to Railway Staging
- **Protection**: Requires passing tests
- **Merge Strategy**: Merge commits from feature branches

### `feature/*` - Feature Branches
- **Purpose**: New feature development
- **Naming**: `feature/descriptive-name`
- **Base**: Created from `dev`
- **Merge**: PR to `dev` branch

### `bugfix/*` - Bug Fix Branches
- **Purpose**: Non-critical bug fixes
- **Naming**: `bugfix/descriptive-name`
- **Base**: Created from `dev`
- **Merge**: PR to `dev` branch

### `hotfix/*` - Hotfix Branches
- **Purpose**: Critical production fixes
- **Naming**: `hotfix/descriptive-name`
- **Base**: Created from `main`
- **Merge**: PR to `main` (then merge back to `dev`)

## Workflow Process

### 1. Feature Development
```bash
# Start new feature
git checkout dev
git pull origin dev
git checkout -b feature/new-ai-tool

# Develop and commit
git add .
git commit -m "feat: add new AI content generation tool"
git push origin feature/new-ai-tool

# Create PR to dev branch
# After review and approval, merge to dev
# Automatic deployment to staging occurs
```

### 2. Release Process
```bash
# When dev is stable and ready for production
git checkout main
git pull origin main
git checkout -b release/v2.1.0

# Create PR from dev to main
# After thorough review and testing, merge to main
# Automatic deployment to production occurs
```

### 3. Hotfix Process
```bash
# Critical issue in production
git checkout main
git pull origin main
git checkout -b hotfix/security-vulnerability

# Fix the issue
git add .
git commit -m "fix: resolve critical security vulnerability"
git push origin hotfix/security-vulnerability

# Create PR to main for immediate production deployment
# After deployment, merge hotfix back to dev
git checkout dev
git merge hotfix/security-vulnerability
```

## Branch Protection Rules

### `main` Branch Protection
- ✅ Require pull request reviews (2 reviewers)
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Restrict pushes to admins only
- ✅ Require signed commits (recommended)

### `dev` Branch Protection  
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Allow force pushes by admins

## Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples
```bash
feat(ai): add GPT-4 integration for content generation
fix(auth): resolve login redirect loop issue
docs: update deployment guide with Railway setup
refactor(scheduler): optimize database queries
test(api): add integration tests for content endpoints
chore(deps): update dependencies to latest versions
```

## Merge Strategies

### Feature → Dev
- **Strategy**: Merge commit
- **Reason**: Preserve feature development history
- **Command**: `git merge --no-ff feature/branch-name`

### Dev → Main
- **Strategy**: Squash and merge
- **Reason**: Clean production history
- **Command**: Via GitHub PR with squash option

### Hotfix → Main
- **Strategy**: Merge commit
- **Reason**: Preserve hotfix traceability
- **Command**: `git merge --no-ff hotfix/branch-name`

## Deployment Mapping

| Branch | Environment | URL | Auto-Deploy |
|--------|-------------|-----|-------------|
| `main` | Production | `https://your-app.railway.app` | ✅ |
| `dev` | Staging | `https://staging-your-app.railway.app` | ✅ |
| `feature/*` | None | Local development | ❌ |
| `hotfix/*` | Production | `https://your-app.railway.app` | ✅ |

## Quality Gates

### Before Merging to `dev`
- [ ] All tests pass
- [ ] Code review completed
- [ ] Feature is functionally complete
- [ ] No breaking changes

### Before Merging to `main`
- [ ] All tests pass
- [ ] Security scan passes
- [ ] Staging environment tested
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Breaking changes documented

## Rollback Strategy

### Production Rollback
```bash
# Option 1: Railway rollback
railway rollback --service=$RAILWAY_PROD_SERVICE_ID

# Option 2: Git revert
git checkout main
git revert <commit-hash>
git push origin main
```

### Staging Rollback
```bash
# Reset dev branch to previous state
git checkout dev
git reset --hard <previous-commit>
git push --force-with-lease origin dev
```

## Best Practices

1. **Keep Branches Small**: Focus on single features/fixes
2. **Regular Updates**: Sync with `dev` frequently
3. **Clean History**: Use meaningful commit messages
4. **Test Locally**: Ensure code works before pushing
5. **Review Thoroughly**: All code should be reviewed
6. **Document Changes**: Update docs with new features

## Troubleshooting

### Merge Conflicts
```bash
# Update your branch with latest dev
git checkout feature/your-branch
git fetch origin
git merge origin/dev

# Resolve conflicts manually
# Then commit the merge
git add .
git commit -m "resolve merge conflicts with dev"
```

### Failed Deployments
```bash
# Check deployment status
railway status --service=$SERVICE_ID

# View deployment logs
railway logs --service=$SERVICE_ID

# Manual deployment if needed
railway up --service=$SERVICE_ID
```

This branch strategy ensures safe, traceable, and efficient development while maintaining production stability.