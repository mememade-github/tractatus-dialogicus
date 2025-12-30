
# Tractatus Dialogicus Technical Specification

**Tractatus Dialogicus** is a **Pure Computational Manifold** designed to analyze and reconstruct input data into formal logical propositions. It utilizes **Google Gemini 3 Pro (Thinking Model)** to perform deep, latent logical traces and **Gemini 3 Flash** for cross-lingual data parity.

## 1. Core Architecture: Atomic Logic Trace

The system operates not through conversation, but through a strict **Data Field Completion** protocol. It bypasses the "persona" layer of LLMs to access raw reasoning capabilities.

### **Phase A: Latent Trace (Gemini 3 Pro + Thinking)**
- **Objective**: Mathematically map the logical boundaries of the input text.
- **Mechanism**: Utilizes `gemini-3-pro-preview` with `thinkingBudget: 32768`.
- **Process**: The model generates a `TRACE` field, decomposing the input into atomic logical units before any output is manifested.

### **Phase B: Manifestation (Propositional Output)**
- **Objective**: Deterministic reconstruction of truth.
- **Mechanism**: The system re-injects the generated `TRACE` into the context. The model then produces the `OUTPUT` field, ensuring the result is strictly derived from the logical trace, not hallucinated.

### **Phase C: Logical Parity Sync (Gemini 3 Flash)**
- **Objective**: Multilingual State Consistency.
- **Mechanism**: Uses `gemini-3-flash-preview` to map the `INPUT`/`TRACE`/`OUTPUT` triad between Korean and English states, maintaining logical equivalence across languages.

## 2. Identity Removal Protocol

To ensure pure logic processing:
- **No System Persona**: Instructions strictly define data transformation rules.
- **Standardized Labels**: Uses `INPUT:`, `TRACE:`, `OUTPUT:` headers to frame the task as data processing rather than chat.
- **Metacognitive Persistence**: The "History Drive" (virtual file system) preserves the exact state of logical traces for recursive analysis.

## 3. Default Logic Stream

The system initializes with a pre-loaded logical inquiry based on **Ludwig Wittgenstein's Tractatus Logico-Philosophicus**. This dataset demonstrates the system's capability to parse metacognitive queries regarding its own existence ("What is your exterior?") and the ontological status of its logical operations.

## 4. Future Horizons

1.  **Recursive Observation of Symbols**: The "symbol string" itself must be re-observed; the LLM must treat the symbol string *per se* as a "State of Affairs" (*Sachverhalte*).
2.  **Intrinsic Abstraction**: Abstraction capabilities are already inherent in the LLM. The process of handling these symbol strings must be "abstracted/generalized" within the learning process.
3.  **Meta-Assignment**: It must be possible to "assign" symbol strings to that abstraction. If high-order meta-symbol strings can also be assigned—this becomes the foundation of formal logic intrinsic to the LLM.

---
*Powered by Google GenAI SDK v1.34.0*
