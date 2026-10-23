# mnemo-site

The project website for [Mnemo](https://github.com/slikhithreddy22/MNemo), a wearable memory assistant that
remembers what you did, not what you saw.

The site is plain HTML, CSS and JavaScript. It has no build step and no framework, so any static host can serve
this folder as it is.

```
Engram/
├── mnemo/       the code (GitHub: slikhithreddy22/MNemo)
├── paper/       the ENGRAM paper
└── mnemo-site/  this site (this repository)
    ├── index.html          home: problem, objectives, method, results, demo, progress, team, docs links
    ├── docs.html           documentation portal
    ├── assets/css/site.css all styles, light and dark theme
    ├── assets/js/          site.js (menu, theme), charts.js (result charts), demo.js (replay, questions, search)
    ├── assets/data/demo.js real outputs of the final benchmark run
    ├── assets/video/       the two demo clips (EPIC-KITCHENS-100, CC BY-NC 4.0)
    └── tools/make_demo_js.py
```

## Preview
Double-click `index.html`, or serve the folder:
```bash
python3 -m http.server 8000      # then open http://localhost:8000
```

## Common edits
- **Team names.** Open `index.html` and search for `EDIT TEAM`. There is one `.member` block per person.
- **Numbers and text.** Everything is written directly in `index.html` and `docs.html`. The three charts take
  their numbers from the constants at the top of each chart in `assets/js/charts.js` (`TRIG`, `STATES`, `SPAN`).
- **Another video.** Put the `.mp4` file in `assets/video/` and copy one `<figure>` inside `<div class="videos">`
  in `index.html`. Keep each file under about 20 MB. A screen recording of `colab/mnemo_live_demo.ipynb` makes a
  good third video.
- **New benchmark results.** Rebuild the demo data from a finished Kaggle run:
  ```bash
  cd ../mnemo
  python -m evaluation.export_demo --results data/kaggle_results/v3_final \
      --annotations data/demo/EPIC_100_train.csv --classes-dir data/demo --out /tmp/demo_data.json
  cd ../mnemo-site && python3 tools/make_demo_js.py /tmp/demo_data.json
  ```
  The replay clip must be the same clip as `example.clip` in that file (now P02_08, starting at 0:03).

## Publish
This repository is published with **GitHub Pages**: Settings → Pages → Build and deployment → Deploy from a
branch → `main`, folder `/ (root)`. The site is then live at https://slikhithreddy22.github.io/mnemo-site/
and updates a minute or so after every push to `main`. `.nojekyll` makes Pages serve the files exactly as they
are.

The demo videos (16 MB in total) live in this repository only, never in the code repository.

Before sharing, make sure the code repository is **public**, or the GitHub links on the site will show a 404 to
visitors.

## Licence and credits
The site's code is under the [MIT licence](LICENSE). The demo clips and annotations (`assets/video/`,
`assets/data/`) are not covered by it. They come from EPIC-KITCHENS-100 (Damen et al., IJCV 2022), are licensed
CC BY-NC 4.0, and are shown here for non-commercial research.

Fonts: IBM Plex Sans, IBM Plex Mono and Newsreader, from Google Fonts.
