// From the repository root with the local server running, start a fresh session
// here so relative download paths resolve to this repository:
// npx --package @playwright/cli playwright-cli -s=studio-posters open http://127.0.0.1:8000/
// npx --package @playwright/cli playwright-cli -s=studio-posters run-code --filename scripts/capture-studio-posters.js
// Capture the actual first live frame separately for each motion preference.
// Reduced-motion frames deliberately settle into winter/autumn and must never
// replace the rainy/green initial frame used by the animated opening.
async(page)=>{
 await page.setViewportSize({width:1440,height:1000});
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.goto('http://127.0.0.1:8000/');
 const savedTheme=await page.evaluate(()=>localStorage.getItem('portfolio-theme'));
 await page.addInitScript(()=>{
  document.addEventListener('studio-ready',event=>{
   queueMicrotask(()=>{
    const s=window.__studio;
    s.renderer.render(s.scene,s.camera);
    window.__studioPosterCapture={
     dataUrl:s.renderer.domElement.toDataURL('image/webp',.9),
     theme:document.body.dataset.theme,
     season:s.seasonClock.state,age:s.seasonClock.age,time:s.time,
     scale:s.approach.scale,reduced:matchMedia('(prefers-reduced-motion:reduce)').matches
    };
   });
  },{capture:true,once:true});
 });
 const captures=[];
 try{
  for(const motion of ['no-preference','reduce'])for(const theme of ['dark','light']){
   await page.emulateMedia({reducedMotion:motion});
   await page.evaluate(t=>localStorage.setItem('portfolio-theme',t),theme);
   await page.reload();
   await page.waitForFunction(()=>window.__studioPosterCapture);
   const state=await page.evaluate(()=>{const {dataUrl,...state}=window.__studioPosterCapture;return state;});
   const reduced=motion==='reduce';
   if(state.theme!==theme||state.reduced!==reduced||state.time!==0||state.scale!==(reduced?.8:1)||state.season.winter!==(reduced&&theme==='dark'?1:0)||state.season.autumn!==(reduced?1:0)||(!reduced&&state.age!==0))throw Error('Poster is not the initial scene: '+JSON.stringify(state));
   const name=`poster${theme==='light'?'-day':''}${reduced?'-reduced':''}.webp`;
   const pending=page.waitForEvent('download');
   await page.evaluate(name=>{const a=document.createElement('a');a.download=name;a.href=window.__studioPosterCapture.dataUrl;a.click();},name);
   await(await pending).saveAs('assets/studio-3d/'+name);
   captures.push({name,...state});
  }
 }finally{
  await page.evaluate(theme=>theme===null?localStorage.removeItem('portfolio-theme'):localStorage.setItem('portfolio-theme',theme),savedTheme);
  await page.emulateMedia({reducedMotion:'no-preference'});
 }
 return captures;
}
