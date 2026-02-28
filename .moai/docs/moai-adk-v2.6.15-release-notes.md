# MoAI-ADK v2.6.15 Release Notes

**Release Date:** 2026-02-28
**Version:** 2.6.15
**Template Version:** 2.6.15

---

## Overview

This update to the MoAI (Strategic Orchestrator) Agent Development Kit brings significant enhancements to team-based workflows, improved documentation organization, and new hook system capabilities. The focus is on enabling parallel execution for complex multi-domain tasks while maintaining the simplicity of single-agent workflows.

---

## Major Features

### 1. Agent Teams System (Experimental)

**Purpose:** Enable parallel execution of specialized agents for complex development tasks

**New Agent Types:**
- `team-researcher` - Read-only codebase exploration
- `team-analyst` - Requirements analysis and validation
- `team-architect` - Technical design and architecture
- `team-backend-dev` - Backend implementation (worktree-isolated)
- `team-frontend-dev` - Frontend implementation (worktree-isolated)
- `team-tester` - Test development (worktree-isolated)
- `team-quality` - Quality validation

**Workflow Integration:**
- **Plan Phase:** Parallel research (3 agents explore concurrently)
- **Run Phase:** Parallel implementation (backend + frontend + tester)
- **Sync Phase:** Single agent (manager-docs) for consistency

**Activation:**
```yaml
# .claude/settings.json
env:
  CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: "1"

# .moai/config/sections/workflow.yaml
workflow:
  team:
    enabled: true
    max_teammates: 10
```

### 2. Enhanced Hook System

**Purpose:** Extend Claude Code with custom behaviors at lifecycle events

**New Hooks (16 total):**

| Category | Hooks | Description |
|----------|-------|-------------|
| **Session** | SessionStart, SessionEnd | Initialize/cleanup session state |
| **Agent** | SubagentStart, SubagentStop, SubagentOutput | Track agent lifecycle |
| **Tool** | PreToolUse, PostToolUse | Intercept tool execution |
| **Git** | PreCommit, PostCommit | Git operation hooks |
| **Worktree** | WorktreeCreate, WorktreeRemove | Worktree management |
| **Quality** | QualityGate, LSPDiagnostic | Quality enforcement |

**Location:** `.claude/hooks/moai/` (executable shell scripts)

**Example Hook:**
```bash
# .claude/hooks/moai/handle-worktree-create.sh
#!/bin/bash
# Create isolated worktree for SPEC implementation
SPEC_ID="$1"
git worktree add ".git/worktrees/$SPEC_ID" -b "feature/SPEC-$SPEC_ID"
```

### 3. New Workflow Skills

**Purpose:** Specialized workflows for common development tasks

| Workflow | Description |
|----------|-------------|
| `clean` | Dead code identification and removal |
| `codemaps` | Architecture documentation generation |
| `context` | Git-based context memory extraction |
| `coverage` | Test coverage analysis and gap filling |
| `e2e` | End-to-end testing with Chrome/Playwright |
| `mx` | MX tag scanning and annotation |
| `review` | Multi-perspective code review |

**Usage:**
```bash
/moai clean              # Remove dead code
/moai codemaps           # Generate architecture docs
/moai context --spec SPEC-XXX  # Extract context memory
/moai coverage           # Analyze test coverage
/moai e2e                # Run E2E tests
/moai mx                 # Scan for MX tags
/moai review             # Comprehensive code review
```

---

## Configuration Enhancements

### New Configuration Files

| File | Purpose |
|------|---------|
| `.moai/config/sections/context.yaml` | Context window optimization settings |
| `.moai/config/sections/llm.yaml` | LLM provider configuration |
| `.moai/config/sections/mx.yaml` | MX tag scanning thresholds |
| `.moai/config/sections/state.yaml` | Session state persistence |

### Updated Configuration Structure

