import * as THREE from '../background-3d/vendor/three.module.js';
import { OrbitControls } from './vendor/OrbitControls.js';
import { Reflector } from './vendor/Reflector.js';
import { mergeGeometries } from './vendor/BufferGeometryUtils.js';
import { buildFurniture } from './furniture.js';
import { buildCampus } from './campus.js?v=tree-terrace-corner-20260930';
import { buildSky } from './sky.js';
import { buildMascot } from './mascot.js';
import { buildNavigation } from './navigation.js';
import { connectNavigation } from './interactions.js';
import { buildSeasons } from './seasons.js';
import { buildSnow } from './snow.js';
import { buildSnowfall } from './snowfall.js?v=night-snow-20260930';
import { createSeasonClock } from './season-state.js';
import { buildCampusBoard } from './campus-board.js';
import { buildLectern } from './lectern.js';
import { buildStudioDoor } from './studio-door.js';
import { createStudioVisit } from './studio-visit.js';
import { buildStudioGlazing } from './studio-glazing.js';
import { createStudioExplore } from './studio-explore.js';
import { buildContributionWall } from './contribution-wall.js';
import { buildStreetLife } from './street-life.js';
import { buildTerraceParasol } from './terrace-parasol.js';
import { buildWelcomeSign } from './welcome-sign.js?v=billboard-car-clear-20260930';

// Original procedural artwork for William Kang's portfolio. All scene assets
// are local. The accessible biography and navigation remain ordinary HTML.
const host=document.getElementById('studio-scene');
// Give video decoding, layout and input a turn between preparation stages.
const yieldStartup=()=>new Promise(resolve=>setTimeout(resolve,0));
if(host){
 initStudio().catch(error=>{host.dataset.state='fallback';console.warn('Studio preview unavailable; using still artwork.',error);});
}

