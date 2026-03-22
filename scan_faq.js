const fs = require('fs');
const d = JSON.parse(fs.readFileSync('src/data/eci_faq_full.json', 'utf8'));
const issues = [];

// Only TRUE corruption patterns (not smart quotes which are fine)
const patterns = [
    { name: 'Mojibake (Ã char)', re: /Ã[\s\S]/g },
    { name: 'Garbled Unicode', re: /\uFFFD/g },
    { name: 'Corrupted Latin Extended B', re: /[\u01EE-\u01FF]/g },
    { name: 'English Vs in Malayalam', re: /[\u0D00-\u0D7F]\s+Vs\.?\s+[\u0D00-\u0D7F]/g },
    { name: 'Wrong Malayalam separator', re: /\u0D35\u0D47\u0D34\u0D4D\u0D38\u0D38\u0D4D/g },
    { name: 'Control chars', re: /[\x00-\x08\x0B\x0C\x0E-\x1F]/g },
    { name: 'Corrupted smart quotes (DZ digraph)', re: /[\u01F1-\u01F3\u01C4-\u01C6]/g },
    { name: 'Truncated/garbled Malayalam', re: /[a-zA-Z]{3,}\u0D4D[\u0D00-\u0D7F]/g },
];

d.forEach((entry, i) => {
    const fields = ['question', 'answer', 'question_ml', 'answer_ml', 'categoryName', 'subCategoryName', 'categoryName_ml', 'subCategoryName_ml'];
    fields.forEach(field => {
        if (!entry[field]) return;
        const val = String(entry[field]);
        patterns.forEach(p => {
            const re = new RegExp(p.re.source, p.re.flags);
            let m;
            while ((m = re.exec(val)) !== null) {
                const start = Math.max(0, m.index - 50);
                const end = Math.min(val.length, m.index + m[0].length + 50);
                issues.push({
                    arrayIndex: i,
                    entryIndex: entry.index,
                    field,
                    pattern: p.name,
                    matchedText: m[0],
                    charCodes: Array.from(m[0]).map(c => 'U+' + c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')).join(' '),
                    context: val.substring(start, end)
                });
            }
        });
    });
});

// Check for the special chars from the original ECI site (like ǲ ǳ ǯ)
d.forEach((entry, i) => {
    ['question', 'answer'].forEach(field => {
        if (!entry[field]) return;
        const val = entry[field];
        // Check for actual garbled chars from PDF extraction
        const re = /[\u01F2\u01F3\u01EF\u01AF\u01B0]/g;
        let m;
        while ((m = re.exec(val)) !== null) {
            const start = Math.max(0, m.index - 50);
            const end = Math.min(val.length, m.index + m[0].length + 50);
            issues.push({
                arrayIndex: i,
                entryIndex: entry.index,
                field,
                pattern: 'Garbled char from PDF',
                matchedText: m[0],
                charCodes: 'U+' + m[0].charCodeAt(0).toString(16).toUpperCase().padStart(4, '0'),
                context: val.substring(start, end)
            });
        }
    });
});

console.log('Total entries:', d.length);
console.log('REAL corruption issues found:', issues.length);
if (issues.length > 0) {
    console.log(JSON.stringify(issues, null, 2));
} else {
    console.log('No real corruption found! All text looks clean.');
}
