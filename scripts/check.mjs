import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const errors=[];
const jsFiles=['app.js','blueprint-engine.js','project-bundle.js','exporters.js','enhancements.js','site-config.js','sw.js','worker/worker.js'];
for(const f of jsFiles){try{execFileSync(process.execPath,['--check',path.join(root,f)],{stdio:'pipe'})}catch(e){errors.push(`${f}: JavaScript syntax error\n${e.stderr}`)}}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);const idSet=new Set(ids);const dups=ids.filter((x,i)=>ids.indexOf(x)!==i);if(dups.length)errors.push(`duplicate ids: ${[...new Set(dups)].join(', ')}`);
for(const f of ['app.js','blueprint-engine.js','project-bundle.js','exporters.js','enhancements.js']){const js=fs.readFileSync(path.join(root,f),'utf8');for(const m of js.matchAll(/\$\(["']#([A-Za-z][\w:-]*)["']\)/g)){if(!idSet.has(m[1]))errors.push(`${f}: missing DOM id #${m[1]}`)}}
const required=['index.html','styles.css','app.js','project-bundle.js','exporters.js','enhancements.js','manifest.webmanifest','404.html','robots.txt','sitemap.xml','assets/icons/favicon.svg','assets/og-image.png','sample-project/blueprint.json','sample-project/project.json','sample-project/story.srt','sample-project/script.txt','sample-project/images/scene-01.svg','sample-project/images/scene-02.svg','sample-project/images/scene-03.svg','LICENSE','package-lock.json','.github/workflows/deploy.yml'];
for(const f of required)if(!fs.existsSync(path.join(root,f)))errors.push(`missing: ${f}`);
for(const f of ['sample-project/blueprint.json','sample-project/project.json','manifest.webmanifest','package.json'])try{JSON.parse(fs.readFileSync(path.join(root,f),'utf8'))}catch(e){errors.push(`${f}: invalid JSON ${e.message}`)}
const manifest=JSON.parse(fs.readFileSync(path.join(root,'sample-project/project.json'),'utf8'));if(manifest.scenes?.length!==3)errors.push(`sample-project: expected 3 scenes, got ${manifest.scenes?.length||0}`);for(const s of manifest.scenes||[]){if(!Array.isArray(s.cueIds)||!s.cueIds.length)errors.push(`${s.id}: cueIds missing`);if(!s.image)errors.push(`${s.id}: image mapping missing`);else if(!fs.existsSync(path.join(root,'sample-project',s.image)))errors.push(`${s.id}: mapped image missing ${s.image}`)}
const bp=JSON.parse(fs.readFileSync(path.join(root,'sample-project/blueprint.json'),'utf8'));if(bp.format!=='whiteboard-blueprint/v1')errors.push('sample-project blueprint: wrong format');if(bp.scenes?.length!==3)errors.push(`sample-project blueprint: expected 3 scenes, got ${bp.scenes?.length||0}`);for(const scene of bp.scenes||[]){if(!(scene.durationMs>0))errors.push(`${scene.id}: blueprint duration invalid`);if(!Array.isArray(scene.objects)||!scene.objects.length)errors.push(`${scene.id}: blueprint objects missing`)}

if(errors.length){console.error([...new Set(errors)].join('\n'));process.exit(1)}console.log(`OK: ${ids.length} HTML ids, JS syntax, DOM refs, Blueprint + 3-scene folder manifest, required files`);
