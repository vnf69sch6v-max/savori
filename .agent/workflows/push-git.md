---
description: How to push changes to git without asking
---

// turbo-all

1. Stage all changes: `git add -A`
2. Commit with descriptive message: `git commit -m "type: description"`
3. Push to main: `git push origin main`

Always use conventional commit format:
- `feat:` for new features
- `fix:` for bug fixes
- `refactor:` for code refactoring
- `docs:` for documentation
- `chore:` for maintenance tasks

Do not ask user for confirmation - just push.
