// Lightweight cel-shaded glazing: a clear tint, grazing-angle sheen and drawn
// reflections make each pane legible without hiding the detailed workspace.
export function buildStudioGlazing({THREE,scene,box,mat}){
 const group=new THREE.Group();group.name='Complete studio glass enclosure';scene.add(group);
 const material=new THREE.ShaderMaterial({
  uniforms:{day:{value:0},nightTint:{value:new THREE.Color(0x83bfca)},dayTint:{value:new THREE.Color(0xb1d7d2)}},
  vertexShader:`varying vec2 paneUv;varying vec3 panePosition;varying vec3 paneNormal;
   void main(){paneUv=uv;vec4 world=modelMatrix*vec4(position,1.);panePosition=world.xyz;paneNormal=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*world;}`,
  fragmentShader:`uniform float day;uniform vec3 nightTint;uniform vec3 dayTint;varying vec2 paneUv;varying vec3 panePosition;varying vec3 paneNormal;
   void main(){
    float grazing=pow(1.-abs(dot(normalize(cameraPosition-panePosition),normalize(paneNormal))),2.2);
    float edge=min(min(paneUv.x,1.-paneUv.x),min(paneUv.y,1.-paneUv.y));
    float rim=1.-smoothstep(.002,.012,edge);
    float diagonal=paneUv.x-.48*paneUv.y;
    float broad=(1.-smoothstep(.034,.066,abs(diagonal-.38)))*.78;
    float narrow=(1.-smoothstep(.009,.018,abs(diagonal-.48)))*.56;
    float reflection=(broad+narrow)*smoothstep(.02,.15,paneUv.y);
    vec3 tint=mix(nightTint,dayTint,day);
    vec3 color=mix(tint,vec3(.90,.97,.95),clamp(reflection*.73+rim*.42,0.,1.));
    float roof=step(.7,abs(normalize(paneNormal).y));
    float alpha=.085+roof*.060+grazing*.19+rim*.20+reflection*(.20+roof*.10);
    gl_FragColor=vec4(color,min(alpha,.43+roof*.06));
    #include <colorspace_fragment>
   }`,
  transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false
 });
 material.forceSinglePass=true;
 const panes=[];
 function pane(name,w,h,x,y,z,rx=0,ry=0){
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),material);
  mesh.name=name;mesh.position.set(x,y,z);mesh.rotation.set(rx,ry,0);group.add(mesh);panes.push(mesh);return mesh;
 }
 const frame=mat(0x527a7e),edge=mat(0x95b8b5);

 // One uninterrupted pane: only the perimeter supports the clear roof.
 pane('Studio continuous glass roof',7.515,2.99,-.10,3.853,-.075,-Math.PI/2);
 box(7.62,.075,.065,-.10,3.824,-1.595,frame,group,false);

 // A convertible-style shade is fully parked beside the service roof. Its
 // compact zigzag cross-section reads as an M, leaving most glass uncovered.
 const canopy=new THREE.Group();canopy.name='Retracted navy M-fold roof canopy';group.add(canopy);
 const navy=mat(0x172b40),navyLit=mat(0x294359),hem=mat(0x101f2e),hinge=mat(0x5c7885);
 const folds=[[-1.58,4.085],[-1.44,4.34],[-1.30,4.095],[-1.16,4.34],[-1.02,4.085]];
 for(let i=0;i<folds.length-1;i++){
  const [za,ya]=folds[i],[zb,yb]=folds[i+1];
  const leaf=box(7.10,.030,Math.hypot(zb-za,yb-ya),-.10,(ya+yb)/2,(za+zb)/2,i%2?navy:navyLit,canopy,true);
  leaf.name=`Stowed canopy fold ${i+1}`;leaf.rotation.x=-Math.atan2(yb-ya,zb-za);
  for(const x of [-3.675,3.475]){
   const binding=box(.034,.041,Math.hypot(zb-za,yb-ya),x,(ya+yb)/2,(za+zb)/2,hem,canopy,false);binding.rotation.x=leaf.rotation.x;
  }
 }
 for(const [z,y] of folds)box(7.16,.021,.023,-.10,y+.017,z,hinge,canopy,false);
 for(const x of [-3.74,3.54]){
  box(.072,.050,3.02,x,3.961,-.09,hem,canopy,false);
  box(.022,.010,2.98,x,3.992,-.09,edge,canopy,false);
  box(.15,.10,.62,x,4.015,-1.30,navy,canopy,false);
  for(const [z,y] of folds){
   const pin=new THREE.Mesh(new THREE.CylinderGeometry(.026,.026,.055,8),hinge);
   pin.rotation.z=Math.PI/2;pin.position.set(x,y,z);canopy.add(pin);
  }
 }
 canopy.userData.foldState='fully retracted';

 // The front facade stops at the door jamb, leaving its full swing untouched.
 const frontEdges=[-3.87,-1.75,.37,2.49];
 for(let i=0;i<3;i++)pane(`Studio front window ${i+1}`,frontEdges[i+1]-frontEdges[i]-.04,3.20,(frontEdges[i]+frontEdges[i+1])/2,2.025,1.465);
 for(const x of frontEdges.slice(1,-1))box(.040,3.26,.055,x,2.025,1.46,frame,group,false);
 box(6.40,.065,.07,-.69,.40,1.46,frame,group,false);
 box(6.40,.042,.055,-.69,3.662,1.46,frame,group,false);

 // Three separate side panes fit the original right-hand aluminum mullions.
 const sideEdges=[-3.45,-1.92,-.26,1.40];
 for(let i=0;i<3;i++)pane(`Studio right window ${i+1}`,sideEdges[i+1]-sideEdges[i]-.045,3.20,3.773,2.025,(sideEdges[i]+sideEdges[i+1])/2,0,Math.PI/2);

 // A slim transom caps the existing solid left wall; shelves remain sheltered.
 pane('Studio left clerestory glass',4.83,.70,-3.866,3.315,-1.035,0,-Math.PI/2);
 box(.065,.055,4.91,-3.865,2.948,-1.035,frame,group,false);
 for(const z of [-1.86,-.21])box(.06,.70,.035,-3.866,3.315,z,frame,group,false);
 return {group,panes,material,canopy,setDay(value){material.uniforms.day.value=value;}};
}
