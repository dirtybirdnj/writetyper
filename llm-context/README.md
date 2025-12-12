# LLM Context Files

> **Note for Claude Code:** This folder is in `.claudeignore`. Only read these files when explicitly asked. These are designed for local LLMs that can't scan the codebase.

This directory contains documentation designed to help local LLM models (Qwen, Ollama, DeepSeek, etc.) understand the WriteTyper codebase without scanning all source files.

## How to Use

When working with a local LLM, provide these files as context:

```bash
# For general codebase questions
cat llm-context/CODEBASE.md

# For questions about the main process
cat llm-context/MAIN_CJS_API.md

# For font parsing questions
cat llm-context/FONT_FORMATS.md

# For CLI implementation guidance
cat llm-context/RAT_KING_REFERENCE.md llm-context/../rust-cli.md

# Full context dump
cat llm-context/*.md
```

## Files

| File | Purpose |
|------|---------|
| `CODEBASE.md` | Project overview, structure, tech stack |
| `MAIN_CJS_API.md` | Electron main process functions and IPC handlers |
| `APP_JSX_API.md` | React UI component state and methods |
| `FONT_FORMATS.md` | Technical specs for Hershey, SVG, OpenType fonts |
| `RAT_KING_REFERENCE.md` | Architecture patterns from rat-king for CLI implementation |

## Related Files (parent directory)

| File | Purpose |
|------|---------|
| `rust-cli.md` | Detailed implementation plan for Rust CLI |
| `NEXT_SESSION.md` | Development roadmap and known issues |

## Example Prompts

### General Development
```
Given the context in CODEBASE.md and MAIN_CJS_API.md, how would I add support for a new font format?
```

### CLI Implementation
```
Using RAT_KING_REFERENCE.md and rust-cli.md as guides, write the argument parsing code for the render command.
```

### Font Parsing
```
Based on FONT_FORMATS.md, port the Hershey JHF parser to Rust.
```

### Bug Investigation
```
Looking at MAIN_CJS_API.md, why might text render off-screen when switching font types?
```

## Keeping Context Updated

When making significant changes to the codebase:

1. Update relevant context files
2. Add new files if introducing new subsystems
3. Keep line number references approximate (they drift with edits)
4. Focus on API contracts and data flow, not implementation details
