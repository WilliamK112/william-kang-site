// Lightweight, perspective-scaled snowfall for the winter night transition.
// One point cloud keeps the effect inexpensive while per-flake attributes add depth.
export function buildSnowfall({THREE,scene,rand},{rainBounds=[],parasol}={}){
 const count=720,positions=new Float32Array(count*3),sizes=new Float32Array(count),brightness=new Float32Array(count);
 const seeds=Array.from({length:count},(_,index)=>({
  x:rand(-8.25,8.25),z:rand(-8.25,8.25),phase:rand(0,9.4),speed:rand(.42,1.12),
  drift:rand(.12,.43),sway:rand(.18,.58),offset:rand(0,Math.PI*2),index
 }));
 seeds.forEach((seed,index)=>{sizes[index]=rand(.20,.48);brightness[index]=rand(.68,1);});
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
 geometry.setAttribute('flakeSize',new THREE.BufferAttribute(sizes,1));
 geometry.setAttribute('brightness',new THREE.BufferAttribute(brightness,1));
 const material=new THREE.ShaderMaterial({
  uniforms:{opacity:{value:0}},transparent:true,depthWrite:false,blending:THREE.NormalBlending,
  vertexShader:`attribute float flakeSize;attribute float brightness;varying float lightness;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=clamp(flakeSize*430./max(1.,-mv.z),2.,9.);gl_Position=projectionMatrix*mv;lightness=brightness;}`,
  fragmentShader:`uniform float opacity;varying float lightness;void main(){vec2 p=gl_PointCoord-.5;float radius=length(p);float soft=1.-smoothstep(.24,.5,radius);float core=1.-smoothstep(.0,.18,radius);float sparkle=max(0.,1.-smoothstep(.015,.055,min(abs(p.x),abs(p.y))));float alpha=(soft*.78+core*.18+sparkle*.12)*opacity*lightness;if(alpha<.025)discard;gl_FragColor=vec4(mix(vec3(.68,.82,.94),vec3(1.),lightness),alpha);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`
 });
 const points=new THREE.Points(geometry,material);points.name='Night snowfall';points.userData.dynamic=true;points.frustumCulled=false;points.visible=false;scene.add(points);
 function sheltered(x,y,z){
  if(x>-5.24&&x<1.82&&z>-2.82&&z<1.92&&y<3.70)return true;
  if(rainBounds.some(bounds=>x>bounds.minX&&x<bounds.maxX&&z>bounds.minZ&&z<bounds.maxZ&&y<bounds.roofY))return true;
  return Boolean(parasol&&(x-parasol.center.x)**2+(z-parasol.center.z)**2<parasol.radius**2&&y<parasol.roofY);
 }
 function update(time){
  if(!points.visible)return;
  seeds.forEach((seed,index)=>{
   const cycle=9.4/seed.speed,y=9.4-((time+seed.phase/seed.speed)%cycle)*seed.speed;
   const x=seed.x+Math.sin(time*seed.sway+seed.offset)*seed.drift+(9.4-y)*.035;
   const z=seed.z+Math.cos(time*seed.sway*.71+seed.offset)*seed.drift*.46;
   const i=index*3;
   if(sheltered(x,y,z))positions.set([x,-20,z],i);else positions.set([x,y,z],i);
  });
  geometry.attributes.position.needsUpdate=true;
 }
 function setAmount(value){
  const amount=THREE.MathUtils.clamp(Number(value)||0,0,1);
  material.uniforms.opacity.value=.92*amount;
  points.visible=amount>.004;
 }
 return {points,material,update,setAmount,count};
}
