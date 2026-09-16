// Load after the page can render; retain the original particle field on failure.
async function loadBackground(){
 try { const {initBackground}=await import('./background.js');initBackground();document.documentElement.dataset.background3d='ready'; }
 catch(error){
  console.warn('3D background unavailable; using particle fallback.',error);
  const previous=document.getElementById('portfolio-geometry-field');
  if(previous){const replacement=previous.cloneNode(false);replacement.id='portfolio-signal-field';previous.replaceWith(replacement);}
  delete document.documentElement.dataset.background3d;
  window.dispatchEvent(new Event('portfolio-background-fallback'));
 }
}
if('requestIdleCallback' in window)requestIdleCallback(loadBackground,{timeout:1200});else setTimeout(loadBackground,50);
