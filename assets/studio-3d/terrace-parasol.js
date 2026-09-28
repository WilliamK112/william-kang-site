// A small cantilever parasol shades the empty table without a pole through it.
export function buildTerraceParasol({THREE,scene,group,cyl,rod,mat}){
 const root=group(0,0,0,0,scene);root.name='Rainbow Terrace parasol';
 const center={x:5.40,z:1.18},pole={x:6.64,z:.65},radius=.96;
 const frame=mat(0x5b6761),ribs=mat(0xa39373),base=mat(0x70766b);
 cyl(.21,.075,pole.x,.248,pole.z,base,root,16);
 cyl(.115,.075,pole.x,.323,pole.z,frame,root,12);
 rod([pole.x,.36,pole.z],[pole.x,2.63,pole.z],.025,frame,root);
 rod([pole.x,2.63,pole.z],[center.x,2.64,center.z],.025,frame,root);
 rod([pole.x,2.07,pole.z],[6.14,2.634,.866],.016,frame,root);
 rod([center.x,2.64,center.z],[center.x,2.51,center.z],.022,frame,root);
 const colors=[0xbf6666,0xd39364,0xe0bf74,0x91ad77,0x72aaa2,0x739fb8,0x9295b6,0xb78fa6];
 const positions=[],rgb=[],rings=[[0,2.55],[.28,2.50],[.64,2.32],[radius,2.16]];
 function point(r,y,a){return [center.x+r*Math.cos(a),y,center.z+r*Math.sin(a)];}
 function triangle(a,b,c,color){positions.push(...a,...b,...c);for(let i=0;i<3;i++)rgb.push(color.r,color.g,color.b);}
 for(let panel=0;panel<8;panel++){
  const color=new THREE.Color(colors[panel]),start=panel*Math.PI/4;
  for(let step=0;step<3;step++){
   const a=start+step*Math.PI/12,b=a+Math.PI/12;
   for(let ring=0;ring<rings.length-1;ring++){
    const [r1,y1]=rings[ring],[r2,y2]=rings[ring+1];
    const p1=point(r1,y1,a),p2=point(r1,y1,b),p3=point(r2,y2,a),p4=point(r2,y2,b);
    triangle(p1,p4,p3,color);if(r1>0)triangle(p1,p2,p4,color);
   }
   const topA=point(radius,2.16,a),topB=point(radius,2.16,b);
   const bottomA=point(radius,2.11-.018*Math.sin(step*Math.PI/3),a),bottomB=point(radius,2.11-.018*Math.sin((step+1)*Math.PI/3),b);
   triangle(topA,bottomA,bottomB,color);triangle(topA,bottomB,topB,color);
  }
  for(let ring=1;ring<rings.length;ring++){
   const [r1,y1]=rings[ring-1],[r2,y2]=rings[ring];rod(point(r1,y1-.015,start),point(r2,y2-.015,start),.008,ribs,root);
  }
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(rgb,3));geometry.computeVertexNormals();
 const fabric=mat(0xffffff).clone();fabric.vertexColors=true;fabric.side=THREE.DoubleSide;
 const canopy=new THREE.Mesh(geometry,fabric);canopy.name='Muted rainbow fabric canopy';canopy.castShadow=canopy.receiveShadow=true;root.add(canopy);
 cyl(.044,.075,center.x,2.59,center.z,frame,root,12);
 return {group:root,center,radius,pole,rimY:2.09,roofY:2.64};
}
