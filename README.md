# LearnPrompting

**Learn prompt engineering by building prompts step by step, then testing them on OpenAI, Claude and Gemini with your own API key.**

🔗 Live: https://salmankhwaja.github.io/LearnPrompting/

## What it does

1. **Build a prompt**: pick a framework and fill one box per part of the prompt. Each box has a dropdown of presets you rewrite for your own situation, and a "Think it through" list of questions a good prompt answers.
2. **Chat**: run the prompt on OpenAI, Claude or Gemini. You control the model, temperature, max output length, Top P and system prompt.
3. **My library**: save prompts you like, reopen past chats, and export or import everything as JSON.

### Frameworks included

| Framework | Sections | Best for |
|---|---|---|
| Persona → Objective → Problem → Constraints → Format | Persona (with years of experience), Objective, Problem at hand, Constraints, Output format, plus optional Tone, Reasoning, Examples | All-round default |
| CO-STAR | Context, Objective, Style, Tone, Audience, Response | Writing and communication |
| RISEN | Role, Instructions, Steps, End goal, Narrowing | Multi-step tasks |
| RTF | Role, Task, Format | Quick, well-defined tasks |
| CRISPE | Capacity & Role, Insight, Statement, Personality, Experiment | Creative work with variations |
| Chain-of-thought | Persona, Problem, Objective, Reasoning, Format | Analysis, maths, troubleshooting |
| Few-shot | Persona, Objective, Examples, Real input, Format | Consistent formatting from examples |
| Critique & refine | Persona, Problem, Objective, Critique, Format | Higher-quality drafts |
| Socratic tutor | Teacher persona, Teach & test, Learning gap, Socratic reasoning, Constraints | Learning a topic yourself |

The page warns you about any `[placeholder]` you have not filled in yet. "Fill worked example" loads a complete security code review prompt so learners can see a finished prompt.

## Privacy and security

- **No backend.** The page is static HTML, CSS and JavaScript on GitHub Pages.
- **Bring your own key.** Requests go straight from your browser to the provider you choose. Use a key with a spending limit.
- **Local storage only.** Chats and saved prompts stay in your browser. Keys are saved only if you tick "Remember key", and are never included in exports.
- **Strict Content-Security-Policy:** scripts load only from this site; network calls are allowed only to `api.openai.com`, `api.anthropic.com` and `generativelanguage.googleapis.com`.

See [SECURITY.md](SECURITY.md) to report a vulnerability.

## Run locally

```bash
git clone https://github.com/salmankhwaja/LearnPrompting.git
cd LearnPrompting
python3 -m http.server 8000
# open http://localhost:8000
```

Serve it over HTTP rather than opening `index.html` from disk; the Content-Security-Policy and some browsers block API calls from `file://`.

## Project layout

```
index.html          page shell and CSP
assets/prompts.js   frameworks, sections, presets, worked example (edit this to add prompts)
assets/app.js       builder, provider API calls, chat history, library
assets/style.css    styles
```

### Adding your own presets

Open `assets/prompts.js` and add an entry to the `presets` array of any section:

```js
{ name: "My preset", text: "Act as a [role] with {years} years of experience in [domain]…" }
```

`{years}` is filled from the Years box; anything in `[square brackets]` is flagged as a placeholder to complete.

## Roadmap

- Optional Google sign-in with sync to the user's own Google Drive (app-data folder), so history follows you across devices without a server.

## Licence

MIT. See [LICENSE](LICENSE).
