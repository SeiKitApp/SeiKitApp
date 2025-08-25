# SeiKit
- Voice-controlled ambient mixer with on-chain saves on Sei EVM Testnet.
- You speak; it switches scenes, layers sounds, and saves/loads your mix (scene + layers + volumes) on chain.
- Live: https://seikitapp.com/
- Contract (SEI testnet): 0x411453D2BfF4Ca48d67d2Bbc7b909D79a5309605

## Features
- Natural-language control: “take me to forest”, “add rain”, “more wind”, “silence”
- Up to 6 layers per scene with sliders
- 3 save slots per wallet on Sei (save, loadOf, clear)
- Speech agent handles common mishears (“lord”→load, “too/to”→two)
- Pure client: vanilla HTML/CSS/JS + Ethers v6 (no backend required)

## Repo structure
.
├─ assets/                  # gifs + mp3s
├─ css/
│  └─ style.css
├─ js/
│  ├─ agent.js             # voice → actions
│  ├─ script.js            # UI, audio engine, wallet + contract calls
│  └─ contract.json        # { "address": "...", "abi": [ ... ] }
├─ smart_contract_sei/     # solidity sources / notes (no secrets)
├─ index.html
└─ logo.png

## Quick start (local)
- Put your deployed address/ABI into js/contract.json:
- { "address": "0xYourTestnetAddress", "abi": [ ... ] }
- Serve the folder (don’t open via file://):
- npx serve .
- or: python -m http.server 5500


In MetaMask, add Sei EVM Testnet (chainId 0x530) and get a little test SEI.

Open the site, Connect Wallet, click Mic, try commands.

## Environment
- If you run an optional speech→intent relay, set your OpenAI key locally:
- OPENAI_API_KEY=sk-...
- Use .env only on your machine. Don’t commit it. Provide .env.example for others.

Voice commands

Scenes: take me to forest/ocean/desert/mountain/cafe/space

Layers: add rain, remove birds, mute wind, unmute music

Volume: more wind, less wind, set birds to 35%

Global: silence, resume

Chain: save to sei, save to slot two, load slot 3, clear slot #1

Deploy (GitHub Pages)

Keep files at repo root (as structured above).

Optional: add a CNAME file with seikitapp.com.

Ensure js/contract.json exists on the published branch.

Do not commit secrets

Add a .gitignore with:

.env
*.env
node_modules/
.DS_Store

Troubleshooting

Audio won’t play: click the page once (browser gesture requirement).

Mic blocked: allow permission; or type commands in the input.

RPC/circuit-breaker errors: switch to a healthy Sei testnet RPC and retry.

Wrong network: the app enforces 0x530; switch in MetaMask.

License

MIT
