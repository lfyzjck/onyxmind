The initial PRD framework for **OnyxMind** is very clear! Building on the core concepts we just discussed — "ultimate automation steward", "multi-dimensional view construction (Canvas/Bases)", and "Tool Use based on the OpenCode SDK" — I have performed a **comprehensive upgrade and restructure** of this PRD.

This update retains your original interaction logic (chat panel, quick commands, context menu) while significantly enhancing **Agent automation capabilities** and **Obsidian native feature integration**.

The updated PRD document is as follows:

---

# OnyxMind Product Requirements Document (PRD) v2.0

## 1. Product Overview

### 1.1 Product Positioning

OnyxMind is an **Obsidian-native intelligent steward and scene-based creative assistant** built on the OpenCode AI Agent framework. Beyond providing Q&A and content generation through an interactive panel, it silently performs automated knowledge base organization, metadata maintenance, and multi-dimensional view (Canvas/Bases) construction in the background through underlying API encapsulation (Tool Use).

### 1.2 Core Value Propositions

- **Automated Organization (The Steward)**: Takes over the tedious manual work of maintaining YAML, tags, and folders, freeing up productivity.
- **Deep Connection and Retrieval (Local RAG)**: Context-aware Q&A and semantic backlink recommendations based on local note content.
- **Structured Visualization (The Architect)**: Breaks beyond text limitations by automatically converting long notes into logically clear Canvas boards or Bases database views.
- **Seamless Integration**: Reuses the OpenCode Agent SDK, encapsulating all file operations as Skills to ensure high extensibility.

### 1.3 Target Users

- **Knowledge Workers / Researchers**: Need to manage large volumes of notes, retrieve information quickly, and produce systematic outputs.
- **Organization Enthusiasts / System Builders**: Passionate about building personal knowledge management systems (PKM) but unwilling to fall into "maintenance fatigue".
- **Content Creators**: Need AI assistance in gathering materials, expanding drafts, and optimizing article structure.

---

## 2. Functional Requirements

### 2.1 Core Feature Modules

#### 2.1.1 Automation Steward Engine (Steward Engine)

**Description**: AI Agent automatically performs vault-level organization operations to reduce "entropy increase".

- **Smart Metadata (Smart YAML) and Bases Integration**: Automatically analyzes note content to complete summaries and keywords, and applies tags and properties adapted for Obsidian Bases (e.g., project status, priority) based on context.
- **Semantic Backlinks and MOC Maintenance**: Silently recommends potential bidirectional links `[[ ]]` in the sidebar while the user is writing; periodically scans isolated notes and suggests archiving them to MOC (Maps of Content).
- **Automated File Flow (Auto-Filing)**: Monitors a designated inbox, automatically renames files, and moves them to the target directory.

#### 2.1.2 Structured View Architect (Architect Engine)

**Description**: Converts text into Obsidian's higher-order view formats.

- **AI to Canvas**: Select a long document and the Agent automatically extracts the core logic, breaks it into multiple card nodes (Nodes), and auto-connects them with edges (Edges) in Canvas.
- **AI to Excalidraw (Extended)**: Generates simple Excalidraw flowcharts or architectural sketches via natural language instructions (based on JSON injection).
- **Automatic Task Extraction**: Scans meeting notes or Daily Notes, extracts `[ ]` to-do items, and syncs them to a unified Bases task board.

#### 2.1.3 Smart Interaction Interfaces

_(Retains and enhances your original design)_

- **Smart Chat Panel**: Supports Markdown, streaming output, and reference navigation; displays the Agent's reasoning process and tool invocation status in real time.
- **Quick Commands (Command Palette)**: Integrated into Obsidian's command palette to trigger high-frequency actions such as "Organize current note properties", "Generate Canvas", and "Full-text summary" with a single click.
- **Context Menu**: Right-click on selected text to access local operations such as "Explain, Rewrite, Extract Tasks, Translate".

