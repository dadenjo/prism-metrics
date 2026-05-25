import { describe, it, expect } from "vitest";
import { analyzeDdd } from "../score.js";
import { DDD_METHODOLOGY } from "../methodology.js";

import typIn from "./__fixtures__/typical.input.json";
import typOut from "./__fixtures__/typical.expected.json";
import emptyIn from "./__fixtures__/empty.input.json";
import emptyOut from "./__fixtures__/empty.expected.json";

describe("analyzeDdd", () => {
  it("matches typical fixture", () => {
    expect(analyzeDdd(typIn)).toEqual(typOut);
  });
  it("matches empty fixture", () => {
    expect(analyzeDdd(emptyIn)).toEqual(emptyOut);
  });
  it("counts isolated contexts", () => {
    const r = analyzeDdd(typIn);
    expect(r.isolatedContexts).toBe(1);
  });
});

describe("DDD_METHODOLOGY", () => {
  it("references the score file", () => {
    expect(DDD_METHODOLOGY.formula.codeRef).toContain("score.ts");
  });
});
