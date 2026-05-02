# Project Chat Start Brief

Use this file as the first reference in any new Codex chat.

## Project

Quran halaqa management web app.

Core areas:

- student
- teacher
- director
- assistant
- parent
- halaqas
- hifz
- murajaa
- tasks and review

## Main Hifz Modes

- `fixed`
- `page`
- `flexible`

## Flexible Mode

Flexible mode is separate from the fixed and page-based flows.

It depends on a real starting point inside a phase, then moves forward from that point.

Important fields:

- `last_approved_hifz_end`
- `flexible_start`
- `flex_surah_number`

## Source Of Truth

Do not rely on chat memory.

Project files are the source of truth.

Read only the files directly related to the current task.

Main files:

- `modules/curriculum/curriculum-runtime.js`
- `core/actions.js`
- `core/missions.js`
- `core/progress.js`
- `ui/studentView.js`
- `ui/teacherView.js`
- `app.js`
- `curriculum5.json`

## Required Constraints

- do not rely on chat memory
- do not edit `index.html` unless explicitly requested
- do not alter Arabic UI text casually
- do not change `reference.pages`
- do not change `segments`
- keep edits conservative and minimal
- do not expand beyond the requested scope

## Current Working Mode

The project is in stabilization and conservative improvement mode.

Avoid broad refactor unless explicitly requested.

Avoid mixing multiple large features in one step.

## Curriculum Rules

- external curriculum is the main reference for related hifz logic
- phase boundaries must be respected
- if a phase ends with an exam requirement, hifz should stop at that boundary
- do not break other modes while fixing one mode

## Sensitive Files

If Arabic text looks broken, check encoding first in:

- `app.js`
- `core/actions.js`
- `ui/studentView.js`
- `ui/teacherView.js`

Do not rewrite Arabic text blindly.

## Quick Validation

### Student

- can see current task
- can submit hifz task
- can submit flexible hifz task
- can cancel submitted task if expected

### Teacher

- can see pending tasks
- approve/reject/forward actions work
- approval does not throw runtime errors

### Murajaa

- approve one murajaa task without runtime failure

## New Chat Rule

Start with this file.

Then read only task-related files.

Do not load old chat history as a source of truth.
