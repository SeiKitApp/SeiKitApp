(() => {
  if (window.__SEIKIT_INIT__) return;
  window.__SEIKIT_INIT__ = true;

  const CHAIN_PARAMS = {
    chainId: "0x530",
    chainName: "Sei Testnet (atlantic-2)",
    nativeCurrency: { name: "SEI", symbol: "SEI", decimals: 18 },
    rpcUrls: ["https://evm-rpc-testnet.sei-apis.com"],
    blockExplorerUrls: ["https://seitrace.com", "https://seiscan.io"]
  };
  const READ_RPC = "https://evm-rpc-testnet.sei-apis.com";
  const READ_CHAIN_ID = 1328;

  let CONTRACT_ADDRESS = null;
  let CONTRACT_ABI = null;

  const DEFAULT_MIX = [0.20,0.12,0.08,0.02,0.02,0.03];

  const SCENES = {
    forest:{gif:"assets/forest/forest.gif",layers:[
      {name:"birds",file:"assets/forest/birds.mp3"},
      {name:"campfire",file:"assets/forest/campfire.mp3"},
      {name:"swamp",file:"assets/forest/forest-swamp.mp3"},
      {name:"leaf",file:"assets/forest/leaf.mp3"},
      {name:"water",file:"assets/forest/water.mp3"},
      {name:"wind",file:"assets/forest/wind.mp3"}]},
    ocean:{gif:"assets/ocean/ocean.gif",layers:[
      {name:"engine",file:"assets/ocean/engine.mp3"},
      {name:"hum",file:"assets/ocean/hum.mp3"},
      {name:"sail",file:"assets/ocean/sail.mp3"},
      {name:"seagull",file:"assets/ocean/seagull.mp3"},
      {name:"wave",file:"assets/ocean/wave.mp3"},
      {name:"wind",file:"assets/ocean/wind.mp3"}]},
    mountain:{gif:"assets/mountain/mountain.gif",layers:[
      {name:"avalanche",file:"assets/mountain/avalanche.mp3"},
      {name:"chimes",file:"assets/mountain/chimes.mp3"},
      {name:"crunching snow",file:"assets/mountain/crunching-snow.mp3"},
      {name:"howling wind",file:"assets/mountain/howling-wind.mp3"},
      {name:"ice cracking",file:"assets/mountain/ice-cracking.mp3"},
      {name:"silence",file:"assets/mountain/silence.mp3"}]},
    desert:{gif:"assets/desert/desert.gif",layers:[
      {name:"bazaar",file:"assets/desert/bazaar.mp3"},
      {name:"cricket",file:"assets/desert/cricket.mp3"},
      {name:"dark background",file:"assets/desert/dark-background.mp3"},
      {name:"foot steps",file:"assets/desert/foot-steps.mp3"},
      {name:"lizard eating",file:"assets/desert/lizard-eating.mp3"},
      {name:"sand storm",file:"assets/desert/sand-storm.mp3"}]},
    space:{gif:"assets/space/space.gif",layers:[
      {name:"bip",file:"assets/space/bip.mp3"},
      {name:"breath",file:"assets/space/breath.mp3"},
      {name:"drone",file:"assets/space/drone.mp3"},
      {name:"fan",file:"assets/space/fan.mp3"},
      {name:"type",file:"assets/space/type.mp3"},
      {name:"space sound",file:"assets/space/space-sound.mp3"}]},
    cafe:{gif:"assets/cafe/cafe.gif",layers:[
      {name:"cash register",file:"assets/cafe/Cash register.mp3"},
      {name:"chatter",file:"assets/cafe/Chatter.mp3"},
      {name:"espresso machine",file:"assets/cafe/Espresso machine.mp3"},
      {name:"kitchen",file:"assets/cafe/Kitchen.mp3"},
      {name:"music",file:"assets/cafe/Music.mp3"},
      {name:"rain",file:"assets/cafe/Rain.mp3"}]}
  };

  const LIBRARY = (()=>{const n=s=>String(s||"").toLowerCase().replace(/\s+/g," ").trim();const m=new Map();Object.values(SCENES).forEach(s=>s.layers.forEach(l=>{const k=n(l.name);if(!m.has(k))m.set(k,{name:l.name,file:l.file})}));return Object.fromEntries(m)})();

  let currentSceneKey=null;
  let players=[];
  let selectedLayer=null;

  const $=q=>document.querySelector(q);
  const micBtn=$("#micBtn");
  const connectBtn=$("#connectBtn");
  const accountBadge=$("#accountBadge");
  const sceneName=$("#sceneName");
  const bg=$("#bg");
  const layersBox=$("#layers");
  const logBox=$("#log");
  const cmdForm=$("#cmdForm");
  const cmdInput=$("#cmdInput");
  const libList=$("#libList");
  const savesBox=$("#saves");
  const micDot=$("#micDot");
  const chainDot=$("#chainDot");
  const txStatus=$("#txStatus");
  const toastBox=$("#toast");

  let provider=null, signer=null, contract=null, readProvider=null, reader=null, userAddress="";

  const norm=s=>String(s||"").replace(/\s+/g," ").trim().toLowerCase();
  const short=a=>a?a.slice(0,6)+"…"+a.slice(-4):"—";

  function toast(msg,ms=3000){const el=document.createElement("div");el.className="toast";el.textContent=msg;toastBox.append(el);setTimeout(()=>el.remove(),ms)}
  function log(msg){const ts=new Date().toLocaleTimeString();logBox.textContent=`[${ts}] ${msg}\n`+logBox.textContent}

  function setVolume(p,v){v=Math.max(0,Math.min(1,v));p.audio.volume=v;p.slider.value=v;p.label.textContent=`${Math.round(v*100)}%`;p.card.classList.toggle("muted",v===0);if(v>0)p.lastVolume=v;refreshLibraryActiveFlags()}

  function findLayer(q){const t=norm(q);let cand=players.find(p=>t.includes(norm(p.name))||norm(p.name).includes(t));if(cand)return cand;const qTokens=new Set(t.split(" "));const scored=players.map(p=>{const nTokens=new Set(norm(p.name).split(" "));let s=0;qTokens.forEach(k=>{if(nTokens.has(k))s++});return{p,score:s}}).sort((a,b)=>b.score-a.score);return scored[0]?.score?scored[0].p:null}

  function clearPlayers(){players.forEach(p=>{try{p.audio.pause();p.audio.src=""}catch{}});players=[];layersBox.innerHTML="";selectedLayer=null}

  function renderLibrary(){libList.innerHTML="";const entries=Object.values(LIBRARY).sort((a,b)=>a.name.localeCompare(b.name));for(const item of entries){const row=document.createElement("div");row.className="lib-item";row.dataset.key=norm(item.name);const title=document.createElement("div");title.textContent=item.name;const addBtn=document.createElement("button");addBtn.className="add";addBtn.textContent="Add";addBtn.addEventListener("click",()=>addLayerByName(item.name));row.append(title,addBtn);libList.append(row)}refreshLibraryActiveFlags()}

  function refreshLibraryActiveFlags(){const active=new Set(players.map(p=>norm(p.name)));document.querySelectorAll(".lib-item").forEach(el=>{el.classList.toggle("active",active.has(el.dataset.key))})}

  function buildScene(sceneKey){const scene=SCENES[sceneKey];if(!scene)return;currentSceneKey=sceneKey;sceneName.textContent=sceneKey.toUpperCase();bg.src=scene.gif;clearPlayers();scene.layers.forEach((layer,i)=>addLayer({name:layer.name,file:layer.file},DEFAULT_MIX[i]??0.02));refreshLibraryActiveFlags()}

  function addLayerByName(name){const k=norm(name);const item=LIBRARY[k];if(!item){log(`(no sound named "${name}")`);return false}return addLayer(item)}

  function addLayer(item,initialVol){if(players.length>=6){toast("Max 6 layers");return false}if(players.some(p=>norm(p.name)===norm(item.name))){log(`(already active: ${item.name})`);return false}
    const idx=players.length;const vol=initialVol??(DEFAULT_MIX[idx]??0.1);const a=new Audio(item.file);a.loop=true;a.volume=vol;a.play().catch(()=>{});
    const card=document.createElement("div");card.className="layer";card.dataset.layer=item.name;
    const top=document.createElement("div");top.className="row";const nm=document.createElement("div");nm.className="name";nm.textContent=item.name;
    const ctrls=document.createElement("div");ctrls.className="controls";
    const lessBtn=document.createElement("button");lessBtn.className="iconbtn";lessBtn.textContent="−";
    const moreBtn=document.createElement("button");moreBtn.className="iconbtn";moreBtn.textContent="+";
    const muteBtn=document.createElement("button");muteBtn.className="iconbtn";muteBtn.textContent="Mute";
    const removeBtn=document.createElement("button");removeBtn.className="iconbtn";removeBtn.textContent="Remove";
    ctrls.append(lessBtn,moreBtn,muteBtn,removeBtn);top.append(nm,ctrls);
    const slider=document.createElement("input");slider.type="range";slider.min=0;slider.max=1;slider.step=0.01;slider.value=vol;
    const volLabel=document.createElement("div");volLabel.style.fontSize="12px";volLabel.style.opacity=".8";volLabel.textContent=`${Math.round(vol*100)}%`;
    card.append(top,slider,volLabel);layersBox.append(card);
    const p={name:item.name,audio:a,slider,lastVolume:vol,label:volLabel,card};players.push(p);
    card.addEventListener("click",e=>{if(e.target.closest(".iconbtn"))return;document.querySelectorAll(".layer").forEach(el=>el.classList.remove("selected"));card.classList.add("selected");selectedLayer=p});
    slider.addEventListener("input",()=>setVolume(p,parseFloat(slider.value)));
    moreBtn.addEventListener("click",()=>setVolume(p,p.audio.volume+0.05));
    lessBtn.addEventListener("click",()=>setVolume(p,p.audio.volume-0.05));
    muteBtn.addEventListener("click",()=>setVolume(p,0));
    removeBtn.addEventListener("click",()=>removeLayer(p));
    refreshLibraryActiveFlags();return true
  }

  function removeLayer(p){const idx=players.indexOf(p);if(idx===-1)return;try{p.audio.pause();p.audio.src=""}catch{}p.card.remove();players.splice(idx,1);if(selectedLayer===p)selectedLayer=null;refreshLibraryActiveFlags();log(`→ removed ${p.name}`)}

  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;let rec=null,listening=false;
  function startListening(){if(!SR){toast("Speech API not supported");return}if(listening)return;rec=new SR();rec.lang="en-US";rec.continuous=true;rec.interimResults=false;rec.onresult=e=>{const last=e.results[e.results.length-1][0].transcript.trim();log(`🎙 ${last}`);agent.handle(last)};rec.onend=()=>{if(listening)rec.start()};rec.start();listening=true;micBtn.classList.add("on");micBtn.setAttribute("aria-pressed","true");micBtn.textContent="🎤 Mic: On";micDot.classList.add("ok")}
  function stopListening(){if(rec)rec.stop();listening=false;micBtn.classList.remove("on");micBtn.setAttribute("aria-pressed","false");micBtn.textContent="🎤 Mic: Off";micDot.classList.remove("ok")}
  micBtn.addEventListener("click",()=>{if(!currentSceneKey)buildScene("forest");players.forEach(p=>p.audio.play().catch(()=>{}));listening?stopListening():startListening()});

  cmdForm.addEventListener("submit",e=>{e.preventDefault();const v=cmdInput.value.trim();if(!v)return;log(`⌨️ ${v}`);agent.handle(v);cmdInput.value=""});

  const contractReady=()=>Boolean(CONTRACT_ADDRESS)&&Array.isArray(CONTRACT_ABI)&&CONTRACT_ABI.length>0;

  async function loadContractConfig(){try{const res=await fetch("js/contract.json?ts="+Date.now(),{cache:"no-store"});if(!res.ok)throw new Error("contract.json not found");const cfg=await res.json();CONTRACT_ADDRESS=cfg.address||"";CONTRACT_ABI=Array.isArray(cfg.abi)?cfg.abi:[]}catch(e){console.error(e);toast("contract.json missing/invalid")}}

  async function ensureNetwork(){
    const target=(CHAIN_PARAMS.chainId||"").toLowerCase();
    if(window.ethereum&&target&&target!=="0x0000"){
      const current=(await window.ethereum.request({method:"eth_chainId"})).toLowerCase();
      if(current!==target){
        try{await window.ethereum.request({method:"wallet_switchEthereumChain",params:[{chainId:target}]})}
        catch(e){if(e&&e.code===4902){await window.ethereum.request({method:"wallet_addEthereumChain",params:[CHAIN_PARAMS]})}else{throw e}}
      }
    }
    provider=new ethers.BrowserProvider(window.ethereum);
    signer=await provider.getSigner();
    userAddress=await signer.getAddress();
    connectBtn.classList.add("connected");
    connectBtn.textContent="Connected";
    if(accountBadge)accountBadge.textContent=short(userAddress)
  }

  async function ensureWallet(){
    await contractCfgReady;
    if(!window.ethereum)throw new Error("NO_METAMASK");
    await window.ethereum.request({method:"eth_requestAccounts"});
    await ensureNetwork();
    if(contractReady()){
      contract=new ethers.Contract(CONTRACT_ADDRESS,CONTRACT_ABI,signer);
      readProvider=new ethers.JsonRpcProvider(READ_RPC,READ_CHAIN_ID);
      reader=new ethers.Contract(CONTRACT_ADDRESS,CONTRACT_ABI,readProvider);
      chainDot.classList.add("ok");
      await refreshSavesUI()
    }else{
      chainDot.classList.remove("ok")
    }
  }

  function toIdx(slot){if(slot>=1&&slot<=3)return slot-1;if(slot>=0&&slot<=2)return slot;return null}
  function collectCurrentMix(){const scene=currentSceneKey||"forest";const layers=players.map(p=>p.name);const volumesBP=players.map(p=>Math.max(0,Math.min(10000,Math.round(p.audio.volume*10000))));return{scene,layers,volumesBP,uri:""}}
  async function autoChooseSlot(){if(!reader)return 0;for(let i=0;i<3;i++){try{const has=await reader.hasSave(userAddress,i);if(!has)return i}catch{}}return 0}

  async function saveToSei(slotHuman=null){
    try{
      await contractCfgReady;await ensureWallet();
      if(!contract){toast("Fill contract.json first");return}
      const mix=collectCurrentMix();
      const slot=slotHuman!==null?toIdx(slotHuman):await autoChooseSlot();
      if(slot===null){toast("Bad slot");return}
      txStatus.textContent=`Saving (slot ${slot+1})…`;
      const tx=await contract.save(slot,mix.scene,mix.layers,mix.volumesBP,mix.uri);
      toast("Confirm in MetaMask");
      if(!readProvider)readProvider=new ethers.JsonRpcProvider(READ_RPC,READ_CHAIN_ID);
      await readProvider.waitForTransaction(tx.hash);
      txStatus.textContent=`Saved ✓ (slot ${slot+1})`;
      toast("Saved on Sei ✓",2000);
      await refreshSavesUI()
    }catch(e){console.error(e);toast(e?.shortMessage||e?.message||"Save failed");txStatus.textContent="Idle"}
  }

  async function loadFromSei(slotHuman){
    try{
      await contractCfgReady;await ensureWallet();
      if(!reader){toast("Fill contract.json first");return}
      const slot=toIdx(slotHuman);
      txStatus.textContent=`Loading (slot ${slotHuman})…`;
      const res=await reader.loadOf(userAddress,slot);
      const scene=String(res[0]).toLowerCase();
      const layers=res[1];
      const volBP=res[2];
      buildScene(scene);
      clearPlayers();
      layers.forEach((name,i)=>{if(addLayerByName(name)){const p=findLayer(name);if(p){setVolume(p,Math.max(0,Math.min(1,(Number(volBP[i])||0)/10000)))}}});
      txStatus.textContent=`Loaded ✓ (slot ${slotHuman})`;
      toast(`Loaded slot ${slotHuman}`,2000);
      await refreshSavesUI()
    }catch(e){console.error(e);toast(e?.shortMessage||e?.message||"Load failed");txStatus.textContent="Idle"}
  }

  async function clearOnSei(slotHuman){
    try{
      await contractCfgReady;await ensureWallet();
      if(!contract){toast("Fill contract.json first");return}
      const slot=toIdx(slotHuman);
      txStatus.textContent=`Clearing (slot ${slotHuman})…`;
      const tx=await contract.clear(slot);
      toast("Confirm in MetaMask");
      if(!readProvider)readProvider=new ethers.JsonRpcProvider(READ_RPC,READ_CHAIN_ID);
      await readProvider.waitForTransaction(tx.hash);
      txStatus.textContent=`Cleared ✓ (slot ${slotHuman})`;
      toast(`Cleared slot ${slotHuman}`,2000);
      await refreshSavesUI()
    }catch(e){console.error(e);toast(e?.shortMessage||e?.message||"Clear failed");txStatus.textContent="Idle"}
  }

  async function refreshSavesUI(){
    savesBox.innerHTML="";
    for(let i=0;i<3;i++){
      const row=document.createElement("div");row.className="save-row";
      const title=document.createElement("div");title.textContent=`Slot ${i+1}`;
      const actions=document.createElement("div");actions.className="save-actions";
      const s=document.createElement("button");s.className="btn";s.textContent="Save";
      const l=document.createElement("button");l.className="btn";l.textContent="Load";
      const c=document.createElement("button");c.className="btn";c.textContent="Clear";
      actions.append(s,l,c);row.append(title,actions);savesBox.append(row);
      if(!reader){l.disabled=true;c.disabled=true}
      try{if(reader){const has=await reader.hasSave(userAddress,i);title.textContent=`Slot ${i+1} — ${has?"Saved":"Empty"}`;l.disabled=!has;c.disabled=!has}}catch{}
      s.addEventListener("click",()=>saveToSei(i+1));
      l.addEventListener("click",()=>loadFromSei(i+1));
      c.addEventListener("click",()=>clearOnSei(i+1))
    }
  }

  connectBtn.addEventListener("click",()=>ensureWallet().catch(e=>{console.error(e);toast(e?.shortMessage||e?.message||"Wallet connect failed")}));

  if(window.ethereum){
    window.ethereum.on("chainChanged",async()=>{try{
      provider=new ethers.BrowserProvider(window.ethereum);
      signer=await provider.getSigner();
      if(CONTRACT_ADDRESS&&CONTRACT_ABI&&CONTRACT_ABI.length){contract=new ethers.Contract(CONTRACT_ADDRESS,CONTRACT_ABI,signer)}
      readProvider=new ethers.JsonRpcProvider(READ_RPC,READ_CHAIN_ID);
      if(CONTRACT_ADDRESS&&CONTRACT_ABI&&CONTRACT_ABI.length){reader=new ethers.Contract(CONTRACT_ADDRESS,CONTRACT_ABI,readProvider)}
      chainDot.classList.add("ok");
      await refreshSavesUI();
      toast("Network changed")
    }catch(e){console.error(e);chainDot.classList.remove("ok");toast("Network change error")}});
    window.ethereum.on("accountsChanged",async()=>{try{await ensureWallet()}catch(e){console.error(e)}})
  }

  const AgentClass = window.SeiAgent;
  if (!AgentClass || typeof AgentClass !== "function") { console.error("SeiAgent class not available. Check script order."); return; }

  const agent = new AgentClass({
    goScene:key=>{buildScene(key);players.forEach(p=>p.audio.play().catch(()=>{}));log(`→ Scene: ${key}`)},
    add:name=>{if(addLayerByName(name))log(`→ added ${name}`)},
    remove:name=>{const p=findLayer(name);if(!p){log(`(no layer matched "${name}")`);return}removeLayer(p)},
    mute:name=>{const p=findLayer(name);if(p)setVolume(p,0)},
    unmute:name=>{const p=findLayer(name);if(p)setVolume(p,p.lastVolume??0.1)},
    bump:(name,delta)=>{const p=findLayer(name);if(p)setVolume(p,p.audio.volume+(delta/100))},
    setVolume:(name,pct)=>{const p=findLayer(name)||addLayerByName(name)&&findLayer(name);if(p)setVolume(p,Math.max(0,Math.min(1,pct/100)))},
    silence:()=>{players.forEach(p=>setVolume(p,0))},
    resume:()=>{players.forEach((p,i)=>setVolume(p,p.lastVolume??(DEFAULT_MIX[i]??0.02)))},
    save:slot=>saveToSei(slot),
    load:slot=>loadFromSei(slot),
    clear:slot=>clearOnSei(slot),
    connect:()=>ensureWallet().catch(()=>{}),
    getScenes:()=>Object.keys(SCENES),
    getActiveLayers:()=>players.map(p=>p.name),
    getLibraryLayers:()=>Object.values(LIBRARY).map(v=>v.name),
    getSelected:()=>selectedLayer?.name||null
  });

  renderLibrary();
  buildScene("forest");
  micDot.classList.remove("ok");
  document.addEventListener("keydown",e=>{if(e.key==="m"&&(e.ctrlKey||e.metaKey)){e.preventDefault();micBtn.click()}});
  const contractCfgReady = loadContractConfig();
})();
