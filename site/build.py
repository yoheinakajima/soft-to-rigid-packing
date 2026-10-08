#!/usr/bin/env python3
"""Build the static site in docs/ from the repository: overview page, paper (PDF + HTML), data files.
Run from the repo root:  python3 site/build.py
Env: SITE_REPO (e.g. https://github.com/OWNER/soft-to-rigid-packing), SUBMISSION_STATUS."""
import json, os, re, shutil, subprocess, datetime, glob
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); os.chdir(ROOT)
D = 'docs'; os.makedirs(f'{D}/data', exist_ok=True)
REPO = os.environ.get('SITE_REPO', 'https://github.com/OWNER/soft-to-rigid-packing')
def git(*a):
    try: return subprocess.check_output(['git', *a], stderr=subprocess.DEVNULL).decode().strip()
    except Exception: return ''
commit = git('rev-parse', '--short', 'HEAD') or 'uncommitted'
full = git('rev-parse', 'HEAD') or 'main'
built = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d %H:%M UTC')
owner_repo = REPO.replace('https://github.com/', '')
claim_path = 'claims/cubincub_n12/cubincub_n12.json'
claim = json.load(open(claim_path)); shutil.copy(claim_path, f'{D}/data/cubincub_n12.json')
vo = open('claims/cubincub_n12/verify_output.txt').read()
wall = re.search(r'min wall gap = (\S+)', vo).group(1); pair = re.search(r'min pair gap = (\S+)', vo).group(1)
summ = json.load(open('site/summary.json'))
tex = open('paper/main.tex').read()
title = re.sub(r'\\\\\s*', ' ', re.search(r'\\title\{(.+?)\}\n', tex, re.S).group(1)).strip()
vals = {'S_FULL': f"{claim['s_full']:.13f}", 'IMPROVEMENT': f"{claim['improvement']:.7f}", 'WALL': f'{float(wall):.10e}', 'PAIR': f'{float(pair):.10e}',
        'STARTS_TOTAL': f"{summ['starts_total']:,}", 'SUBMISSION_STATUS': os.environ.get('SUBMISSION_STATUS', summ.get('submission_status', 'pending')),
        'REPO': REPO, 'RAW_JSON': f'https://raw.githubusercontent.com/{owner_repo}/{full}/{claim_path}', 'COMMIT': commit, 'BUILT': built,
        'PAPER_TITLE': title.replace('--', '–')}
def fill(s):
    for k, v in vals.items(): s = s.replace('{{' + k + '}}', v)
    return s
open(f'{D}/index.html', 'w').write(fill(open('site/index.template.html').read()))
# paper PDF
subprocess.run(['latexmk', '-pdf', '-interaction=nonstopmode', '-quiet', 'main.tex'], cwd='paper', check=True, stdout=subprocess.DEVNULL)
shutil.copy('paper/main.pdf', f'{D}/paper.pdf')
# paper HTML (pandoc, MathML), PNG figures, live 3D viewer under Figure 1
os.makedirs(f'{D}/figures', exist_ok=True)
for f in glob.glob('paper/figures/*.png'): shutil.copy(f, f'{D}/figures/')
t = tex.replace('figures/n12_views.pdf', 'figures/n12_views.png').replace('\\todo{', '\\textbf{TODO: ')
open('/tmp/paper_html.tex', 'w').write(t)
subprocess.run(['pandoc', '/tmp/paper_html.tex', '-f', 'latex', '-t', 'html5', '-s', '--mathml', '--shift-heading-level-by=1', '--citeproc', '--bibliography', 'paper/refs.bib',
                '--template', 'site/paper.template.html', '--resource-path', 'paper', '-o', f'{D}/paper.html'], check=True)
h = open(f'{D}/paper.html').read()
live = ('<div class="viewer live" id="live3"><div class="stage"><div class="hud"></div></div>'
        '<div class="ctl"><button type="button">Pause</button><input type="range" min="0" max="1000" value="0" aria-label="Scrub the run"></div>'
        '<div class="cap">Interactive: the run that found this packing, from balls to the certified cubes. Drag to rotate.</div></div>')
h = re.sub(r'(<figure[^>]*>\s*<img[^>]*n12_views\.png.*?</figure>)', lambda m: m.group(1) + live, h, count=1, flags=re.S)
open(f'{D}/paper.html', 'w').write(fill(h))
json.dump({'commit': commit, 'built': built, 'paper_title': title}, open(f'{D}/data/build.json', 'w'))
open(f'{D}/.nojekyll', 'w').close()
print('built', commit, built)
