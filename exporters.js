(() => {
  'use strict';
  const $=s=>document.querySelector(s), api=window.WhiteboardStudio;if(!api)return;
  const stage=$('#stage');
  const xml=s=>String(s??'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':'&quot;',"'":"&apos;"}[c]));
  const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  function status(label,pct=0,detail=''){$('#exportStatus')?.classList.remove('hidden');if($('#exportStatusText'))$('#exportStatusText').textContent=label;if($('#exportStatusDetail'))$('#exportStatusDetail').textContent=detail||`${Math.round(pct)}%`;if($('#exportProgress'))$('#exportProgress').value=clamp(pct,0,100)}
  function done(label='저장 완료'){status(label,100,'100%');setTimeout(()=>$('#exportStatus')?.classList.add('hidden'),1400)}
  function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},400)}
  function durationOf(s){return (s?.durationMs||0)+ +($('#holdMs')?.value||0)}
  function transform(s,W,H){const iw=s.imageWidth||W,ih=s.imageHeight||H,scale=Math.min(W/iw,H/ih);return{scale,x:(W-iw*scale)/2,y:(H-ih*scale)/2,w:iw*scale,h:ih*scale}}
  function zeroGeometry(r,d){if(d==='right_to_left')return{x:r.x+r.w,y:r.y,w:0,h:r.h};if(d==='top_to_bottom')return{x:r.x,y:r.y,w:r.w,h:0};if(d==='bottom_to_top')return{x:r.x,y:r.y+r.h,w:r.w,h:0};if(d==='center_out')return{x:r.x+r.w/2,y:r.y+r.h/2,w:0,h:0};return{x:r.x,y:r.y,w:0,h:r.h}}
  function subtitleSvg(s,offset,W,H){if(!$('#burnSubtitles')?.checked)return'';const fs=Math.max(18,Math.round(H*.032)),y=H-Math.round(H*.06);return (s.cues||[]).map((c,i)=>{const begin=(offset+c.startMs/1000).toFixed(3),dur=((c.endMs-c.startMs)/1000).toFixed(3),text=xml(c.text.length>70?c.text.slice(0,67)+'…':c.text);return `<g opacity="0"><set attributeName="opacity" to="1" begin="${begin}s" dur="${dur}s"/><rect x="${W*.08}" y="${y-fs*1.5}" width="${W*.84}" height="${fs*2.2}" rx="8" fill="#111" opacity=".72"/><text x="${W/2}" y="${y}" fill="#fff" font-family="system-ui,sans-serif" font-size="${fs}" font-weight="600" text-anchor="middle">${text}</text></g>`}).join('')}
  function makeAnimatedSvg(all=false){
    const scenes=all?api.state.scenes:[api.state.scenes[api.state.sceneIndex]].filter(Boolean);if(!scenes.length||!scenes.some(s=>s.imageData))throw new Error('이미지가 연결된 장면이 필요합니다.');
    const W=+$('#outWidth').value||1280,H=+$('#outHeight').value||720;let offset=0,defs=[],groups=[];
    scenes.forEach((s,si)=>{const tr=transform(s,W,H),sceneDur=durationOf(s)/1000,globalSceneStart=offset,sceneId=`svg-scene-${si}`;let parts=[];
      if(!(s.elements||[]).length){parts.push(`<image href="${xml(s.imageData)}" x="${tr.x}" y="${tr.y}" width="${tr.w}" height="${tr.h}"/>`)}
      else (s.elements||[]).forEach((e,ei)=>{const rr={x:tr.x+e.region.x*tr.scale,y:tr.y+e.region.y*tr.scale,w:e.region.width*tr.scale,h:e.region.height*tr.scale},z=zeroGeometry(rr,e.reveal.direction),clipId=`clip-${si}-${ei}`,begin=(globalSceneStart+e.reveal.startMs/1000).toFixed(3),dur=(e.reveal.durationMs/1000).toFixed(3);let anim='';
        if(e.reveal.direction==='right_to_left')anim=`<animate attributeName="x" from="${z.x}" to="${rr.x}" begin="${begin}s" dur="${dur}s" fill="freeze"/><animate attributeName="width" from="0" to="${rr.w}" begin="${begin}s" dur="${dur}s" fill="freeze"/>`;
        else if(e.reveal.direction==='top_to_bottom')anim=`<animate attributeName="height" from="0" to="${rr.h}" begin="${begin}s" dur="${dur}s" fill="freeze"/>`;
        else if(e.reveal.direction==='bottom_to_top')anim=`<animate attributeName="y" from="${z.y}" to="${rr.y}" begin="${begin}s" dur="${dur}s" fill="freeze"/><animate attributeName="height" from="0" to="${rr.h}" begin="${begin}s" dur="${dur}s" fill="freeze"/>`;
        else if(e.reveal.direction==='center_out')anim=`<animate attributeName="x" from="${z.x}" to="${rr.x}" begin="${begin}s" dur="${dur}s" fill="freeze"/><animate attributeName="y" from="${z.y}" to="${rr.y}" begin="${begin}s" dur="${dur}s" fill="freeze"/><animate attributeName="width" from="0" to="${rr.w}" begin="${begin}s" dur="${dur}s" fill="freeze"/><animate attributeName="height" from="0" to="${rr.h}" begin="${begin}s" dur="${dur}s" fill="freeze"/>`;
        else anim=`<animate attributeName="width" from="0" to="${rr.w}" begin="${begin}s" dur="${dur}s" fill="freeze"/>`;
        defs.push(`<clipPath id="${clipId}"><rect x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}">${anim}</rect></clipPath>`);parts.push(`<image href="${xml(s.imageData)}" x="${tr.x}" y="${tr.y}" width="${tr.w}" height="${tr.h}" clip-path="url(#${clipId})"/>`)});
      const visibility=all?` opacity="0"><set attributeName="opacity" to="1" begin="${globalSceneStart.toFixed(3)}s" dur="${sceneDur.toFixed(3)}s"/>`:'>';
      groups.push(`<g id="${sceneId}"${visibility}<rect width="${W}" height="${H}" fill="${xml($('#paperColor').value||'#f5ebd7')}"/>${parts.join('')}${subtitleSvg(s,globalSceneStart,W,H)}</g>`);offset+=sceneDur;
    });
    const total=offset.toFixed(3);return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" data-duration="${total}">\n<title>${xml(api.state.projectName)} animated whiteboard</title><desc>Animated SVG exported from Whiteboard AI Motion Studio. Duration ${total}s.</desc><defs>${defs.join('')}</defs>${groups.join('')}\n</svg>`;
  }

  // Compact dependency-free GIF89a encoder using a fixed 3-3-2 (256 color) palette.
  function palette332(){const p=new Uint8Array(256*3);for(let i=0;i<256;i++){p[i*3]=Math.round(((i>>5)&7)*255/7);p[i*3+1]=Math.round(((i>>2)&7)*255/7);p[i*3+2]=Math.round((i&3)*255/3)}return p}
  function rgbaTo332(data){const out=new Uint8Array(data.length/4);for(let i=0,j=0;i<data.length;i+=4,j++){out[j]=((data[i]>>5)<<5)|((data[i+1]>>5)<<2)|(data[i+2]>>6)}return out}
  function lzw(indices){const clear=256,eoi=257,bytes=[];let cur=0,bits=0,codeSize=9,next=258,dict=new Map();const write=code=>{cur|=code<<bits;bits+=codeSize;while(bits>=8){bytes.push(cur&255);cur>>>=8;bits-=8}};const reset=()=>{dict=new Map();codeSize=9;next=258};write(clear);if(!indices.length){write(eoi);if(bits)bytes.push(cur&255);return new Uint8Array(bytes)}let prefix=indices[0];for(let i=1;i<indices.length;i++){const k=indices[i],key=prefix*256+k,found=dict.get(key);if(found!==undefined){prefix=found;continue}write(prefix);if(next<4096){dict.set(key,next++);if(next===(1<<codeSize)&&codeSize<12)codeSize++}else{write(clear);reset()}prefix=k}write(prefix);write(eoi);if(bits>0)bytes.push(cur&255);return new Uint8Array(bytes)}
  function push16(a,n){a.push(n&255,(n>>8)&255)}function subBlocks(a,data){for(let i=0;i<data.length;i+=255){const n=Math.min(255,data.length-i);a.push(n);for(let j=0;j<n;j++)a.push(data[i+j])}a.push(0)}
  function makeGif(frames,W,H,delayCs){const out=[];for(const c of 'GIF89a')out.push(c.charCodeAt(0));push16(out,W);push16(out,H);out.push(0xF7,0,0);out.push(...palette332());out.push(0x21,0xFF,0x0B,...[...'NETSCAPE2.0'].map(c=>c.charCodeAt(0)),0x03,0x01,0,0,0);for(const frame of frames){out.push(0x21,0xF9,0x04,0x00);push16(out,delayCs);out.push(0,0);out.push(0x2C);push16(out,0);push16(out,0);push16(out,W);push16(out,H);out.push(0,8);subBlocks(out,lzw(frame))}out.push(0x3B);return new Blob([new Uint8Array(out)],{type:'image/gif'})}
  async function exportGif(all=false){
    const scenes=all?api.state.scenes:[api.state.scenes[api.state.sceneIndex]].filter(Boolean);if(!scenes.length||!scenes.some(s=>s.imageData))throw new Error('이미지가 연결된 장면이 필요합니다.');api.stopPlayback();
    const oldIndex=api.state.sceneIndex,oldTime=api.state.timeMs;const fps=clamp(+$('#gifFps').value||10,4,20),maxW=clamp(+$('#gifMaxWidth').value||720,320,1280),srcW=stage.width,srcH=stage.height,scale=Math.min(1,maxW/srcW),W=Math.max(2,Math.round(srcW*scale/2)*2),H=Math.max(2,Math.round(srcH*scale/2)*2),off=document.createElement('canvas');off.width=W;off.height=H;const oc=off.getContext('2d',{willReadFrequently:true}),step=1000/fps,totalMs=scenes.reduce((a,s)=>a+durationOf(s),0),maxFrames=700,planned=Math.ceil(totalMs/step);if(planned>maxFrames)throw new Error(`GIF가 ${planned}프레임으로 너무 큽니다. GIF FPS를 낮추거나 장면을 나눠 저장하세요. (최대 ${maxFrames}프레임)`);
    const frames=[];let doneMs=0;status(all?'전체 GIF 렌더링':'장면 GIF 렌더링',0,`${W}×${H} · ${fps}fps`);
    for(const s of scenes){const idx=api.state.scenes.indexOf(s);api.selectScene(idx);const dur=durationOf(s);for(let t=0;t<dur;t+=step){api.state.timeMs=t;await api.draw();oc.drawImage(stage,0,0,W,H);frames.push(rgbaTo332(oc.getImageData(0,0,W,H).data));const pct=(doneMs+t)/totalMs*100;if(frames.length%3===0){status(all?'전체 GIF 렌더링':'장면 GIF 렌더링',pct,`${frames.length}/${planned} 프레임`);await sleep(0)}}doneMs+=dur}
    status('GIF 압축 중',96,`${frames.length} 프레임`);const blob=makeGif(frames,W,H,Math.max(2,Math.round(100/fps)));download(blob,all?`${api.state.projectName}-full.gif`:`${scenes[0].id}.gif`);if(oldIndex>=0){api.selectScene(oldIndex);api.state.timeMs=oldTime;await api.draw()}done('GIF 저장 완료')
  }
  function saveSvg(all=false){const svg=makeAnimatedSvg(all);download(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}),all?`${api.state.projectName}-full.animated.svg`:`${api.state.scenes[api.state.sceneIndex]?.id||'scene'}.animated.svg`);done('Animated SVG 저장 완료')}
  function bind(id,fn){$(id)?.addEventListener('click',async()=>{try{await fn()}catch(e){status('내보내기 실패',0,e.message);api.toast(e.message)}})}
  $('#openExportDialogBtn')?.addEventListener('click',()=>$('#exportDialog')?.showModal());bind('#exportSceneSvgBtn',()=>saveSvg(false));bind('#exportProjectSvgBtn',()=>saveSvg(true));bind('#exportSceneGifBtn',()=>exportGif(false));bind('#exportProjectGifBtn',()=>exportGif(true));
  window.WhiteboardExporters={makeAnimatedSvg,exportGif,makeGif,rgbaTo332,lzw};
})();
