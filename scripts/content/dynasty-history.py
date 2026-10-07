"""Insert `history` and `sources` blocks into src/data/dynasties.yaml.

Usage: python3 scripts/content/dynasty-history.py <file.json>
The JSON maps dynasty id -> {"history": [{"heading", "text"}], "sources": [{"label", "url"?}]}.
Existing history/sources for those ids are replaced; other entries are untouched.
"""
import json, re, sys

PATH = 'src/data/dynasties.yaml'
data = json.load(open(sys.argv[1], encoding='utf-8'))
text = open(PATH, encoding='utf-8').read()

def q(s):
    return json.dumps(s, ensure_ascii=False)

def block(entry):
    out = ['  history:']
    for sec in entry['history']:
        out.append(f'    - heading: {q(sec["heading"])}')
        out.append('      text: |')
        for line in sec['text'].strip().split('\n'):
            out.append(('        ' + line).rstrip())
    out.append('  sources:')
    for src in entry['sources']:
        out.append(f'    - label: {q(src["label"])}')
        if src.get('url'):
            out.append(f'      url: {src["url"]}')
    return '\n'.join(out) + '\n'

# Split into entries at top-level "- id:" lines, keeping the header comment.
parts = re.split(r'(?m)^(?=- id: )', text)
for i, part in enumerate(parts):
    m = re.match(r'- id: "(\d+)"', part)
    if not m or m.group(1) not in data:
        continue
    # Drop any previous history/sources (they always come last in an entry).
    part = re.split(r'(?m)^  history:', part)[0]
    if not part.endswith('\n'):
        part += '\n'
    parts[i] = part + block(data[m.group(1)])
open(PATH, 'w', encoding='utf-8').write(''.join(parts))
print('updated', ', '.join(sorted(data, key=int)))
