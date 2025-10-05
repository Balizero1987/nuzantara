# Official Document Extraction & Citation Guide

Goal: Create anchored extracts for official Immigration (Imigrasi) and Manpower (Kemnaker) documents to support grounded answers.

Workflow
- Place PDFs in `official/docs/` and keep original filenames.
- For each document, create an extract at `official/extracts/<doc-code>.md` with:
  - Header: Title, Effective Date, Source, File path
  - Sections: Article/Paragraph headings with anchors (e.g., `## Art. 12 — Biometrics #art12`)
  - Citations: Use `[Doc: Title — Art. X, p.Y]` convention in visa_types `legal_basis[]`.

Anchoring Rules
- Prefer article/paragraph numbers; include page numbers for PDFs.
- Keep quotes ≤ 3 sentences; store full text only when necessary.
- Update `official/registry.json` with `status: present` and `path` filled.

Quality Gates
- Each visa_types entry must cite at least one official extract section.
- Changes in biometrics, fee, or scope → update extract + `effective_date`.

