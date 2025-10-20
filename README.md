# Cennso Website

## Overview

This repository contains sources for the Cennso website. The website uses [Next.js](https://nextjs.org/) for static site generation.

## Prerequisites

Use the following tools to set up the project:

- [Node.js](https://nodejs.org/en/) >= v16
- [Yarn](https://yarnpkg.com/getting-started/install)

## Usage

### Add new content

To learn how to add new content to the website, check the [documentation](./docs) folder.

### Install dependencies

To install all dependencies, run this command:

```bash
yarn
```

### Launch the website locally

Launch the development server with the hot/auto-reloading functionality that makes any change in files from the `pages|components|lib` folder immediately visible in the browser. Run the following command:

```bash
yarn dev
```

Then, go to the `http://localhost:3000` page.

> **NOTE**: Hot/auto-reloading doesn't work if the static content, such as content for blog posts, is changed. After updating the static content, manually refresh the page in the browser for the changes to appear.

### Build the production-ready website

To build a production-ready website, run the following command:

```bash
yarn build
```

### Run the server with the production-ready website

To serve a production-ready website, run the following command:

```bash
yarn start
```

Then, go to the `http://localhost:3000` page.

## Development and AI Agents

This project uses **[Spec-kit](https://github.com/github/spec-kit)**, a structured workflow for planning and implementing features with AI agents.

### Quick Reference Files

- **[AGENTS.md](./AGENTS.md)** - Technical context and patterns for working in this codebase (stack, structure, commands)
- **[Constitution](./.specify/memory/constitution.md)** - Non-negotiable standards (code quality, accessibility, performance, testing)

### Spec-kit Workflow

Spec-kit provides **AI agent commands** (slash commands recognized by compatible AI assistants) that guide you through feature development:

#### 1. **Create a Feature Specification**

Command:

```
/speckit.specify Add additional subpage that highlights our open source involvement
```

**What this does**: AI agent recognizes the `/speckit.specify` command and:

- Creates a new feature branch (e.g., `001-open-source-page`)
- Generates feature spec in `/specs/001-open-source-page/spec.md` with:
  - User stories and acceptance criteria
  - Functional requirements
  - Success metrics

#### 2. **Generate Implementation Plan**

Command:

```
/speckit.plan
```

**What this does**: AI agent generates technical design documents:

- `plan.md` - Technical approach, architecture decisions, constitution compliance check
- `research.md` - Technology choices and best practices research
- `data-model.md` - Entity definitions and data structures (if needed)
- `contracts/` - API endpoints and interfaces (if applicable)
- Updates AGENTS.md with feature-specific context

#### 3. **Create Task Breakdown**

Command:

```
/speckit.tasks
```

**What this does**: AI agent creates detailed implementation checklist:

- `tasks.md` - Dependency-ordered tasks organized by user story
- Each user story becomes independently testable and deliverable
- Clear file paths and parallel execution opportunities identified

#### 4. **Implement Tasks**

Command:

```
/speckit.implement
```

**What this does**: AI agent works through the tasks.md checklist:

- Implements code according to plan and constitution standards
- Creates files, components, and utilities as specified
- Ensures compliance with quality gates (TypeScript, linting, formatting)

#### Optional Commands

- `/speckit.clarify` - AI asks questions to resolve ambiguities in the spec before planning
- `/speckit.analyze` - AI reviews existing code for refactoring or integration points
- `/speckit.checklist` - AI validates implementation against constitution requirements
- `/speckit.constitution` - Update project standards and principles

**Note**: These are **AI agent commands** - they work with compatible AI assistants that support slash command syntax (like GitHub Copilot, Cursor, etc.). The agent recognizes the command and follows the workflow defined in `.github/prompts/speckit.*.prompt.md` files.

### File Structure

```
.specify/
├── memory/
│   └── constitution.md          # Project standards
├── templates/                   # Templates for specs, plans, tasks
└── scripts/                     # Automation scripts

specs/
└── ###-feature-name/           # Generated per feature
    ├── spec.md                 # User stories and requirements
    ├── plan.md                 # Technical design
    ├── tasks.md                # Implementation checklist
    ├── research.md             # Technology decisions
    ├── data-model.md           # Data structures
    └── contracts/              # API definitions
```

### Best Practices

1. **Always start with `/speckit.specify`** - Don't skip the spec; it ensures clear requirements
2. **Review the constitution** before implementation - All code must comply with standards
3. **One user story at a time** - Tasks are organized for independent, testable delivery
4. **Run quality gates before merge**: `yarn check:all` (includes format, lint, accessibility, and build checks)

### AI Agent Notes

Remember that not all AI Agents follow the `AGENTS.md` standard by default, so you may need to explicitly ask agents to read it or reference the constitution for standards compliance.
