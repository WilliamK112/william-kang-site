// A fixed outdoor gallery. Canvas logo faces and baked uplight washes keep this
// inexpensive: no new shadow maps, realtime lights, or animation loop.
export async function buildContributionWall({THREE,studioGroup,mat},{links}){
 const group=new THREE.Group();group.name='Open-source contribution gallery';
 group.position.set(-.1,2.07,-3.705);group.rotation.y=Math.PI;studioGroup.add(group);
 const geometries=[],materials=[],textures=[],cards=[],washes=[],lenses=[];
 const unit=new THREE.BoxGeometry(1,1,1);geometries.push(unit);
 const brass=mat(0x958970),wood=mat(0x9c8264),frame=mat(0x344f56),paper=mat(0xe2dac4);
 function block(w,h,d,x,y,z,material,parent=group){const mesh=new THREE.Mesh(unit,material);mesh.scale.set(w,h,d);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 function face(w,h,x,y,z,draw){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=Math.round(1024*h/w);
  draw(canvas.getContext('2d'),canvas.width,canvas.height);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;textures.push(texture);
  const material=new THREE.MeshBasicMaterial({map:texture,toneMapped:false});materials.push(material);
  const geometry=new THREE.PlaneGeometry(w,h);geometries.push(geometry);
  const mesh=new THREE.Mesh(geometry,material);mesh.userData.dynamic=true;mesh.position.set(x,y,z);group.add(mesh);return mesh;
 }
 function text(c,value,x,y,size,color='#324b50',weight=600){c.fillStyle=color;c.font=`${weight} ${size}px Arial,sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(value,x,y);}
 block(6.92,2.78,.085,0,0,-.005,wood);
 for(const x of [-3.435,3.435])block(.07,2.83,.16,x,0,.033,frame);
 for(const y of [-1.40,1.40])block(6.94,.07,.16,0,y,.033,frame);
 const heading=face(6.30,.26,0,1.12,.052,(c,W,H)=>{c.fillStyle='#9c8264';c.fillRect(0,0,W,H);text(c,'BUILDING IN OPEN SOURCE',W/2,H/2,H*.65,'#f6f0dc',700);});
 const definitions=[
  {id:'github',name:'GitHub',project:'github / docs',summary:'Clearer private Actions reuse',pr:'#43969',tint:'#e6e7db'},
  {id:'docker',name:'Docker',project:'docker / cli',summary:'Respecting NO_COLOR',pr:'#6957',tint:'#dce8e5'},
  {id:'microsoft',name:'Microsoft',project:'microsoft / apm',summary:'Safer plugin deployment',pr:'#1971',tint:'#eee1d0'}
 ];
 async function loadLogo(id){const image=new Image();image.src=new URL(`./contribution-logos/${id}.svg`,import.meta.url).href;try{await image.decode();return image;}catch{return null;}}
 const logos=await Promise.all(definitions.map(item=>loadLogo(item.id)));
 const actions=definitions.map((item,index)=>{
  const x=(index-1)*2.18,anchor=links.find(link=>link.id===item.id)?.anchor;
  block(1.99,2.14,.065,x,-.13,.064,paper);
  for(const corner of [-1,1])block(.024,.05,.011,x+corner*.92,-1.10,.104,brass);
  const mesh=face(1.90,2.04,x,-.13,.101,(c,W,H)=>{
   c.fillStyle=item.tint;c.fillRect(0,0,W,H);
   text(c,'OPEN-SOURCE CONTRIBUTION',W/2,H*.055,27,'#647879',600);
   const logo=logos[index];
   if(logo){const scale=Math.min(W*.69/logo.naturalWidth,H*.39/logo.naturalHeight),w=logo.naturalWidth*scale,h=logo.naturalHeight*scale;c.drawImage(logo,(W-w)/2,H*.285-h/2,w,h);}
   else text(c,item.name,W/2,H*.285,122,'#304b54',700);
   text(c,item.name,W/2,H*.55,item.id==='microsoft'?79:91,'#293f48',700);
   text(c,item.project,W/2,H*.64,35,'#6c7770',500);
   c.strokeStyle='#b1beb1';c.lineWidth=2;c.beginPath();c.moveTo(W*.10,H*.70);c.lineTo(W*.90,H*.70);c.stroke();
   text(c,item.summary,W/2,H*.775,36,'#425e5a',500);
   c.fillStyle='#d0dfca';c.beginPath();c.roundRect(W*.14,H*.853,W*.72,H*.080,20);c.fill();
   text(c,`MERGED PR ${item.pr}  ↗`,W/2,H*.895,36,'#36594f',700);
  });
  mesh.name=`${item.name} contribution link`;
  const label=`${item.name} · merged contribution ${item.pr}`;
  // The shared controller activates native anchors synchronously for popup allowance.
  const action={id:`contribution-${item.id}`,group:mesh,hitMeshes:[mesh],element:anchor,label,link:{id:item.id,label,anchor}};
  cards.push({id:action.id,mesh});return action;
 });
 const washCanvas=document.createElement('canvas');washCanvas.width=256;washCanvas.height=512;
 const ctx=washCanvas.getContext('2d'),pixels=ctx.createImageData(256,512);
 for(let y=0;y<512;y++)for(let x=0;x<256;x++){
  const v=y/511,u=(x-127.5)/127.5,width=.13+(1-v)*.90;
  const edge=Math.max(0,1-Math.abs(u)/width),alpha=Math.pow(edge,1.5)*Math.sin(Math.PI*(.07+.88*v))*.70;
  const offset=(y*256+x)*4;pixels.data.set([255,202,117,Math.round(alpha*255)],offset);
 }
 ctx.putImageData(pixels,0,0);const washTexture=new THREE.CanvasTexture(washCanvas);textures.push(washTexture);
 function wash(w,h,x,y,z,rotation=0){const geometry=new THREE.PlaneGeometry(w,h);geometries.push(geometry);const material=new THREE.MeshBasicMaterial({map:washTexture,transparent:true,opacity:.34,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});materials.push(material);const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.rotation.x=rotation;mesh.userData.dynamic=true;mesh.userData.themeControlled=true;group.add(mesh);washes.push(mesh);return mesh;}
 for(const x of [-1.65,2.38]){
  // Gallery coordinates face the lake; the fixture stays on clear paving.
  const floorY=-2.07+.065,z=.72;
  block(.37,.075,.33,x,floorY,z,frame);
  block(.27,.12,.25,x,floorY+.07,z+.014,frame);
  const lampMaterial=mat(0xffdda6,0xffbe71,1.5).clone();materials.push(lampMaterial);lenses.push(lampMaterial);
  const lens=block(.235,.018,.18,x,floorY+.139,z-.016,lampMaterial);lens.rotation.x=-.42;lens.userData.dynamic=true;
  wash(2.65,3.12,x,-.105,.15);
  wash(.64,.86,x,-2.07+.030,.61,-Math.PI/2);
 }
 let day=0,hovered=null;
 function setDay(value){day=THREE.MathUtils.clamp(value,0,1);washes.forEach((mesh,index)=>mesh.material.opacity=(index%2===0?.26:.31)*(1-day*.98));lenses.forEach(material=>material.emissiveIntensity=1.45*(1-day*.95));repaintShades();}
 function repaintShades(){heading.material.color.setScalar(.86+.14*day);cards.forEach(card=>card.mesh.material.color.setScalar(card.id===hovered?1:.84+.16*day));}
 function setHovered(id){const next=cards.some(card=>card.id===id)?id:null;if(next!==hovered){hovered=next;repaintShades();}}
 setDay(0);
 return {group,actions,cards,setDay,setHovered,logoStatus:definitions.map((item,index)=>({id:item.id,loaded:Boolean(logos[index])})),dispose(){textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());group.removeFromParent();}};
}