### 2.2 Configuration and Underlying Settings

#### 2.2.1 Engine and Connection Configuration

- **OpenCode Service Configuration**: API Endpoint, key management, and model selection (preferring high-intelligence models such as Claude 3.5 Sonnet).
- **Local Privacy Mode (Local AI)**: Reserved Ollama/Local RAG interface configuration to meet the absolute privacy requirements of power users.

#### 2.2.2 Agent Behavior and Security Configuration

- **Tool Permission Management**: Fine-grained control over Agent permissions (e.g., allow read, allow YAML modification, disallow file deletion).
- **Operation Confirmation Mechanism**: The option "destructive operations (e.g., bulk move, rename) require user confirmation" is enabled by default.
- **Local RAG Index Settings**: Configure the update frequency (real-time / scheduled) and excluded folders for the vector store.

---

## 3. Non-Functional Requirements

### 3.1 Performance and Architecture Requirements

- **RAG Retrieval Latency**: Local semantic retrieval must complete in < 1 second.
- **Asynchronous Scheduling**: All batch file modification operations must enter a **Job Queue** and must never block the Obsidian main UI thread.
- **Token Optimization**: A Local Pre-filter mechanism is used to avoid sending the entire vault's text directly to the large model, which would cause token overflow.

### 3.2 Security and Stability Requirements

- **File Safety**: Before large-scale operations (e.g., organizing dozens of notes), automatically create a snapshot or support Ctrl+Z history rollback.
- **Data Stays Local**: Non-conversation-essential content is not proactively sent to the cloud, with clear privacy boundaries.

---

## 4. User Stories

### 4.1 Automated Organization (New)

**As** a user with an organizational obsession,
**I want** to quickly jot down fleeting thoughts in the Inbox, then have OnyxMind automatically tag, categorize, and fill in Bases properties,
**so that** I can focus on capturing ideas without spending half an hour every day dragging files and writing YAML.

### 4.2 Visual Thinking (New)

**As** a visual learner,
**I want** AI to help me convert a 5,000-word research report into an Obsidian Canvas with a single click,
**so that** I can quickly grasp the article's logical chain and core arguments through spatial layout.

### 4.3 Knowledge Q&A and Creation (Improved)

**As** a knowledge worker / content creator,
**I want** to summon the panel while writing and have AI retrieve my local vault and generate a structured draft,
**so that** I can overcome blank-page anxiety and maximize the reuse of my past knowledge.

---

## 5. Priority Planning (Roadmap)

### P0 (MVP Required: Validate Architecture and Core Pain Points)

- OpenCode SDK underlying integration and Tool Registry registration (read/write files, update metadata).
- **Smart Chat Panel** (basic Q&A + streaming UI response).
- **Smart Metadata Steward** (one-click completion of YAML and Bases properties).
- Basic local retrieval (keyword-based or lightweight RAG).

### P1 (Important Features: Experience Differentiation)

- **AI to Canvas** (long-form to board conversion, core highlight).
- **Smart Task Extraction** (scan Daily Notes and sync to task board).
- Quick commands and context text-selection menu.
- Visual confirmation and rollback mechanisms for file operations.

### P2 (Enhanced Features: Deep Ecosystem Integration)

- **Automated File Flow** (Inbox auto-archiving and renaming).
- Real-time semantic backlink recommendations (writing sidebar hints).
- Full local model (Ollama) compatibility.

### P3 (Future Plans)

- AI to Excalidraw prototype generation.
- Multi-Agent collaboration (different Agents responsible for different folders).

---

## 6. Success Metrics

- **Core Stickiness**: Weekly Active User (WAU) retention rate > 50%.
- **Feature Penetration Rate**: "Metadata completion" and "Convert to Canvas" tool invocation share > 40% of total AI calls (proving steward value beyond being a pure chat tool).
- **Stability**: Crash or data corruption rate caused by automated file operations is strictly 0%.
