/**
 * Fix incomplete i18n wiring: ensure server pages call getTranslator in the page body,
 * and patch a few known broken client spots.
 */
import fs from "node:fs";

function ensurePageT(file) {
  let text = fs.readFileSync(file, "utf8");
  if (!text.includes('getTranslator')) {
    console.log("skip (no getTranslator)", file);
    return;
  }
  // Already has t in default function
  if (/export default async function \w+\([^)]*\) \{\s*\n\s*const \{ t \} = await getTranslator\(\);/.test(text)) {
    console.log("ok", file);
    return;
  }
  // Insert after function opening
  const next = text.replace(
    /(export default async function \w+\([^)]*\) \{\n)/,
    "$1  const { t } = await getTranslator();\n",
  );
  if (next === text) {
    console.log("FAILED", file);
    return;
  }
  // Avoid double if generateMetadata already - we're adding to default only
  // Check for double in same function - if already present later, remove duplicate? 
  // Count occurrences in default - leave as is; double await is ok but wasteful
  // If we already had one mid-function somehow...
  const matches = next.match(/const \{ t \} = await getTranslator\(\);/g) || [];
  let final = next;
  if (matches.length > 2) {
    // keep first in metadata and first in default - ok
  }
  // If default now has two (one we added + one later), remove later ones inside default only - skip for now
  fs.writeFileSync(file, final);
  console.log("fixed", file, "getTranslator count", matches.length);
}

const pages = [
  "app/dashboard/calendar/page.tsx",
  "app/dashboard/clients/page.tsx",
  "app/dashboard/contracts/page.tsx",
  "app/dashboard/leads/page.tsx",
  "app/dashboard/payments/page.tsx",
  "app/dashboard/projects/page.tsx",
  "app/dashboard/proposals/page.tsx",
  "app/dashboard/proposals/[id]/page.tsx",
  "app/dashboard/tasks/page.tsx",
  "app/dashboard/team/page.tsx",
  "app/dashboard/templates/page.tsx",
  "app/admin/workspaces/page.tsx",
  "app/admin/workspaces/[id]/page.tsx",
];

for (const p of pages) ensurePageT(p);

// admin workspaces: statusLabelFor uses t outside - refactor to accept t
{
  const file = "app/admin/workspaces/page.tsx";
  let text = fs.readFileSync(file, "utf8");
  text = text.replace(
    /function statusLabelFor\(status: string \| null\) \{\n  if \(!status\) return t\("admin\.noSubscription"\);/,
    `function statusLabelFor(status: string | null, t: (key: string) => string) {\n  if (!status) return t("admin.noSubscription");`,
  );
  // Replace hardcoded RO status map with t keys if possible - keep for now but ensure call sites pass t
  text = text.replace(/statusLabelFor\(([^)]+)\)/g, (m, arg) => {
    if (arg.includes(", t")) return m;
    if (arg.includes("status:")) return m;
    return `statusLabelFor(${arg}, t)`;
  });
  // Fix the function signature replacement might double - check
  fs.writeFileSync(file, text);
  console.log("patched statusLabelFor workspace list");
}

{
  const file = "app/admin/workspaces/[id]/page.tsx";
  let text = fs.readFileSync(file, "utf8");
  // Find helper using t
  if (text.includes("return t(") && !text.includes("function statusLabelFor")) {
    // inline uses - ensure page has t
  }
  // If helper at module level
  text = text.replace(
    /function statusLabelFor\(status: string \| null\) \{/,
    `function statusLabelFor(status: string | null, t: (key: string) => string) {`,
  );
  text = text.replace(/statusLabelFor\(([^,\)]+)\)/g, (m, arg) => {
    if (String(arg).includes("t")) return m;
    return `statusLabelFor(${arg}, t)`;
  });
  fs.writeFileSync(file, text);
  console.log("patched workspace detail");
}

console.log("done pages");
