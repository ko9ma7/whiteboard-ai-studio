(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const api = window.WhiteboardStudio;
  if (!api) return;

  const bundle = { name:'', files:new Map(), images:new Map(), manifest:null, source:'none' };
  const norm = p => String(p||'').replace(/\\/g,'/').replace(/^\.\//,'');
  const esc = s => String(s??'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':'&quot;',"'":'&#39;'}[c]));
  const dataUrl = blob => new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(blob)});
  const imageInfo = src => new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve({width:i.naturalWidth,height:i.naturalHeight});i.onerror=reject;i.src=src});

  function setSummary(text, kind='neutral'){
    const el=$('#bundleSummary'); if(!el)return; el.className='hint-box bundle-summary '+kind; el.innerHTML=text;
  }
  function setOutput(o={}){
    if(o.width)$('#outWidth').value=o.width;if(o.height)$('#outHeight').value=o.height;if(o.fps)$('#fps').value=o.fps;
    if(o.holdMs!=null)$('#holdMs').value=o.holdMs;if(o.paperColor)$('#paperColor').value=o.paperColor;if(o.burnSubtitles!=null)$('#burnSubtitles').checked=o.burnSubtitles;
    api.updateCanvasSize();
  }
  function sceneFromManifest(m, allCues, i){
    const ids=(m.cueIds||[]).map(Number);let selected=ids.length?allCues.filter(c=>ids.includes(Number(c.id))):[];
    if(!selected.length && m.cueStart!=null && m.cueEnd!=null) selected=allCues.filter(c=>c.id>=m.cueStart&&c.id<=m.cueEnd);
    if(!selected.length) selected=allCues.slice(i*2,i*2+2);
    const base=selected[0]?.startMs||0;
    const cues=selected.map(c=>({...c,startMs:c.startMs-base,endMs:c.endMs-base}));
    return {id:m.id||`scene-${String(i+1).padStart(2,'0')}`,title:m.title||cues[0]?.text?.slice(0,32)||`장면 ${i+1}`,durationMs:m.durationMs||Math.max(3000,cues.at(-1)?.endMs||5000),cues,imageData:null,imageName:'',imageWidth:m.imageWidth||1280,imageHeight:m.imageHeight||720,elements:Array.isArray(m.elements)?structuredClone(m.elements):[],prompt:m.prompt||'',bundleImagePath:norm(m.image||'')};
  }
  async function applyImageData(sceneIndex, src, name, path=''){
    const scene=api.state.scenes[sceneIndex]; if(!scene||!src)return;
    const info=await imageInfo(src);
    scene.imageData=src;scene.imageName=name||path.split('/').pop()||'image';scene.imageWidth=info.width;scene.imageHeight=info.height;scene._img=null;scene.bundleImagePath=path||scene.bundleImagePath||scene.imageName;
    if($('#autoFullElement')?.checked&&!scene.elements.length){
      const old=api.state.sceneIndex;api.selectScene(sceneIndex); // app helper creates the default element when image is applied through normal flow
      await api.setSceneImageData(src,scene.imageName); if(old>=0&&old!==sceneIndex)api.selectScene(old);
    }
  }
  function normalizedEntries(files){
    const arr=[...files];const first=arr[0]?.webkitRelativePath||'';const root=first.includes('/')?first.split('/')[0]:'';
    return arr.map(f=>{const full=norm(f.webkitRelativePath||f.name);const rel=root&&full.startsWith(root+'/')?full.slice(root.length+1):full;return [rel,f]});
  }
  function rebuildImageIndex(){bundle.images.clear();for(const [p,f] of bundle.files){if(f.type?.startsWith('image/')||/\.(png|jpe?g|webp|gif|svg)$/i.test(p))bundle.images.set(p,f)}}
  function findFile(path){path=norm(path);if(bundle.files.has(path))return bundle.files.get(path);const lower=path.toLowerCase();for(const [p,f] of bundle.files)if(p.toLowerCase()===lower||p.toLowerCase().endsWith('/'+lower))return f;return null}
  function bestImagePath(scene,i){
    if(scene.bundleImagePath&&bundle.images.has(norm(scene.bundleImagePath)))return norm(scene.bundleImagePath);
    const candidates=[scene.id,`scene-${String(i+1).padStart(2,'0')}`,String(i+1).padStart(2,'0'),String(i+1)];
    for(const c of candidates){for(const p of bundle.images.keys()){const base=p.split('/').pop().replace(/\.[^.]+$/,'').toLowerCase();if(base===c.toLowerCase()||base.startsWith(c.toLowerCase()+'-'))return p}}
    return '';
  }
  async function mapImagePath(sceneIndex,path,quiet=false){
    path=norm(path);const f=bundle.images.get(path)||findFile(path);if(!f){if(!quiet)api.toast(`이미지를 찾지 못했습니다: ${path}`);return false}
    const src=f.__dataUrl||await dataUrl(f);try{f.__dataUrl=src}catch{}
    await applyImageData(sceneIndex,src,f.name,path);return true;
  }
  async function autoMapImages(){
    if(!api.state.scenes.length)return;
    let count=0;for(let i=0;i<api.state.scenes.length;i++){const p=bestImagePath(api.state.scenes[i],i);if(p&&await mapImagePath(i,p,true))count++}
    api.selectScene(Math.max(0,api.state.sceneIndex));renderConnections();api.toast(`${count}/${api.state.scenes.length}개 장면 이미지를 연결했습니다.`);
  }
  async function buildFromManifest(manifest,srtText,scriptText=''){
    const cues=api.parseSRT(srtText);if(!cues.length)throw new Error('project.json이 가리키는 SRT에서 유효한 자막을 찾지 못했습니다.');
    api.stopPlayback();api.state.projectName=manifest.projectName||bundle.name||'folder-project';api.state.cues=cues;api.state.scenes=(manifest.scenes||[]).map((m,i)=>sceneFromManifest(m,cues,i));
    if(!api.state.scenes.length){$('#srtInput').value=srtText;api.buildScenesFromSrt(srtText)}
    $('#srtInput').value=srtText;$('#srtBuilderOutput').value=srtText;if(scriptText)$('#scriptInput').value=scriptText;setOutput(manifest.output||{});
    api.selectScene(api.state.scenes.length?0:-1);await autoMapImages();renderConnections();
  }
  async function importFolder(files){
    if(!files?.length)return;bundle.files=new Map(normalizedEntries(files));bundle.name=(files[0].webkitRelativePath||'folder').split('/')[0]||'folder';bundle.source='folder';rebuildImageIndex();
    const manifestFile=findFile('project.json')||[...bundle.files].find(([p])=>/\.whiteboard-project\.json$/i.test(p))?.[1];let manifest=null;
    if(manifestFile){try{manifest=JSON.parse(await manifestFile.text())}catch{throw new Error('project.json을 JSON으로 읽을 수 없습니다.')}}
    bundle.manifest=manifest;
    const srtPath=manifest?.srt||[...bundle.files.keys()].find(p=>/\.srt$/i.test(p));const srtFile=srtPath?findFile(srtPath):null;if(!srtFile)throw new Error('폴더 안에서 .srt 파일을 찾지 못했습니다.');
    const scriptPath=manifest?.script||[...bundle.files.keys()].find(p=>/(^|\/)(script|story|narration)\.txt$/i.test(p));const scriptFile=scriptPath?findFile(scriptPath):null;
    if(manifest?.scenes?.length)await buildFromManifest(manifest,await srtFile.text(),scriptFile?await scriptFile.text():'');
    else{$('#srtInput').value=await srtFile.text();$('#srtBuilderOutput').value=$('#srtInput').value;if(scriptFile)$('#scriptInput').value=await scriptFile.text();api.buildScenesFromSrt($('#srtInput').value);await autoMapImages()}
    setSummary(`<b>${esc(bundle.name)}</b> · SRT 1개 · 이미지 ${bundle.images.size}개 · 장면 ${api.state.scenes.length}개`, 'ok');renderConnections();
  }
  async function loadSample(){
    const base='./sample-project/';setSummary('3장면 예제 폴더 불러오는 중…');
    const manifest=await fetch(base+'project.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('예제 project.json을 불러오지 못했습니다.');return r.json()});
    const srt=await fetch(base+manifest.srt,{cache:'no-store'}).then(r=>r.text());const script=manifest.script?await fetch(base+manifest.script,{cache:'no-store'}).then(r=>r.text()):'';
    bundle.name='sample-project';bundle.source='sample';bundle.manifest=manifest;bundle.files.clear();bundle.images.clear();
    for(const sc of manifest.scenes){const path=norm(sc.image);const blob=await fetch(base+path,{cache:'no-store'}).then(r=>r.blob());const file=new File([blob],path.split('/').pop(),{type:blob.type||'image/svg+xml'});bundle.files.set(path,file);bundle.images.set(path,file)}
    await buildFromManifest(manifest,srt,script);setSummary(`<b>sample-project</b> · story.srt ↔ 3개 장면 ↔ 3개 이미지가 project.json 한 곳에서 연결됨`,'ok');
    const preview=$('#sampleManifestPreview');if(preview)preview.textContent=JSON.stringify(manifest,null,2);api.toast('3장면 예제 폴더를 열었습니다. 장면 1·2·3이 모두 연결되어 있습니다.');
  }
  function renderConnections(){
    const scenes=api.state.scenes||[], imagePaths=[...bundle.images.keys()];const map=$('#bundleMappingList'),strip=$('#sceneLinkStrip');
    if(map){map.innerHTML=scenes.length?scenes.map((s,i)=>{const ids=s.cues.map(c=>c.id).join(', '),excerpt=s.cues.map(c=>c.text).join(' ').slice(0,70);const opts=['<option value="">— 연결 이미지 선택 —</option>',...imagePaths.map(p=>`<option value="${esc(p)}" ${norm(s.bundleImagePath)===p?'selected':''}>${esc(p)}</option>`)].join('');return `<article class="mapping-row ${i===api.state.sceneIndex?'active':''}" data-scene-index="${i}"><div class="mapping-num">${String(i+1).padStart(2,'0')}</div><div class="mapping-body"><b>${esc(s.title)}</b><small>SRT #${esc(ids||'-')} · ${esc(excerpt||'자막 없음')}</small><div class="mapping-controls"><select class="scene-image-select" data-index="${i}" aria-label="장면 ${i+1} 연결 이미지">${opts}</select><label class="mini-file">직접 선택<input class="scene-manual-image" data-index="${i}" type="file" accept="image/*" hidden></label></div></div><button class="mapping-view icon-btn" data-index="${i}" title="장면 보기">▶</button></article>`}).join(''):'<div class="empty-state">SRT 또는 프로젝트 폴더를 불러오면 장면 ↔ 이미지 연결표가 표시됩니다.</div>'}
    if(strip){strip.innerHTML=scenes.length?scenes.map((s,i)=>`<button class="scene-link-chip ${i===api.state.sceneIndex?'active':''}" data-index="${i}"><b>${i+1}</b><span>${esc(s.title)}</span><em>${s.imageData?'이미지 연결 ✓':'이미지 없음'}</em></button>`).join(''):'<span class="scene-strip-empty">장면을 만들면 1 · 2 · 3 연결 상태가 여기에 표시됩니다.</span>'}
  }
  document.addEventListener('change',async e=>{
    if(e.target.id==='projectFolderInput'){try{await importFolder(e.target.files)}catch(err){setSummary(esc(err.message),'bad');api.toast(err.message)}}
    if(e.target.matches('.scene-image-select')){const i=+e.target.dataset.index,p=e.target.value;if(p){await mapImagePath(i,p);api.selectScene(i);renderConnections()}}
    if(e.target.matches('.scene-manual-image')){const i=+e.target.dataset.index,f=e.target.files[0];if(f){const src=await dataUrl(f);await applyImageData(i,src,f.name,f.name);api.selectScene(i);renderConnections()}}
  });
  document.addEventListener('click',e=>{const view=e.target.closest('.mapping-view,.scene-link-chip');if(view){api.selectScene(+view.dataset.index);renderConnections()}});
  $('#autoMapImagesBtn')?.addEventListener('click',autoMapImages);$('#loadSampleFolderBtn')?.addEventListener('click',loadSample);
  $('#clearBundleBtn')?.addEventListener('click',()=>{bundle.files.clear();bundle.images.clear();bundle.manifest=null;bundle.source='none';setSummary('폴더 연결을 지웠습니다. 현재 편집 중인 장면 데이터는 유지됩니다.');renderConnections()});
  const observer=new MutationObserver(()=>renderConnections());if($('#sceneList'))observer.observe($('#sceneList'),{childList:true,subtree:true});
  fetch('./sample-project/project.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(p=>{if(p&&$('#sampleManifestPreview'))$('#sampleManifestPreview').textContent=JSON.stringify(p,null,2)}).catch(()=>{});
  window.WhiteboardProjectBundle={bundle,loadSample,importFolder,autoMapImages,renderConnections};
  renderConnections();
})();
