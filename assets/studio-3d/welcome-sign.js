export function buildWelcomeSign({THREE,scene,box,cyl,group,mat,panel,glow}){
 const sign=group(-4.18,.035,5.02,Math.PI*.25,scene);
 sign.name='Courtyard welcome sign';

 const navy=mat(0x173846),frame=mat(0xb7c9b4),cream=mat(0xeadfbd),red=mat(0xa83f4d,0x7c1f32,.15);
 const warm=mat(0xffdca3,0xffbd6b,1.35),stone=mat(0x607982);

 // Broad stone feet and paired posts give the sign a collectible miniature silhouette.
 box(.68,.14,.56,-.87,.07,0,stone,sign);
 box(.68,.14,.56,.87,.07,0,stone,sign);
 box(.18,1.22,.18,-.87,.69,0,navy,sign);
 box(.18,1.22,.18,.87,.69,0,navy,sign);
 cyl(.16,.08,-.87,.18,0,frame,sign,12);
 cyl(.16,.08,.87,.18,0,frame,sign,12);

 // A deep rear slab, pale reveal and inset face make the board read as real 3D geometry.
 box(2.88,1.18,.22,0,1.30,0,navy,sign);
 box(2.68,.98,.255,0,1.30,.015,frame,sign);
 box(2.53,.83,.28,0,1.30,.025,navy,sign);
 box(3.08,.12,.42,0,1.94,-.01,red,sign);
 box(2.80,.055,.22,0,1.83,.18,warm,sign,false);
 box(.15,.15,.34,-1.31,1.94,-.01,cream,sign);
 box(.15,.15,.34,1.31,1.94,-.01,cream,sign);

 const face=panel(2.42,.74,0,1.30,.174,(ctx,W,H)=>{
  ctx.clearRect(0,0,W,H);
  const r=40;
  ctx.beginPath();
  ctx.roundRect(5,5,W-10,H-10,r);
  const bg=ctx.createLinearGradient(0,0,W,H);
  bg.addColorStop(0,'#234b55');bg.addColorStop(1,'#142f3b');
  ctx.fillStyle=bg;ctx.fill();
  ctx.strokeStyle='#e9dfbd';ctx.lineWidth=10;ctx.stroke();

  ctx.fillStyle='#f2b95f';
  ctx.beginPath();
  for(let i=0;i<10;i++){
   const a=-Math.PI/2+i*Math.PI/5,rad=i%2?12:25;
   const x=W/2+Math.cos(a)*rad,y=46+Math.sin(a)*rad;
   if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  }
  ctx.closePath();ctx.fill();

  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillStyle='#fff4d2';
  ctx.font='800 72px "Arial Rounded MT Bold", "Trebuchet MS", sans-serif';
  ctx.fillText('WELCOME TO MY',W/2,H*.39,W*.86);
  ctx.font='900 88px "Arial Rounded MT Bold", "Trebuchet MS", sans-serif';
  ctx.fillText('LITTLE CORNER',W/2,H*.61,W*.88);
  ctx.fillStyle='#f5bd72';
  ctx.font='700 30px "Trebuchet MS", sans-serif';
  ctx.letterSpacing='5px';
  ctx.fillText('LOOK AROUND  ·  STAY AWHILE',W/2,H*.84,W*.78);
 },sign);
 face.name='Welcome to my little corner sign face';

 // Small warm bulbs keep the sign friendly during the rainy night scene.
 for(const x of [-1.23,1.23]){
  cyl(.065,.08,x,1.80,.20,warm,sign,10).rotation.x=Math.PI/2;
  glow(x,1.80,.27,0xffc477,.46,.18,sign);
 }
 return {group:sign,face};
}