async function initStudio(){
 performance.mark('studio-prepare-start');
 let prepared=false,entryComplete=!document.querySelector('[data-entry-intro]');
 window.addEventListener('portfolio-entry-complete',()=>{entryComplete=true;if(prepared)wake();},{once:true});
 await yieldStartup();
 const scene=new THREE.Scene(),renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 const canvas=renderer.domElement;canvas.setAttribute('aria-hidden','true');host.appendChild(canvas);
 const camera=new THREE.PerspectiveCamera(35,1,.1,180);
 const controls=new OrbitControls(camera,canvas);controls.target.set(0,1.9,-.2);
 controls.enableDamping=true;controls.dampingFactor=.075;controls.enablePan=false;controls.enableZoom=true;controls.zoomSpeed=.65;
 controls.rotateSpeed=.4;controls.minPolarAngle=.35;controls.maxPolarAngle=1.42;controls.minDistance=15;controls.maxDistance=55;
 const coarse=matchMedia('(pointer:coarse)');controls.touches.ONE=coarse.matches?null:THREE.TOUCH.ROTATE;controls.touches.TWO=THREE.TOUCH.DOLLY_ROTATE;canvas.style.touchAction='pan-y';
 let touched=false,boardOverview=null,cameraTransition=null;
 let modelParent=scene;
 const animators=[],cache=new Map(),geometries=new Map();let seed=99717;
 function rand(a=0,b=1){seed=(seed*1664525+1013904223)>>>0;return a+(b-a)*seed/4294967296;}
 const ramp=new THREE.DataTexture(new Uint8Array([70,144,207,255]),4,1,THREE.RedFormat);ramp.minFilter=ramp.magFilter=THREE.NearestFilter;ramp.needsUpdate=true;
 function mat(color,emissive=0,strength=0){const k=[color,emissive,strength].join('|');if(!cache.has(k))cache.set(k,new THREE.MeshToonMaterial({color,emissive,emissiveIntensity:strength,gradientMap:ramp}));return cache.get(k);}
 const material=m=>m?.isMaterial?m:mat(m),boxGeo=new THREE.BoxGeometry(1,1,1),edgeGeo=new THREE.EdgesGeometry(boxGeo);
 const ink=new THREE.LineBasicMaterial({color:0x142b37,transparent:true,opacity:.56});
 function box(w,h,d,x,y,z,m,parent=modelParent,outline=true){const mesh=new THREE.Mesh(boxGeo,material(m));mesh.position.set(x,y,z);mesh.scale.set(w,h,d);mesh.castShadow=!mesh.material.transparent;mesh.receiveShadow=true;if(outline)mesh.add(new THREE.LineSegments(edgeGeo,ink));parent.add(mesh);return mesh;}
 function cyl(r,h,x,y,z,m,parent=modelParent,n=16){const k=`c${r},${h},${n}`;if(!geometries.has(k))geometries.set(k,new THREE.CylinderGeometry(r,r,h,n));const o=new THREE.Mesh(geometries.get(k),material(m));o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
 function sphere(r,x,y,z,m,parent=modelParent){const k='s'+r;if(!geometries.has(k))geometries.set(k,new THREE.SphereGeometry(r,12,8));const o=new THREE.Mesh(geometries.get(k),material(m));o.position.set(x,y,z);parent.add(o);return o;}
 function rod(a,b,r,m,parent=modelParent){const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),d=q.clone().sub(p),o=cyl(r,d.length(),0,0,0,m,parent,8);o.position.copy(p.add(q).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return o;}
 function tube(points,r,m,parent=modelParent){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const o=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(12,points.length*6),r,6,false),material(m));parent.add(o);return o;}
 function torus(r,t,x,y,z,m,parent=modelParent){const o=new THREE.Mesh(new THREE.TorusGeometry(r,t,8,32),material(m));o.position.set(x,y,z);parent.add(o);return o;}
 function group(x=0,y=0,z=0,ry=0,parent=modelParent){const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=ry;parent.add(g);return g;}
 function panel(w,h,x,y,z,draw,parent=modelParent,ry=0){const c=document.createElement('canvas');c.width=1024;c.height=Math.min(1024,Math.max(128,Math.round(1024*h/w)));draw(c.getContext('2d'),c.width,c.height);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;const o=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex,transparent:true,toneMapped:false,side:THREE.DoubleSide}));o.position.set(x,y,z);o.rotation.y=ry;parent.add(o);return o;}
 function label(text,w,h,x,y,z,opt={}){return panel(w,h,x,y,z,(c,W,H)=>{c.fillStyle=opt.bg??'#eddfbc';c.fillRect(0,0,W,H);c.textAlign='center';c.textBaseline='middle';const ls=text.split('\n'),fs=opt.fontSize||Math.min(H*.72/ls.length,W/(Math.max(...ls.map(s=>s.length))*.62));c.fillStyle=opt.color||'#30454c';c.font=`${opt.weight||'700'} ${fs}px "Arial", "Yu Gothic", sans-serif`;ls.forEach((l,i)=>c.fillText(l,W/2,H/2+(i-(ls.length-1)/2)*fs*1.25,W*.91));},opt.parent||modelParent,opt.ry||0);}
 const glowTexture=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const cx=c.getContext('2d'),g=cx.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,.9)');g.addColorStop(.12,'rgba(255,255,255,.3)');g.addColorStop(.45,'rgba(255,255,255,.07)');g.addColorStop(1,'transparent');cx.fillStyle=g;cx.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);})();
 function glow(x,y,z,color,size,opacity=.22,parent=modelParent){const o=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending}));o.position.set(x,y,z);o.scale.setScalar(size);parent.add(o);return o;}
 function light(x,y,z,color,intensity,distance){const l=new THREE.PointLight(color,intensity,distance,2);l.position.set(x,y,z);scene.add(l);return l;}
 const ambient=new THREE.HemisphereLight(0x99c2dc,0x423947,1.15);scene.add(ambient);
 const moon=new THREE.DirectionalLight(0xabcfe4,1.2);moon.position.set(-3,12,7);moon.castShadow=true;moon.shadow.mapSize.set(1536,1536);Object.assign(moon.shadow.camera,{left:-9,right:9,top:9,bottom:-9});moon.shadow.bias=-.00015;moon.shadow.normalBias=.04;scene.add(moon);
 const rim=new THREE.DirectionalLight(0x889be2,.8);rim.position.set(7,5,-6);scene.add(rim);
 const studioLights=[light(-1,2.7,-1.3,0xffd19d,13,9),light(2.2,2,-1.1,0x9eeedb,6,6),light(-3.3,2.2,1.6,0xffc17b,4,5)];
 await yieldStartup();

 // A glazed studio envelope keeps the workstation visible through its roof.
 const slate=mat(0x314753),frame=mat(0x3c7277),wood=mat(0x976f58,0xb28758,.11),cream=mat(0xc7c3a9,0xefca99,.13),metal=mat(0x78969c);
 box(16,.42,16,0,-.25,0,0x21333e);box(15.86,.085,15.86,0,-.47,0,0x0e202a,scene,false);
 box(15.93,.02,15.93,0,-.025,0,0x203846,scene,false);
 const studioGroup=group(-1.65,0,.5);studioGroup.name='William AI studio';studioGroup.scale.setScalar(.88);studioLights.forEach(l=>studioGroup.add(l));modelParent=studioGroup;
 box(8.1,.29,5.4,-.1,.13,-1.05,0x8b9b97);box(7.45,.045,4.95,-.1,.305,-1.05,wood);
 for(let x=-3.7;x<3.5;x+=.31)box(.011,.01,4.81,x,.335,-1.05,0x694f44,studioGroup,false);
 box(7.5,3.38,.14,-.1,2.04,-3.59,cream);box(.12,2.5,4.95,-3.86,1.69,-1.07,0x45666c);
 for(let z=-3.4;z<1.3;z+=.38)box(.013,.022,.23,-3.788,1.33,z,0x9aaa9e,studioGroup,false);
 // Rear service roof and slim structural beams support the glass canopy.
 box(7.87,.2,2.12,-.1,3.88,-2.68,slate);box(7.94,.095,2.18,-.1,4.015,-2.68,0x52707c);
 for(let x=-3.85;x<3.8;x+=.53)box(.025,.016,2.06,x,4.074,-2.68,0x233d4c,studioGroup,false);
 box(8,.18,.14,-.1,3.83,1.46,frame);box(.14,.18,5.08,-3.96,3.83,-1.08,frame);box(.14,.18,5.08,3.76,3.83,-1.08,frame);
 for(const [x,z] of [[-3.94,1.43],[3.76,1.43],[-3.94,-3.6],[3.76,-3.6]]){box(.14,3.53,.14,x,2.03,z,frame);box(.24,.21,.24,x,.42,z,0x668a86);}
 box(7.7,.042,.043,-.1,3.72,1.48,mat(0xffddb0,0xffcc88,1.8),studioGroup,false);
 box(.043,.035,4.9,3.68,3.7,-1.03,mat(0xb2f5de,0x73d5bd,.75),studioGroup,false);
 // Keep the original side frame, adding visible glass in every open bay.
 for(const z of [-3.48,-1.92,-.26,1.43])box(.1,3.35,.055,3.76,2.01,z,metal);
 for(const y of [.39,3.66])box(.09,.06,4.89,3.76,y,-1.06,metal);
 const studioGlazing=buildStudioGlazing({THREE,scene:studioGroup,box,mat});
 const studioDoor=buildStudioDoor({THREE,scene:studioGroup,box,cyl,rod,mat,panel});
 // Roof plaque, detailed rain gutter and drain chains.
 box(2.25,.65,.1,-2.47,3.28,1.48,0x183943);
 label('W.K  /  AI STUDIO',2.08,.44,-2.47,3.29,1.544,{bg:'#243f47',color:'#d7f2d1',fontSize:95});
 box(8.08,.085,.12,-.1,3.93,1.51,0x7c9f9e);
 tube([[-4.06,3.96,1.49],[-4.19,3.9,1.5],[-4.2,.21,1.52]],.045,0x507b83);
 // A narrow two-step entry follows the glass door's centerline.
 box(1.35,.17,.53,3.09,.11,1.92,0x718b8e);box(1.35,.12,.53,3.09,.04,2.4,0x627e85);
 box(1.8,.019,.73,1.49,.34,1.03,0x406866);const welcome=label('MAKE SOMETHING MATTER.',1.58,.18,1.49,.353,1.04,{bg:'transparent',color:'#bad3bd'});welcome.rotation.x=-Math.PI/2;
 modelParent=scene;
 // Rain-wet paving and a quiet strip of miniature street.
 for(let x=-7.6;x<7.8;x+=.6)for(let z=-7.6;z<7.8;z+=.6){if(z<1.75&&x>-4.2&&x<4.0)continue;box(.57,.027,.57,x,-.005,z,0x36505c,scene,false);}
 // A flush channel follows the left foundation and receives the downpipe.
 const drain=group(-5.42,.025,-.42);drain.name='Studio left-wall drainage channel';
 box(.16,.018,4.66,0,0,0,0x0d2834,drain,false);
 for(let z=-2.28;z<=2.29;z+=.12)box(.17,.016,.027,0,.005,z,0x62818e,drain,false);
 for(let x=-4.9;x<5.4;x+=1.75)box(.73,.011,.06,x,.04,5.52,0x809aa0,scene,false);
 const welcomeSign=buildWelcomeSign({THREE,scene,box,cyl,group,mat,panel,glow});
 // Warm street lamp and a compact tree frame the courtyard.
 cyl(.15,.13,-4.85,.065,2.8,0x233e49);cyl(.052,3.75,-4.85,1.9,2.8,0x5a7d89);
 tube([[-4.85,3.6,2.8],[-4.85,4.1,2.8],[-4.6,4.2,2.8],[-4.26,4.14,2.8],[-4.19,3.97,2.8]],.042,0x688991);
 cyl(.27,.11,-4.19,3.93,2.8,mat(0xffe9b8,0xffbe71,1.7));cyl(.32,.06,-4.19,4.01,2.8,0x344f5b);
 glow(-4.19,3.86,2.8,0xffb970,2.4,.22);light(-4.19,3.7,2.8,0xffca87,8,8);
 const pool=new THREE.Mesh(new THREE.PlaneGeometry(3.7,3.5),new THREE.MeshBasicMaterial({map:glowTexture,color:0xffcc8b,transparent:true,opacity:.19,depthWrite:false,blending:THREE.AdditiveBlending}));pool.rotation.x=-Math.PI/2;pool.position.set(-4.1,.06,3.1);scene.add(pool);
 const tree=group(-6.45,.05,-1.75);cyl(.46,.49,0,.245,0,0x75665f,tree,10);cyl(.43,.03,0,.5,0,0x243b37,tree,12);rod([0,.49,0],[.06,1.85,.07],.057,0x796959,tree);
 const rootFoliage=[];
 for(let i=0;i<12;i++){const a=i*2.399,y=1.38+(i%4)*.23,x=Math.cos(a)*.38,z=Math.sin(a)*.36;rod([.03,.9,0],[x,y,z],.021,0x728877,tree);rod([x*.74,y-.19,z*.74],[x*1.28,y+.13,z*1.25],.011,0x796959,tree);const leaf=sphere(.31,x,y,z,mat([0x5c8c83,0x79a091,0x477a79][i%3]).clone(),tree);leaf.scale.set(1,.73,1);leaf.userData.dynamic=true;rootFoliage.push(leaf);}
 modelParent=studioGroup;
 // Roof service details and subtle back-wall silhouette.
 await yieldStartup();
 box(1.06,.22,.78,1.78,4.17,-2.95,0x6c8991);for(let i=0;i<9;i++)box(.93,.022,.045,1.78,4.3,-3.25+i*.075,0x9cb5b3,studioGroup,false);
 cyl(.115,.47,-2.7,4.16,-3.1,0x8aa0a3);cyl(.2,.06,-2.7,4.42,-3.1,0x3e5d68);
 buildFurniture({THREE,scene:studioGroup,box,cyl,sphere,rod,tube,torus,group,mat,panel,label,glow,animators,rand});
 const lectern=buildLectern({THREE,scene:studioGroup,box,mat});
 modelParent=scene;
 await yieldStartup();
 const campus=await buildCampus({THREE,scene,box,cyl,sphere,rod,tube,torus,group,mat,panel,label,glow,animators,rand});
 await yieldStartup();
 const parasol=buildTerraceParasol({THREE,scene,group,cyl,rod,mat});
 const campusBoard=buildCampusBoard({THREE,scene,box,cyl,sphere,rod,tube,torus,group,mat,panel,label,glow,animators});
 const mascot=buildMascot({THREE,scene,box,cyl,sphere,rod,tube,torus,group,mat,panel,label,glow,animators,rand});
 const sky=buildSky({THREE,scene});
 const roadLinks=[...host.querySelectorAll('[data-studio-road-link]')].map(anchor=>({id:anchor.dataset.studioRoadLink,label:anchor.textContent.trim(),href:anchor.href,anchor}));
 const navigation=buildNavigation({THREE,scene,box,cyl,sphere,rod,tube,torus,group,mat,panel,label,glow},{links:roadLinks,parent:lectern.keyMount});
 let navigationInput=null,exploration=null;
 await yieldStartup();
 const seasons=buildSeasons({THREE,scene,mat},{trees:[{group:tree,foliage:rootFoliage,groundY:.04,scatterRadius:.9},...campus.seasonTrees]});
 const snow=buildSnow({THREE,scene,mat});
 const snowfall=buildSnowfall({THREE,scene,rand},{rainBounds:campus.rainBounds,parasol});
 animators.push(t=>snowfall.update(t));
 const seasonClock=createSeasonClock({light:document.body.dataset.theme==='light',reducedMotion:matchMedia('(prefers-reduced-motion:reduce)').matches,leafEndTime:seasons.endTime});
 let seasonLast='',seasonWinter=0,seasonShadowElapsed=0;

 // Real projective reflection with gentle roughness and moving water normals.
 const wetShader={uniforms:{color:{value:new THREE.Color(0x314b5a)},tDiffuse:{value:null},textureMatrix:{value:null},time:{value:0},day:{value:0},winter:{value:0}},
 vertexShader:`uniform mat4 textureMatrix;varying vec4 proj;varying vec3 world;void main(){proj=textureMatrix*vec4(position,1.);world=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`uniform sampler2D tDiffuse;uniform vec3 color;uniform float time;uniform float day;uniform float winter;varying vec4 proj;varying vec3 world;float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);}void main(){vec2 p=world.xz;float wet=smoothstep(.2,.75,noise(p*.8)*.7+noise(p*2.)*.3);vec2 uv=proj.xy/proj.w+vec2(sin(p.y*16.+time),cos(p.x*12.-time))*.00035*(1.-winter);vec3 reflection=texture2D(tDiffuse,uv).rgb*.5+texture2D(tDiffuse,uv+vec2(.0015,0.)).rgb*.25+texture2D(tDiffuse,uv-vec2(.0015,0.)).rgb*.25;vec3 pavement=mix(color*(.18+hash(p*420.)*.06),vec3(.36,.43,.43)+hash(p*420.)*.035,day);vec3 ground=mix(pavement,reflection,mix(.13+wet*.44,.06+wet*.18,day)*(1.-winter*.62));float snowCover=winter*smoothstep(4.9,7.5,max(abs(p.x),abs(p.y)))*smoothstep(.22,.67,noise(p*1.4)+winter*.15);ground=mix(ground,mix(vec3(.40,.50,.59),vec3(.83,.85,.80),day),snowCover);gl_FragColor=vec4(ground,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`};
 const water=new Reflector(new THREE.PlaneGeometry(15.93,15.93),{textureWidth:768,textureHeight:768,multisample:0,clipBias:.003,shader:wetShader});water.rotation.x=-Math.PI/2;water.position.y=.017;water.userData.dynamic=true;scene.add(water);animators.push(t=>water.material.uniforms.time.value=t);
 // Continuous rainfall stays inside the miniature; nothing falls through the roof.
 const rainCount=1020,rainPositions=new Float32Array(rainCount*6),rainSeeds=Array.from({length:rainCount},()=>({x:rand(-7.88,7.88),z:rand(-7.88,7.88),phase:rand(0,8),speed:rand(4.3,7.2),len:rand(.075,.18)}));
 const rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(rainPositions,3));const rain=new THREE.LineSegments(rainGeo,new THREE.LineBasicMaterial({color:0xadcfdc,transparent:true,opacity:.3,depthWrite:false}));rain.userData.dynamic=true;rain.frustumCulled=false;scene.add(rain);
 animators.push(t=>{if(!rain.visible)return;rainSeeds.forEach((s,i)=>{let y=((s.phase-t*s.speed)%8+8)%8,x=Math.min(7.9,s.x+(8-y)*.019),z=s.z;const indoors=x>-5.24&&x<1.82&&z>-2.82&&z<1.92;const underCampusRoof=campus.rainBounds.some(b=>x>b.minX&&x<b.maxX&&z>b.minZ&&z<b.maxZ&&y<b.roofY);const underParasol=(x-parasol.center.x)**2+(z-parasol.center.z)**2<parasol.radius**2&&y<parasol.roofY;if((indoors&&y<3.70)||underCampusRoof||underParasol)y=-2;const k=i*6;rainPositions.set([x,y,z,x+.015,y-s.len,z+.005],k);});rainGeo.attributes.position.needsUpdate=true;});
 const dummy=new THREE.Object3D(),ringGeo=new THREE.RingGeometry(.94,1,32);ringGeo.rotateX(-Math.PI/2);
 const rings=new THREE.InstancedMesh(ringGeo,new THREE.MeshBasicMaterial({color:0x9ac1cd,transparent:true,opacity:.18,depthWrite:false}),55);rings.userData.dynamic=true;scene.add(rings);const ringSeeds=Array.from({length:55},(_,i)=>({x:i<38?rand(-5.5,5.5):rand(4.1,5.7),z:i<38?rand(2.95,5.6):rand(-5.5,2),phase:rand(0,3),life:rand(1.3,2.9)}));
 animators.push(t=>{if(!rings.visible)return;ringSeeds.forEach((r,i)=>{const u=((t+r.phase)%r.life)/r.life;dummy.position.set(r.x,.043,r.z);dummy.scale.set(.04+u*.29,1,.04+u*.29);dummy.updateMatrix();rings.setMatrixAt(i,dummy.matrix);rings.setColorAt(i,new THREE.Color().setScalar((1-u)*.7));});rings.instanceMatrix.needsUpdate=true;rings.instanceColor.needsUpdate=true;});
 const dropGeo=new THREE.SphereGeometry(1,5,4),drops=new THREE.InstancedMesh(dropGeo,new THREE.MeshBasicMaterial({color:0xc8e6e7,transparent:true,opacity:.54}),30);drops.userData.dynamic=true;studioGroup.add(drops);
 animators.push(t=>{if(!drops.visible)return;for(let i=0;i<30;i++){const u=(t*.67+i*.237)%1;dummy.position.set(-4+i*.272,3.88-u*u*3.86,1.57);dummy.scale.set(.008,.013+u*.06,.008);dummy.updateMatrix();drops.setMatrixAt(i,dummy.matrix);}drops.instanceMatrix.needsUpdate=true;});
 const trailsPos=new Float32Array(30*6),trailsGeo=new THREE.BufferGeometry();trailsGeo.setAttribute('position',new THREE.BufferAttribute(trailsPos,3));const trails=new THREE.LineSegments(trailsGeo,new THREE.LineBasicMaterial({color:0xc4e2df,transparent:true,opacity:.21,depthWrite:false}));trails.userData.dynamic=true;studioGroup.add(trails);
 const trailSeeds=Array.from({length:30},()=>({z:rand(-3.4,1.3),p:rand(0,1),s:rand(.032,.083)}));animators.push(t=>{if(!trails.visible)return;trailSeeds.forEach((v,i)=>{const y=3.5-((t*v.s+v.p)%1)*3;trailsPos.set([3.794,y,v.z,3.794,y+.08,v.z+.007],i*6);});trailsGeo.attributes.position.needsUpdate=true;});
 const topGlow=glow(-.1,3.68,1.5,0xffc785,6,.08,studioGroup);animators.push(t=>topGlow.material.opacity=.08+Math.sin(t*1.13)*.006);

 // Preserve the studio's exact clickable silhouette before render batching
 // combines its walls and furniture with the rest of the courtyard.
 scene.updateMatrixWorld(true);
 const studioHitParts=[];
 studioGroup.traverse(object=>{
  if(!object.isMesh||object.isInstancedMesh)return;
  const geometry=object.geometry.index?object.geometry.toNonIndexed():object.geometry.clone();
  geometry.applyMatrix4(object.matrixWorld);
  for(const name of Object.keys(geometry.attributes))if(name!=='position')geometry.deleteAttribute(name);
  studioHitParts.push(geometry);
 });
 const studioEntryHit=new THREE.Mesh(mergeGeometries(studioHitParts,false),new THREE.MeshBasicMaterial({visible:false,side:THREE.DoubleSide}));
 studioHitParts.forEach(geometry=>geometry.dispose());
 studioEntryHit.name='Whole AI studio entry hit surface';studioEntryHit.userData.dynamic=true;scene.add(studioEntryHit);
 // Build the outward-facing gallery after the entry proxy, so a logo click
 // opens its contribution instead of being swallowed by the studio entrance.
 const contributionLinks=[...host.querySelectorAll('[data-studio-contribution]')].map(anchor=>({id:anchor.dataset.studioContribution,anchor}));
 const contributionWall=await buildContributionWall({THREE,studioGroup,mat},{links:contributionLinks});
 await yieldStartup();
 scene.updateMatrixWorld(true);
 // Batch static geometry, keeping labeled screens and animated objects intact.
 const batches=new Map(),outlines=[],toRemove=[];
 scene.traverse(o=>{if((!o.isMesh&&!o.isLineSegments)||o.isInstancedMesh||o.isReflector)return;let p=o;while(p){if(p.userData.dynamic)return;p=p.parent;}
  if(o.isLineSegments&&o.material===ink){outlines.push(o.geometry.clone().applyMatrix4(o.matrixWorld));toRemove.push(o);return;}
  if(!o.isMesh||Array.isArray(o.material)||o.material.transparent)return;
  const key=o.material.uuid+'|'+Object.keys(o.geometry.attributes).sort().join(',');if(!batches.has(key))batches.set(key,{m:o.material,geos:[]});let g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);batches.get(key).geos.push(g);toRemove.push(o);
 });
 let batchStart=performance.now();
 for(const {m,geos} of batches.values()){const g=mergeGeometries(geos,false);if(g){const o=new THREE.Mesh(g,m);o.castShadow=o.receiveShadow=true;scene.add(o);}geos.forEach(g=>g.dispose());if(performance.now()-batchStart>8){await yieldStartup();batchStart=performance.now();}}
 if(outlines.length){const o=new THREE.LineSegments(mergeGeometries(outlines,false),ink);scene.add(o);outlines.forEach(g=>g.dispose());}
 const removed=new Set(toRemove);toRemove.forEach(o=>{[...o.children].forEach(c=>{if(!removed.has(c))scene.attach(c);});o.removeFromParent();});
 renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
 const streetLife=buildStreetLife({THREE,scene,mergeGeometries});
 await yieldStartup();

 let width=1,height=1,fit=1,inView=true,elapsed=0,previous=0,rafId=0,disposed=false,contextLost=false,viewInitialized=false,settleRemaining=0,warmupGeneration=0,visualRevision=0;
 const motion=matchMedia('(prefers-reduced-motion:reduce)');let userPaused=motion.matches;
 const approachDuration=4.2;
 let approachElapsed=0,approachRunning=!motion.matches,exteriorScale=motion.matches?closeViewScale():1;
 function closeViewScale(){return innerWidth<=820?.92:.80;}
 function cancelApproach(){approachRunning=false;}
 function applyExteriorView(){
  const angle=.63+Math.sin(elapsed*.11)*.036,radius=29.9*fit*exteriorScale;
  camera.position.set(controls.target.x+Math.sin(angle)*radius,controls.target.y+12*fit*exteriorScale,controls.target.z+Math.cos(angle)*radius);
 }
 function updateApproach(seconds){
  // Respect a changed motion preference even before its change event arrives.
  if(motion.matches){cancelApproach();exteriorScale=closeViewScale();applyExteriorView();return;}
  approachElapsed=Math.min(approachDuration,approachElapsed+seconds);
  const u=approachElapsed/approachDuration,ease=u*u*u*(u*(u*6-15)+10);
  exteriorScale=THREE.MathUtils.lerp(1,closeViewScale(),ease);applyExteriorView();
  if(u===1)approachRunning=false;
 }
 controls.addEventListener('start',()=>{touched=true;cameraTransition=null;cancelApproach();});
 const hero=host.closest('.studio-hero');
 let nextPageDocked=false;
 function updateNextPagePosition(){
  const homeDistance=Math.hypot(29.9,12)*fit*closeViewScale();
  const distance=camera.position.distanceTo(controls.target);
  const range=Math.max(1,homeDistance-controls.minDistance);
  const zoom=visit?.active?1:THREE.MathUtils.clamp((homeDistance-distance)/range,0,1);
  const eased=zoom*zoom*(3-2*zoom);
  const baseTop=Math.min(hero.clientHeight*.78,innerHeight-200);
  const viewportReserve=innerWidth<=1120?202:154;
  const dockTop=Math.max(baseTop,Math.min(hero.clientHeight-150,innerHeight-viewportReserve));
  const shift=innerWidth<=820?0:Math.max(0,dockTop-baseTop)*eased;
  hero.style.setProperty('--studio-next-page-shift',`${shift.toFixed(2)}px`);
  // Keep a stable state hook for diagnostics without using it to drive motion.
  const docked=nextPageDocked?zoom>.01:zoom>.03;
  if(docked!==nextPageDocked){nextPageDocked=docked;hero.classList.toggle('is-model-zoomed',docked);}
 }
 const enterButton=hero.querySelector('[data-studio-enter]'),exitButton=hero.querySelector('[data-studio-exit]'),visitStatus=hero.querySelector('[data-studio-visit-status]');
 const walkButtons=[...host.querySelectorAll('[data-studio-walk]')];
 const visit=createStudioVisit({THREE,camera,controls,door:studioDoor,studioGroup,reducedMotion:()=>motion.matches,wake,onChange(state){
  touched=true;cancelApproach();cameraTransition=null;boardOverview=null;navigationInput?.cancel();
  const focused=document.activeElement,inside=state!=='exterior',walkFocused=walkButtons.includes(focused),restoreFocus=state==='exterior'&&(focused===exitButton||focused===canvas||walkFocused);hero.classList.toggle('is-studio-interior',inside);hero.dataset.visit=state;updateNextPagePosition();
  hero.querySelector('.studio-copy').inert=inside;enterButton.hidden=inside;exitButton.hidden=!inside;
  enterButton.setAttribute('aria-expanded',String(inside));
  exploration?.setState(state);
  walkButtons.forEach(button=>{button.hidden=state!=='interior'||!visit.nodes.find(node=>node.id===visit.currentNode)?.neighbors.includes(button.dataset.studioWalk);});
  if(inside){canvas.removeAttribute('aria-hidden');canvas.tabIndex=0;canvas.dataset.studioLabel='studioLookLabel';canvas.setAttribute('aria-label',window.__portfolioI18n?.getText('studioLookLabel')||'Studio view. Drag or use arrow keys to look around. Click a floor tile to move.');if(walkFocused)canvas.focus({preventScroll:true});}else{canvas.setAttribute('aria-hidden','true');canvas.removeAttribute('tabindex');}
  const key=state==='interior'?'studioInsideHint':state==='exiting'?'studioLeavingHint':state==='relocating'?'studioMovingHint':'studioEnteringHint';
  visitStatus.dataset.i18n=key;visitStatus.textContent=window.__portfolioI18n?.getText(key)||({studioInsideHint:'Drag to look · Click a floor tile to move · Explore the lectern keys',studioLeavingHint:'Returning to the courtyard…',studioEnteringHint:'Step inside…',studioMovingHint:'Moving through the studio…'})[key];
  visitStatus.hidden=!inside;
  if(inside&&document.activeElement===enterButton)exitButton.focus({preventScroll:true});
  if(restoreFocus)enterButton.focus({preventScroll:true});
  if(state==='entering'&&innerWidth<=820)window.scrollTo({top:Math.max(0,hero.offsetTop-(document.querySelector('header')?.offsetHeight||0)),behavior:'instant'});
  settleRemaining=.2;
 }});
 navigation.keys.forEach(key=>key.enabled=()=>visit.state==='interior');
 exitButton.addEventListener('click',()=>{visit.exit();});
 const escapeVisit=event=>{if(event.key==='Escape'&&visit.active){event.preventDefault();visit.exit();}};
 document.addEventListener('keydown',escapeVisit);
 let day=document.body.dataset.theme==='light'?1:0,targetDay=day,transitionStart=day,transitionElapsed=3.2;
 const dayNightColors={skyNight:new THREE.Color(0x99c2dc),skyDay:new THREE.Color(0xddeeff),groundNight:new THREE.Color(0x423947),groundDay:new THREE.Color(0xc8bea0),moon:new THREE.Color(0xabcfe4),sun:new THREE.Color(0xffebcc)};
 function applySeason(force=false,dt=0){const state=seasonClock.state;const signature=Object.values(state).join('|');if(!force&&signature===seasonLast)return;seasonLast=signature;seasonWinter=state.winter;seasons.update(state);snow.setAmount(THREE.MathUtils.smoothstep(seasonWinter,.14,1));water.material.uniforms.winter.value=seasonWinter;campus.lake?.setWinter?.(seasonWinter);seasonShadowElapsed+=dt;if(force||seasonShadowElapsed>.25||!seasonClock.active){renderer.shadowMap.needsUpdate=true;seasonShadowElapsed=0;}}
 const pointLights=[],emissiveMaterials=new Map(),lampGlows=[];
 scene.traverse(o=>{if(o.isPointLight)pointLights.push([o,o.intensity]);if(o.isSprite&&!o.userData.themeControlled)lampGlows.push([o,o.material.opacity]);const m=o.material;if(m?.emissiveIntensity>0&&!emissiveMaterials.has(m))emissiveMaterials.set(m,m.emissiveIntensity);});
 function applyDay(){
  hero?.style.setProperty('--studio-day',day.toFixed(4));
  ambient.color.copy(dayNightColors.skyNight).lerp(dayNightColors.skyDay,day);ambient.groundColor.copy(dayNightColors.groundNight).lerp(dayNightColors.groundDay,day);ambient.intensity=1.15+day*.85;
  moon.color.copy(dayNightColors.moon).lerp(dayNightColors.sun,day);moon.intensity=1.2+day*1.7;moon.position.set(-3+day*10,12,7-day*3);rim.intensity=.8-day*.38;
  renderer.toneMappingExposure=1.12+day*.05;
  pointLights.forEach(([o,intensity])=>o.intensity=intensity*(1-day*.93));
  emissiveMaterials.forEach((intensity,m)=>m.emissiveIntensity=intensity*(1-day*.78));
  lampGlows.forEach(([o,opacity])=>o.material.opacity=opacity*(1-day*.96));
  pool.material.opacity=.19*(1-day*.92);topGlow.material.opacity=(.08+Math.sin(elapsed*1.13)*.006)*(1-day*.96);
  const rainAmount=(1-day)*(1-THREE.MathUtils.smoothstep(seasonWinter,0,.58));rain.material.opacity=.3*rainAmount;rain.visible=rainAmount>.005;rings.material.opacity=.18*(1-day*.91)*(1-seasonWinter);rings.visible=seasonWinter<.995;drops.material.opacity=.54*rainAmount;drops.visible=rain.visible;trails.material.opacity=.21*rainAmount;trails.visible=rain.visible;
  const snowFallIn=THREE.MathUtils.smoothstep(seasonWinter,.025,.50),snowFallOut=1-THREE.MathUtils.smoothstep(seasonWinter,.88,1);snowfall.setAmount((1-day)*snowFallIn*snowFallOut);
  water.material.uniforms.day.value=day;studioGlazing.setDay(day);campus?.setDay?.(day);campusBoard.setDay?.(day);contributionWall.setDay(day);sky.setDay(day,elapsed);
 }
 const themeObserver=new MutationObserver(()=>{
  const next=document.body.dataset.theme==='light'?1:0;if(next===targetDay)return;
  visualRevision++;
  transitionStart=day;targetDay=next;transitionElapsed=0;seasonClock.setTheme(next===1);applySeason(motion.matches);
  if(motion.matches||contextLost){day=targetDay;transitionElapsed=3.2;applyDay();renderer.shadowMap.needsUpdate=true;}
  wake();
 });themeObserver.observe(document.body,{attributes:true,attributeFilter:['data-theme']});
 const motionButton=document.querySelector('[data-studio-motion]');
 function updateMotionButton(){if(!motionButton)return;const paused=userPaused;motionButton.setAttribute('aria-pressed',String(paused));const key=paused?'studioResumeMotion':'studioPauseMotion';const text=window.__portfolioI18n?.getText?window.__portfolioI18n.getText(key):(paused?'Play scene':'Pause motion');motionButton.setAttribute('aria-label',text);const span=motionButton.querySelector('[data-studio-motion-label]');if(span){span.textContent=text;span.dataset.i18n=key;}else motionButton.textContent=text;}
 function updateInteraction(dt){const keyMoving=navigationInput?.update(dt,motion.matches);const boardMoving=campusBoard.update(dt,motion.matches);exploration?.update(dt,motion.matches,navigationInput?.hovered?.id);contributionWall.setHovered(navigationInput?.hovered?.id);studioDoor.setHovered(!visit.active&&navigationInput?.hovered?.id==='studio-door');const doorMoving=studioDoor.update(dt,motion.matches);return keyMoving||boardMoving||doorMoving;}
 function updateStreetLife(seconds){streetLife.update(seconds,{day,enabled:!userPaused&&!approachRunning&&!visit.active,reducedMotion:motion.matches});}
 function paint(t=elapsed){if(contextLost)return;animators.forEach(fn=>fn(t,0));applySeason();applyDay();updateStreetLife(0);if(updateInteraction(1/60))renderer.shadowMap.needsUpdate=true;if(prepared)renderer.render(scene,camera);}
 function resetView({initial=false}={}){if(visit.active){visit.exit();return;}touched=false;cameraTransition=null;boardOverview=null;if(!initial){cancelApproach();exteriorScale=closeViewScale();}controls.minDistance=15*fit;controls.target.set(0,1.9,-.2);applyExteriorView();controls.update();wake();}
 function moveCamera(position,target,minimum=controls.minDistance){
  touched=true;cancelApproach();controls.minDistance=Math.min(controls.minDistance,minimum);
  cameraTransition={from:camera.position.clone(),fromTarget:controls.target.clone(),position:position.clone(),target:target.clone(),minimum,age:0};
  settleRemaining=.9;wake();
 }
 function focusBoard(){
  boardOverview??={position:camera.position.clone(),target:controls.target.clone(),minimum:controls.minDistance};
  const detailWidth=Math.min(width*.80,560),distance=3.75*height/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*detailWidth);
  const target=new THREE.Vector3(4.947,4.24,-6.03),position=target.clone().add(new THREE.Vector3(.03,.075,-1).multiplyScalar(distance));
  moveCamera(position,target,distance*.88);
 }
 function toggleBoard(){
  const opening=campusBoard.toggle();
  if(opening)focusBoard();
  else if(boardOverview){const overview=boardOverview;boardOverview=null;moveCamera(overview.position,overview.target,overview.minimum);}
  if(motion.matches){updateCamera(0);renderer.shadowMap.needsUpdate=true;paint();}
  settleRemaining=.9;wake();
 }
 function updateCamera(dt){
  if(!cameraTransition)return false;
  const transition=cameraTransition;transition.age=motion.matches ? .75 : Math.min(.75,transition.age+dt);
  const progress=transition.age/.75,ease=progress*progress*(3-2*progress);
  camera.position.lerpVectors(transition.from,transition.position,ease);controls.target.lerpVectors(transition.fromTarget,transition.target,ease);
  if(progress===1){controls.minDistance=transition.minimum;cameraTransition=null;}
  return true;
 }
 function resize(){width=host.clientWidth;height=host.clientHeight;if(!width||!height)return;visualRevision++;const oldFit=fit;camera.aspect=width/height;
  if(visit.active)visit.resize();else {fit=Math.max(1,1.19/camera.aspect);controls.minDistance=controls.minDistance/oldFit*fit;controls.maxDistance=55*fit;
  if(!viewInitialized){resetView({initial:true});viewInitialized=true;}else if(approachRunning)updateApproach(0);else if(!touched){exteriorScale=closeViewScale();applyExteriorView();}else camera.position.sub(controls.target).multiplyScalar(fit/oldFit).add(controls.target);}
  controls.update();camera.updateProjectionMatrix();renderer.setSize(width,height);paint();}
 function loop(now){rafId=0;if(!prepared||!entryComplete||disposed||contextLost||document.hidden||!inView)return;const frameSeconds=previous?Math.min((now-previous)/1000,1):1/60,dt=Math.min(frameSeconds,.05);previous=now;settleRemaining=Math.max(0,settleRemaining-dt);
  if(!userPaused){elapsed+=dt;seasonClock.advance(frameSeconds);applySeason(false,frameSeconds);if(approachRunning)updateApproach(frameSeconds);else if(!touched)applyExteriorView();animators.forEach(fn=>fn(elapsed,dt));}
  if(transitionElapsed<3.2){transitionElapsed=Math.min(3.2,transitionElapsed+frameSeconds);const u=transitionElapsed/3.2,s=u*u*(3-2*u);day=transitionStart+(targetDay-transitionStart)*s;renderer.shadowMap.needsUpdate=true;}
  applyDay();updateStreetLife(frameSeconds);const visiting=visit.update(dt,motion.matches),cameraMoving=updateCamera(dt);controls.update();const interactionMoving=updateInteraction(dt);if(interactionMoving)renderer.shadowMap.needsUpdate=true;if(interactionMoving||cameraMoving||visiting)settleRemaining=Math.max(settleRemaining,.12);renderer.render(scene,camera);if(!userPaused||transitionElapsed<3.2||settleRemaining>0)rafId=requestAnimationFrame(loop);
 }
 function wake(){if(prepared&&entryComplete&&!rafId&&!contextLost&&!document.hidden&&inView&&!disposed){previous=0;rafId=requestAnimationFrame(loop);}}
 controls.addEventListener('change',()=>{updateNextPagePosition();if(prepared&&userPaused&&!contextLost)renderer.render(scene,camera);});
 controls.addEventListener('start',()=>{settleRemaining=.8;wake();});controls.addEventListener('end',()=>{settleRemaining=.8;wake();});
 const viewButtons=[...document.querySelectorAll('[data-studio-zoom],[data-studio-reset]')];
 function zoomBy(factor){if(visit.active)return;touched=true;cancelApproach();cameraTransition=null;boardOverview=null;const delta=camera.position.clone().sub(controls.target);const distance=THREE.MathUtils.clamp(delta.length()*factor,controls.minDistance,controls.maxDistance);camera.position.copy(controls.target).add(delta.setLength(distance));controls.update();paint();wake();}
 viewButtons.forEach(button=>button.addEventListener('click',()=>{if(button.hasAttribute('data-studio-reset'))resetView();else zoomBy(button.dataset.studioZoom==='in'?.8:1.25);}));
 canvas.addEventListener('dblclick',()=>{if(!visit.active)resetView();});
 motionButton?.addEventListener('click',()=>{userPaused=!userPaused;updateMotionButton();wake();});
 motion.addEventListener('change',()=>{userPaused=motion.matches;seasonClock.setReducedMotion(motion.matches);applySeason(true);if(motion.matches){if(approachRunning){cancelApproach();exteriorScale=closeViewScale();applyExteriorView();controls.update();}day=targetDay;transitionElapsed=3.2;applyDay();renderer.shadowMap.needsUpdate=true;}updateMotionButton();wake();});
 window.addEventListener('portfolio-language-changed',updateMotionButton);
 function showRearBoard(){if(visit.active)return;touched=true;cancelApproach();cameraTransition=null;boardOverview=null;controls.minDistance=15*fit;controls.target.set(0,1.9,-.2);camera.position.set(17.6,12.4,-25).sub(controls.target).multiplyScalar(fit).add(controls.target);controls.update();settleRemaining=.45;wake();}
 function showContributions(){if(visit.active)return;boardOverview=null;const target=new THREE.Vector3(-1.738,1.82,-2.77),offset=new THREE.Vector3(-2.76,2.6,-10.5).multiplyScalar(Math.max(1,1.35/camera.aspect));moveCamera(target.clone().add(offset),target,6);}
 const boardToggle=host.querySelector('[data-studio-board-toggle]');
 const boardActions=[{group:campusBoard.group,hitMeshes:campusBoard.hitTargets,label:'Flip UW–Madison card',element:boardToggle,enabled:()=>!visit.active,onFocus(){if(visit.active)return;if(campusBoard.flipped)focusBoard();else showRearBoard();},activate(){if(!visit.active)toggleBoard();}}];
 if(campusBoard.sourceTarget)boardActions.push({group:campusBoard.sourceTarget,hitMeshes:[campusBoard.sourceTarget],label:'UW–Madison ranking source',enabled:()=>!visit.active&&campusBoard.flipped&&!campusBoard.moving,activate(){document.querySelector('#uw-flip-card .uw-mini-source')?.click();}});
 boardActions.push({id:'studio-door',group:studioDoor.group,hitMeshes:[studioEntryHit,...studioDoor.hitMeshes],label:'Enter AI studio',element:enterButton,enabled:()=>!visit.active,activate:visit.enter});
 contributionWall.actions.forEach(action=>{action.enabled=()=>!visit.active;action.onFocus=showContributions;});boardActions.push(...contributionWall.actions);
 exploration=createStudioExplore({THREE,studioGroup,camera,controls,canvas,visit,wake,onActivity(){settleRemaining=.2;wake();}});
 exploration.actions.forEach(action=>{action.element=walkButtons.find(button=>'walk-'+button.dataset.studioWalk===action.id);});
 boardActions.push(...exploration.actions);
 navigationInput=connectNavigation({THREE,scene,camera,canvas,navigation,actions:boardActions,onActivity(){touched=true;settleRemaining=.45;wake();},onGesture(){cancelApproach();cameraTransition=null;boardOverview=null;}});
 host.addEventListener('studio-board-change',()=>{settleRemaining=.45;wake();});
 document.addEventListener('visibilitychange',()=>{previous=0;if(document.hidden&&rafId){cancelAnimationFrame(rafId);rafId=0;}else wake();});
 const observer=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(!inView&&rafId){cancelAnimationFrame(rafId);rafId=0;}else wake();},{threshold:.01});observer.observe(host);
 const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;prepared=false;warmupGeneration++;visit.exit({immediate:true});day=targetDay;transitionElapsed=3.2;applyDay();host.dataset.state='fallback';host.dataset.ready='false';enterButton.disabled=true;if(motionButton)motionButton.disabled=true;if(boardToggle)boardToggle.disabled=true;viewButtons.forEach(b=>b.disabled=true);if(rafId)cancelAnimationFrame(rafId);rafId=0;});
 canvas.addEventListener('webglcontextrestored',()=>{contextLost=false;renderer.shadowMap.needsUpdate=true;warmScene().catch(error=>{host.dataset.state='fallback';console.warn('Studio restoration unavailable; using still artwork.',error);});});
 window.addEventListener('pagehide',event=>{if(event.persisted)return;disposed=true;cancelAnimationFrame(rafId);resizeObserver.disconnect();observer.disconnect();themeObserver.disconnect();document.removeEventListener('keydown',escapeVisit);exploration.dispose();visit.dispose();navigationInput.dispose();campusBoard.dispose?.();contributionWall.dispose();streetLife.dispose();controls.dispose();renderer.dispose();},{once:true});
 // Compile and upload while the intro or still artwork covers the canvas.
 // The camera approach and season clock begin only after the intro exits.
 async function warmScene(){
 const generation=++warmupGeneration,current=()=>!disposed&&!contextLost&&generation===warmupGeneration;
 seasonClock.setTheme(day===1);seasonClock.setReducedMotion(motion.matches);applySeason(true);
 resize();updateMotionButton();paint(elapsed);
 scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
 await renderer.compileAsync(scene,camera);
 if(!current())return;
 const textures=new Set();
 scene.traverse(object=>{for(const material of [object.material].flat().filter(Boolean)){for(const value of Object.values(material))if(value?.isTexture&&!value.isRenderTargetTexture)textures.add(value);}});
 let uploadStart=performance.now();
 for(const texture of textures){renderer.initTexture(texture);if(performance.now()-uploadStart>6){await yieldStartup();if(!current())return;uploadStart=performance.now();}}
 await yieldStartup();
 if(!current())return;
 // If layout changes during presentation, warm the new size before revealing.
 let renderedRevision;
 do{
  renderedRevision=visualRevision;paint(elapsed);renderer.render(scene,camera);
  await new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));
 }while(current()&&renderedRevision!==visualRevision);
 if(!current())return;
 prepared=true;
 performance.mark('studio-prepared');performance.measure('studio-preparation','studio-prepare-start','studio-prepared');
 host.dataset.state='ready';host.dataset.ready='true';enterButton.disabled=false;if(motionButton)motionButton.disabled=false;if(boardToggle)boardToggle.disabled=false;viewButtons.forEach(b=>b.disabled=false);host.dispatchEvent(new Event('studio-ready'));wake();
 window.__studio={scene,camera,renderer,controls,water,animators,host,resetView,showRearBoard,showContributions,contributionWall,campus,campusBoard,mascot,navigation,navigationInput,studioDoor,studioGlazing,studioGroup,welcomeSign,lectern,visit,exploration,seasons,snow,snowfall,seasonClock,streetLife,get approach(){return {running:approachRunning,elapsed:approachElapsed,duration:approachDuration,scale:exteriorScale};},get day(){return day;},get time(){return elapsed;},get paused(){return userPaused;},get inView(){return inView;},get stats(){return {drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles};}};
 }
 await warmScene();
}
