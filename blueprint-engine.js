(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const Studio = window.WhiteboardStudio;
  if (!Studio) return;

  const BP = {
    mode: 'text', preset: 'whiteboard', files: [], fileAssets: [], parsed: null,
    compiled: { svgs: [], htmls: [], srt: '' }
  };
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clamp = (n,a,b) => Math.min(b,Math.max(a,n));
  const uid = i => `scene-${String(i+1).padStart(2,'0')}`;
  const download = (text,name,type='text/plain') => { const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type})); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),500); };
  const dataUrl = text => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(text)}`;

  function sentenceSplit(text) {
    return String(text||'').replace(/\r/g,'').split(/(?<=[.!?。！？]|다\.|요\.|니다\.)\s+|\n{2,}/).map(x=>x.trim()).filter(Boolean);
  }
  function deriveNarrationFromInput() {
    const src=$('#bpSourceInput').value.trim();
    if(BP.mode==='srt' || /-->/.test(src)) return Studio.parseSRT(src).map(x=>x.text).join('\n');
    if(BP.mode==='json') { try { const j=JSON.parse(src); return (j.scenes||[]).map(s=>s.narration||s.text||s.title||'').filter(Boolean).join('\n'); } catch {} }
    if(BP.mode==='markup') return src.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
    return src;
  }
  function localBlueprint() {
    const source=$('#bpSourceInput').value.trim();
    if(BP.mode==='json') { try { const j=JSON.parse(source); if(j.scenes?.length) return normalizeBlueprint(j); } catch {} }
    if(BP.mode==='markup' && source){
      if(/^<svg[\s>]/i.test(source)){
        const src=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
        return normalizeBlueprint({format:'whiteboard-blueprint/v1',title:'SVG 가져오기',canvas:{width:1280,height:720},style:{paper:'#F5EBD7',ink:'#383A36',accent:'#FFA500',allowText:false},scenes:[{id:'scene-01',title:'가져온 SVG',narration:'가져온 SVG 장면',durationMs:(+$('#bpSceneLength').value||8)*1000,visualMode:'whiteboard',layout:'focus',animation:{preset:'ink-color-gaze',inkPath:$('#bpInkPath').value,colorFill:$('#bpColorFill').value,pause:$('#bpPause').value},transition:{type:$('#bpTransition').value,durationMs:500},objects:[{id:'imported-svg',type:'image',x:40,y:30,w:1200,h:660,src,drawOrder:1}]}]});
      }
      const body=source.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1]||source;
      return normalizeBlueprint({format:'whiteboard-blueprint/v1',title:'HTML 가져오기',canvas:{width:1280,height:720},style:{paper:'#F5EBD7',ink:'#383A36',accent:'#FFA500',allowText:true},scenes:[{id:'scene-01',title:'가져온 HTML',narration:'가져온 HTML 장면',durationMs:(+$('#bpSceneLength').value||8)*1000,visualMode:'html',layout:'focus',sourceMarkup:body,animation:{preset:'mask-wipe'},transition:{type:$('#bpTransition').value,durationMs:500},objects:[{id:'html-surface',type:'html',x:40,y:30,w:1200,h:660,markup:body,drawOrder:1}]}]});
    }
    if(BP.fileAssets.length && !source){
      return normalizeBlueprint({format:'whiteboard-blueprint/v1',title:'가져온 이미지 프로젝트',canvas:{width:1280,height:720},style:{paper:'#F5EBD7',ink:'#383A36',accent:'#FFA500',allowText:false},scenes:BP.fileAssets.map((a,i)=>({id:uid(i),title:a.name.replace(/\.[^.]+$/,''),narration:`${a.name} 장면`,durationMs:(+$('#bpSceneLength').value||8)*1000,visualMode:'whiteboard',layout:'focus',animation:{preset:'ink-color-gaze',inkPath:$('#bpInkPath').value,colorFill:$('#bpColorFill').value,pause:$('#bpPause').value},transition:{type:$('#bpTransition').value,durationMs:500},objects:[{id:'source-image',type:'image',x:80,y:60,w:1120,h:600,src:a.dataUrl,text:'',drawOrder:1}]}))});
    }
    let chunks=[];
    if(BP.mode==='srt' || /-->/.test(source)) chunks=Studio.parseSRT(source).map(c=>({text:c.text,durationMs:Math.max(1000,c.endMs-c.startMs)}));
    else {
      const parts=sentenceSplit(deriveNarrationFromInput());
      const target=+$('#bpSceneLength').value||8;
      let buf=[], chars=0;
      parts.forEach((p,i)=>{ buf.push(p); chars+=p.length; const est=Math.max(2500,chars/7.2*1000); if(est>=target*1000 || i===parts.length-1){ chunks.push({text:buf.join(' '),durationMs:clamp(Math.round(est),3000,target*1600)});buf=[];chars=0;} });
    }
    if(!chunks.length) chunks=[{text:'첫 장면의 내용을 입력하세요.',durationMs:6000}];
    const visual=$('#bpVisualMode').value;
    return normalizeBlueprint({
      format:'whiteboard-blueprint/v1', title:'새 프로젝트', canvas:{width:1280,height:720},
      style:{paper:'#F5EBD7',ink:'#383A36',accent:'#FFA500',allowText:$('#bpAllowText').checked},
      scenes:chunks.map((c,i)=>makeScene(c.text,c.durationMs,i,visual))
    });
  }
  function makeScene(text,durationMs,i,visualMode) {
    const layouts=['left-right','steps','focus','radial']; const layout=layouts[i%layouts.length];
    const mode=visualMode==='mixed'?['whiteboard','diagram','kinetic'][i%3]:visualMode;
    const phrases=text.split(/[,，;:·]|그리고|또한|다음으로|마지막으로/).map(x=>x.trim()).filter(Boolean).slice(0,4);
    const objects=[];
    if(mode==='kinetic') {
      objects.push({id:'headline',type:'text',x:120,y:215,w:1040,h:140,text:phrases[0]||text,drawOrder:1});
      if(phrases[1]) objects.push({id:'sub',type:'text',x:210,y:400,w:860,h:80,text:phrases.slice(1).join(' · '),drawOrder:2});
    } else if(layout==='left-right') {
      objects.push({id:'subject-a',type:'circle',x:150,y:225,w:220,h:220,drawOrder:1});
      objects.push({id:'link',type:'arrow',x:430,y:315,w:270,h:55,drawOrder:2});
      objects.push({id:'subject-b',type:'box',x:760,y:205,w:330,h:260,drawOrder:3});
    } else if(layout==='steps') {
      [0,1,2].forEach(n=>objects.push({id:`step-${n+1}`,type:'box',x:100+n*390,y:250+(n%2)*80,w:300,h:180,drawOrder:n+1}));
      objects.push({id:'flow',type:'arrow',x:360,y:330,w:520,h:60,drawOrder:4});
    } else if(layout==='radial') {
      objects.push({id:'core',type:'circle',x:510,y:240,w:260,h:260,drawOrder:1});
      [[160,120],[910,120],[150,500],[930,500]].forEach((p,n)=>objects.push({id:`node-${n+1}`,type:'circle',x:p[0],y:p[1],w:120,h:120,drawOrder:n+2}));
    } else {
      objects.push({id:'focus',type:'illustration',x:280,y:150,w:720,h:410,drawOrder:1});
    }
    if($('#bpAllowText').checked && mode!=='whiteboard') {
      objects.push({id:'label',type:'text',x:100,y:70,w:1080,h:90,text:(phrases[0]||text).slice(0,70),drawOrder:0});
    }
    return { id:uid(i), title:(phrases[0]||text).slice(0,30), narration:text, durationMs:Math.max(2500,durationMs||6000), visualMode:mode, layout,
      animation: mode==='whiteboard'?{preset:'ink-color-gaze',inkPath:$('#bpInkPath').value,colorFill:$('#bpColorFill').value,pause:$('#bpPause').value}:{preset:mode==='kinetic'?'word-pop':'mask-wipe'},
      transition:{type:$('#bpTransition').value,durationMs:500}, objects };
  }
  function normalizeBlueprint(j) {
    const out={format:'whiteboard-blueprint/v1',title:j.title||j.projectName||'Blueprint Project',canvas:j.canvas||{width:1280,height:720},style:{paper:'#F5EBD7',ink:'#383A36',accent:'#FFA500',allowText:false,...(j.style||{})},scenes:[]};
    (j.scenes||[]).forEach((s,i)=>out.scenes.push({id:s.id||uid(i),title:s.title||`장면 ${i+1}`,narration:s.narration||s.text||'',durationMs:+s.durationMs||6000,visualMode:s.visualMode||'whiteboard',layout:s.layout||'focus',animation:s.animation||{preset:'ink-color-gaze',inkPath:'grid',colorFill:'contour-wipe',pause:'heavy'},transition:s.transition||{type:'cut',durationMs:0},sourceMarkup:s.sourceMarkup||'',objects:(s.objects||[]).map((o,n)=>({id:o.id||`obj-${n+1}`,type:o.type||'box',x:+o.x||100,y:+o.y||100,w:+o.w||200,h:+o.h||150,text:o.text||'',src:o.src||'',markup:o.markup||'',drawOrder:o.drawOrder??n+1,style:o.style||{}}))}));
    return out;
  }
  function validate(bp) {
    const issues=[];
    if(!bp?.scenes?.length) issues.push('scenes가 없습니다.');
    (bp?.scenes||[]).forEach((s,i)=>{ if(!s.narration)issues.push(`${i+1}번 장면 narration이 비었습니다.`); if(!(s.durationMs>0))issues.push(`${i+1}번 장면 durationMs가 잘못되었습니다.`); if(!Array.isArray(s.objects))issues.push(`${i+1}번 장면 objects가 배열이 아닙니다.`); });
    return issues;
  }
  function parseEditor() { try { const j=normalizeBlueprint(JSON.parse($('#bpJsonEditor').value)); BP.parsed=j; return j; } catch(e) { Studio.toast('Blueprint JSON 형식을 확인하세요.'); return null; } }
  function setBlueprint(bp) { BP.parsed=normalizeBlueprint(bp); $('#bpJsonEditor').value=JSON.stringify(BP.parsed,null,2); compileAll(); renderValidation(); }
  function renderValidation() { const bp=BP.parsed||parseEditor(); if(!bp)return; const issues=validate(bp), el=$('#bpValidation'); el.className='validation '+(issues.length?'warn':'ok'); el.textContent=issues.length?`수정할 항목 ${issues.length}개: ${issues.slice(0,4).join(' / ')}`:`정상 · ${bp.scenes.length}개 장면 · 총 ${(bp.scenes.reduce((a,s)=>a+s.durationMs,0)/1000).toFixed(1)}초 · 오브젝트 ${bp.scenes.reduce((a,s)=>a+s.objects.length,0)}개`; }

  function objectSvg(o,style) {
    const ink=o.style?.stroke||style.ink, accent=o.style?.fill||style.accent;
    if(o.type==='circle') return `<ellipse cx="${o.x+o.w/2}" cy="${o.y+o.h/2}" rx="${o.w/2}" ry="${o.h/2}" fill="none" stroke="${ink}" stroke-width="5"/>`;
    if(o.type==='arrow') return `<path d="M ${o.x} ${o.y+o.h/2} H ${o.x+o.w-35} M ${o.x+o.w-70} ${o.y} L ${o.x+o.w} ${o.y+o.h/2} L ${o.x+o.w-70} ${o.y+o.h}" fill="none" stroke="${ink}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`;
    if(o.type==='text') return `<text x="${o.x+o.w/2}" y="${o.y+o.h/2}" text-anchor="middle" dominant-baseline="middle" font-family="system-ui,sans-serif" font-weight="700" font-size="${Math.min(54,Math.max(22,o.h*.45))}" fill="${ink}">${esc(o.text)}</text>`;
    if(o.type==='image' && o.src) return `<image href="${esc(o.src)}" x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" preserveAspectRatio="xMidYMid meet"/>`;
    if(o.type==='html' && o.markup){const clean=String(o.markup).replace(/<script[\s\S]*?<\/script>/gi,'');return `<foreignObject x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}"><div xmlns="http://www.w3.org/1999/xhtml" style="width:100%;height:100%;overflow:hidden;background:white;color:#222;font:16px system-ui">${clean}</div></foreignObject>`;}
    if(o.type==='illustration') return `<path d="M ${o.x+o.w*.12} ${o.y+o.h*.72} C ${o.x+o.w*.24} ${o.y+o.h*.15}, ${o.x+o.w*.46} ${o.y+o.h*.20}, ${o.x+o.w*.52} ${o.y+o.h*.54} S ${o.x+o.w*.78} ${o.y+o.h*.92}, ${o.x+o.w*.90} ${o.y+o.h*.30}" fill="none" stroke="${ink}" stroke-width="8" stroke-linecap="round"/><circle cx="${o.x+o.w*.52}" cy="${o.y+o.h*.54}" r="28" fill="${accent}" opacity=".8"/>`;
    return `<rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" rx="28" fill="none" stroke="${ink}" stroke-width="5"/><path d="M ${o.x+35} ${o.y+50} H ${o.x+o.w-35} M ${o.x+35} ${o.y+90} H ${o.x+o.w*.68}" stroke="${ink}" stroke-width="4" stroke-linecap="round" opacity=".65"/>`;
  }
  function compileSvg(bp,s,i) {
    const {width:w,height:h}=bp.canvas, st=bp.style; const objs=[...s.objects].sort((a,b)=>a.drawOrder-b.drawOrder);
    const defs=objs.map((o,n)=>`<clipPath id="r${n}"><rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}"/></clipPath>`).join('');
    const body=objs.map((o,n)=>`<g id="${esc(o.id)}" class="obj obj-${n}" style="opacity:1">${objectSvg(o,st)}</g>`).join('\n');
    const caption=st.allowText?'':`<foreignObject x="100" y="${h-112}" width="${w-200}" height="72"><div xmlns="http://www.w3.org/1999/xhtml" style="font:600 26px/1.35 system-ui;text-align:center;color:${st.ink};background:rgba(245,235,215,.88);padding:12px 20px;border-radius:14px">${esc(s.narration)}</div></foreignObject>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><defs>${defs}</defs><rect width="100%" height="100%" fill="${st.paper}"/><g>${body}</g>${caption}</svg>`;
  }
  function compileHtml(bp,s,i) {
    const {width:w,height:h}=bp.canvas, objs=[...s.objects].sort((a,b)=>a.drawOrder-b.drawOrder); const dur=s.durationMs/1000;
    const clips=s.sourceMarkup?`<div class="clip imported-html" id="imported-html" data-start="0" data-duration="${dur.toFixed(2)}" data-track-index="1" style="position:absolute;inset:0;overflow:hidden">${s.sourceMarkup}</div>`:objs.map((o,n)=>`<div class="clip object" id="${esc(o.id)}" data-start="${(n*Math.max(.2,dur/(objs.length+2))).toFixed(2)}" data-duration="${Math.max(1,dur-n*.25).toFixed(2)}" data-track-index="${n+1}" style="position:absolute;left:${o.x/w*100}%;top:${o.y/h*100}%;width:${o.w/w*100}%;height:${o.h/h*100}%">${objectSvg({...o,x:0,y:0},bp.style)}</div>`).join('\n');
    const anim=s.sourceMarkup?`tl.fromTo('#imported-html',{opacity:0},{opacity:1,duration:.45,ease:'power2.out'},0);`:objs.map((o,n)=>`tl.fromTo('#${o.id}',{opacity:0,scale:.94},{opacity:1,scale:1,duration:.45,ease:'power2.out'},${(n*Math.max(.2,dur/(objs.length+2))).toFixed(2)});`).join('\n');
    return `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:${bp.style.paper}}#stage{position:relative;width:${w}px;height:${h}px;transform-origin:0 0}.object svg{width:100%;height:100%;overflow:visible}.caption{position:absolute;left:8%;right:8%;bottom:5%;font:600 26px/1.35 system-ui;text-align:center;color:${bp.style.ink}}</style></head><body><div id="stage" data-composition-id="${s.id}" data-start="0" data-width="${w}" data-height="${h}">${clips}<div class="caption">${esc(s.narration)}</div></div><script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"><\/script><script>const tl=gsap.timeline({paused:true});${anim}window.__timelines=window.__timelines||{};window.__timelines['${s.id}']=tl;<\/script></body></html>`;
  }
  function deriveSrt(bp) { let t=0,n=1,out=[]; bp.scenes.forEach(s=>{const start=t,end=t+s.durationMs; out.push(`${n++}\n${msSrt(start)} --> ${msSrt(end)}\n${s.narration}`);t=end;}); return out.join('\n\n'); }
  function msSrt(ms){ms=Math.round(ms);const h=Math.floor(ms/3600000);ms%=3600000;const m=Math.floor(ms/60000);ms%=60000;const s=Math.floor(ms/1000),x=ms%1000;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')},${String(x).padStart(3,'0')}`;}
  function compileAll() { const bp=BP.parsed||parseEditor(); if(!bp)return; BP.parsed=bp; BP.compiled.svgs=bp.scenes.map((s,i)=>compileSvg(bp,s,i)); BP.compiled.htmls=bp.scenes.map((s,i)=>compileHtml(bp,s,i)); BP.compiled.srt=deriveSrt(bp); const sel=$('#bpPreviewScene'); sel.innerHTML=bp.scenes.map((s,i)=>`<option value="${i}">${i+1}. ${esc(s.title)}</option>`).join(''); renderPreview(+sel.value||0); }
  function renderPreview(i=0) { if(!BP.compiled.svgs.length)return; $('#bpSvgPreview').innerHTML=BP.compiled.svgs[i]||''; const f=$('#bpHtmlPreview'); f.srcdoc=BP.compiled.htmls[i]||''; }

  async function aiBlueprint() {
    const source=$('#bpSourceInput').value.trim(); if(!source){Studio.toast('먼저 입력 자료를 넣으세요.');return}
    const provider=($('#externalAiSelect')?.value==='chatgpt'?'openai':$('#externalAiSelect')?.value==='claude'?'anthropic':$('#externalAiSelect')?.value)||'openai';
    const model=Studio.modelFor(provider,'text');
    const system='You are a video storyboard compiler. Return ONLY valid JSON, no markdown.';
    const prompt=`Turn the source into a deterministic scene blueprint. Schema: {format:"whiteboard-blueprint/v1",title,canvas:{width:1280,height:720},style:{paper:"#F5EBD7",ink:"#383A36",accent:"#FFA500",allowText:false},scenes:[{id,title,narration,durationMs,visualMode:"whiteboard|diagram|kinetic",layout,animation:{preset:"ink-color-gaze|mask-wipe|word-pop",inkPath:"grid|skeleton",colorFill:"contour-wipe|brush",pause:"heavy|auto|light|off"},transition:{type:"cut|fade|slide|wipe",durationMs},objects:[{id,type:"box|circle|arrow|illustration|text",x,y,w,h,text,drawOrder}]}]}. Coordinates must fit 1280x720. Prefer 4-10 second scenes unless the material needs longer. Whiteboard scenes should keep image text minimal. Source:\n${source}`;
    try { $('#bpAiDesignBtn').disabled=true; $('#bpAiDesignBtn').textContent='AI 설계 중…'; const d=await Studio.gatewayFetch('/v1/text',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({provider,model,system,prompt})}); let txt=(d.text||'').trim().replace(/^```json\s*/,'').replace(/```$/,'').trim(); setBlueprint(JSON.parse(txt)); Studio.toast('AI Blueprint를 만들었습니다.'); } catch(e){Studio.toast(e.message||'AI Blueprint 생성 실패');} finally {$('#bpAiDesignBtn').disabled=false;$('#bpAiDesignBtn').textContent='연결된 AI로 정교하게 설계';}
  }

  function applyToStudio() {
    const bp=BP.parsed||parseEditor(); if(!bp)return; compileAll();
    const global=[]; let abs=0;
    const scenes=bp.scenes.map((s,i)=>{
      const cue={id:i+1,startMs:0,endMs:s.durationMs,text:s.narration}; global.push({id:i+1,startMs:abs,endMs:abs+s.durationMs,text:s.narration});abs+=s.durationMs;
      const elements=s.objects.map((o,n)=>({id:o.id,label:o.id,sequence:n+1,narrativeRole:o.type,subtitle:s.narration,type:o.type,region:{x:o.x,y:o.y,width:o.w,height:o.h},reveal:{direction:'left_to_right',startMs:Math.round(n*Math.max(250,s.durationMs/(s.objects.length+2))),durationMs:Math.max(700,Math.round(s.durationMs/(s.objects.length+1))),maskPaddingPx:10,protectedRegions:[]},handPath:{start:[o.x,o.y+o.h/2],end:[o.x+o.w,o.y+o.h/2],easing:'easeInOut'},colorPhase:70}));
      return {id:s.id,title:s.title,durationMs:s.durationMs,cues:[cue],imageData:dataUrl(BP.compiled.svgs[i]),imageName:`${s.id}.svg`,imageWidth:bp.canvas.width,imageHeight:bp.canvas.height,elements,prompt:'',blueprintScene:s};
    });
    Studio.state.projectName=bp.title.replace(/\s+/g,'-').toLowerCase(); Studio.state.cues=global; Studio.state.scenes=scenes; $('#srtInput').value=BP.compiled.srt; Studio.selectScene(0); Studio.renderSceneList(); Studio.showTab('studio'); Studio.toast(`${scenes.length}개 장면을 Studio로 보냈습니다.`);
  }

  function crc32(bytes){let c=0xffffffff;for(const b of bytes){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;}
  function u16(n){return [n&255,(n>>>8)&255]} function u32(n){return [n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255]}
  function zipStore(files){const enc=new TextEncoder(),locals=[],centrals=[];let offset=0;for(const [name,content] of Object.entries(files)){const nb=enc.encode(name),db=enc.encode(content),crc=crc32(db);const local=new Uint8Array([0x50,0x4b,0x03,0x04,...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(db.length),...u32(db.length),...u16(nb.length),...u16(0),...nb,...db]);locals.push(local);const cen=new Uint8Array([0x50,0x4b,0x01,0x02,...u16(20),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(db.length),...u32(db.length),...u16(nb.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(offset),...nb]);centrals.push(cen);offset+=local.length;}const centralSize=centrals.reduce((a,b)=>a+b.length,0),end=new Uint8Array([0x50,0x4b,0x05,0x06,...u16(0),...u16(0),...u16(centrals.length),...u16(centrals.length),...u32(centralSize),...u32(offset),...u16(0)]);return new Blob([...locals,...centrals,end],{type:'application/zip'});}
  function downloadZip(){const bp=BP.parsed||parseEditor();if(!bp)return;compileAll();const files={'blueprint.json':JSON.stringify(bp,null,2),'story.srt':BP.compiled.srt};bp.scenes.forEach((s,i)=>{files[`scenes/${s.id}.svg`]=BP.compiled.svgs[i];files[`compositions/${s.id}.html`]=BP.compiled.htmls[i];});files['project.json']=JSON.stringify({format:'whiteboard-compiled-project/v1',source:'blueprint.json',srt:'story.srt',scenes:bp.scenes.map((s,i)=>({id:s.id,title:s.title,durationMs:s.durationMs,svg:`scenes/${s.id}.svg`,html:`compositions/${s.id}.html`}))},null,2);const blob=zipStore(files),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${(bp.title||'project').replace(/\s+/g,'-')}-compiled.zip`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}

  async function filesChanged(e){
    BP.files=[...e.target.files];BP.fileAssets=[];const info=[];
    const asDataUrl=f=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(f)});
    for(const f of BP.files){
      info.push(`${f.name} (${Math.round(f.size/1024)}KB)`);
      if(f.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(f.name)){
        try{BP.fileAssets.push({name:f.name,dataUrl:await asDataUrl(f),type:f.type||'image/*'});if(!$('#bpSourceInput').value)BP.mode='text';}catch{}
      }
      if(/\.(txt|md|srt|json|svg|html?)$/i.test(f.name)){const t=await f.text();if(/\.srt$/i.test(f.name)){BP.mode='srt';$('#bpSourceInput').value=t}else if(/\.json$/i.test(f.name)){BP.mode='json';$('#bpSourceInput').value=t}else if(/\.(html?)$/i.test(f.name)){BP.mode='markup';$('#bpSourceInput').value=t}else if(/\.svg$/i.test(f.name)){if(!$('#bpSourceInput').value)$('#bpSourceInput').value='';}else if(!$('#bpSourceInput').value){BP.mode='text';$('#bpSourceInput').value=t}}
    }
    $('#bpFileSummary').textContent=info.length?`${info.length}개 파일 · 이미지 자산 ${BP.fileAssets.length}개: ${info.slice(0,4).join(' · ')}${info.length>4?' …':''}`:'파일을 고르면 형식을 자동 판별합니다.';syncModeButtons();
  }
  function syncModeButtons(){$$('.input-mode').forEach(b=>b.classList.toggle('active',b.dataset.bpMode===BP.mode));}
  function example(){return {format:'whiteboard-blueprint/v1',title:'AI 화이트보드 제작 3단계',canvas:{width:1280,height:720},style:{paper:'#F5EBD7',ink:'#383A36',accent:'#FFA500',allowText:false},scenes:[makeScene('대본이나 문서를 넣으면 먼저 장면의 의미와 구조를 설계합니다.',6500,0,'whiteboard'),makeScene('그 설계에서 SVG와 HTML 화면을 만들고 손그림이나 다이어그램 애니메이션을 적용합니다.',7500,1,'diagram'),makeScene('마지막으로 같은 설계에서 SRT와 프로젝트 JSON, GIF, WebM, HyperFrames 결과를 만듭니다.',7000,2,'mixed')]};}

  $$('.input-mode').forEach(b=>b.onclick=()=>{BP.mode=b.dataset.bpMode;syncModeButtons();});
  $$('.bp-preset').forEach(b=>b.onclick=()=>{BP.preset=b.dataset.preset;$$('.bp-preset').forEach(x=>x.classList.toggle('active',x===b));$('#bpVisualMode').value=BP.preset;});
  $('#bpFilesInput').onchange=filesChanged;
  $('#bpLocalDesignBtn').onclick=()=>setBlueprint(localBlueprint());
  $('#bpAiDesignBtn').onclick=aiBlueprint;
  $('#bpValidateBtn').onclick=()=>{BP.parsed=parseEditor();if(BP.parsed)renderValidation();};
  $('#bpFormatBtn').onclick=()=>{const bp=parseEditor();if(bp)setBlueprint(bp);};
  $('#bpCompileBtn').onclick=()=>{BP.parsed=parseEditor();if(BP.parsed){compileAll();Studio.toast('SVG와 HTML을 다시 만들었습니다.');}};
  $('#bpPreviewScene').onchange=e=>renderPreview(+e.target.value);
  $('#bpDownloadSvgBtn').onclick=()=>{const i=+$('#bpPreviewScene').value||0;if(BP.compiled.svgs[i])download(BP.compiled.svgs[i],`${BP.parsed.scenes[i].id}.svg`,'image/svg+xml');};
  $('#bpDownloadHtmlBtn').onclick=()=>{const i=+$('#bpPreviewScene').value||0;if(BP.compiled.htmls[i])download(BP.compiled.htmls[i],`${BP.parsed.scenes[i].id}.html`,'text/html');};
  $('#bpDownloadSrtBtn').onclick=()=>{if(BP.compiled.srt)download(BP.compiled.srt,'story.srt','application/x-subrip');};
  $('#bpDownloadZipBtn').onclick=downloadZip;
  $('#bpApplyStudioBtn').onclick=applyToStudio;
  $('#bpLoadExampleBtn').onclick=()=>{setBlueprint(example());$('#bpSourceInput').value=example().scenes.map(x=>x.narration).join('\n\n');};
  ['bpInkPath','bpColorFill','bpPause','bpTransition','bpVisualMode','bpAllowText'].forEach(id=>$('#'+id)?.addEventListener('change',()=>{if(BP.parsed){const bp=parseEditor();if(bp){bp.style.allowText=$('#bpAllowText').checked;bp.scenes.forEach(s=>{if(s.visualMode==='whiteboard'){s.animation={preset:'ink-color-gaze',inkPath:$('#bpInkPath').value,colorFill:$('#bpColorFill').value,pause:$('#bpPause').value}}s.transition={type:$('#bpTransition').value,durationMs:500};});setBlueprint(bp);}}}));

  $('#bpSourceInput').value='대본이나 문서를 넣으면 먼저 AI가 장면의 의미와 구조를 설계합니다. 그 설계 데이터에서 SVG와 HTML 화면을 만들고 애니메이션을 적용합니다. 마지막으로 같은 설계에서 SRT와 프로젝트 파일, 영상 결과를 파생시킵니다.';
  setBlueprint(example());
  window.WhiteboardBlueprint={BP,localBlueprint,setBlueprint,compileAll,applyToStudio,deriveSrt};
})();
