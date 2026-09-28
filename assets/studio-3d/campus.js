import {buildCrest} from './crest.js';
import {buildLake} from './lake.js';

// An original UW-inspired campus courtyard, not a replica of a particular building.
export async function buildCampus(api) {
  const {THREE,scene,box,cyl,sphere,rod,tube,torus,group,mat,panel,label,glow,animators}=api;
  const brick=mat(0x985a51,0xa97050,.035),brickDark=mat(0x774e4b,0xa36f51,.02);
  const sandstone=mat(0xcdbb94,0xdfb985,.075),stone=mat(0xa5aaa0);
  const roof=mat(0x3c545d),metal=mat(0x526f73),dark=mat(0x243d48),wood=mat(0xab845b);
  const red=mat(0xad414a,0xc67a62,.035),leafMats=[mat(0x668a66),mat(0x809769),mat(0x457e73)];
  const windowMat=new THREE.MeshToonMaterial({color:0x9eb8b0,emissive:0xffd29a,emissiveIntensity:.52});
  let dayAmount=0;
  const campusGroup=group();campusGroup.name='UW-inspired campus courtyard';
  const hallScaleX=.66;
  function collectInto(target,...keep){
    const excluded=new Set([target,...keep]);
    for(const object of [...campusGroup.children])if(!excluded.has(object))target.add(object);
  }

  // The redbrick academic wing steps up behind the glass studio, creating depth.
  box(8.08,.26,2.99,.45,.10,-5.56,stone,campusGroup);
  const entranceX=.2273,doorLeft=entranceX-1.30,doorRight=entranceX+1.30;
  // Masonry is genuinely split around the door void, with a deep vestibule behind it.
  box(doorLeft+3.45,5.55,2.70,(-3.45+doorLeft)/2,2.925,-5.55,brick,campusGroup);
  box(4.35-doorRight,5.55,2.70,(4.35+doorRight)/2,2.925,-5.55,brick,campusGroup);
  box(2.60,2.80,2.70,entranceX,4.30,-5.55,brick,campusGroup);
  // Close the rear of the front vestibule, leaving only a modest recessed service exit.
  const rearDoorWidth=1.42,rearPierWidth=(2.60-rearDoorWidth)/2;
  for(const side of [-1,1])box(rearPierWidth,2.75,.22,entranceX+side*(rearDoorWidth+rearPierWidth)/2,1.525,-6.79,brick,campusGroup,false);
  box(rearDoorWidth,.45,.22,entranceX,2.675,-6.79,brick,campusGroup,false);
  box(rearDoorWidth,.11,.22,entranceX,.205,-6.79,sandstone,campusGroup,false);
  for(const [cx,w] of [[(-3.52+doorLeft)/2,doorLeft+3.52],[(4.42+doorRight)/2,4.42-doorRight]]){
    box(w,.20,2.85,cx,.42,-5.55,sandstone,campusGroup);
    box(w,.14,2.85,cx,2.70,-5.55,sandstone,campusGroup);
  }
  box(8.01,.20,2.90,.45,5.73,-5.55,sandstone,campusGroup);
  box(7.98,.065,2.96,.45,5.575,-5.55,sandstone,campusGroup,false);
  box(8.15,.15,3.06,.45,5.88,-5.55,roof,campusGroup);
  // Delicate mortar lines are one geometry rather than hundreds of draw calls.
  const mortar=[];
  for(let row=0;row<28;row++){
    const y=.47+row*.184;
    if(y<2.90)mortar.push(-3.44,y,-4.188,doorLeft,y,-4.188,doorRight,y,-4.188,4.34,y,-4.188);
    else mortar.push(-3.44,y,-4.188,4.34,y,-4.188);
    for(let x=-3.44+(row%2)*.20;x<4.30;x+=.40){if(y<2.9&&x>doorLeft&&x<doorRight)continue;mortar.push(x,y,-4.186,x,y+.183,-4.186);}
    mortar.push(4.357,y,-6.88,4.357,y,-4.20);
    for(let z=-6.88+(row%2)*.2;z<-4.2;z+=.4)mortar.push(4.358,y,z,4.358,y+.183,z);
    if(y<2.45)mortar.push(-3.44,y,-6.908,entranceX-rearDoorWidth/2,y,-6.908,entranceX+rearDoorWidth/2,y,-6.908,4.34,y,-6.908);
    else mortar.push(-3.44,y,-6.908,4.34,y,-6.908);
    for(let x=-3.44+(row%2)*.20;x<4.30;x+=.40){if(y<2.45&&Math.abs(x-entranceX)<rearDoorWidth/2)continue;mortar.push(x,y,-6.910,x,y+.183,-6.910);}
  }
  const mortarGeometry=new THREE.BufferGeometry();mortarGeometry.setAttribute('position',new THREE.Float32BufferAttribute(mortar,3));
  campusGroup.add(new THREE.LineSegments(mortarGeometry,new THREE.LineBasicMaterial({color:0xc89b7c,transparent:true,opacity:.25})));
  // Corner quoins and the stone framing make the small masonry convincing.
  for(const x of [-3.40,4.29])for(let y=.68;y<5.63;y+=.59)box(.17,.26,.16,x,y,-4.145,sandstone,campusGroup,false);
  for(const x of [-3.40,4.29])for(let y=.68;y<5.63;y+=.59)box(.17,.26,.16,x,y,-6.925,sandstone,campusGroup,false);
  box(7.97,.15,.13,.45,2.78,-6.955,sandstone,campusGroup,false);
  function tallWindow(x,y,z,w=.71,h=1.31,parent=campusGroup,ry=0) {
    const g=group(x,y,z,ry,parent);
    box(w+.15,h+.19,.086,0,0,0,sandstone,g);
    box(w,h,.027,0,0,.059,dark,g,false);
    box(w-.074,h-.078,.022,0,0,.078,windowMat,g,false);
    box(.033,h-.033,.037,0,0,.100,sandstone,g,false);
    for(const py of [-h*.19,h*.20])box(w-.026,.032,.040,0,py,.10,sandstone,g,false);
    box(w+.24,.105,.22,0,-h/2-.06,.064,sandstone,g);
    box(w+.19,.075,.15,0,h/2+.106,.033,sandstone,g);
  }
  for(const x of [-2.98,3.64])tallWindow(x,4.43,-4.146,.67,1.47);
  for(const x of [-2.38,3.04])tallWindow(x,1.67,-4.144,1.01,1.57);
  for(const z of [-6.20,-4.97])tallWindow(4.36,4.44,z,.64,1.39,campusGroup,Math.PI/2);
  for(const z of [-6.20,-4.97])tallWindow(4.36,1.67,z,.66,1.57,campusGroup,Math.PI/2);

  const vestibule=new THREE.MeshBasicMaterial({color:0x23393d});
  const doorGlass=new THREE.MeshBasicMaterial({color:0x789f99,transparent:true,opacity:.38,depthWrite:false,side:THREE.DoubleSide});
  const bronze=mat(0x8e8064,0xd5af76,.05);
  box(2.55,2.48,.085,entranceX,1.57,-5.12,vestibule,campusGroup,false);
  box(2.55,.09,1.02,entranceX,.285,-4.70,sandstone,campusGroup,false);
  box(1.78,.08,.10,entranceX,2.53,-4.85,windowMat,campusGroup,false);
  for(const dir of [-1,1]){
    const x=entranceX+dir*.56;
    box(1.07,2.11,.026,x,1.382,-4.235,doorGlass,campusGroup,false);
    for(const dx of [-.54,.54])box(.058,2.18,.075,x+dx,1.385,-4.225,bronze,campusGroup);
    for(const y of [.31,2.458])box(1.13,.066,.076,x,y,-4.222,bronze,campusGroup);
    box(1.09,.085,.037,x,.67,-4.179,bronze,campusGroup,false);
    rod([entranceX+dir*.125,1.05,-4.124],[entranceX+dir*.125,1.52,-4.124],.019,sandstone,campusGroup);
    rod([entranceX+dir*.125,1.08,-4.205],[entranceX+dir*.125,1.08,-4.118],.015,bronze,campusGroup);
  }
  box(2.27,.30,.031,entranceX,2.64,-4.237,doorGlass,campusGroup,false);
  box(2.37,.071,.091,entranceX,2.829,-4.19,bronze,campusGroup);
  box(.050,.32,.071,entranceX,2.64,-4.19,bronze,campusGroup,false);
  for(const x of [entranceX-1.29,entranceX+1.29])box(.19,2.70,.25,x,1.62,-4.145,sandstone,campusGroup);
  box(2.75,.11,.41,entranceX,.286,-4.087,sandstone,campusGroup);
  // The portico projects into the court, with columns sitting on the top landing.
  for(const x of [entranceX-1.62,entranceX+1.62]){
    box(.40,.15,.41,x,.375,-3.60,sandstone,campusGroup);
    box(.21,2.32,.22,x,1.61,-3.60,sandstone,campusGroup);
    box(.38,.14,.37,x,2.805,-3.60,sandstone,campusGroup);
  }
  box(3.95,.23,1.22,entranceX,2.99,-3.68,sandstone,campusGroup);
  box(4.11,.105,1.34,entranceX,3.15,-3.68,roof,campusGroup);
  box(3.93,.055,1.26,entranceX,3.228,-3.68,sandstone,campusGroup,false);
  for(const side of [-1,1]){
    const x=entranceX+side*2.02;
    box(.31,.36,.29,x,.41,-3.77,mat(0x76766a),campusGroup);
    cyl(.165,.052,x,.617,-3.77,dark,campusGroup,12);
    for(let k=0;k<5;k++){const a=k*2.4;const shrub=sphere(.135,x+Math.cos(a)*.085,.71+(k%2)*.055,-3.77+Math.sin(a)*.075,leafMats[k%3],campusGroup);shrub.scale.y=.82;}
    box(.23,.36,.14,x,2.09,-4.025,dark,campusGroup);
    box(.16,.235,.022,x,2.09,-3.940,windowMat,campusGroup,false);
    box(.28,.051,.23,x,2.305,-4.014,bronze,campusGroup);
    for(const dx of [-.083,.083])rod([x+dx,1.96,-3.919],[x+dx,2.22,-3.919],.008,dark,campusGroup);
  }

  const rearExit=group(entranceX,0,-6.90,Math.PI,campusGroup);rearExit.name='Recessed rear campus exit';
  const exitPaint=mat(0x4d6767,0x8a9d87,.035);
  box(1.32,2.14,.065,0,1.36,-.018,exitPaint,rearExit);
  box(.82,.59,.025,0,1.91,.030,dark,rearExit,false);
  box(.71,.48,.021,0,1.91,.047,windowMat,rearExit,false);
  box(.040,.49,.034,0,1.91,.067,bronze,rearExit,false);
  box(1.22,.22,.018,0,.50,.028,bronze,rearExit,false);
  for(const x of [-.754,.754])box(.13,2.39,.18,x,1.405,.045,sandstone,rearExit);
  box(1.65,.14,.21,0,2.67,.045,sandstone,rearExit);
  box(1.64,.09,.34,0,.274,.065,sandstone,rearExit);
  rod([-.44,.99,.125],[-.44,1.31,.125],.020,bronze,rearExit);
  for(const y of [1.03,1.27])rod([-.44,y,.025],[-.44,y,.125],.013,bronze,rearExit);
  box(.36,.065,.23,0,2.79,.15,dark,rearExit);
  box(.28,.022,.11,0,2.753,.20,windowMat,rearExit,false);
  box(2.03,.075,.63,0,2.98,.205,roof,rearExit);
  for(const x of [-.66,.66])rod([x,2.70,.07],[x,2.93,.45],.021,metal,rearExit);
  box(2.13,.24,.55,entranceX,.12,-7.115,sandstone,campusGroup);
  box(2.36,.12,.40,entranceX,.06,-7.590,sandstone,campusGroup);

  // A low stepped pediment and an offset clock tower suggest campus architecture.
  const frontRoof=box(6.32,.10,1.62,-.38,6.20,-4.88,roof,campusGroup);frontRoof.rotation.x=.35;
  const rearRoof=box(6.32,.10,1.37,-.38,6.22,-6.23,roof,campusGroup);rearRoof.rotation.x=-.40;
  box(6.43,.12,.17,-.38,6.51,-5.61,sandstone,campusGroup);
  // Solid gable ends sit just inside the roof edges and tuck into both roof slopes.
  const gableProfile=new THREE.Shape();
  gableProfile.moveTo(6.87,5.94);gableProfile.lineTo(5.61,6.47);gableProfile.lineTo(4.10,5.92);gableProfile.closePath();
  const gableGeometry=new THREE.ExtrudeGeometry(gableProfile,{depth:.07,bevelEnabled:false,steps:1});
  for(const x of [-3.52,2.69]){
    const gable=new THREE.Mesh(gableGeometry,brickDark);gable.rotation.y=Math.PI/2;gable.position.x=x;
    gable.castShadow=gable.receiveShadow=true;gable.name='Solid inset masonry gable';campusGroup.add(gable);
  }
  for(const x of [-2.35,.77]){
    box(.82,.48,.52,x,6.335,-4.71,brickDark,campusGroup);
    box(.46,.37,.055,x,6.335,-4.421,sandstone,campusGroup);
    box(.33,.28,.015,x,6.335,-4.387,windowMat,campusGroup,false);
    box(.030,.28,.025,x,6.335,-4.37,sandstone,campusGroup,false);
    const dormerRoof=new THREE.Mesh(new THREE.ConeGeometry(.67,.33,4),roof);dormerRoof.position.set(x,6.74,-4.71);dormerRoof.rotation.y=Math.PI/4;campusGroup.add(dormerRoof);
  }
  // The clock tower sits just beyond the pitched roof's right edge. Its cap
  // still meets the eaves, while the masonry no longer intersects the slope.
  const tower=group(3.52,5.93,-5.75,0,campusGroup);
  box(1.26,.73,1.25,0,.365,0,brickDark,tower);
  for(const x of [-.66,.66])for(const z of [-.66,.66])box(.11,.80,.11,x,.40,z,sandstone,tower);
  box(1.45,.15,1.43,0,.78,0,sandstone,tower);
  const towerRoof=new THREE.Mesh(new THREE.ConeGeometry(1.08,.43,4),roof);towerRoof.position.set(0,1.05,0);towerRoof.rotation.y=Math.PI/4;tower.add(towerRoof);
  cyl(.042,.13,0,1.335,0,sandstone,tower,10);sphere(.055,0,1.438,0,sandstone,tower);
  for(const ry of [0,Math.PI/2]){
    const clockFace=group(ry? .635:0,.355,ry?0:.635,ry,tower);
    panel(.66,.66,0,0,.013,(c,W,H)=>{
      c.fillStyle='#e3d7b3';c.beginPath();c.arc(W/2,H/2,W*.49,0,Math.PI*2);c.fill();c.strokeStyle='#465d61';c.lineWidth=W*.014;
      for(let i=0;i<12;i++){const a=i*Math.PI/6;c.beginPath();c.moveTo(W/2+Math.sin(a)*W*.36,H/2-Math.cos(a)*H*.36);c.lineTo(W/2+Math.sin(a)*W*.43,H/2-Math.cos(a)*H*.43);c.stroke();}
      c.lineWidth=W*.026;c.beginPath();c.moveTo(W*.5,H*.5);c.lineTo(W*.34,H*.32);c.moveTo(W*.5,H*.5);c.lineTo(W*.77,H*.43);c.stroke();
    },clockFace);
  }

  // Keep the school independent at the right rear; lettering retains its original aspect.
  const hallGroup=group(4.65,0,1,0,campusGroup);hallGroup.name='Independent UW academic hall';
  collectInto(hallGroup);hallGroup.scale.x=hallScaleX;
  const crestStone=box(3.45,2.28,.15,entranceX,4.75,-4.135,mat(0xe1d7bd,0xe2c598,.04),hallGroup);
  crestStone.scale.x/=hallScaleX;
  const logo=await buildCrest(api,{parent:hallGroup,x:entranceX,y:4.8,z:-4.05,scaleX:1/hallScaleX});

  // Limestone terrace and the separate curved lake shoreline.
  box(3.24,.18,5.12,5.94,.075,-1.06,stone,campusGroup);
  box(3.22,.037,5.10,5.94,.187,-1.06,mat(0xb4ad96),campusGroup);
  const paving=[];
  for(let x=4.35;x<7.57;x+=.45)paving.push(x,.209,-3.59,x,.209,1.45);
  for(let z=-3.59;z<1.5;z+=.46)paving.push(4.35,.209,z,7.55,.209,z);
  const pavingGeo=new THREE.BufferGeometry();pavingGeo.setAttribute('position',new THREE.Float32BufferAttribute(paving,3));campusGroup.add(new THREE.LineSegments(pavingGeo,new THREE.LineBasicMaterial({color:0x737e79,transparent:true,opacity:.3})));
  const terraceGroup=group(0,0,3.35,0,campusGroup);terraceGroup.name='Front-right Terrace courtyard';collectInto(terraceGroup,hallGroup);
  const lake=buildLake({...api,scene:campusGroup});
  const lakeGroup=lake.group;
  // Railings protect the lake and have the light scale of a miniature model.
  for(const x of [5.01,5.64,6.27,6.90,7.53])cyl(.029,.62,x,.495,-3.63,metal,campusGroup,10);
  for(const y of [.63,.84])rod([5.01,y,-3.63],[7.53,y,-3.63],.026,metal,campusGroup);
  for(const z of [-3.61,-2.36,-1.11,.14,1.38])cyl(.031,.65,7.53,.514,z,metal,campusGroup,10);
  for(const y of [.61,.85])rod([7.53,y,-3.60],[7.53,y,1.38],.026,metal,campusGroup);

  // Sunburst chair backs quote the Terrace's familiar form in three soft colors.
  const chairColors=[mat(0xd4ad52),mat(0xc77e4b),mat(0x719465)];
  function terraceChair(x,z,ry,colorIndex){
    const chair=group(x,.208,z,ry,campusGroup),m=chairColors[colorIndex%3];
    cyl(.219,.046,0,.433,0,m,chair,20);
    for(const [px,pz] of [[-.145,-.145],[.145,-.145],[-.145,.145],[.145,.145]])rod([px,.415,pz],[px*1.25,.015,pz*1.20],.018,m,chair);
    rod([-.168,.42,-.133],[-.20,.879,-.205],.018,m,chair);rod([.168,.42,-.133],[.20,.879,-.205],.018,m,chair);
    torus(.233,.019,0,.813,-.207,m,chair);
    const center=cyl(.052,.027,0,.813,-.207,m,chair,12);center.rotation.x=Math.PI/2;
    for(let i=0;i<10;i++){const a=i*Math.PI*2/10;rod([0,.813,-.207],[Math.sin(a)*.219,.813+Math.cos(a)*.219,-.207],.013,m,chair);}
  }
  function terraceTable(x,z,withPizza=false){
    const g=group(x,.208,z,0,campusGroup);
    cyl(withPizza?.50:.401,.052,0,.662,0,mat(0xd3c2a0),g,32);cyl(.065,.61,0,.33,0,metal,g,12);
    for(let i=0;i<3;i++){const a=i*Math.PI*2/3;rod([0,.1,0],[Math.cos(a)*.28,.026,Math.sin(a)*.28],.024,metal,g);}
    cyl(.049,.106,withPizza?.37:.12,.744,withPizza?-.16:-.05,mat(0xddd8c0),g,16);
    if(withPizza){
      const crust=mat(0xbc854b,0xe3bb79,.07),cheese=mat(0xe8be64,0xf7c989,.12),pepperoni=mat(0xa74839,0xbb7150,.06);
      cyl(.344,.018,0,.701,0,mat(0xe2dbbf),g,48);
      const plateRim=torus(.325,.012,0,.713,0,mat(0xc7bc9e),g);plateRim.rotation.x=-Math.PI/2;
      for(let slice=0;slice<6;slice++){
        const start=slice*Math.PI/3+.025,end=(slice+1)*Math.PI/3-.025,mid=(start+end)/2,offset=slice===0?.022:0;
        const piece=group(Math.cos(mid)*offset,0,-Math.sin(mid)*offset,0,g);
        const shape=new THREE.Shape();shape.moveTo(0,0);shape.lineTo(Math.cos(start)*.277,Math.sin(start)*.277);shape.absarc(0,0,.277,start,end,false);shape.lineTo(0,0);shape.closePath();
        const bread=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.023,bevelEnabled:true,bevelSegments:1,bevelSize:.002,bevelThickness:.002,steps:1}),cheese);
        bread.rotation.x=-Math.PI/2;bread.position.y=.715;piece.add(bread);
        const edge=new THREE.Mesh(new THREE.TorusGeometry(.280,.023,7,14,end-start),crust);edge.rotation.set(-Math.PI/2,0,start);edge.position.y=.742;piece.add(edge);
        for(const [r,a] of [[.135,mid-.12],[.219,mid+.12]])cyl(.031,.008,Math.cos(a)*r,.746,-Math.sin(a)*r,pepperoni,piece,12);
        box(.019,.005,.010,Math.cos(mid)*.18,.748,-Math.sin(mid)*.18,leafMats[0],piece,false);
      }
    }
  }
  terraceTable(5.30,-2.08);terraceChair(4.65,-2.1,Math.PI/2,0);terraceChair(5.96,-2.06,-Math.PI/2,1);
  terraceTable(6.57,.02,true);terraceChair(6.58,-.67,0,2);terraceChair(6.59,.73,Math.PI,0);
  collectInto(terraceGroup,hallGroup,lakeGroup);

  // Three entrance steps connect the academic hall to the courtyard.
  const path=group(0,0,0,0,campusGroup);path.name='UW entrance steps';
  box(2.98,.30,.83,4.80,.15,-2.87,sandstone,path);
  box(3.10,.20,.40,4.80,.10,-2.26,sandstone,path);
  box(3.22,.10,.40,4.80,.05,-1.86,sandstone,path);

  // A slim campus pennant brings red into the quieter left side of the composition.
  const pennant=group(-1.10,0,0,0,campusGroup);
  cyl(.17,.14,-5.56,.07,-.74,stone,pennant,14);cyl(.039,3.41,-5.56,1.785,-.74,metal,pennant,12);
  sphere(.074,-5.56,3.535,-.74,sandstone,pennant);
  rod([-5.59,3.30,-.74],[-4.71,3.30,-.74],.023,metal,pennant);
  box(.75,1.27,.025,-5.11,2.64,-.734,red,pennant,false);
  label('UW\nMADISON',.65,.98,-5.11,2.67,-.713,{parent:pennant,bg:'#ad414a',color:'#ede3c8',fontSize:199});

  // Bicycles and trees animate the edges without blocking the open workstation.
  const bike=group(-6.01,.095,.85,.20,campusGroup);
  for(const x of [-.52,.52]){
    torus(.288,.026,x,.32,0,dark,bike);torus(.263,.012,x,.32,0,stone,bike);
    for(let i=0;i<8;i++){const a=i*Math.PI/4;rod([x,.32,0],[x+Math.cos(a)*.246,.32+Math.sin(a)*.246,0],.0055,metal,bike);}
    cyl(.037,.065,x,.32,0,metal,bike,10).rotation.x=Math.PI/2;
  }
  for(const [a,b] of [[[-.52,.32,0],[-.13,.40,0]],[[-.13,.40,0],[-.25,.87,0]],[[-.25,.87,0],[-.52,.32,0]],[[-.25,.87,0],[.31,.83,0]],[[.31,.83,0],[-.13,.40,0]],[[.31,.83,0],[.52,.32,0]]])rod(a,b,.024,red,bike);
  rod([-.25,.87,0],[-.28,.99,0],.024,metal,bike);box(.26,.055,.14,-.28,1.015,0,wood,bike);
  rod([.31,.83,0],[.26,1.035,0],.020,metal,bike);tube([[.26,1.035,-.14],[.25,1.08,-.11],[.25,1.08,.11],[.26,1.035,.14]],.017,dark,bike);
  cyl(.060,.05,-.13,.4,0,metal,bike,12).rotation.x=Math.PI/2;
  rod([-.13,.4,0],[-.05,.35,.10],.014,metal,bike);box(.12,.025,.078,-.05,.35,.10,dark,bike,false);
  rod([-.14,.4,-.02],[-.23,.03,-.15],.014,metal,bike);
  // A compact rear cycle court uses full-size round wheels, independent of the narrow hall scale.
  const bikeCourt=group(0,0,0,0,campusGroup);bikeCourt.name='Rear campus bicycle parking';
  box(2.23,.055,1.81,6.53,.020,-7.00,stone,bikeCourt,false);
  const parkedBikePaint=[mat(0x8d514f),mat(0x668c82),mat(0xb09963),mat(0x496573)];
  for(let i=0;i<4;i++){
    const x=5.78+i*.50;
    if(i!==2){
      const parked=bike.clone(true);parked.position.set(x,.0415,-7.00);parked.rotation.y=Math.PI/2+(i%2?.025:-.025);
      parked.name=`Parked campus bicycle ${i+1}`;parked.traverse(o=>{if(o.isMesh&&o.material===red)o.material=parkedBikePaint[i];});bikeCourt.add(parked);
    }
    for(const side of [-1,1])rod([x+side*.105,.05,-6.43],[x+side*.105,.34,-6.43],.019,metal,bikeCourt);
    tube([[x-.105,.34,-6.43],[x-.09,.40,-6.43],[x+.09,.40,-6.43],[x+.105,.34,-6.43]],.019,metal,bikeCourt);
  }
  const bikeBounds={minX:5.40,maxX:7.66,minZ:-7.94,maxZ:-6.06};
  const seasonTrees=[];
  function treeBranch(from,to,bottomRadius,tipRadius,parent){
    const start=new THREE.Vector3(...from),end=new THREE.Vector3(...to),direction=end.clone().sub(start);
    const branch=new THREE.Mesh(new THREE.CylinderGeometry(tipRadius,bottomRadius,direction.length(),7),wood);
    branch.position.copy(start.add(end).multiplyScalar(.5));branch.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());
    branch.castShadow=branch.receiveShadow=true;branch.name='Tapered winter branch';parent.add(branch);return branch;
  }
  function campusTree(x,z,size){
    const g=group(x,.08,z,0,campusGroup);g.name=`Campus seasonal tree ${seasonTrees.length+1}`;
    box(.81,.24,.83,0,.12,0,stone,g);box(.68,.028,.70,0,.253,0,mat(0x566654),g,false);
    rod([0,.25,0],[.05,1.90*size,0],.065,wood,g);
    const foliage=[];
    for(let i=0;i<9;i++){
      const a=i*2.399,r=(i%3)*.17+.09,y=(1.31+(i%3)*.24)*size,px=Math.cos(a)*r,pz=Math.sin(a)*r;
      treeBranch([.02,(.94+(i%3)*.12)*size,0],[px,y,pz],.030*size,.011*size,g);
      // Fine upward forks remain inside the original canopy and read when its leaves fall.
      for(const direction of [-1,1]){
        const twigAngle=a+direction*.56,twigRadius=r+.16*size;
        treeBranch([px*.75,y-.12*size,pz*.75],[Math.cos(twigAngle)*twigRadius,y+(.11+(i%2)*.055)*size,Math.sin(twigAngle)*twigRadius],.013*size,.0035*size,g);
      }
      const leaf=sphere(.33*size,px,y,pz,leafMats[i%3].clone(),g);leaf.scale.set(1.13,.80,1.04);
      leaf.name='Season-controlled canopy';leaf.userData.dynamic=true;foliage.push(leaf);
    }
    seasonTrees.push({group:g,foliage,groundY:.04,scatterRadius:.9});
  }
  campusTree(-6.78,-5.52,1.16);campusTree(-6.66,-2.68,1.00);campusTree(7.00,6.70,.94);

  const windowGlow=glow(3.55,4.39,-3.99,0xffcf90,1.35,.08,hallGroup);
  animators.push(t=>{lake.update(t);windowGlow.material.opacity=(1-dayAmount)*(.065+Math.sin(t*.43)*.008);});
  function setDay(value){
    dayAmount=typeof value==='boolean'?(value?1:0):THREE.MathUtils.clamp(Number(value)||0,0,1);
    windowMat.emissiveIntensity=THREE.MathUtils.lerp(.52,.035,dayAmount);
    windowMat.color.copy(new THREE.Color(0x9eb8b0)).lerp(new THREE.Color(0x88acb1),dayAmount);
    lake.setDay(dayAmount);
    windowGlow.material.opacity=(1-dayAmount)*.065;
  }
  setDay(0);
  const rainBounds=[
    {minX:2.24,maxX:7.66,minZ:-6.10,maxZ:-3.00,roofY:6.94},
    {minX:6.32,maxX:7.45,minZ:-5.54,maxZ:-3.96,roofY:7.45},
    {minX:3.42,maxX:6.20,minZ:-3.36,maxZ:-2.00,roofY:3.28}
  ];
  const rearBoardMount={parent:hallGroup,localX:.45,localY:4.24,wallLocalZ:-6.90,worldCenterX:4.947,worldY:4.24,wallWorldZ:-5.90,maxWidth:4.50,maxHeight:2.30,outwardZ:-1};
  return {setDay,group:campusGroup,hallGroup,terraceGroup,lakeGroup,lake,logo,rainBounds,seasonTrees,rearBoardMount,bikeBounds,windowMaterial:windowMat};
}
