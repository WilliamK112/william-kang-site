// Physical, raycastable navigation keys. Event handling belongs to the host scene.
export function buildNavigation(api, {links = [], parent = api.scene, scale = .26, columnPitch = .74, rowPitch = .51, enabled, onFocus} = {}) {
  const {THREE,scene,mat,panel,cyl}=api;
  const root=new THREE.Group();root.name='Lectern navigation keycaps';root.userData.dynamic=true;parent.add(root);
  const keys=[];
  const palettes=[
    {top:0xe5d9ba,side:0xb5a88a,text:'#293e49',accent:0x86baaa},
    {top:0xa64b4d,side:0x743a43,text:'#fff0d6',accent:0xe3bd83},
    {top:0x8fb5a4,side:0x587f79,text:'#203f43',accent:0xe0d9ac},
    {top:0x3b5967,side:0x263d4c,text:'#e9e8d3',accent:0x9acabb}
  ];
  const socketMaterial=mat(0x182f3c,0x47767e,.035).clone();
  const collarMaterial=mat(0x3b515a,0x47767e,.04).clone();
  const screwMaterial=mat(0x81918d,0x9ca38c,.035).clone();

  function roundedOutline(w,d,r,steps=5) {
    const points=[];
    for(const [cx,cz,a] of [[w/2-r,d/2-r,0],[-w/2+r,d/2-r,Math.PI/2],[-w/2+r,-d/2+r,Math.PI],[w/2-r,-d/2+r,Math.PI*1.5]]){
      for(let i=0;i<=steps;i++){const angle=a+i/steps*Math.PI/2;points.push([cx+Math.cos(angle)*r,cz+Math.sin(angle)*r]);}
    }
    return points;
  }
  function sculptedGeometry(rings) {
    const vertices=[],indices=[],groups=[],n=roundedOutline(rings[0].w,rings[0].d,rings[0].r).length;
    for(const ring of rings)for(const [x,z] of roundedOutline(ring.w,ring.d,ring.r))vertices.push(x,ring.y-(ring.slope||0)*z,z);
    for(let band=0;band<rings.length-1;band++){
      const start=indices.length;
      for(let i=0;i<n;i++){const j=(i+1)%n,a=band*n+i,b=(band+1)*n+i,an=band*n+j,bn=(band+1)*n+j;indices.push(a,b,bn,a,bn,an);}
      groups.push({start,count:indices.length-start,materialIndex:band===rings.length-2?1:0});
    }
    const bottomCenter=vertices.length/3;vertices.push(0,rings[0].y,0);
    let start=indices.length;
    for(let i=0;i<n;i++)indices.push(bottomCenter,i,(i+1)%n);
    groups.push({start,count:indices.length-start,materialIndex:0});
    const topCenter=vertices.length/3,topOffset=(rings.length-1)*n;vertices.push(0,rings.at(-1).y,0);start=indices.length;
    for(let i=0;i<n;i++)indices.push(topCenter,topOffset+(i+1)%n,topOffset+i);
    groups.push({start,count:indices.length-start,materialIndex:1});
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);
    groups.forEach(g=>geometry.addGroup(g.start,g.count,g.materialIndex));geometry.computeVertexNormals();return geometry;
  }
  const socketGeometry=sculptedGeometry([
    {w:2.31,d:1.63,r:.18,y:.034},
    {w:2.40,d:1.72,r:.19,y:.064},
    {w:2.37,d:1.69,r:.18,y:.105},
    {w:2.22,d:1.54,r:.16,y:.135}
  ]);
  const capGeometry=sculptedGeometry([
    {w:2.15,d:1.42,r:.15,y:.035},
    {w:2.23,d:1.50,r:.16,y:.090},
    {w:2.16,d:1.44,r:.15,y:.180,slope:.08},
    {w:1.97,d:1.26,r:.14,y:.386,slope:.12},
    {w:1.89,d:1.18,r:.13,y:.412,slope:.12}
  ]);
  const slopeAngle=Math.atan(.12);

  links.slice(0,4).forEach((link,index)=>{
    const palette=palettes[index],name=String(link.label||link.id||`Link ${index+1}`);
    const keyGroup=new THREE.Group();keyGroup.name=`${name} navigation key`;keyGroup.position.set((index%2-.5)*columnPitch,0,(Math.floor(index/2)-.5)*rowPitch);keyGroup.scale.setScalar(scale);keyGroup.userData.dynamic=true;keyGroup.userData.navigationIndex=index;keyGroup.userData.navigationId=link.id||name;root.add(keyGroup);
    const socket=new THREE.Mesh(socketGeometry,[socketMaterial,collarMaterial]);socket.name='Recessed mechanical socket';socket.castShadow=socket.receiveShadow=true;keyGroup.add(socket);
    for(const x of [-1.025,1.025]){
      const screw=cyl(.021,.008,x,.121,.758,screwMaterial,keyGroup,10);screw.name='Socket fixing';
    }
    const cap=new THREE.Group();cap.name=`${name} moving cap`;cap.position.y=.145;cap.userData.dynamic=true;keyGroup.add(cap);
    const sideMaterial=mat(palette.side,0xdfbd91,.06).clone();
    const topMaterial=mat(palette.top,0xf0cda2,.105).clone();
    const accentMaterial=mat(palette.accent,palette.accent,.18).clone();
    const body=new THREE.Mesh(capGeometry,[sideMaterial,topMaterial]);body.name='Sculpted double-bevel keycap';body.castShadow=body.receiveShadow=true;cap.add(body);

    // The printing follows the sloped top, with transparent margins and generous type.
    const topLabel=panel(1.75,1.07,0,.418,0,(ctx,W,H)=>{
      ctx.clearRect(0,0,W,H);
      ctx.fillStyle=palette.text;ctx.textAlign='left';ctx.textBaseline='middle';ctx.globalAlpha=.76;
      ctx.font=`600 ${W*.059}px "Arial",sans-serif`;ctx.fillText(String(index+1).padStart(2,'0'),W*.18,H*.145);
      ctx.strokeStyle=palette.text;ctx.lineWidth=W*.009;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(W*.80,H*.235);ctx.lineTo(W*.887,H*.098);ctx.moveTo(W*.800,H*.098);ctx.lineTo(W*.887,H*.098);ctx.lineTo(W*.887,H*.234);ctx.stroke();
      ctx.globalAlpha=1;ctx.textAlign='center';
      const fontSize=Math.min(W*.167,W*.88/(Math.max(name.length,1)*.59));
      ctx.font=`700 ${fontSize}px "Arial",sans-serif`;ctx.fillText(name,W*.5,H*.565,W*.95);
      ctx.globalAlpha=.36;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(W*.19,H*.835);ctx.lineTo(W*.81,H*.835);ctx.stroke();ctx.globalAlpha=1;
    },cap);topLabel.rotation.x=-Math.PI/2+slopeAngle;topLabel.name=`${name} top lettering`;
    const frontLabel=panel(1.60,.086,0,.102,.754,(ctx,W,H)=>{
      ctx.clearRect(0,0,W,H);ctx.fillStyle=palette.text;ctx.globalAlpha=.74;ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.font=`600 ${Math.min(H*.77,95)}px "Arial",sans-serif`;ctx.fillText(name,W*.5,H*.52,W*.88);ctx.globalAlpha=1;
    },cap);frontLabel.name=`${name} front engraving`;
    const led=cyl(.025,.012,-.675,.472,-.403,accentMaterial,cap,16);led.rotation.x=slopeAngle;led.name='Inset indicator lamp';
    const trimPoints=roundedOutline(1.977,1.267,.143).map(([x,z])=>new THREE.Vector3(x,.390-.12*z,z));
    const trimGeo=new THREE.BufferGeometry().setFromPoints(trimPoints);
    const trim=new THREE.LineLoop(trimGeo,new THREE.LineBasicMaterial({color:palette.side,transparent:true,opacity:.43}));trim.name='Fine keycap shoulder trim';cap.add(trim);
    const hitMeshes=[body,socket,topLabel,frontLabel];hitMeshes.forEach(mesh=>{mesh.userData.navigationIndex=index;mesh.userData.navigationId=link.id||name;});
    keys.push({group:keyGroup,cap,hitMeshes,link,homeY:cap.position.y,material:topMaterial,accentMaterial,sideMaterial,label:name,labelMesh:topLabel,frontLabel,baseColor:topMaterial.color.clone(),enabled:link.enabled??enabled,onFocus:link.onFocus??onFocus});
  });
  return {group:root,keys,dimensions:{width:columnPitch+2.40*scale,depth:rowPitch+1.72*scale}};
}
