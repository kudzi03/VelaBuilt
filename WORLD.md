# Vela — build notes and handover

Internal. Branch `claude/velabuilt-voice-immersive-c5xvth`.

If you are picking this up cold, read this before touching the object or the
voice guide. The walkable building and the photographic corridor that came
before are gone; nothing here depends on them.

---

## What Vela is

One original structure behind every page of velabuilt.com: dark graphite
members, an amber core, smoke and embers. It rebuilds itself into a different
form for each part of the site (armature, planes, aperture, circuit, lattice,
frame). It is also the presence of the voice guide. Tap it, or any "Talk to
Vela" control, and after one consent screen it listens, thinks, speaks and
moves the site while it explains.

Code: `src/vela/` (the object), `src/voice/` (the guide). Architecture is in
ARCHITECTURE.md.

## The agent

| | |
| --- | --- |
| **Vela (the website agent)** | `agent_4501m357hr66e95rvryg3609nnnv`, "Vela — VelaBuilt web guide" |
| Original studio agent | `agent_9001m347033mfsfbnzk4t695g3f3`, "VelaBuilt Guide". **Left untouched.** |

**Duplicated, not adapted.** The original agent was built for the walkable
world and may be used elsewhere. Vela needed a different prompt, seven client
tools, different privacy settings and an allowlist. Changing the original in
place would have broken whatever still points at it, so it was duplicated
and the copy reconfigured.

Configured on the agent:

- **LLM** `claude-sonnet-5`, low reasoning effort, temperature 0.4.
- **Voice** unchanged from the original (`eleven_v3_conversational`).
- **Knowledge base** one text document, "VelaBuilt — facts for Vela (web
  guide)" (`XQIT6WjZYV0JqUzplKu0`), used in-prompt. Written from
  `src/content/`. **When services, work or FAQs change, update this document
  to match.** It is the only copy of the facts that does not rebuild itself.
- **Prompt** grounding first: Cardio Life is the only nameable client; no
  prices, results, numbers, timelines, testimonials, certifications,
  partnerships or team details; "I don't know, the team can answer it" beats
  a guess. Then the tool rules, including "call focus_service first when a
  question is about one of the four areas".
- **Privacy** `record_voice: false`, `delete_audio: true`, `retention_days:
  30`. The consent sheet and `/privacy#talking-to-vela` say exactly this.
- **Allowlist** `velabuilt.com`, `www.velabuilt.com`, `vela-built.vercel.app`.
- **Overrides** only `text_only` may be overridden by the client (for Type
  instead). Prompt, first message, voice and LLM cannot be.
- **Dynamic variables** `current_page`, `current_path`, `mode`, sent at start.
  Chapter and route changes go in as silent contextual updates.

## The tools

All client tools, all enumerated. There is no tool that takes a URL, a
selector or code. Every call goes through `parseToolCall` in
`src/voice/tools.ts` before anything moves; an unknown value comes back as a
sentence the agent can say, and nothing happens.

| Tool | Takes | Does |
| --- | --- | --- |
| `navigate_site` | one of 11 destinations | `router.push` to that page |
| `scroll_to_section` | one of 9 homepage sections | scrolls there (or goes home first) |
| `focus_service` | `digital_experiences · ai_systems · automation · business_systems` | scrolls to that chapter, the structure changes shape, its cards light |
| `show_capability` | one of 15 capability ids | as above, and lights that one card |
| `show_project` | `cardio_life` | opens the case study |
| `open_contact` | optional focus | opens the enquiry dialog; the visitor fills and sends it |
| `prefill_enquiry` | focus + summary | shows the summary in the panel and **waits**. Only "Yes, open the form" puts it in the form. The form is never submitted by Vela. Times out after 100 s with nothing added |

## Consent, microphone, privacy

- Nothing ElevenLabs loads until the visitor opens the consent sheet and
  chooses. The sheet says what the microphone is for, that Vela is an AI on
  ElevenLabs, that audio is not stored and the transcript is kept 30 days.
- **Start talking** pre-checks `getUserMedia`. If the microphone is refused,
  Vela says so and offers **Type instead**. Nothing retries silently.
- **Type instead** is a text-only session: no microphone is ever requested.
- Mute, End and Escape are always available. Ending releases the microphone
  and returns the structure to dormant.
- No voice autoplays. Vela's first line plays only after the visitor pressed
  Start.

## The session route

`GET /api/voice/session?mode=voice|text`, rate-limited to 6 per minute per
IP, `Cache-Control: no-store`.

1. `ELEVENLABS_API_KEY` set → mints a WebRTC **conversation token** (voice)
   or a **signed WebSocket URL** (text). The key never leaves the server.
2. No key → returns the public agent id. The allowlist is the gate.
3. No agent id → 503, and the panel says Vela is unavailable.

## How it was verified

- **Agent decisions** — six ElevenLabs simulation tests, each run three times
  against the live agent, all 18 passing:
  websites → `focus_service digital_experiences`;
  "What can you actually automate for a contractor?" → `focus_service
  automation`; "Show me something you've built" → `show_project
  cardio_life`; asked for a ballpark price → no number; asked for clients →
  only Cardio Life; roofer wanting something built → no `prefill_enquiry`.
  The tests are saved in the ElevenLabs workspace under names starting
  "Vela:".
- **Site handling** — `scripts/voice-tools.mjs` intercepts the ElevenLabs WebSocket
  and plays the real protocol to the real SDK in the page, then fires tool
  calls: focus moves the page and changes the chapter, invalid values and a
  URL destination are refused without moving, `show_project` navigates and
  the session survives it, prefill returns nothing until the visitor
  confirms and never posts the form, End restores dormant. 23 checks, all
  passing.
- **Not verified from the build sandbox:** a live spoken conversation. The
  sandbox cannot open outbound WebSockets or WebRTC at all. Verify by ear on
  velabuilt.com.

## Changing things

- **Add a destination or section**: add it to `DESTINATIONS` / `SECTIONS` in
  `tools.ts`, add the value to the tool's enum on the agent, add a unit test.
- **Change a shape or placement**: `chapters.ts`. Shapes live in
  `geometry.ts`; `tests/geometry.test.ts` checks every shape seats every node
  once, every member references real nodes, and the server still matches the
  renderer.
- **Re-run the agent tests** after any prompt change (ElevenLabs dashboard →
  Vela → Tests, or the API).
