import fs from "node:fs";

const pages = [
  "app/dashboard/calendar/page.tsx",
  "app/dashboard/clients/page.tsx",
  "app/dashboard/contracts/page.tsx",
  "app/dashboard/leads/page.tsx",
  "app/dashboard/payments/page.tsx",
  "app/dashboard/projects/page.tsx",
  "app/dashboard/proposals/page.tsx",
  "app/dashboard/tasks/page.tsx",
  "app/dashboard/team/page.tsx",
  "app/dashboard/templates/page.tsx",
];

for (const file of pages) {
  let text = fs.readFileSync(file, "utf8");
  if (/export default async function \w+\([^)]*\) \{\r?\n  const \{ t \} = await getTranslator\(\);/.test(text)) {
    console.log("skip", file);
    continue;
  }
  const next = text.replace(
    /(export default async function \w+\([^)]*\) \{\r?\n)/,
    "$1  const { t } = await getTranslator();\n",
  );
  if (next === text) console.log("FAIL", file);
  else {
    fs.writeFileSync(file, next);
    console.log("ok", file);
  }
}
