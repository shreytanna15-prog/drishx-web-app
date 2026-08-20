import fs from "fs";
import path from "path";

const libDir = path.join(import.meta.dirname, "..", "lib");
const files = fs
  .readdirSync(libDir)
  .filter((name) => name.endsWith("-api.ts"))
  .map((name) => path.join(libDir, name));

for (const file of files) {
  let content = fs.readFileSync(file, "utf8");
  let changed = false;

  if (content.includes("getStoredToken")) {
    content = content.replace(
      /import \{ getStoredToken \} from ["'][^"']+["'];\n/g,
      ""
    );
    content = content.replace(
      /import \{ getStoredToken \} from ["']@\/lib\/auth-storage["'];\n/g,
      ""
    );
    changed = true;
  }

  if (!content.includes("getAuthHeaders") && content.includes("Authorization")) {
    const importLine = 'import { getAuthHeaders } from "./auth-fetch";\n';
    const importLineAlias = 'import { getAuthHeaders } from "@/lib/auth-fetch";\n';
    if (file.includes("cart-api")) {
      // cart-api uses passed headers
    } else if (!content.includes("auth-fetch")) {
      const firstImport = content.match(/^import .+\n/m);
      if (firstImport) {
        const usesAlias = content.includes('@/lib/');
        content =
          content.slice(0, firstImport.index! + firstImport[0].length) +
          (usesAlias ? importLineAlias : importLine) +
          content.slice(firstImport.index! + firstImport[0].length);
      }
    }
    changed = true;
  }

  content = content.replace(
    /const token = getStoredToken\(\);\s*if \(!token\) \{\s*throw new Error\("Not authenticated"\);\s*\}\s*/g,
    ""
  );

  content = content.replace(
    /function authHeaders\([^)]*\)[^{]*\{[\s\S]*?return \{[\s\S]*?Authorization: `Bearer \$\{[^}]+\}`,[\s\S]*?\};\s*\}\s*/g,
    ""
  );

  content = content.replace(
    /headers: \{\s*"Content-Type": "application\/json",\s*Authorization: `Bearer \$\{token\}`,\s*\}/g,
    'headers: getAuthHeaders()'
  );

  content = content.replace(
    /headers: authHeaders\(\)/g,
    "headers: getAuthHeaders()"
  );

  content = content.replace(
    /headers: authHeaders\(false\)/g,
    "headers: getAuthHeaders()"
  );

  content = content.replace(
    /headers: authHeaders\(token\)/g,
    "headers: getAuthHeaders()"
  );

  if (changed) {
    fs.writeFileSync(file, content);
    console.log("updated", path.basename(file));
  }
}

// invoices-api special case
const invoices = path.join(libDir, "invoices-api.ts");
let invoicesContent = fs.readFileSync(invoices, "utf8");
invoicesContent = invoicesContent.replace(
  /import \{ getStoredToken \} from "@\/lib\/auth-storage";\n/,
  'import { authFetch } from "@/lib/auth-fetch";\n'
);
invoicesContent = invoicesContent.replace(
  /function authHeaders\(token\?: string \| null\): Record<string, string> \{[\s\S]*?\}\n\n/,
  ""
);
invoicesContent = invoicesContent.replace(
  /await fetch\(/g,
  "await authFetch("
);
invoicesContent = invoicesContent.replace(
  /headers: authHeaders\(token\),\n/g,
  ""
);
invoicesContent = invoicesContent.replace(
  /token\?: string \| null\n/g,
  ""
);
invoicesContent = invoicesContent.replace(
  /, token\?: string \| null/g,
  ""
);
fs.writeFileSync(invoices, invoicesContent);
console.log("updated invoices-api.ts");