**Git Strategy Configuration:**
```yaml
# .moai/config/sections/git-strategy.yaml
git_strategy:
  mode: manual  # Options: manual, personal, team
  provider: github
```

**GitHub Integration:**
```yaml
# .moai/config/sections/system.yaml
github:
  auto_delete_branches: true
  enable_trust_5: true
  spec_git_workflow: main_direct  # Options: main_direct, feature_branch
  git_workflow: github_flow       # Options: github_flow, gitflow, main_direct
```

---

## Agent Updates

### Manager Agents

All manager agents updated with:
- Improved task delegation patterns
- Enhanced error handling
- Better progress reporting
- Context memory integration

### Expert Agents

All expert agents updated with:
- Latest best practices
- Improved tool selection
- Enhanced domain expertise
- MX tag awareness

### Builder Agents

New builder capabilities:
- `builder-agent` - Create custom subagents
- `builder-skill` - Create workflow skills
- `builder-plugin` - Create Claude Code plugins

---

## Documentation Improvements

### Progressive Disclosure System

Token optimization through 3-level loading:
- **Level 1 (Metadata):** ~100 tokens, always loaded
- **Level 2 (Body):** ~5,000 tokens, trigger-based
- **Level 3 (Bundled):** On-demand loading

**Result:** 67% reduction in initial token load

### New Documentation Structure

```
.claude/skills/moai/
├── workflows/          # Main workflow definitions
├── team/              # Team-mode workflows
├── references/        # Cross-references and specs
└── SKILL.md           # Main entry point
```

---

## Breaking Changes

### Agent Teams Prerequisites

Both conditions must be met for team mode:
1. `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in settings.json
2. `workflow.team.enabled: true` in workflow.yaml

### ESLint Configuration Update

Flat config migration requires explicit rule configuration:
```javascript
// eslint.config.js
import tseslint from 'typescript-eslint'

export default defineConfig([
  {
    rules: {
      'no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-expressions': ['error', {
        allowShortCircuit: true,
        allowTernary: true,
      }],
    },
  },
])
```

---

## Bug Fixes

- Fixed ESLint v9 + typescript-eslint v8 flat config compatibility
- Resolved MX tag scanning for large codebases
- Fixed worktree cleanup on team shutdown
- Improved error reporting in agent delegation

---

## Performance Improvements

- **Token Usage:** 67% reduction in initial skill loading
- **Agent Teams:** Up to 3x faster for parallelizable tasks
- **File Reading:** Progressive loading based on file size
- **Context Management:** Smart token budget allocation

---

## Migration Guide

### From v2.6.x to v2.6.15

1. **Update configuration:**
   ```bash
   moai update
   ```

2. **Enable Agent Teams (optional):**
   ```yaml
   # .claude/settings.json
   env:
     CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: "1"

   # .moai/config/sections/workflow.yaml
   workflow:
     team:
       enabled: true
   ```

3. **Review new workflows:**
   ```bash
   /moai help        # See all available commands
   /moai context     # New context memory feature
   /moai mx          # New MX tag scanning
   ```

4. **Update ESLint config (if using TypeScript):**
   - Migrate to flat config format
   - Explicitly configure rule overrides

---

## Known Issues

1. **Agent Teams:** Experimental feature, may have stability issues
2. **Worktree Cleanup:** Manual cleanup may be required after team shutdown
3. **ESLint v9:** Some rule combinations may require manual configuration

---

## Future Roadmap

### v2.7.0 (Planned)
- Stable Agent Teams release
- Enhanced CG Mode (Claude + GLM cost optimization)
- Improved worktree management
- Better error recovery

### v2.8.0 (Planned)
- Plugin marketplace
- Custom agent templates
- Enhanced MX tag IDE integration
- Performance profiling tools

---

## Support

- **Documentation:** `.claude/skills/moai/`
- **Issues:** Report via `/moai feedback`
- **Changelog:** See `.moai/docs/` directory

---

**End of Release Notes**
