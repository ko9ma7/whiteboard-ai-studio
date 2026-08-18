(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const api = window.WhiteboardStudio;
  if (!api) return;
  const DB_NAME='whiteboard-ai-motion-studio';
  const STORE='autosave';
  let dbPromise=null, saveTimer=null, lastFingerprint='';

  function announce(message){ api.toast(message); }
  function openDb(){
    if(!('indexedDB' in window)) return Promise.reject(new Error('IndexedDB 미지원'));
    if(dbPromise) return dbPromise;
    dbPromise=new Promise((resolve,reject)=>{
      const r=indexedDB.open(DB_NAME,1);
      r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE)};
      r.onsuccess=()=>resolve(r.result); r.onerror=()=>reject(r.error);
    });
    return dbPromise;
  }
  async function idbSet(key,value){const db=await openDb();return new Promise((res,rej)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(value,key);tx.oncomplete=res;tx.onerror=()=>rej(tx.error)})}
  async function idbGet(key){const db=await openDb();return new Promise((res,rej)=>{const tx=db.transaction(STORE,'readonly');const r=tx.objectStore(STORE).get(key);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
  async function idbDelete(key){const db=await openDb();return new Promise((res,rej)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(key);tx.oncomplete=res;tx.onerror=()=>rej(tx.error)})}
  function fingerprint(project){return JSON.stringify({name:project.projectName,builder:project.builder,cues:project.cues,scenes:project.scenes.map(s=>({id:s.id,title:s.title,durationMs:s.durationMs,prompt:s.prompt,imageName:s.imageName,elements:s.elements})),output:project.output}).slice(0,500000)}
  function setAutosaveStatus(text,kind='neutral'){const e=$('#autosaveStatus');if(!e)return;e.textContent=text;e.className='status-dot '+kind}
  async function saveAutosave(force=false){
    try{const project=api.safeProject(), fp=fingerprint(project);if(!force&&fp===lastFingerprint)return;setAutosaveStatus('저장 중…','neutral');await idbSet('project',{savedAt:Date.now(),project});lastFingerprint=fp;setAutosaveStatus('자동저장 완료','on')}
    catch{setAutosaveStatus('자동저장 실패','off')}
  }
  function scheduleAutosave(){clearTimeout(saveTimer);saveTimer=setTimeout(()=>saveAutosave(),650)}

  function setProject(p,{message='프로젝트를 불러왔습니다.'}={}){
    api.stopPlayback();
    api.state.projectName=p.projectName||'whiteboard-ai-project';api.state.cues=p.cues||[];api.state.scenes=p.scenes||[];
    const o=p.output||{};
    if(o.width)$('#outWidth').value=o.width;if(o.height)$('#outHeight').value=o.height;if(o.fps)$('#fps').value=o.fps;if(o.holdMs!=null)$('#holdMs').value=o.holdMs;if(o.paperColor)$('#paperColor').value=o.paperColor;if(o.burnSubtitles!=null)$('#burnSubtitles').checked=o.burnSubtitles;
    if(p.builder?.script)$('#scriptInput').value=p.builder.script;if(p.builder?.srt)$('#srtBuilderOutput').value=p.builder.srt;
    api.selectScene(api.state.scenes.length?0:-1);updateProjectJson();scheduleAutosave();announce(message);
  }
  async function loadDemo(){
    try{
      setAutosaveStatus('예제 로드 중…');
      if(window.WhiteboardProjectBundle?.loadSample){await window.WhiteboardProjectBundle.loadSample();updateProjectJson();scheduleAutosave();return}
      throw new Error('예제 폴더 로더를 찾지 못했습니다.');
    }catch(e){announce(e.message)}
  }
  function newProject(){
    if(api.state.scenes.length&&!confirm('현재 프로젝트를 비우고 새 프로젝트를 시작할까요? 자동저장 데이터도 새 상태로 갱신됩니다.'))return;
    api.state.projectName='whiteboard-ai-project';api.state.cues=[];api.state.scenes=[];api.state.sceneIndex=-1;api.state.elementIndex=-1;api.state.timeMs=0;
    $('#srtInput').value='';$('#srtBuilderOutput').value='';$('#scriptInput').value='';$('#scenePromptOutput').value='';
    api.selectScene(-1);updateProjectJson();saveAutosave(true);announce('새 프로젝트를 시작했습니다.')
  }
  async function restoreAutosave(){const saved=await idbGet('project').catch(()=>null);if(saved?.project)setProject(saved.project,{message:`자동저장을 복원했습니다. (${new Date(saved.savedAt).toLocaleString()})`});return saved}

  function applyTheme(value){
    const resolved=value==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):value;
    document.documentElement.dataset.theme=resolved;localStorage.setItem('wai-theme',value);$('#themeSelect').value=value;
    const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=resolved==='dark'?'#302f2a':'#f5ebd7';
  }
  const savedTheme=localStorage.getItem('wai-theme')||'system';applyTheme(savedTheme);$('#themeSelect').addEventListener('change',e=>applyTheme(e.target.value));matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',()=>{if($('#themeSelect').value==='system')applyTheme('system')});

  function updateProjectJson(){const el=$('#currentProjectJson');if(!el)return;try{el.textContent=JSON.stringify(api.safeProject(),null,2)}catch(e){el.textContent='프로젝트 JSON을 표시할 수 없습니다: '+e.message}}
  function copyText(text){navigator.clipboard?.writeText(text).then(()=>announce('클립보드에 복사했습니다.')).catch(()=>announce('클립보드 복사에 실패했습니다.'))}

  async function refreshModels(provider){
    const box=$(`#models-${provider}`);if(box){box.textContent='사용 가능한 모델 조회 중…';box.classList.add('loading-shimmer')}
    try{
      const d=await api.gatewayFetch(`/v1/models?provider=${encodeURIComponent(provider)}`);
      const models=d.models||[];
      if(box){box.classList.remove('loading-shimmer');box.textContent=models.length?`사용 가능: ${models.slice(0,8).join(' · ')}${models.length>8?' …':''}`:'모델 목록이 비어 있습니다.'}
      if(models.length){
        const preferredText=api.defaults.models?.[provider]?.text;
        const preferredImage=api.defaults.models?.[provider]?.image;
        const text=(preferredText&&models.includes(preferredText)?preferredText:null)||models.find(x=>!/(image|imagen|imagine|tts|transcribe|audio|embedding|video|moderation)/i.test(x));
        const image=(preferredImage&&models.includes(preferredImage)?preferredImage:null)||models.find(x=>/(image|imagen|imagine)/i.test(x));
        if(text&&$(`#model-${provider}-text`))$(`#model-${provider}-text`).value=text;
        if(image&&$(`#model-${provider}-image`)&&!$(`#model-${provider}-image`).disabled)$(`#model-${provider}-image`).value=image;
        api.saveSettings();
      }
    }catch(e){if(box){box.classList.remove('loading-shimmer');box.textContent='조회 실패: '+e.message}announce(e.message)}
  }
  $$('.refresh-models').forEach(b=>b.addEventListener('click',()=>refreshModels(b.dataset.provider)));

  $('#loadDemoBtn')?.addEventListener('click',loadDemo);$('#loadDemoFromExamplesBtn')?.addEventListener('click',loadDemo);$('#newProjectBtn')?.addEventListener('click',newProject);
  $('#refreshProjectJsonBtn')?.addEventListener('click',updateProjectJson);$('#copyCurrentProjectJsonBtn')?.addEventListener('click',()=>copyText($('#currentProjectJson').textContent));

  // Autosave after user operations and programmatic workflows, without blocking the editor.
  document.addEventListener('input',()=>scheduleAutosave(),{passive:true});document.addEventListener('change',()=>scheduleAutosave(),{passive:true});document.addEventListener('click',()=>setTimeout(()=>{updateProjectJson();scheduleAutosave()},80),{passive:true});
  window.addEventListener('beforeunload',()=>saveAutosave(true));document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')saveAutosave(true)});
  setInterval(()=>saveAutosave(),10000);

  // Keyboard shortcuts: play, save JSON, tabs.
  document.addEventListener('keydown',e=>{
    const tag=document.activeElement?.tagName;if(['INPUT','TEXTAREA','SELECT'].includes(tag))return;
    if(e.code==='Space'){e.preventDefault();$('#playBtn')?.click()}
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();$('#exportProjectBtn')?.click()}
    if((e.ctrlKey||e.metaKey)&&e.key==='1')api.showTab('studio');if((e.ctrlKey||e.metaKey)&&e.key==='2')api.showTab('srt');if((e.ctrlKey||e.metaKey)&&e.key==='3')api.showTab('prompt');
  });

  // Drag image directly onto canvas workspace.
  const stageWrap=document.querySelector('.stage-wrap');
  stageWrap?.addEventListener('dragover',e=>{e.preventDefault();stageWrap.classList.add('drag-active')});stageWrap?.addEventListener('dragleave',()=>stageWrap.classList.remove('drag-active'));stageWrap?.addEventListener('drop',async e=>{e.preventDefault();stageWrap.classList.remove('drag-active');const f=[...e.dataTransfer.files].find(x=>x.type.startsWith('image/'));if(f){await api.loadImageFile(f);scheduleAutosave()}});

  // Onboarding: demo behind the dialog on first visit, restore option when autosave exists.
  (async()=>{
    const saved=await idbGet('project').catch(()=>null);const dialog=$('#onboardingDialog');
    if(saved?.project)$('#dialogRestoreBtn')?.classList.remove('hidden');
    if(!saved?.project)await loadDemo();else setAutosaveStatus('복원 가능','neutral');
    if(dialog&&!localStorage.getItem('wai-onboarding-dismissed')&&!document.body.classList.contains('simple-mode'))dialog.showModal();
    $('#dialogDemoBtn')?.addEventListener('click',async()=>{await loadDemo();dialog?.close()});
    $('#dialogNewBtn')?.addEventListener('click',()=>{api.state.scenes=[];api.state.cues=[];api.selectScene(-1);$('#scriptInput').value='';$('#srtInput').value='';$('#srtBuilderOutput').value='';dialog?.close();saveAutosave(true)});
    $('#dialogRestoreBtn')?.addEventListener('click',async()=>{await restoreAutosave();dialog?.close()});
    dialog?.addEventListener('close',()=>{if($('#dontShowOnboarding')?.checked)localStorage.setItem('wai-onboarding-dismissed','1')});
    updateProjectJson();
  })();
})();
