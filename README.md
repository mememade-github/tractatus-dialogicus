# Tractatus Dialogicus Technical Specifications

## 1. Core Objectives
This application serves as a **Metacognitive Observation Interface**. It facilitates a recursive dialogue where the AI (Gemini 3 Pro) fairly observes and reports its own internal reasoning process before manifesting a final proposition.

## 2. Logical Parity (Bilingual Sync)
- **Synchronized History**: Maintains two parallel history stacks (`historyKO`, `historyEN`).
- **Turn-based Translation**: Every user input and model output is translated in the background via `gemini-3-flash-preview`.
- **Reasoning Preservation**: Internal reasoning traces are preserved and translated to ensure logical continuity when switching between locales.

## 3. Hierarchical Numbering Protocol
The UI implements a strict decimal notation schema derived from Wittgenstein's logic:
- **1.1**: Initial Axiom (System Greeting).
- **N**: Subjective User Input (Propositional Attempt).
- **N.1**: Manifested Result (Analytical Conclusion).

## 4. Resource Resilience
- **Logic Saturation Management**: Uses a jittered exponential backoff for `429` errors.
- **Thinking Budget**: Allocates 32,768 tokens for deep metacognitive derivation.
- **Environment Integration**: Exclusively utilizes the environment-provided `process.env.API_KEY`.

## 5. Storage & Persistence
- **Manifold Snapshots**: Up to 10 logical streams are cached in LocalStorage.
- **Trace Export**: Sessions can be exported as JSON "Truth Streams" for reconstruction and verification.

---
*Verified Implementation v1.8 - 2024*