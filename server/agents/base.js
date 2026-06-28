// BaseAgent: retry logic, timing, and structured SSE event emission.
// All agents extend this class and only implement execute() + startMessage().

export class BaseAgent {
  constructor(name, { maxRetries = 2 } = {}) {
    this.name = name;
    this.maxRetries = maxRetries;
  }

  async run(input, emit) {
    emit({ type: "agent_start", agent: this.name, message: this.startMessage(input) });
    const start = Date.now();
    let lastError;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await this.execute(input);
        const durationMs = Date.now() - start;
        emit({
          type: "agent_complete",
          agent: this.name,
          result: this.publicResult(result),
          durationMs,
        });
        return result;
      } catch (err) {
        lastError = err;
        if (attempt < this.maxRetries) {
          const delay = 500 * 2 ** attempt; // 500ms, 1000ms
          emit({
            type: "agent_retry",
            agent: this.name,
            attempt: attempt + 1,
            maxRetries: this.maxRetries,
            error: err.message,
          });
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    emit({ type: "agent_error", agent: this.name, error: lastError.message });
    throw lastError;
  }

  // Override to provide a human-readable summary for the SSE event (avoid leaking raw data).
  publicResult(result) {
    return result;
  }
  startMessage(_input) {
    return `${this.name} running...`;
  }
  async execute(_input) {
    throw new Error(`${this.name}: execute() not implemented`);
  }
}
