# Codex Project Instructions

This repository is the Codex workspace for reconstructing and improving a project originally created in ChatGPT Projects.

## Working Style

- Preserve the original intent from the ChatGPT Project source material.
- Prefer small, verifiable changes over broad rewrites.
- Keep decisions documented in `docs/decisions.md`.
- Keep implementation tasks tracked in `docs/backlog.md`.
- When source material is ambiguous, record assumptions in `docs/project-spec.md` before implementing.

## Source Material

Place exported or pasted ChatGPT Project material under `source-material/`.

Useful inputs include:

- Project instructions / custom instructions.
- Uploaded files from the ChatGPT Project.
- Important conversation transcripts.
- Existing app code, prompts, specs, datasets, screenshots, or diagrams.

## Definition of Done

A reconstructed feature is considered done when:

- Its source intent is captured in `docs/project-spec.md`.
- The implementation is present in the repo.
- Basic verification steps are documented and run when possible.
- Any gaps or follow-up work are added to `docs/backlog.md`.
