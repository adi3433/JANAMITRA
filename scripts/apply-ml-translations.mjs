import fs from 'node:fs';

const HANDOFF_PATH = process.argv[2] || 'translations/ml-translation-handoff.json';

function parseJsonWithGeminiFix(raw) {
  const text = raw.trim();

  try {
    return JSON.parse(text);
  } catch {
    // Common model artifact: an extra trailing bracket at the very end.
    if (text.endsWith(']]')) {
      return JSON.parse(text.slice(0, -1));
    }
    throw new Error('Invalid JSON. If this came from Gemini, check for an extra trailing "]" at the end.');
  }
}

function normalizeEntries(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.entries)) return payload.entries;
  return [];
}

function tokenizePath(expr) {
  const tokens = [];
  const re = /(\[[0-9]+\]|[^.\[\]]+)/g;
  let m;
  while ((m = re.exec(expr)) !== null) {
    const raw = m[0];
    if (raw.startsWith('[')) {
      tokens.push(Number(raw.slice(1, -1)));
    } else {
      tokens.push(raw);
    }
  }
  return tokens;
}

function getAtPath(root, expr) {
  const tokens = tokenizePath(expr);
  let cur = root;
  for (const t of tokens) {
    if (cur == null) return undefined;
    cur = cur[t];
  }
  return cur;
}

function setMlAtPath(root, expr, value) {
  const tokens = tokenizePath(expr);
  if (tokens.length === 0) return false;

  let cur = root;
  for (let i = 0; i < tokens.length - 1; i += 1) {
    const t = tokens[i];
    if (cur == null || !(t in cur)) return false;
    cur = cur[t];
  }

  const last = tokens[tokens.length - 1];
  if (cur == null || !(last in cur)) return false;

  const lastKey = String(last);
  const mlKey = lastKey.endsWith('_ml') ? lastKey : `${lastKey}_ml`;
  cur[mlKey] = value;
  return true;
}

function main() {
  if (!fs.existsSync(HANDOFF_PATH)) {
    console.error(`Handoff file not found: ${HANDOFF_PATH}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(HANDOFF_PATH, 'utf8');
  const payload = parseJsonWithGeminiFix(raw);
  const entries = normalizeEntries(payload);

  const grouped = new Map();
  for (const e of entries) {
    if (!e || typeof e.file !== 'string' || typeof e.path !== 'string') continue;
    if (typeof e.ml !== 'string' || !e.ml.trim()) continue;

    if (!grouped.has(e.file)) grouped.set(e.file, []);
    grouped.get(e.file).push(e);
  }

  let totalApplied = 0;

  for (const [targetFile, fileEntries] of grouped.entries()) {
    if (!fs.existsSync(targetFile)) {
      console.warn(`Skipping missing target file: ${targetFile}`);
      continue;
    }

    const data = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
    let appliedInFile = 0;

    for (const e of fileEntries) {
      const currentEn = getAtPath(data, e.path);
      if (typeof currentEn !== 'string') continue;
      if (currentEn !== e.en) continue;

      if (setMlAtPath(data, e.path, e.ml.trim())) {
        appliedInFile += 1;
      }
    }

    fs.writeFileSync(targetFile, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
    totalApplied += appliedInFile;
    console.log(`${targetFile}: applied ${appliedInFile} translations`);
  }

  console.log(`Done. Applied ${totalApplied} translations in total.`);
}

main();
