# Project agent skills (drishx-website)

Canonical folder: **`.agents/skills/`**.  
Cursor discovery: **`.cursor/skills/`** junctions into each skill (run `link-skills.ps1`).

## DrishX-specific skills

| Skill | Use for |
|-------|---------|
| `drishx-client-api` | Client fetch/mutation hooks, loading & error (no React Query) |

## Link after clone (Windows)

```powershell
powershell -ExecutionPolicy Bypass -File .agents\link-skills.ps1
```
