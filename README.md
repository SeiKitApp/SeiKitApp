# SeiKit 🎙️🎶

**SeiKit** is a voice-driven ambient mixer that saves your sound “scenes” on the **Sei EVM testnet**.  
You speak; it switches GIF scenes, stacks up to six loops, and writes/loads your mix (scene + layers + volumes) directly on chain.  
Each wallet has **3 save slots**.

<img width="1920" height="1702" alt="198dea1e54072426f502e2443edbf986" src="https://github.com/user-attachments/assets/7f4e0b48-f6d3-402e-8731-c8d8f5f1a5ab" />


---

## 🌐 Links
- Website: [https://seikitapp.com/](https://seikitapp.com/)  
- X / Twitter: [https://x.com/SeiKitApp](https://x.com/SeiKitApp)  
- GitHub: [https://github.com/SeiKitApp/SeiKitApp](https://github.com/SeiKitApp/SeiKitApp)  
- Demo video: [https://youtu.be/OGs72C_argM](https://youtu.be/OGs72C_argM)  
- Smart contract (Sei testnet): `0x39f0a4d87d5c36EA9a50707f05415451F33d03b7`  

---

## 🕹️ User Instructions

1. Connect wallet (**MetaMask → Sei Testnet**).
2. Click mic (or type in the command box).
3. Try commands:

---

## What we built on Sei

- Built exclusively on the Sei EVM testnet.
- Uses the SeiKit_Saves.sol smart contract to persist scene state: Scene type, Up to 6 active layers, and Per-layer volumes (basis points for precision)
- Frontend enforces Sei (chainId 0x530) and routes MetaMask txs.
- Leverages Sei’s low fees + fast finality for real-time “voice → tx → UI” loops.


<img width="2551" height="441" alt="graphviz" src="https://github.com/user-attachments/assets/5b60b26d-cbbb-41cf-8a1c-4dc532b1e7f2" />

---

## 🤯 Why it fits The Unexpected
SeiKit uses blockchain as a real-time state layer for sensory environments, not financial products.
Voice commands are parsed by an AI agent into deterministic on-chain state, making each sound mix portable and verifiable.
- Voice → AI agent → On-chain scene
- Anyone can load, fork, or share mixes.
- With Sei’s speed, the loop feels immediate → enabling shared focus rooms, tipping for curated mixes, and remixable presets.
