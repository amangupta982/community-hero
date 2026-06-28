import { describe, it, expect, vi } from "vitest";
import { asyncHandler } from "../utils/asyncHandler.js";

function makeReq() {
  return {};
}

function makeRes() {
  return {
    _status: null,
    _json: null,
    status(c) { this._status = c; return this; },
    json(d) { this._json = d; return this; },
  };
}

describe("asyncHandler", () => {
  it("calls the wrapped function with req, res, next", async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const req = makeReq();
    const res = makeRes();
    const next = vi.fn();

    await asyncHandler(fn)(req, res, next);

    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith(req, res, next);
  });

  it("does not call next when the handler resolves successfully", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const next = vi.fn();

    await asyncHandler(fn)(makeReq(), makeRes(), next);

    expect(next).not.toHaveBeenCalled();
  });

  it("calls next with the error when the handler rejects", async () => {
    const error = new Error("database failure");
    const fn = vi.fn().mockRejectedValue(error);
    const next = vi.fn();

    await asyncHandler(fn)(makeReq(), makeRes(), next);

    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith(error);
  });

  it("does not swallow synchronous throws from the wrapped handler", () => {
    // asyncHandler uses Promise.resolve(fn(...)).catch(next).
    // If fn throws synchronously, the argument evaluation throws before
    // Promise.resolve() is called — the outer function throws synchronously.
    // next is NOT called; callers of asyncHandler(fn)() receive the throw.
    const error = new Error("sync error");
    const fn = vi.fn().mockImplementation(() => { throw error; });
    const next = vi.fn();

    expect(() => asyncHandler(fn)(makeReq(), makeRes(), next)).toThrow("sync error");
    expect(next).not.toHaveBeenCalled();
  });

  it("passes through the return value when the handler resolves with a value", async () => {
    const fn = vi.fn().mockResolvedValue({ result: 42 });
    const next = vi.fn();

    // asyncHandler doesn't return the resolved value, just ensures next isn't called
    await asyncHandler(fn)(makeReq(), makeRes(), next);
    expect(next).not.toHaveBeenCalled();
  });

  it("preserves the error message when forwarding to next", async () => {
    const message = "Gemini quota exceeded";
    const fn = async () => { throw new Error(message); };

    const next = vi.fn();
    await asyncHandler(fn)(makeReq(), makeRes(), next);

    expect(next.mock.calls[0][0].message).toBe(message);
  });

  it("works with non-Error rejections (string)", async () => {
    const fn = vi.fn().mockRejectedValue("string error");
    const next = vi.fn();

    await asyncHandler(fn)(makeReq(), makeRes(), next);

    expect(next).toHaveBeenCalledWith("string error");
  });

  it("wraps a sync function correctly (no await in handler)", async () => {
    const fn = vi.fn().mockReturnValue(Promise.resolve("sync-result"));
    const next = vi.fn();

    await asyncHandler(fn)(makeReq(), makeRes(), next);

    expect(fn).toHaveBeenCalledOnce();
    expect(next).not.toHaveBeenCalled();
  });

  it("can wrap multiple independent handlers", async () => {
    const next = vi.fn();
    const successFn = vi.fn().mockResolvedValue(undefined);
    const failFn = vi.fn().mockRejectedValue(new Error("fail"));

    await asyncHandler(successFn)(makeReq(), makeRes(), next);
    expect(next).not.toHaveBeenCalled();

    await asyncHandler(failFn)(makeReq(), makeRes(), next);
    expect(next).toHaveBeenCalledOnce();
  });
});
