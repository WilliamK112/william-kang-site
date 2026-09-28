// Layout scoping survives failed WebGL initialization and is shared by the 2D fallback.
const html=document.documentElement;
const scoped=html.hasAttribute('data-studio-portfolio');
const hero=scoped?document.getElementById('hero'):null;
let controller=null,loading=false,scheduled=false,failed=false,disposed=false;
let layout={active:!hero,near:!hero,start:0,end:0,height:innerHeight};
if(!html.dataset.background3d)html.dataset.background3d='pending';

function updateLayout(){
 if(disposed)return;
 const height=Math.max(1,innerHeight),bottom=hero?hero.getBoundingClientRect().bottom:-100;
 const start=Math.max(0,Math.min(height,bottom)),end=Math.max(0,Math.min(height,bottom+100));
 const active=!hero||bottom<height-.5;
 layout={active,near:!hero||bottom<height+220,start,end,height};
 html.style.setProperty('--section-bg-start',`${start.toFixed(2)}px`);
 html.style.setProperty('--section-bg-end',`${end.toFixed(2)}px`);
 html.style.setProperty('--section-bg-visible',active?'1':'0');
 const canvas=document.getElementById('portfolio-geometry-field')||document.getElementById('portfolio-signal-field');
 if(canvas){canvas.dataset.active=String(active);if(!controller&&canvas.id==='portfolio-geometry-field')canvas.dataset.running='false';}
 controller?.setActive(active);
 if(layout.near&&!controller&&!failed&&!loading&&!scheduled&&!document.hidden){
  scheduled=true;
  const begin=()=>{scheduled=false;if(layout.near&&!document.hidden&&!disposed)loadBackground();};
  if('requestIdleCallback' in window)requestIdleCallback(begin,{timeout:900});else setTimeout(begin,40);
 }
}
function useFallback(error){
 if(failed||disposed)return;
 failed=true;loading=false;controller?.dispose();controller=null;
 console.warn('3D background unavailable; using particle fallback.',error);
 const previous=document.getElementById('portfolio-geometry-field');
 if(previous){const replacement=previous.cloneNode(false);replacement.id='portfolio-signal-field';replacement.dataset.running='false';previous.replaceWith(replacement);}
 delete html.dataset.background3d;
 updateLayout();
 window.dispatchEvent(new Event('portfolio-background-fallback'));
}
async function loadBackground(){
 if(loading||controller||failed||disposed)return;
 loading=true;
 try{
  const {initBackground}=await import('./background.js');
  if(disposed)return;
  if(!layout.near||document.hidden){loading=false;return;}
  controller=initBackground({active:layout.active,onFailure:useFallback});
  html.dataset.background3d='ready';loading=false;updateLayout();
 }catch(error){useFallback(error);}
}
const layoutObserver=new ResizeObserver(updateLayout);
if(hero)layoutObserver.observe(hero);
addEventListener('scroll',updateLayout,{passive:true});
addEventListener('resize',updateLayout,{passive:true});
document.addEventListener('visibilitychange',updateLayout);
addEventListener('pageshow',updateLayout);
addEventListener('pagehide',event=>{
 if(event.persisted)return;
 disposed=true;controller?.dispose();layoutObserver.disconnect();
 removeEventListener('scroll',updateLayout);removeEventListener('resize',updateLayout);
 document.removeEventListener('visibilitychange',updateLayout);removeEventListener('pageshow',updateLayout);
});
updateLayout();
