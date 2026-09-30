export function buildWelcomeSign({THREE,scene,box,cyl,group,mat,panel,glow}){
 const sign=group(-5.35,.035,7.78,0,scene);
 sign.name='Courtyard welcome sign';

 const navy=mat(0x173846),frame=mat(0xb7c9b4),cream=mat(0xeadfbd),red=mat(0xa83f4d,0x7c1f32,.15);
 const warm=mat(0xffdca3,0xffbd6b,1.35),stone=mat(0x607982);

 // Broad stone feet and tall paired posts give it the scale of a roadside billboard.
 box(.82,.18,.40,-1.36,.09,0,stone,sign);
 box(.82,.18,.40,1.36,.09,0,stone,sign);
 box(.22,2.62,.16,-1.36,1.43,0,navy,sign);
 box(.22,2.62,.16,1.36,1.43,0,navy,sign);
 cyl(.18,.10,-1.36,.22,0,frame,sign,12);
 cyl(.18,.10,1.36,.22,0,frame,sign,12);

 // A deep rear slab, pale reveal and inset face make the board read as real 3D geometry.
 box(4.64,1.74,.18,0,3.10,0,navy,sign);
 box(4.38,1.48,.20,0,3.10,.015,frame,sign);
 box(4.15,1.25,.22,0,3.10,.025,navy,sign);
 box(4.88,.14,.30,0,4.04,-.01,red,sign);
 box(4.42,.065,.18,0,2.20,.14,warm,sign,false);
 box(.18,.18,.26,-2.14,4.04,-.01,cream,sign);
 box(.18,.18,.26,2.14,4.04,-.01,cream,sign);

 const face=panel(4.02,1.14,0,3.10,.188,(ctx,W,H)=>{
  ctx.clearRect(0,0,W,H);
  const r=40;
  ctx.beginPath();
  ctx.roundRect(5,5,W-10,H-10,r);
  const bg=ctx.createLinearGradient(0,0,W,H);
  bg.addColorStop(0,'#234b55');bg.addColorStop(1,'#142f3b');
  ctx.fillStyle=bg;ctx.fill();
  ctx.strokeStyle='#e9dfbd';ctx.lineWidth=10;ctx.stroke();

  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillStyle='#fff4d2';
  ctx.font='900 142px "Arial Rounded MT Bold", "Trebuchet MS", sans-serif';
  ctx.fillText('WELCOME!',W/2,H*.38,W*.82);
  ctx.fillStyle='#f5e7bd';
  ctx.font='900 62px "Arial Rounded MT Bold", "Trebuchet MS", sans-serif';
  ctx.fillText('TO MY LITTLE CORNER',W/2,H*.66,W*.84);
  ctx.fillStyle='#f5bd72';
  ctx.font='700 30px "Trebuchet MS", sans-serif';
  ctx.letterSpacing='4px';
  ctx.fillText('COME IN  ·  LOOK AROUND',W/2,H*.87,W*.60);
 },sign);
 face.name='Welcome to my little corner sign face';

 // Small warm bulbs keep the sign friendly during the rainy night scene.
 for(const x of [-1.82,1.82]){
  cyl(.075,.10,x,2.30,.22,warm,sign,10).rotation.x=Math.PI/2;
  glow(x,2.30,.30,0xffc477,.62,.20,sign);
 }
 return {group:sign,face};
}
