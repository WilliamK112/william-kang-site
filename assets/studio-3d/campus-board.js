// The existing About-section Wisconsin card, mounted as a physical flipboard.
// The host owns input, animation scheduling, camera focus and source-link opening.
export function buildCampusBoard({THREE, scene, mat}, {parent=scene}={}) {
  const group=new THREE.Group();
  group.name='UW–Madison rear-wall flipboard';
  group.userData.dynamic=true;
  group.position.set(4.947,4.24,-5.90);
  group.rotation.y=Math.PI;
  // Coordinates above are world-space even if the caller supplies hallGroup.
  scene.add(group);
  if(parent!==scene){parent.updateWorldMatrix(true,false);parent.attach(group);}

  const wood=mat(0xb39e79),frame=mat(0x586c70),bronze=mat(0xa58d62);
  const edge=mat(0xd9ccb1,0xc2ac7d,.035);
  const bodyGeometry=new THREE.BoxGeometry(1,1,1);
  const ownedMaterials=[],ownedTextures=[],ownedGeometries=[bodyGeometry];
  function box(w,h,d,x,y,z,material,owner=group){
    const object=new THREE.Mesh(bodyGeometry,material);
    object.position.set(x,y,z);object.scale.set(w,h,d);
    object.castShadow=object.receiveShadow=true;owner.add(object);return object;
  }
  // A shallow fixed wall frame and sliding side arms explain the flip mechanism.
  for(const x of [-1.98,1.98])box(.095,1.99,.060,x,0,.022,frame);
  for(const y of [-.955,.955])box(4.05,.085,.060,0,y,.022,frame);
  const arms=[];
  for(const x of [-1.97,1.97]){
    box(.19,.32,.062,x,0,.025,bronze);
    arms.push(box(.065,.068,.08,x,0,.06,frame));
  }
  const carrier=new THREE.Group();carrier.name='Sliding flipboard axle';group.add(carrier);
  const rotating=new THREE.Group();rotating.name='Two-sided Wisconsin card';carrier.add(rotating);
  const body=box(3.75,1.80,.085,0,0,0,wood,rotating);
  for(const x of [-1.835,1.835])box(.075,1.80,.096,x,0,0,edge,rotating);
  for(const y of [-.8625,.8625])box(3.75,.075,.096,0,y,0,edge,rotating);
  const pinGeometry=new THREE.CylinderGeometry(.054,.054,.19,12);ownedGeometries.push(pinGeometry);
  for(const x of [-1.92,1.92]){
    const pin=new THREE.Mesh(pinGeometry,bronze);pin.rotation.z=Math.PI/2;pin.position.x=x;carrier.add(pin);
  }

  const original=document.getElementById('uw-flip-card');
  const host=document.getElementById('studio-scene');
  const keyboardButton=document.querySelector('[data-studio-board-toggle]');
  const read=(selector,fallback='')=>original?.querySelector(selector)?.textContent?.trim()||fallback;
  const sourceAnchor=original?.querySelector('.uw-mini-source');
  const sourceHref=sourceAnchor?.href||'';
  const logo=original?.querySelector('.uw-flip-front img')||new Image();
  if(!logo.src)logo.src=new URL('../wisconsin_logo_transparent_only_W_white-dc13339c-e36a-4f86-85ca-242fa3512993.png',import.meta.url).href;

  function canvasFace(name,owner,z){
    const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=1024;
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    texture.anisotropy=4;ownedTextures.push(texture);
    const material=new THREE.MeshBasicMaterial({map:texture,toneMapped:false});ownedMaterials.push(material);
    const geometry=new THREE.PlaneGeometry(3.60,1.65);ownedGeometries.push(geometry);
    const plane=new THREE.Mesh(geometry,material);plane.name=name;plane.position.z=z;owner.add(plane);
    return {plane,canvas,texture,ctx:canvas.getContext('2d')};
  }
  const front=canvasFace('Wisconsin logo side',rotating,.050);
  const reverse=new THREE.Group();reverse.rotation.x=Math.PI;reverse.position.z=-.050;rotating.add(reverse);
  const back=canvasFace('Original UW–Madison CS Edge content',reverse,0);

  function rounded(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
  function fitText(ctx,text,x,y,maxWidth,size,weight='500',align='left'){
    ctx.textAlign=align;ctx.textBaseline='middle';ctx.font=`${weight} ${size}px Arial, "Microsoft YaHei", sans-serif`;
    while(ctx.measureText(text).width>maxWidth&&size>22){size--;ctx.font=`${weight} ${size}px Arial, "Microsoft YaHei", sans-serif`;}
    ctx.fillText(text,x,y,maxWidth);
  }
  function wrapped(ctx,text,x,y,width,size,lineHeight,maxLines=2){
    ctx.font=`500 ${size}px Arial, "Microsoft YaHei", sans-serif`;ctx.textAlign='left';ctx.textBaseline='middle';
    const words=/\s/.test(text)?text.split(/\s+/):[...text],separator=/\s/.test(text)?' ':'';
    const lines=[];let line='';
    for(const word of words){const candidate=line?line+separator+word:word;if(line&&ctx.measureText(candidate).width>width){lines.push(line);line=word;}else line=candidate;}
    if(line)lines.push(line);
    lines.slice(0,maxLines).forEach((text,index)=>ctx.fillText(text,x,y+index*lineHeight,width));
  }
  function repaint(){
    const c=front.ctx,W=2048,H=1024;
    const gradient=c.createLinearGradient(0,0,W,H);gradient.addColorStop(0,'#edd9df');gradient.addColorStop(.48,'#e0e3ec');gradient.addColorStop(1,'#d4e9dd');
    c.fillStyle=gradient;c.fillRect(0,0,W,H);
    const light=c.createRadialGradient(W*.48,H*.43,10,W*.48,H*.43,W*.55);light.addColorStop(0,'rgba(255,252,236,.9)');light.addColorStop(1,'rgba(255,252,236,0)');c.fillStyle=light;c.fillRect(0,0,W,H);
    if(logo.complete&&logo.naturalWidth){
      // Crop only the source asset's transparent margins; the logo is unchanged.
      c.drawImage(logo,182,122,536,356,502,90,1044,694);
    }else{
      c.fillStyle='#a92332';fitText(c,'WISCONSIN',W/2,H*.42,W*.8,150,'700','center');
    }
    c.fillStyle='rgba(255,255,250,.65)';rounded(c,730,865,588,94,47);c.fill();
    c.fillStyle='#6c4f57';fitText(c,read('.uw-flip-hint','Click to flip'),W/2,912,520,43,'700','center');
    c.strokeStyle='rgba(155,101,104,.28)';c.lineWidth=3;rounded(c,24,24,W-48,H-48,22);c.stroke();
    front.texture.needsUpdate=true;

    const b=back.ctx;b.fillStyle='#f3eedf';b.fillRect(0,0,W,H);
    b.fillStyle='#a44b51';b.fillRect(0,0,26,H);
    b.fillStyle='#314650';fitText(b,read('.uw-mini-title'),106,103,1830,88,'700');
    b.fillStyle='#617278';fitText(b,read('.uw-mini-standing'),108,198,1815,47);
    const ranks=[...(original?.querySelectorAll('.uw-mini-ranks > span')||[])].map(node=>node.textContent.trim());
    ranks.forEach((rank,index)=>{
      const row=index<3?0:1,column=index<3?index:index-3;
      const x=108+column*615,y=265+row*199,w=582;
      b.fillStyle=index===2?'#dce9de':'#e7e4d9';rounded(b,x,y,w,181,18);b.fill();
      b.strokeStyle='#cbd0c2';b.lineWidth=2;b.stroke();
      const number=rank.match(/\d+/)?.[0]||'';
      const label=rank.replace(/#\d+|第\d+名/, '').trim();
      b.fillStyle='#995057';fitText(b,number?'#'+number:rank,x+w/2,y+54,w-44,94,'700','center');
      b.fillStyle='#405750';fitText(b,label,x+w/2,y+139,w-42,52,'600','center');
    });
    const points=[...(original?.querySelectorAll('.uw-mini-points > span')||[])].map(node=>node.textContent.trim());
    points.forEach((text,index)=>{
      const y=718+index*97;b.fillStyle='#a44b51';b.beginPath();b.arc(122,y,7,0,Math.PI*2);b.fill();
      b.fillStyle='#51636a';wrapped(b,text,148,y,1770,47,51,2);
    });
    b.strokeStyle='#cbc8bb';b.lineWidth=2;b.beginPath();b.moveTo(108,907);b.lineTo(1940,907);b.stroke();
    b.fillStyle='#866b49';fitText(b,read('.uw-mini-source'),1024,957,1780,42,'600','center');
    b.beginPath();b.moveTo(530,988);b.lineTo(1518,988);b.strokeStyle='#b29f7b';b.stroke();
    back.texture.needsUpdate=true;
    host?.dispatchEvent(new Event('studio-board-change'));
  }
  logo.addEventListener('load',repaint);
  window.addEventListener('portfolio-language-changed',repaint);
  repaint();

  // A distinct, outward-facing hit plane coincides with the source line only.
  const sourceGeometry=new THREE.PlaneGeometry(3.15,.155);ownedGeometries.push(sourceGeometry);
  const sourceMaterial=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false});ownedMaterials.push(sourceMaterial);
  const sourceTarget=new THREE.Mesh(sourceGeometry,sourceMaterial);sourceTarget.name='Original UW source link';
  sourceTarget.position.set(0,-.717,.004);reverse.add(sourceTarget);

  let angle=0,target=0,isMoving=false;
  function applyTransform(){
    rotating.rotation.x=angle;
    const distance=.080+.900*Math.abs(Math.sin(angle));carrier.position.z=distance;
    arms.forEach(arm=>{arm.position.z=distance/2;arm.scale.z=distance;});
    sourceTarget.visible=target>0&&!isMoving;
    if(keyboardButton)keyboardButton.setAttribute('aria-pressed',String(target>0));
  }
  function toggle(){target=target===0?Math.PI:0;isMoving=true;applyTransform();host?.dispatchEvent(new Event('studio-board-change'));return target>0;}
  function update(dt=0,reducedMotion=false){
    if(!isMoving)return false;
    if(reducedMotion)angle=target;
    else angle+=(target-angle)*(1-Math.exp(-9*Math.max(0,Math.min(.12,Number(dt)||0))));
    if(Math.abs(target-angle)<.0005){angle=target;isMoving=false;}
    applyTransform();return isMoving;
  }
  applyTransform();
  function setDay(value){const shade=.78+Math.max(0,Math.min(1,Number(value)||0))*.22;front.plane.material.color.setScalar(shade);back.plane.material.color.setScalar(shade);}
  function dispose(){
    logo.removeEventListener('load',repaint);window.removeEventListener('portfolio-language-changed',repaint);
    ownedTextures.forEach(texture=>texture.dispose());ownedMaterials.forEach(material=>material.dispose());ownedGeometries.forEach(geometry=>geometry.dispose());group.removeFromParent();
  }
  return {group,hitTargets:[front.plane,back.plane,body],toggle,update,setDay,sourceTarget,sourceHref,
    get flipped(){return target>0;},get moving(){return isMoving;},dispose};
}
