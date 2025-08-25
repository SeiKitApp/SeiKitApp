(function(){
  const norm = s => String(s||"").toLowerCase().replace(/\s+/g," ").trim();

  class Agent{
    constructor(opts){
      this.cb = opts || {};
      this.getScenes = opts.getScenes || (() => []);
      this.getActiveLayers = opts.getActiveLayers || (() => []);
      this.getLibraryLayers = opts.getLibraryLayers || (() => []);
      this.getSelected = opts.getSelected || (() => null);
    }

    handle(inputRaw){
      let text = " " + norm(inputRaw) + " ";

      text = text.replace(/[.,!?]+$/g, "");

      text = text
        .replace(/^(and|ed|ad|at|had)\s+/i, "add ")
        .replace(/\s+and\s+$/i, " add ");

      text = text
        .replace(/\blord\b/g, "load")
        .replace(/\blode\b/g, "load")
        .replace(/\bloard\b/g, "load");

      const sceneAliases = {
        forest: ["forest","forrest","woods"],
        ocean: ["ocean","sea"],
        desert: ["desert"],
        mountain: ["mountain","mountains"],
        space: ["space","outer space"],
        cafe: ["cafe","café","coffee shop"]
      };

      const canonScene = t => {
        for (const [k, vals] of Object.entries(sceneAliases)) {
          for (const v of vals) if (t.includes(v)) return k;
        }
        return null;
      };

      const pickName = (q, pool) => {
        const qs = new Set(norm(q).split(" ").filter(Boolean));
        let best = null, score = 0;
        for (const name of pool) {
          const ns = new Set(norm(name).split(" "));
          let s = 0; qs.forEach(t => { if (ns.has(t)) s++; });
          if (s > score) { score = s; best = name; }
        }
        return best || pool.find(n => norm(n).includes(norm(q))) || null;
      };

      const scenes  = this.getScenes();
      const active  = this.getActiveLayers();
      const library = this.getLibraryLayers();

      const takeRe = /(take|bring|move|switch|go)\s+(me\s+)?(to|into|in)\s+([a-z\s]+)/;
      const mt = text.match(takeRe);
      if (mt) {
        const key = canonScene(mt[4]) || pickName(mt[4], scenes);
        if (key && this.cb.goScene) { this.cb.goScene(key); return true; }
      }

      if (/^\s*(silence|mute all|be quiet|shut up)\s*$/.test(text)) { if (this.cb.silence) this.cb.silence(); return true; }
      if (/^\s*(resume|unmute all|sound on)\s*$/.test(text))       { if (this.cb.resume)  this.cb.resume();  return true; }

      const setRe = /(?:set|volume(?: of)?)\s+([a-z\s\-]+)\s+to\s+(\d{1,3})\s*(?:%|percent|per\s*cent)?/;
      const ms = text.match(setRe);
      if (ms) {
        const pct = Math.max(0, Math.min(100, parseInt(ms[2], 10)));
        const name = pickName(ms[1], active.length ? active : library);
        if (name && this.cb.setVolume) this.cb.setVolume(name, pct);
        return true;
      }

      const ma = text.match(/^\s*(add|play)\s+([a-z\s\-]+)\s*$/);
      if (ma) {
        const nm = pickName(ma[2], library);
        if (nm && this.cb.add) this.cb.add(nm);
        return true;
      }

      const mr = text.match(/^\s*(remove|delete|take out)\s+(this|it|[a-z\s\-]+)\s*$/);
      if (mr) {
        const tgt = mr[2];
        if (/(this|it)/.test(tgt)) {
          const sel = this.getSelected();
          if (sel && this.cb.remove) this.cb.remove(sel);
        } else {
          const nm = pickName(tgt, active);
          if (nm && this.cb.remove) this.cb.remove(nm);
        }
        return true;
      }

      const ml = text.match(/(mute|no|unmute|more|less)\s+([a-z\s\-]+)/);
      if (ml) {
        const action = ml[1];
        const nm = pickName(ml[2], active);
        if (!nm) return true;
        if (action === "mute" || action === "no") { if (this.cb.mute)   this.cb.mute(nm); }
        if (action === "unmute")                  { if (this.cb.unmute) this.cb.unmute(nm); }
        if (action === "more")                    { if (this.cb.bump)   this.cb.bump(nm, +5); }
        if (action === "less")                    { if (this.cb.bump)   this.cb.bump(nm, -5); }
        return true;
      }

      const mr2 = text.match(/([a-z\s\-]+)\s+(more|less|mute|no|unmute|remove|add)\s*$/);
      if (mr2) return this.handle(`${mr2[2]} ${mr2[1]}`);

      const NUM_WORD = {
        one:1, won:1,
        two:2, too:2, to:2, tu:2, tow:2,
        three:3, tree:3, free:3, thre:3
      };
      const getSlot = t => {
        const m = t.match(/\b(slot\s*)?(#\s*)?([a-z0-9]+)\b/);
        if (!m) return null;
        const raw = m[3].toLowerCase();
        const n = /^\d+$/.test(raw) ? parseInt(raw,10) : (NUM_WORD[raw] || null);
        return (n>=1 && n<=3) ? n : null;
      };

      if (/^\s*save(\s+(to|on)\s+(sei|chain|blockchain))?(\s+(settings|scene|mix))?\s*$/.test(text)) {
        if (this.cb.save) this.cb.save(null);
        return true;
      }
      let mm = text.match(/^\s*save\s+(to\s+)?slot\s+([a-z0-9#\s]+)\s*$/);
      if (mm) {
        const n = getSlot(mm[2]);
        if (n && this.cb.save) this.cb.save(n);
        return true;
      }

      mm = text.match(/^\s*load\s+([a-z0-9#\s]+)\s*$/);
      if (mm) {
        const n = getSlot(mm[1]);
        if (n && this.cb.load) this.cb.load(n);
        return true;
      }

      mm = text.match(/^\s*clear\s+([a-z0-9#\s]+)\s*$/);
      if (mm) {
        const n = getSlot(mm[1]);
        if (n && this.cb.clear) this.cb.clear(n);
        return true;
      }

      if (/^(connect|connect wallet|wallet)\s*$/.test(text)) {
        if (this.cb.connect) this.cb.connect();
        return true;
      }

      return false;
    }
  }

  window.SeiAgent = Agent;
})();
