import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("BrandLogo source contract", () => {
  const source = readFileSync(
    path.resolve(__dirname, "../../../components/brand/brand-logo.tsx"),
    "utf8",
  );

  it("uses /logo.png on a white container", () => {
    expect(source).toContain('src="/logo.png"');
    expect(source).toContain("bg-white");
    expect(source).toContain("object-contain");
  });

  it("does not apply CSS recolor utilities on the mark", () => {
    expect(source).not.toMatch(/mix-blend-mode|brightness-|grayscale|hue-rotate/);
    expect(source).not.toMatch(/className=\{[^}]*\binvert\b/);
  });

  it("keeps a collapsed white square variant", () => {
    expect(source).toContain('"collapsed"');
  });
});
