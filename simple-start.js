(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const Studio = window.WhiteboardStudio;
  const BP = () => window.WhiteboardBlueprint;
  const externalUrls = {
    chatgpt:'https://chatgpt.com/',
    gemini:'https://gemini.google.com/',
    claude:'https://claude.ai/',
    grok:'https://grok.com/'
  };

  let mode = null;
  let assetFiles = [];

  function setSimpleMode(on=true){
    document.body.classList.toggle('simple-mode', on);
    $('#simpleStart').classList.toggle('hidden', !on);
    $('.tabs')?.classList.toggle('simple-hidden', on);
    $('#mainContent')?.classList.toggle('simple-hidden', on);
  }
  function showChooser(){
    mode=null;
    $('#simpleChooser').classList.remove('hidden');
    $('#simpleFlow').classList.add('hidden');
    $('#simpleResult').classList.add('hidden');
  }
  function choose(m){
    mode=m;
    $('#simpleChooser').classList.add('hidden');
    $('#simpleFlow').classList.remove('hidden');
    $('#simpleResult').classList.add('hidden');
    $$('.simple-panel').forEach(x=>x.classList.add('hidden'));
    const map={
      describe:['설명만으로 만들기','원하는 장면을 설명하면 자동으로 장면 설계를 만들거나 외부 AI용 지시서를 준비합니다.','#simpleDescribePanel'],
      srt:['대본 · SRT로 만들기','대본이나 기존 SRT만 넣으면 장면을 자동 구성합니다.','#simpleSrtPanel'],
      assets:['이미지 · SVG · HTML로 만들기','이미 만들어 둔 자료를 순서대로 가져와 장면으로 사용합니다.','#simpleAssetsPanel'],
      project:['기존 프로젝트 열기','기존 폴더나 JSON을 그대로 열어 이어서 작업합니다.','#simpleProjectPanel']
    };
    const [t,st,panel]=map[m]; $('#simpleFlowTitle').textContent=t; $('#simpleFlowSubtitle').textContent=st; $(panel).classList.remove('hidden');
  }
  function openAdvanced(tab='blueprint'){
    setSimpleMode(false);
    Studio?.showTab?.(tab);
  }
  function makeExternalPrompt(){
    const source=$('#simpleDescription').value.trim();
    if(!source){Studio.toast('원하는 장면을 먼저 설명하세요.');return ''}
    const visual=$('#simpleVisualStyle').value;
    const sec=+$('#simpleSceneLength').value || 8;
    const prompt=`You are designing a deterministic animated scene for a browser-based whiteboard/video studio.\n\nUSER INTENT\n${source}\n\nGOAL\nCreate a reusable scene Blueprint. The studio will compile this Blueprint into SVG, HTML, captions, and animation. Do not return prose explanations. Return ONE valid JSON object only.\n\nREQUIRED JSON SCHEMA\n{\n  "format": "whiteboard-blueprint/v1",\n  "title": "project title",\n  "canvas": {"width":1280,"height":720},\n  "style": {"paper":"#F5EBD7","ink":"#383A36","accent":"#FFA500","allowText":false},\n  "scenes": [\n    {\n      "id":"scene-01",\n      "title":"short scene title",\n      "narration":"spoken narration for this scene",\n      "durationMs": ${sec*1000},\n      "visualMode":"${visual}",\n      "layout":"clear left-to-right or center-out composition",\n      "animation": {\n        "preset":"ink-color-gaze",\n        "inkPath":"skeleton",\n        "colorFill":"contour-wipe",\n        "pause":"auto"\n      },\n      "transition":{"type":"fade","durationMs":450},\n      "objects":[\n        {"id":"object-1","type":"box|circle|arrow|illustration|text","x":100,"y":120,"w":300,"h":220,"text":"","drawOrder":1}\n      ]\n    }\n  ]\n}\n\nRULES\n- All object coordinates must fit inside 1280×720.\n- Create enough separate objects so major semantic parts can animate independently.\n- Prefer 1–6 objects per scene; avoid decorative clutter.\n- Keep important content inside ~70px safe margins.\n- For whiteboard scenes use visualMode="whiteboard", preset="ink-color-gaze", inkPath="skeleton" where practical.\n- Narration is the source for derived SRT.\n- If the request needs multiple moments, split it into multiple scenes rather than overloading one scene.\n- Return JSON only. No Markdown fences. No commentary.`;
    $('#simpleAiPrompt').value=prompt;
    return prompt;
  }
  function showResult(){
    $('#simpleFlow').classList.add('hidden');
    $('#simpleChooser').classList.add('hidden');
    $('#simpleResult').classList.remove('hidden');
    const bp=BP()?.BP?.parsed;
    const scenes=bp?.scenes || Studio?.state?.scenes || [];
    $('#simpleResultMeta').textContent=scenes.length ? `${scenes.length}개 장면 · 다음 단계는 미리보고 필요한 부분만 수정하면 됩니다.` : '프로젝트를 불러왔습니다.';
    const host=$('#simpleSceneCards'); host.innerHTML='';
    scenes.slice(0,12).forEach((s,i)=>{
      const card=document.createElement('button'); card.className='simple-scene-card';
      const svg=BP()?.BP?.compiled?.svgs?.[i];
      card.innerHTML=`<span class="simple-scene-num">${String(i+1).padStart(2,'0')}</span><div class="simple-scene-thumb">${svg||'<span>장면</span>'}</div><b>${escapeHtml(s.title||s.id||`장면 ${i+1}`)}</b><small>${escapeHtml(s.narration||s.cues?.map(c=>c.text).join(' ')||'')}</small>`;
      card.onclick=()=>{ if(Studio?.state?.scenes?.length){Studio.selectScene(Math.min(i,Studio.state.scenes.length-1)); openAdvanced('studio');} else openAdvanced('blueprint'); };
      host.appendChild(card);
    });
  }
  function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function localBuildFrom(source, bpMode='text'){
    $('#bpSourceInput').value=source;
    $$('.input-mode').forEach(b=>b.classList.toggle('active',b.dataset.bpMode===bpMode));
    BP().BP.mode=bpMode;
    $('#bpVisualMode').value=$('#simpleVisualStyle')?.value || 'whiteboard';
    $('#bpSceneLength').value=$('#simpleSceneLength')?.value || '8';
    const data=BP().localBlueprint();
    BP().setBlueprint(data);
    BP().compileAll();
    showResult();
  }
  function isSrt(t){return /\d{2}:\d{2}:\d{2}[,.]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,.]\d{3}/.test(t)}

  $$('.simple-method').forEach(b=>b.onclick=()=>choose(b.dataset.simpleMode));
  $('#simpleBackBtn').onclick=showChooser;
  $('#simpleStartOverBtn').onclick=showChooser;
  $('#simpleOpenAdvancedBtn').onclick=()=>openAdvanced('blueprint');
  $('#simpleAdvancedResultBtn').onclick=()=>openAdvanced('blueprint');
  $('#simpleEditBtn').onclick=()=>{ if(BP()?.BP?.parsed){BP().applyToStudio(); setSimpleMode(false);} else openAdvanced('studio'); };
  $('#simpleExportBtn').onclick=()=>{ if(BP()?.BP?.parsed){BP().applyToStudio(); setSimpleMode(false); setTimeout(()=>$('#openExportDialogBtn')?.click(),150);} else {openAdvanced('studio');setTimeout(()=>$('#openExportDialogBtn')?.click(),150);} };
  $('#simpleLoadExampleBtn').onclick=()=>{ $('#bpLoadExampleBtn')?.click(); BP().compileAll(); showResult(); };

  $('#simpleAutoBuildBtn').onclick=()=>localBuildFrom($('#simpleDescription').value.trim(),'text');
  $('#simpleExternalAiBtn').onclick=()=>{ const box=$('#simpleExternalAiBox'); box.classList.toggle('hidden'); if(!box.classList.contains('hidden')) makeExternalPrompt(); };
  $('#simpleVisualStyle').onchange=()=>{ if(!$('#simpleExternalAiBox').classList.contains('hidden'))makeExternalPrompt(); };
  $('#simpleSceneLength').onchange=()=>{ if(!$('#simpleExternalAiBox').classList.contains('hidden'))makeExternalPrompt(); };
  $('#simpleCopyAiPromptBtn').onclick=async()=>{const p=makeExternalPrompt();if(!p)return;await navigator.clipboard.writeText(p);Studio.toast('AI용 제작 지시서를 복사했습니다.');};
  $('#simpleOpenAiSiteBtn').onclick=()=>{const p=makeExternalPrompt();if(p)navigator.clipboard.writeText(p).catch(()=>{});window.open(externalUrls[$('#simpleAiProvider').value]||externalUrls.chatgpt,'_blank','noopener');};
  $('#simpleApplyAiResultBtn').onclick=()=>{
    const raw=$('#simpleAiResult').value.trim(); if(!raw){Studio.toast('AI 결과를 붙여넣으세요.');return}
    const cleaned=raw.replace(/^```(?:json|html|svg)?\s*/i,'').replace(/```$/,'').trim();
    try{const obj=JSON.parse(cleaned);BP().setBlueprint(obj);BP().compileAll();showResult();return}catch{}
    if(/^<svg[\s>]/i.test(cleaned)||/^<!doctype html|^<html[\s>]/i.test(cleaned)){localBuildFrom(cleaned,'markup');return}
    Studio.toast('Blueprint JSON, SVG 또는 HTML 형식을 확인하세요.');
  };

  $('#simpleSrtFile').onchange=async e=>{const f=e.target.files[0];if(f)$('#simpleSrtInput').value=await f.text();};
  $('#simpleSrtBuildBtn').onclick=()=>{const t=$('#simpleSrtInput').value.trim();if(!t){Studio.toast('대본 또는 SRT를 넣으세요.');return}localBuildFrom(t,isSrt(t)?'srt':'text');};

  $('#simpleAssetsFiles').onchange=async e=>{
    assetFiles=[...e.target.files];
    $('#simpleAssetsSummary').textContent=assetFiles.length?`${assetFiles.length}개 파일 선택: ${assetFiles.slice(0,5).map(f=>f.name).join(' · ')}${assetFiles.length>5?' …':''}`:'선택한 자료를 장면 순서대로 자동 배치합니다.';
  };
  $('#simpleAssetsBuildBtn').onclick=async()=>{
    const markup=$('#simpleMarkupInput').value.trim();
    if(markup){localBuildFrom(markup,'markup');return}
    if(!assetFiles.length){Studio.toast('이미지, SVG 또는 HTML을 선택하세요.');return}
    const dt=new DataTransfer(); assetFiles.forEach(f=>dt.items.add(f));
    const input=$('#bpFilesInput'); input.files=dt.files; input.dispatchEvent(new Event('change',{bubbles:true}));
    setTimeout(()=>{const data=BP().localBlueprint();BP().setBlueprint(data);BP().compileAll();showResult();},120);
  };

  $('#simpleProjectFolder').onchange=e=>{const target=$('#projectFolderInput');const dt=new DataTransfer();[...e.target.files].forEach(f=>dt.items.add(f));target.files=dt.files;target.dispatchEvent(new Event('change',{bubbles:true}));setTimeout(()=>{setSimpleMode(false);Studio.showTab('studio');},250);};
  $('#simpleProjectJson').onchange=e=>{const f=e.target.files[0];if(!f)return;const dt=new DataTransfer();dt.items.add(f);const target=$('#projectFile');target.files=dt.files;target.dispatchEvent(new Event('change',{bubbles:true}));setTimeout(()=>{setSimpleMode(false);Studio.showTab('studio');},250);};

  // Default experience: only the simple chooser is visible.
  setSimpleMode(true); showChooser();
})();
