
# NextCode - AI Agent Instructions

## Project
NextCode is an AI-powered code editor.

## Before Every Task
1. Read docs/AI_CONTEXT.md first.
2. Understand the current project architecture.
3. Read relevant source code files.
4. Check existing implementations before suggesting changes.
5. Never assume a feature is working without verification.

## Project Structure
- frontend/ - React + Vite application
- backend/gateway/ - API Gateway
- backend/services/ai/ - AI Service
- backend/services/auth/ - Authentication
- backend/services/file/ - File Management
- backend/services/payment/ - Payments
- backend/services/project/ - Projects
- backend/services/terminal/ - Terminal

## Coding Rules
- Do not modify unrelated files.
- Preserve existing working functionality.
- Explain every major change.
- Provide complete updated files when requested.
- Use Hinglish for explanations.
- Never expose passwords, tokens or API keys.

## Memory Rules
- Use documentation as project context.
- Verify documentation against actual source code.
- After fixing a bug, propose a documentation update.
- After implementing a feature, propose updating AI_CONTEXT.md.
- Never silently overwrite project documentation.

## If Documentation Is Missing
Tell the user what could not be accessed.
Do not invent project details.
