// Four miniature vehicles face +Z. Each is one static vertex-colored mesh;
// garment 1/2 reserve neutral shaded paint for the host's instance palettes.
export function buildStreetCarGeometry({THREE,mergeGeometries},{kind='sedan'}={}) {
 const aliases={'school-bus':'bus',schoolbus:'bus',sports:'sport','sports-car':'sport'};
 kind=aliases[kind]||kind;
 if(!['sedan','bus','pickup','sport'].includes(kind))kind='sedan';
 const pieces=[],transform=new THREE.Object3D();
 const paint={color:0xffffff,garment:1},roof={color:0xffffff,garment:2};
 const glass=0x294653,rubber=0x25333c;
 const trim=0x435d65,chrome=0x9faeaa,hub=0xa9b6af,headlamp=0xf4dfac,tail=0xb76b60;
 function add(geometry,color,position=[0,0,0],rotation=[0,0,0]) {
  transform.position.set(...position);transform.rotation.set(...rotation);transform.scale.set(1,1,1);transform.updateMatrix();
  const g=geometry.index?geometry.toNonIndexed():geometry.clone();geometry.dispose();g.applyMatrix4(transform.matrix);
  const normal=g.getAttribute('normal'),base=new THREE.Color(color?.color??color),colors=new Float32Array(normal.count*3);
  for(let i=0;i<normal.count;i++){
   const light=.79+.18*Math.max(0,normal.getY(i))+.03*Math.max(0,-normal.getX(i));
   colors.set([base.r*light,base.g*light,base.b*light],i*3);
  }
  g.deleteAttribute('uv');g.setAttribute('color',new THREE.BufferAttribute(colors,3));
  g.setAttribute('joint',new THREE.BufferAttribute(new Float32Array(normal.count),1));
  g.setAttribute('garment',new THREE.BufferAttribute(new Float32Array(normal.count).fill(color?.garment||0),1));pieces.push(g);
 }
 function polygon(points,color,outward) {
  const p=points.map(a=>new THREE.Vector3(...a)),n=p[1].clone().sub(p[0]).cross(p[2].clone().sub(p[0]));
  if(n.dot(new THREE.Vector3(...outward))<0)p.reverse();
  const vertices=[];for(let i=1;i<p.length-1;i++)vertices.push(...p[0],...p[i],...p[i+1]);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.computeVertexNormals();add(g,color);
 }
 function box(w,h,d,x,y,z,color,rotation=[0,0,0]){add(new THREE.BoxGeometry(w,h,d),color,[x,y,z],rotation);}
 function rod(from,to,r,color){
  const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to),direction=b.clone().sub(a);
  const g=new THREE.CylinderGeometry(r,r,direction.length(),5);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize()));
  add(g,color,a.add(b).multiplyScalar(.5).toArray());
 }
 function loft(stations,color=paint,bottomColor=trim){
  const rings=stations.map(([z,w,belt,shoulder,top])=>[
   [-w*.83,belt,z],[-w,belt+.034,z],[-w,shoulder,z],[-w*.83,top,z],
   [w*.83,top,z],[w,shoulder,z],[w,belt+.034,z],[w*.83,belt,z]
  ]);
  for(let i=0;i<rings.length-1;i++)for(let j=0;j<8;j++){
   const k=(j+1)%8,a=rings[i][j],b=rings[i][k],c=rings[i+1][k],d=rings[i+1][j];
   polygon([a,b,c,d],j===7?bottomColor:color,[(a[0]+b[0])/2,(a[1]+b[1])/2-(stations[i][2]+stations[i][4])*.5,0]);
  }
  polygon(rings[0],color,[0,0,-1]);polygon(rings.at(-1),color,[0,0,1]);
 }
 function wheels(zPositions,{radius=.175,x=.443,lipColor=paint,lip=true}={}){
  const y=radius+.03;
  for(const side of [-1,1])for(const z of zPositions){
   add(new THREE.TorusGeometry(radius-.038,.038,5,14).rotateZ(Math.PI/14),rubber,[side*x,y,z],[0,Math.PI/2,0]);
   add(new THREE.CylinderGeometry(radius*.59,radius*.59,.064,10),hub,[side*(x+.005),y,z],[0,0,Math.PI/2]);
   add(new THREE.CylinderGeometry(radius*.30,radius*.30,.006,8),trim,[side*(x+.040),y,z],[0,0,Math.PI/2]);
   if(lip)add(new THREE.TorusGeometry(radius+.012,.010,3,10,Math.PI),lipColor,[side*(x+.013),y,z],[0,Math.PI/2,0]);
  }
 }
 function lamps(frontZ,rearZ,y,width=.177){
  for(const side of [-1,1]){
   box(width,.057,.030,side*.278,y,frontZ,headlamp);
   box(.123,.050,.027,side*.286,y+.025,rearZ,tail);
  }
 }
 function buildSedan(){
 // Eight-sided cross-sections produce rounded shoulders and a tapered nose,
 // with a continuous bonnet, sill and rear hatch rather than stacked cubes.
 const stations=[
  [-.94,.322,.260,.396,.423],[-.82,.414,.223,.452,.474],
  [-.48,.445,.210,.472,.496],[.34,.445,.210,.472,.496],
  [.77,.405,.233,.431,.457],[.93,.319,.264,.376,.402]
 ];
 const rings=stations.map(([z,w,belt,shoulder,top])=>[
  [-w*.83,belt,z],[-w,belt+.034,z],[-w,shoulder,z],[-w*.83,top,z],
  [w*.83,top,z],[w,shoulder,z],[w,belt+.034,z],[w*.83,belt,z]
 ]);
 for(let i=0;i<rings.length-1;i++)for(let j=0;j<8;j++){
  const k=(j+1)%8,a=rings[i][j],b=rings[i][k],c=rings[i+1][k],d=rings[i+1][j];
  polygon([a,b,c,d],j===7?trim:paint,[(a[0]+b[0])/2,(a[1]+b[1])/2-.345,0]);
 }
 polygon(rings[0],paint,[0,0,-1]);polygon(rings.at(-1),paint,[0,0,1]);

 // The ivory greenhouse has chamfered corners, a sloping windscreen and a
 // gently crowned roof. Side glazing is split by slender painted pillars.
 const lower=[[-.332,.491,.415],[.332,.491,.415],[.390,.491,.337],[.390,.491,-.621],
  [.330,.491,-.724],[-.330,.491,-.724],[-.390,.491,-.621],[-.390,.491,.337]];
 const upper=[[-.275,.782,.110],[.275,.782,.110],[.323,.791,.052],[.323,.793,-.405],
  [.270,.783,-.467],[-.270,.783,-.467],[-.323,.793,-.405],[-.323,.791,.052]];
 for(let i=0;i<8;i++){
  const j=(i+1)%8;polygon([lower[i],lower[j],upper[j],upper[i]],roof,
   [(lower[i][0]+lower[j][0])/2,.12,(lower[i][2]+lower[j][2])/2+.12]);
 }
 for(let i=0;i<8;i++)polygon([upper[i],upper[(i+1)%8],[0,.810,-.175]],roof,[0,1,0]);
 polygon([[-.312,.511,.398],[.312,.511,.398],[.258,.767,.130],[-.258,.767,.130]],glass,[0,.5,1]);
 polygon([[-.308,.513,-.708],[-.250,.766,-.483],[.250,.766,-.483],[.308,.513,-.708]],glass,[0,.5,-1]);
 for(const side of [-1,1]){
  const p=(x,y,z)=>[side*x,y,z];
  polygon([p(.386,.513,.310),p(.331,.769,.043),p(.331,.771,-.183),p(.387,.513,-.183)],glass,[side,.1,0]);
  polygon([p(.387,.513,-.218),p(.331,.771,-.218),p(.330,.771,-.390),p(.386,.513,-.590)],glass,[side,.1,0]);
  // Restrained drawn reflections keep the windows readable at miniature size.
  polygon([p(.382,.541,.246),p(.373,.584,.205),p(.354,.674,.112),p(.359,.653,.078)],0x65838b,[side,.1,0]);
  box(.018,.024,.124,side*.448,.428,-.280,chrome);
  box(.016,.032,.024,side*.448,.386,-.170,trim);
  box(.017,.018,.69,side*.448,.300,-.080,trim);
  // Small mirrors have angled shells and a dark inset face.
  box(.096,.058,.102,side*.432,.536,.243,paint,[0,side*.19,0]);
  box(.071,.035,.010,side*.432,.536,.186,glass,[0,side*.19,0]);
 }
 // Distinct bumpers and inset grille, without a floating license plate/logo.
 box(.595,.071,.049,0,.283,.932,trim);
 box(.640,.056,.045,0,.286,-.944,trim);
 box(.305,.062,.014,0,.351,.934,rubber);
 for(const y of [.341,.363])box(.281,.007,.007,0,y,.944,chrome);
 for(const side of [-1,1]){
  box(.177,.060,.029,side*.244,.390,.925,headlamp,[0,-side*.10,side*.06]);
  box(.126,.054,.030,side*.247,.397,-.931,tail,[0,side*.10,0]);
 }
 rod([-.275,.527,.378],[.035,.543,.361],.007,trim);

 // Thin wheel-well outlines surround four profiled tires. The wheel axles are
 // along X; the 14-sided rubber and two hub rings remain crisp when enlarged.
 for(const side of [-1,1])for(const z of [-.597,.590]){
  add(new THREE.TorusGeometry(.137,.038,5,14).rotateZ(Math.PI/14),rubber,[side*.432,.205,z],[0,Math.PI/2,0]);
  add(new THREE.CylinderGeometry(.103,.103,.064,10),hub,[side*.437,.205,z],[0,0,Math.PI/2]);
  add(new THREE.CylinderGeometry(.052,.052,.006,8),trim,[side*.472,.205,z],[0,0,Math.PI/2]);
  // Half-ring sits just above the tire, giving the painted fender a readable lip.
  add(new THREE.TorusGeometry(.185,.010,3,10,Math.PI),paint,[side*.447,.205,z],[0,Math.PI/2,0]);
 }
 }
 function buildBus(){
  // A conventional school-bus silhouette: tall continuous saloon, separate
  // rounded bonnet and inset folding entry, with six paired side windows.
  loft([[-1.50,.394,.255,.514,.547],[-1.38,.458,.243,.553,.586],
   [.90,.458,.243,.553,.586],[1.16,.425,.260,.571,.620],[1.49,.365,.282,.516,.560],[1.535,.320,.312,.480,.526]]);
  loft([[-1.47,.400,.511,1.167,1.225],[-1.36,.458,.511,1.219,1.280],
   [.83,.458,.511,1.219,1.280],[.97,.405,.511,1.162,1.220]],paint,paint);
  // Broad cream roof panels and shallow transverse seams soften the profile.
  polygon([[-.376,1.281,-1.34],[.376,1.281,-1.34],[.376,1.281,.81],[-.376,1.281,.81]],roof,[0,1,0]);
  for(const z of [-.96,-.29,.38])box(.754,.010,.014,0,1.281,z,roof);
  for(const side of [-1,1]){
   for(const z of [-1.20,-.88,-.56,-.24,.08,.40]){
    box(.012,.329,.269,side*.464,.989,z,trim);
    box(.014,.289,.237,side*.470,.998,z,glass);
    box(.016,.009,.237,side*.475,.999,z,chrome);
   }
   for(const y of [.601,.684])box(.020,.030,2.37,side*.463,y,-.205,rubber);
   box(.020,.025,2.38,side*.463,.789,-.205,trim);
   box(.059,.110,.100,side*.491,1.019,1.042,trim);
   rod([side*.417,.97,.963],[side*.484,1.020,1.041],.013,trim);
  }
  // The folding passenger door occupies the right-front section only.
  box(.021,.663,.277,.454,.830,.729,trim);
  for(const z of [.660,.798])box(.027,.584,.116,.461,.844,z,glass);
  box(.030,.026,.263,.472,.589,.729,chrome);
  box(.115,.044,.309,.458,.364,.729,trim);
  polygon([[-.354,.737,.981],[-.348,1.124,.981],[-.017,1.124,.981],[-.017,.737,.981]],glass,[0,0,1]);
  polygon([[.017,.737,.981],[.017,1.124,.981],[.348,1.124,.981],[.354,.737,.981]],glass,[0,0,1]);
  polygon([[-.332,.788,-1.487],[.332,.788,-1.487],[.332,1.125,-1.487],[-.332,1.125,-1.487]],glass,[0,0,-1]);
  box(.209,.065,.017,0,1.179,.980,trim);
  for(const side of [-1,1]){
   box(.067,.040,.020,side*.300,1.164,.981,tail);
   box(.060,.035,.020,side*.213,1.165,.981,headlamp);
  }
  box(.358,.135,.025,0,.438,1.542,trim);
  for(const x of [-.123,-.041,.041,.123])box(.025,.112,.029,x,.437,1.553,chrome);
  box(.728,.085,.067,0,.314,1.535,trim);
  box(.796,.086,.062,0,.321,-1.506,trim);
  lamps(1.527,-1.501,.521,.101);
  wheels([-.981,1.044],{radius:.195,x:.441});
 }
 function buildPickup(){
  // The low bed floor and separate bed walls leave a visible open cargo well.
  loft([[-1.18,.361,.248,.380,.409],[-1.08,.452,.231,.394,.429],
   [.67,.452,.231,.432,.470],[1.08,.400,.250,.412,.454],[1.19,.341,.284,.387,.425]]);
  box(.790,.042,.840,0,.423,-.681,trim);
  for(const x of [-.28,-.14,0,.14,.28])box(.012,.014,.745,x,.451,-.687,chrome);
  for(const side of [-1,1]){
   box(.063,.193,.892,side*.421,.519,-.685,paint);
   box(.070,.025,.912,side*.421,.624,-.685,roof);
   box(.050,.176,.022,side*.378,.523,-1.134,trim);
  }
  box(.804,.186,.061,0,.521,-1.127,paint);
  box(.803,.025,.069,0,.625,-1.127,roof);
  box(.165,.022,.014,0,.558,-1.163,chrome);
  loft([[-.287,.376,.457,.799,.875],[-.168,.407,.457,.837,.906],
   [.325,.400,.457,.822,.893],[.630,.337,.457,.603,.633]],roof,paint);
  polygon([[-.303,.498,.638],[.303,.498,.638],[.315,.811,.365],[-.315,.811,.365]],glass,[0,.4,1]);
  polygon([[-.313,.533,-.296],[-.313,.777,-.296],[.313,.777,-.296],[.313,.533,-.296]],glass,[0,0,-1]);
  for(const side of [-1,1]){
   polygon([[side*.411,.505,-.151],[side*.411,.505,.505],[side*.405,.783,.313],[side*.413,.798,-.143]],glass,[side,0,0]);
   box(.016,.264,.023,side*.415,.653,-.027,roof);
   box(.023,.025,.119,side*.456,.445,-.116,chrome);
   box(.094,.066,.112,side*.457,.630,.389,paint,[0,side*.16,0]);
   box(.052,.058,.561,side*.458,.261,.158,trim);
  }
  box(.675,.075,.060,0,.318,1.195,trim);
  box(.725,.070,.069,0,.300,-1.175,trim);
  box(.344,.078,.025,0,.411,1.194,rubber);
  for(const y of [.393,.420])box(.329,.010,.029,0,y,1.207,chrome);
  lamps(1.175,-1.173,.457,.157);
  wheels([-.767,.794],{radius:.189,x:.455});
 }
 function buildSport(){
  // Wedge shoulders, an extended bonnet and rear-set shallow greenhouse give
  // the coupe a different silhouette from the upright sedan and utility cars.
  loft([[-1.015,.333,.222,.352,.389],[-.896,.454,.207,.378,.414],
   [-.442,.468,.192,.393,.434],[.387,.453,.198,.352,.395],
   [.865,.403,.225,.302,.355],[1.015,.302,.257,.293,.327]]);
  loft([[-.784,.321,.404,.481,.514],[-.461,.361,.404,.628,.683],
   [-.093,.353,.404,.631,.688],[.321,.291,.386,.449,.482]],roof,paint);
  polygon([[-.270,.401,.331],[.270,.401,.331],[.308,.626,-.071],[-.308,.626,-.071]],glass,[0,.5,1]);
  polygon([[-.285,.436,-.792],[-.304,.620,-.470],[.304,.620,-.470],[.285,.436,-.792]],glass,[0,.5,-1]);
  for(const side of [-1,1]){
   polygon([[side*.365,.426,-.681],[side*.365,.426,.235],[side*.359,.608,-.106],[side*.366,.600,-.448]],glass,[side,0,0]);
   box(.021,.018,.110,side*.471,.374,-.340,chrome);
   box(.099,.042,.087,side*.469,.458,.083,paint,[0,side*.12,0]);
   box(.025,.035,.804,side*.461,.233,-.060,trim);
   polygon([[side*.176,.347,.874],[side*.356,.347,.822],[side*.342,.375,.666],[side*.213,.375,.725]],headlamp,[0,.8,1]);
   box(.230,.027,.026,side*.261,.373,-1.018,tail);
   box(.060,.097,.035,side*.270,.441,-.876,trim);
  }
  // Short integrated rear wing, dark diffuser, twin exhaust and hood crease.
  box(.776,.034,.141,0,.498,-.876,roof);
  box(.593,.046,.051,0,.260,1.014,trim);
  box(.407,.048,.018,0,.300,1.019,rubber);
  box(.640,.066,.037,0,.252,-1.021,trim);
  for(const side of [-1,1]){
   add(new THREE.CylinderGeometry(.031,.031,.045,8),chrome,[side*.275,.261,-1.045],[Math.PI/2,0,0]);
   rod([side*.203,.401,.369],[side*.155,.359,.827],.004,paint);
  }
  wheels([-.652,.641],{radius:.165,x:.457});
 }
 ({sedan:buildSedan,bus:buildBus,pickup:buildPickup,sport:buildSport}[kind])();
 const geometry=mergeGeometries(pieces,false);pieces.forEach(g=>g.dispose());
 geometry.computeBoundingBox();geometry.computeBoundingSphere();
 geometry.name=`Detailed ${kind} traffic miniature`;
 geometry.userData.kind=kind;
 geometry.userData.partSummary=kind==='sedan'?['tapered eight-sided body','crowned contrasting roof','sloped front and rear glass',
  'four side windows and pillars','drawn glazing reflections','mirrors','door handles and sill trim',
  'inset grille and bumpers','headlamps and tail lamps','windscreen wiper','four profiled tires and hubcaps','fender lips']:
  kind==='bus'?['tall crowned saloon','separate rounded bonnet','twelve split side windows','black rub rails',
   'folding passenger door and step','split windshield','rear window','roof warning lamps','front grille',
   'outboard mirrors','four profiled tires and hubcaps','wide safety bumpers']:
  kind==='pickup'?['shaped long utility body','open recessed cargo bed','ribbed bed floor','raised bed sides and tailgate',
   'contrasting tall cab','sloped windshield','rear cab glass','split side windows','mirrors and handles',
   'running boards','front grille','four profiled tires and hubcaps']:
  ['low wedge body','long sloping bonnet','rear-set coupe greenhouse','swept windshield','rear fastback glass',
   'projector lamps','short rear wing','dark rear diffuser','twin exhaust tips','mirrors and handles','four low-profile tires and hubcaps'];
 geometry.userData.bounds={min:geometry.boundingBox.min.toArray(),max:geometry.boundingBox.max.toArray()};
 geometry.userData.paintSlots={1:'main paint',2:'roof and secondary trim'};
 return geometry;
}
