import { describe, it, expect } from "vitest";
import {
  IGNORE_DIRS,
  TEST_FILE_PATTERNS,
  stripComments,
  shouldScanFile,
} from "../scanner-exclusions.js";

describe("IGNORE_DIRS", () => {
  it("covers build / cache / vendor dirs", () => {
    for (const d of ["node_modules", ".git", ".next", "dist", "build", "coverage", "__pycache__"]) {
      expect(IGNORE_DIRS.has(d)).toBe(true);
    }
  });

  it("covers agent / tool worktree dirs (the Atomar-Security-10/F class)", () => {
    for (const d of [".claude", ".amber", ".mcs", ".prism"]) {
      expect(IGNORE_DIRS.has(d)).toBe(true);
    }
  });

  it("covers test layout dirs", () => {
    for (const d of ["__tests__", "__mocks__", "test", "tests", "spec", "fixtures"]) {
      expect(IGNORE_DIRS.has(d)).toBe(true);
    }
  });

  it("covers framework artefact dirs", () => {
    for (const d of [".vercel", ".turbo", ".storybook", "storybook-static", "out", "tmp"]) {
      expect(IGNORE_DIRS.has(d)).toBe(true);
    }
  });

  it("does NOT skip ordinary source dirs", () => {
    for (const d of ["src", "lib", "app", "components", "packages"]) {
      expect(IGNORE_DIRS.has(d)).toBe(false);
    }
  });
});

describe("TEST_FILE_PATTERNS", () => {
  const matches = (name: string) => TEST_FILE_PATTERNS.some((re) => re.test(name));

  it("matches *.test.* for JS/TS family + py", () => {
    expect(matches("foo.test.ts")).toBe(true);
    expect(matches("foo.test.tsx")).toBe(true);
    expect(matches("foo.test.js")).toBe(true);
    expect(matches("foo.test.jsx")).toBe(true);
    expect(matches("foo.test.py")).toBe(true);
  });

  it("matches *.spec.*", () => {
    expect(matches("bar.spec.ts")).toBe(true);
    expect(matches("bar.spec.tsx")).toBe(true);
  });

  it("matches *.e2e.*", () => {
    expect(matches("baz.e2e.js")).toBe(true);
  });

  it("matches *.fixture.* and *.mock.*", () => {
    expect(matches("user.fixture.ts")).toBe(true);
    expect(matches("api.mock.ts")).toBe(true);
  });

  it("matches python test_*.py convention", () => {
    expect(matches("test_x.py")).toBe(true);
    expect(matches("test_module_name.py")).toBe(true);
  });

  it("does NOT match plain source files", () => {
    expect(matches("foo.ts")).toBe(false);
    expect(matches("bar.tsx")).toBe(false);
    expect(matches("baz.py")).toBe(false);
    expect(matches("index.js")).toBe(false);
  });
});

describe("stripComments", () => {
  it("strips single-line // comments", () => {
    const out = stripComments("const x = 1; // hidden\nconst y = 2;");
    expect(out).not.toContain("hidden");
    expect(out).toContain("const x = 1;");
    expect(out).toContain("const y = 2;");
  });

  it("preserves the trailing newline after a // comment", () => {
    const out = stripComments("a // gone\nb");
    // The newline must still split a from b.
    expect(out.split("\n").length).toBe(2);
  });

  it("strips multi-line block /* */ comments", () => {
    const src = "before /* this is\nstill a comment */ after";
    const out = stripComments(src);
    expect(out).not.toContain("still a comment");
    expect(out).toContain("before");
    expect(out).toContain("after");
  });

  it("strips Python / shell # comments", () => {
    const out = stripComments("x = 1  # secret here\ny = 2");
    expect(out).not.toContain("secret here");
    expect(out).toContain("x = 1");
    expect(out).toContain("y = 2");
  });

  it("does NOT strip # inside a string literal (best-effort)", () => {
    // Documented limitation: best-effort guard via preceding quote.
    const out = stripComments(`const tag = "#prod-channel";`);
    expect(out).toContain("#prod-channel");
  });

  it("does NOT eat the URL scheme `://`", () => {
    const out = stripComments(`const url = "https://example.com/x";`);
    expect(out).toContain("https://example.com/x");
  });
});

describe("shouldScanFile", () => {
  it("rejects paths inside any IGNORE_DIRS component", () => {
    expect(shouldScanFile("src/foo/__tests__/bar.ts")).toBe(false);
    expect(shouldScanFile("node_modules/lodash/index.js")).toBe(false);
    expect(shouldScanFile(".claude/worktrees/agent-xyz/file.ts")).toBe(false);
    expect(shouldScanFile("apps/app/dist/server.js")).toBe(false);
    expect(shouldScanFile("/abs/path/.amber/green/x.ts")).toBe(false);
  });

  it("rejects test/fixture/mock filenames even outside test dirs", () => {
    expect(shouldScanFile("src/foo.test.ts")).toBe(false);
    expect(shouldScanFile("src/foo.spec.tsx")).toBe(false);
    expect(shouldScanFile("src/api.mock.ts")).toBe(false);
    expect(shouldScanFile("src/data.fixture.ts")).toBe(false);
    expect(shouldScanFile("scripts/test_runner.py")).toBe(false);
  });

  it("accepts ordinary production source", () => {
    expect(shouldScanFile("src/foo.ts")).toBe(true);
    expect(shouldScanFile("apps/web/lib/auth.ts")).toBe(true);
    expect(shouldScanFile("/abs/path/src/components/Button.tsx")).toBe(true);
    expect(shouldScanFile("server/handlers/login.py")).toBe(true);
  });

  it("handles Windows-style separators", () => {
    expect(shouldScanFile("src\\foo\\__tests__\\bar.ts")).toBe(false);
    expect(shouldScanFile("src\\foo\\bar.ts")).toBe(true);
  });

  it("rejects empty / degenerate input", () => {
    expect(shouldScanFile("")).toBe(false);
  });
});
