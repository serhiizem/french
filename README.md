# Français — cahier d'exercices

Level: A2 → B1. Grammar practice, plus new vocabulary built into the exercises.

## How it works

Each topic has its own folder:

| File | What it is |
|---|---|
| `lecon.md` | The rule, short and with examples. Read this first. |
| `vocabulaire.md` | 20–25 new words. They show up in the exercises. |
| `exercices.md` | Homework on paper: fill in the `____` blanks. |
| `corrige.md` | Answer key. Open it only after you finish. |
| `index.html` | The same lesson, vocabulary and exercises as one interactive page. Checks your answers right away. Works on a phone. Shared look and checking code live in `shared/`. |

## Two ways to check your homework

1. **Fast, on the phone:** open the topic's page (link below), type your answers, tap **Vérifier**. Wrong answers show the right one plus a short reason. Your answers are saved in the browser. **Copier pour Claude** copies your mistakes (and any free writing) so you can paste them to Claude and ask about them.
2. **With explanations:** fill in `exercices.md` right here, then ask Claude: *"corrige le topic 01"*. You get a correction with explanations, and the next homework can focus on your mistakes.

## Topics

All topics: **https://serhiizem.github.io/french/**

| # | Topic | Page |
|---|---|---|
| 01 | [L'ordre des pronoms compléments](01-ordre-des-pronoms/) — *Je le lui donne* | [open](https://serhiizem.github.io/french/01-ordre-des-pronoms/) |
| 02 | [Le conditionnel présent](02-conditionnel-present/) — *Si j'étais riche, je voyagerais* | [open](https://serhiizem.github.io/french/02-conditionnel-present/) |
| 03 | [Les phrases avec si : si + présent](03-si-present/) — *S'il pleut demain, je prendrai le bus* | [open](https://serhiizem.github.io/french/03-si-present/) |

### Ideas for the next topics
- Les pronoms **y** et **en** (in depth)
- COD ou COI ? (*le* or *lui*? *aider qqn* vs *téléphoner à qqn*)
- Passé composé ou imparfait ?
- Accord du participe passé (avoir / être)
- Pronoms relatifs : *qui, que, où, dont*
- Le futur simple
- Le conditionnel passé (*j'aurais dû…*)
- Le subjonctif présent (after *il faut que*, *je veux que*)
- Discours indirect (*Il dit que…, Il m'a demandé si…*)

## Publishing (public link)

`./publish.sh` builds the pages into `docs/` and pushes them to GitHub. GitHub Pages serves them at
`https://<github-user>.github.io/<repo>/`, with one page per topic.
