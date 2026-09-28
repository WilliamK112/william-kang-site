export function buildFurniture(api) {
  const {THREE,scene,box,cyl,sphere,rod,tube,torus,group,mat,panel,label,glow,animators,rand}=api;
  const warm=(color,k=.19)=>mat(color,0xffd6ab,k);
  const wood=warm(0xbb865b,.23), edgeWood=warm(0xd6aa78,.25);
  const ivory=warm(0xe9dfc1,.29), slate=warm(0x304652,.13), dark=warm(0x182c39,.075);
  const steel=warm(0x73878a,.12), mint=warm(0x7aafa0,.21), brass=warm(0xbba371,.19);
  const coral=warm(0xc38478,.22), black=mat(0x102330);
  const warmBulb=new THREE.MeshBasicMaterial({color:0xffdf9a,toneMapped:false});
  const mintBulb=new THREE.MeshBasicMaterial({color:0x9ce7ca,toneMapped:false});
  const screenRim=warm(0x152835,.06);
  const paper=warm(0xf4e6c8,.3);
  const text=(value,w,h,x,y,z,options={})=>label(value,w,h,x,y,z,{bg:'#e5dcc2',color:'#354e54',...options});

  // Woven floor rug and a chamfered-looking, warm wood workbench.
  const rug=panel(4.8,2.27,-.63,.365,-.02,(c,W,H)=>{
    c.fillStyle='#5b797d';c.fillRect(0,0,W,H);
    c.strokeStyle='#b0b9a0';c.lineWidth=9;c.strokeRect(23,23,W-46,H-46);
    c.strokeStyle='rgba(212,220,190,.12)';c.lineWidth=1.5;
    for(let y=6;y<H;y+=7){c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke();}
    c.strokeStyle='rgba(24,59,63,.13)';for(let x=6;x<W;x+=9){c.beginPath();c.moveTo(x,0);c.lineTo(x,H);c.stroke();}
    c.strokeStyle='#cad0b4';c.lineWidth=3;for(let i=0;i<4;i++){c.beginPath();c.moveTo(42+i*15,H*.46);c.lineTo(42+i*15,H*.54);c.stroke();}
  });rug.rotation.x=-Math.PI/2;
  box(3.92,.15,1.37,-.6,1.17,-.25,wood);
  box(3.87,.045,1.33,-.6,1.266,-.25,edgeWood,scene,false);
  box(3.7,.035,.025,-.6,1.257,.428,ivory,scene,false);
  for(const x of [-2.3,1.1]){
    box(.075,.71,1.1,x,.73,-.25,slate);
    box(.39,.065,1.17,x,.39,-.25,steel);
  }
  rod([-2.3,.52,-.77],[1.1,.93,-.77],.029,slate);
  rod([-2.3,.93,-.77],[1.1,.52,-.77],.029,slate);
  box(.72,.43,.74,.62,.91,-.29,wood);
  for(let j=0;j<2;j++){
    box(.66,.17,.025,.62,.813+j*.195,.10,edgeWood);
    rod([.50,.82+j*.195,.13],[.74,.82+j*.195,.13],.015,brass);
  }
  // The desk grain is intentionally sparse, so the larger forms stay clean.
  for(let i=0;i<9;i++)rod([-2.40+i*.45,1.293,-.88],[-2.31+i*.45,1.293,.33],.0025,warm(0x946c4d,.13));

  function monitor(cx,cz,draw) {
    box(.57,.055,.31,cx,1.322,cz+.12,slate);
    box(.072,.36,.10,cx,1.515,cz-.012,steel);
    box(1.31,.85,.080,cx,1.995,cz,screenRim);
    box(1.34,.82,.035,cx,1.995,cz-.038,steel);
    panel(1.21,.747,cx,2.017,cz+.044,draw);
    box(1.26,.045,.047,cx,1.601,cz+.044,slate,scene,false);
    text('W / STUDIO',.29,.031,cx,1.602,cz+.073,{bg:'#304652',color:'#a1b6ab',fontSize:62});
    box(.021,.013,.004,cx+.56,1.6,cz+.075,mintBulb,scene,false);
    tube([[cx,1.60,cz-.1],[cx+.09,1.35,cz-.24],[cx+.13,1.13,cz-.23],[cx+.36,.86,cz-.32]],.016,dark);
  }
  monitor(-1.47,-.61,(c,W,H)=>{
    c.fillStyle='#122b38';c.fillRect(0,0,W,H);
    c.fillStyle='#203d48';c.fillRect(0,0,W,H*.115);
    c.fillStyle='#d3ddcb';c.font=`600 ${W*.031}px monospace`;c.fillText('match_pipeline.py',W*.071,H*.073);
    c.fillStyle='#729f99';c.font=`${W*.025}px monospace`;c.fillText('VISION  /  ENGINEERING',W*.61,H*.073);
    c.fillStyle='#172f3b';c.fillRect(0,H*.115,W*.062,H*.825);
    const lines=[
      [['#6f9699','# Track · understand · review']],
      [['#c89aa5','class '],['#b5d9bf','MatchAnalyzer'],['#dce3cb',':']],
      [['#dce3cb','  '],['#c89aa5','def '],['#dfc995','analyze'],['#dce3cb','(self, frame):']],
      [['#dce3cb','    tracks = '],['#85c9bf','tracker'],['#dce3cb','.update(frame)']],
      [['#dce3cb','    poses  = '],['#85c9bf','pose_model'],['#dce3cb','(frame)']],
      [['#dce3cb','    shuttle = '],['#dfc995','recover'],['#dce3cb','(frame)']],
      [['#dce3cb','']],
      [['#c89aa5','    return '],['#dfc995','MatchFrame'],['#dce3cb','(']],
      [['#dce3cb','      tracks, poses, shuttle']],
      [['#dce3cb','    )']],
      [['#dce3cb','']],
      [['#6f9699','# Small steps. Observable systems.']]
    ];
    c.font=`${W*.0285}px monospace`;
    lines.forEach((tokens,i)=>{
      const y=H*.192+i*H*.058;c.fillStyle='#567c83';c.textAlign='right';c.fillText(String(i+1),W*.044,y);c.textAlign='left';let x=W*.092;
      for(const [color,value] of tokens){c.fillStyle=color;c.fillText(value,x,y);x+=c.measureText(value).width;}
    });
    c.fillStyle='#397c71';c.fillRect(0,H*.944,W,H*.056);c.fillStyle='#dae7cd';c.font=`${W*.023}px monospace`;c.fillText('main  ·  python                         UTF-8',W*.022,H*.982);
  });
  monitor(-.025,-.55,(c,W,H)=>{
    c.fillStyle='#152f3b';c.fillRect(0,0,W,H);
    c.fillStyle='#d5e7cf';c.font=`700 ${W*.034}px sans-serif`;c.fillText('BADMINTON  /  VISION LAB',W*.046,H*.089);
    c.fillStyle='#8bb7ad';c.font=`${W*.023}px monospace`;c.fillText('CONCEPT VIEW · NOT A MEASURED REPLAY',W*.047,H*.14);
    const x=W*.14,y=H*.23,w=W*.73,h=H*.57;
    c.fillStyle='#4a8a7c';c.fillRect(x,y,w,h);c.strokeStyle='#d5e3ba';c.lineWidth=3;c.strokeRect(x,y,w,h);
    c.beginPath();c.moveTo(x+w/2,y);c.lineTo(x+w/2,y+h);c.moveTo(x+w*.075,y);c.lineTo(x+w*.075,y+h);c.moveTo(x+w*.925,y);c.lineTo(x+w*.925,y+h);c.moveTo(x,y+h*.105);c.lineTo(x+w,y+h*.105);c.moveTo(x,y+h*.895);c.lineTo(x+w,y+h*.895);c.moveTo(x+w*.31,y);c.lineTo(x+w*.31,y+h);c.moveTo(x+w*.69,y);c.lineTo(x+w*.69,y+h);c.moveTo(x,y+h/2);c.lineTo(x+w*.31,y+h/2);c.moveTo(x+w*.69,y+h/2);c.lineTo(x+w,y+h/2);c.stroke();
    c.strokeStyle='#e8d09a';c.lineWidth=4;c.setLineDash([9,7]);c.beginPath();c.moveTo(x+w*.22,y+h*.73);c.bezierCurveTo(x+w*.36,y+h*.07,x+w*.62,y+h*.92,x+w*.8,y+h*.29);c.stroke();c.setLineDash([]);
    [[.24,.57,'#aadfd0'],[.77,.38,'#f1bba5']].forEach(([px,py,col])=>{
      const X=x+w*px,Y=y+h*py;c.strokeStyle=col;c.lineWidth=4;c.strokeRect(X-13,Y-20,26,40);c.fillStyle=col;c.beginPath();c.arc(X,Y,6,0,Math.PI*2);c.fill();
    });
    c.fillStyle='#f7df99';c.beginPath();c.arc(x+w*.8,y+h*.29,7,0,Math.PI*2);c.fill();
    c.font=`700 ${W*.024}px monospace`;c.fillStyle='#a6d9c5';c.fillText('TRACK',W*.14,H*.91);c.fillStyle='#ebc3a5';c.fillText('POSE',W*.40,H*.91);c.fillStyle='#d8dfbb';c.fillText('REVIEW',W*.65,H*.91);
    c.fillStyle='#253f49';c.fillRect(W*.14,H*.946,W*.73,H*.018);c.fillStyle='#88bdac';c.fillRect(W*.14,H*.946,W*.38,H*.018);
  });

  // Keyboard, separate keycaps, mouse and a soft mint desk mat.
  box(1.78,.019,.63,-.88,1.31,.04,warm(0x5e817d,.20),scene,false);
  box(1.08,.052,.355,-1.10,1.35,.05,slate);
  for(let row=0;row<4;row++)for(let col=0;col<14;col++){
    if(row===3&&col>2&&col<10)continue;
    box(.055,.021,.052,-1.59+col*.074,1.39,-.074+row*.079,(col===0||col===13)?mint:ivory,scene,false);
  }
  box(.48,.021,.052,-1.147,1.39,.163,ivory,scene,false);
  const mouse=sphere(.105,-.148,1.358,.062,ivory);mouse.scale.set(.68,.39,1.03);
  rod([-.148,1.400,.002],[-.148,1.401,.078],.006,slate);
  tube([[-1.1,1.36,-.136],[-1.03,1.32,-.33],[-1.13,1.32,-.44],[-1.20,1.34,-.48]],.007,dark);

  // A third, small laptop holds a restrained local terminal, not invented metrics.
  const laptop=group(.905,1.3,.01,-.16);
  box(.57,.025,.39,0,.015,0,steel,laptop);
  box(.49,.012,.23,0,.031,-.048,slate,laptop,false);
  for(let r=0;r<3;r++)for(let c=0;c<8;c++)box(.041,.007,.031,-.205+c*.058,.041,-.124+r*.052,ivory,laptop,false);
  box(.17,.007,.084,0,.037,.106,mint,laptop,false);
  box(.60,.393,.027,0,.218,-.194,dark,laptop);
  panel(.548,.340,0,.220,-.177,(c,W,H)=>{
    c.fillStyle='#1a3540';c.fillRect(0,0,W,H);c.fillStyle='#badbbf';c.font=`${W*.052}px monospace`;
    ['$ studio / workspace','> inspect · build · iterate','','  API  →  QUEUE','   ↓       ↓','  DATA ← MODEL','','  ready for the next idea_'].forEach((s,i)=>c.fillText(s,W*.062,H*.125+i*H*.108));
  },laptop);

  // Ceramic mug, coaster and a notebook with hand-drawn ideas.
  cyl(.139,.018,-.04,1.31,.329,brass,scene,28);
  cyl(.105,.176,-.04,1.407,.329,ivory,scene,24);
  cyl(.090,.009,-.04,1.50,.329,warm(0x6e4e3c,.16),scene,24);
  const mugHandle=torus(.067,.018,.080,1.410,.329,ivory);mugHandle.rotation.y=Math.PI/2;
  text('W',.09,.072,-.04,1.412,.434,{bg:'#e9dfc1',color:'#537f75',fontSize:92});
  const notebook=group(-2.09,1.304,.13,.06);
  box(.35,.04,.44,0,.02,0,coral,notebook);
  box(.327,.011,.409,0,.045,0,paper,notebook,false);
  const notes=panel(.285,.34,0,.052,0,(c,W,H)=>{
    c.fillStyle='#efe2bd';c.fillRect(0,0,W,H);c.strokeStyle='#bac8b3';c.lineWidth=2;for(let y=H*.14;y<H;y+=H*.13){c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke();}
    c.strokeStyle='#567e78';c.lineWidth=8;c.beginPath();c.moveTo(W*.16,H*.21);c.lineTo(W*.78,H*.21);c.moveTo(W*.20,H*.49);c.lineTo(W*.65,H*.39);c.lineTo(W*.77,H*.66);c.stroke();
    c.strokeRect(W*.14,H*.62,W*.32,H*.21);c.fillStyle='#916e54';c.font=`${W*.15}px monospace`;c.fillText('idea',W*.24,H*.17);
  },notebook);notes.rotation.x=-Math.PI/2;
  rod([-2.26,1.365,.06],[-1.93,1.365,.205],.014,brass);

  // Brass articulated task lamp; the shade casts its warmth towards the bench.
  cyl(.18,.034,-2.34,1.321,-.54,slate,scene,28);
  cyl(.113,.021,-2.34,1.349,-.54,brass,scene,20);
  rod([-2.34,1.36,-.54],[-2.49,1.90,-.54],.023,brass);
  rod([-2.49,1.90,-.54],[-2.17,2.28,-.47],.023,brass);
  for(const p of [[-2.34,1.37,-.54],[-2.49,1.90,-.54],[-2.17,2.28,-.47]])sphere(.052,...p,slate);
  const shade=new THREE.Mesh(new THREE.CylinderGeometry(.10,.23,.17,24),brass);shade.position.set(-2.13,2.21,-.46);scene.add(shade);
  cyl(.196,.013,-2.13,2.121,-.46,warmBulb,scene,24);
  glow(-2.13,2.09,-.46,0xffd796,.8,.16);
  const lampLight=new THREE.PointLight(0xffd49a,1.15,3.3,2);lampLight.position.set(-2.13,1.98,-.44);scene.add(lampLight);

  // An offset ergonomic chair leaves both screens visible in the opening view.
  const chair=group(-2.36,.35,.80,-.22);
  cyl(.06,.43,0,.30,0,steel,chair,14);
  cyl(.14,.084,0,.105,0,slate,chair,16);
  for(let i=0;i<5;i++){
    const a=i*Math.PI*2/5,x=Math.cos(a)*.32,z=Math.sin(a)*.32;
    rod([0,.13,0],[x,.075,z],.027,steel,chair);
    const wheel=cyl(.049,.066,x,.050,z,dark,chair,12);wheel.rotation.z=Math.PI/2;
  }
  box(.64,.115,.60,0,.59,0,slate,chair);
  box(.61,.073,.565,0,.672,-.005,mint,chair);
  box(.57,.75,.105,0,.97,.237,slate,chair);
  box(.49,.62,.039,0,.965,.175,warm(0x557e7b,.17),chair);
  for(let i=0;i<7;i++)rod([-.222,.72+i*.070,.147],[.222,.72+i*.070,.147],.0065,mint,chair);
  box(.38,.19,.12,0,1.422,.25,slate,chair);
  for(const x of [-.37,.37]){
    rod([x*.82,.55,.05],[x,.86,.035],.020,steel,chair);
    box(.085,.061,.34,x,.885,-.055,slate,chair);
  }

  // Open shelving: technical books, sketch pads and quiet personal objects.
  const shelf=group(-2.63,.35,-3.08);
  for(const x of [-.76,.76])box(.076,2.63,.58,x,1.315,0,slate,shelf);
  for(const y of [.10,.79,1.53,2.29,2.66])box(1.60,.075,.65,0,y,0,wood,shelf);
  box(1.55,2.59,.036,0,1.35,-.29,warm(0x5c746d,.16),shelf,false);
  const bookColors=[mint,coral,ivory,warm(0x7489a0,.19),warm(0xb8996e,.2)];
  const bookNames=['SYSTEMS','ML','DATA','CS','BUILD','VISION'];
  for(let r=0;r<2;r++)for(let i=0;i<6;i++){
    const x=-.64+i*.159,y=.855+r*.74,h=.41+(i%3)*.065;
    box(.13,h,.38,x,y+h/2,0,bookColors[(i+r)%5],shelf);
    text(bookNames[(i+r)%6],.091,.27,x,y+.21,.197,{parent:shelf,bg:['#7aafa0','#c38478','#e9dfc1','#7489a0','#b8996e'][(i+r)%5],color:'#293f4a',fontSize:71});
    box(.083,.016,.006,x,y+h-.048,.2,ivory,shelf,false);
  }
  for(let i=0;i<3;i++)box(.38,.080,.41,.42,.89+i*.087,0,bookColors[i+1],shelf);
  box(.48,.11,.41,.40,1.68,0,ivory,shelf);text('FIELD NOTES',.37,.058,.40,1.695,.213,{parent:shelf,bg:'#e9dfc1',color:'#546f6c',fontSize:57});
  // Award silhouette, intentionally not a claim of a specific credential.
  box(.37,.061,.24,-.44,2.366,.032,brass,shelf);
  box(.31,.37,.052,-.44,2.577,.008,brass,shelf);
  text('BUILD\nLEARN\nSHIP',.256,.264,-.44,2.583,.039,{parent:shelf,bg:'#bba371',color:'#314b53',fontSize:138});
  // Small plant on the top shelf.
  cyl(.141,.22,.38,2.80,.02,ivory,shelf,14);
  cyl(.130,.014,.38,2.917,.02,dark,shelf,14);
  for(let i=0;i<6;i++){
    const a=i*2.399,x=.38+Math.cos(a)*.15,z=.02+Math.sin(a)*.13,y=3.06+(i%2)*.09;
    rod([.38,2.92,.02],[x,y,z],.009,steel,shelf);
    const leaf=sphere(.095,x,y,z,mint,shelf);leaf.scale.set(1.24,.48,.76);leaf.rotation.z=a*.37;
  }
  // Rear whiteboard: an actual architectural story, clearly a conceptual diagram.
  box(2.34,1.48,.070,.19,2.39,-3.405,steel);
  panel(2.24,1.38,.19,2.39,-3.361,(c,W,H)=>{
    c.fillStyle='#e8e4cd';c.fillRect(0,0,W,H);c.fillStyle='#36575c';c.font=`700 ${W*.049}px sans-serif`;c.fillText('IDEAS → WORKING SYSTEMS',W*.064,H*.13);
    c.fillStyle='#829185';c.font=`${W*.024}px monospace`;c.fillText('concept sketch  /  make every step observable',W*.067,H*.20);
    const nodes=[['API',.06,'#cee0ce'],['QUEUE',.295,'#e6c9ac'],['MODEL',.53,'#b9d6ce'],['DATA',.765,'#d8cbd7']];
    c.lineWidth=4;
    nodes.forEach(([name,x,color],i)=>{
      c.fillStyle=color;c.fillRect(W*x,H*.35,W*.178,H*.27);c.strokeStyle='#627e78';c.strokeRect(W*x,H*.35,W*.178,H*.27);
      c.fillStyle='#355657';c.font=`700 ${W*.033}px monospace`;c.textAlign='center';c.fillText(name,W*(x+.089),H*.515);
      if(i<3){c.strokeStyle='#648e80';c.beginPath();c.moveTo(W*(x+.183),H*.49);c.lineTo(W*(x+.225),H*.49);c.lineTo(W*(x+.213),H*.47);c.moveTo(W*(x+.225),H*.49);c.lineTo(W*(x+.213),H*.51);c.stroke();}
    });
    c.textAlign='left';c.fillStyle='#738a7d';c.font=`${W*.027}px monospace`;c.fillText('trace  ·  retry  ·  cache  ·  review',W*.087,H*.77);
    c.strokeStyle='#c18d76';c.lineWidth=3;c.beginPath();c.moveTo(W*.087,H*.815);c.bezierCurveTo(W*.31,H*.833,W*.57,H*.805,W*.71,H*.82);c.stroke();
    c.fillStyle='#927761';c.font=`italic ${W*.026}px sans-serif`;c.fillText('Build small. Learn fast.',W*.53,H*.935);
  });
  box(2.13,.046,.135,.19,1.658,-3.30,ivory);
  for(let i=0;i<3;i++)rod([-.57+i*.17,1.698,-3.277],[-.45+i*.17,1.698,-3.277],.018,[slate,coral,mint][i]);
  // Two paper notes gently break the precision of the architecture diagram.
  text('one thing\nat a time',.27,.27,1.51,2.18,-3.378,{bg:'#e1c583',color:'#67573f',fontSize:95});
  text('keep it\nobservable',.27,.28,1.46,2.54,-3.378,{bg:'#a5c9b7',color:'#3b665b',fontSize:92});

  // A tidy compact server rack: real shelves, ports, status lamps and cooling fan.
  const server=group(2.61,.35,-2.59);
  box(1.08,2.56,.84,0,1.28,0,dark,server);
  box(.96,2.43,.025,0,1.30,.44,slate,server);
  for(const x of [-.48,.48])box(.043,2.44,.065,x,1.31,.476,steel,server);
  box(.78,.19,.035,0,2.40,.471,black,server);
  text('LOCAL / COMPUTE',.77,.10,0,2.41,.496,{parent:server,bg:'#102330',color:'#afd4c2',fontSize:72});
  for(let r=0;r<5;r++){
    const y=.56+r*.345;
    box(.81,.257,.056,0,y,.488,steel,server);
    box(.50,.188,.018,-.09,y,.525,dark,server,false);
    for(let j=0;j<6;j++)box(.047,.127,.017,-.288+j*.071,y,.54,slate,server,false);
    box(.075,.015,.023,.332,y+.048,.536,mintBulb,server,false);
    box(.033,.014,.023,.311,y-.031,.536,brass,server,false);
    text(String(r+1).padStart(2,'0'),.046,.053,-.367,y,.528,{parent:server,bg:'#73878a',color:'#203e45',fontSize:87});
  }
  const fan=torus(.156,.014,0,.236,.49,steel,server);
  cyl(.047,.026,0,.236,.489,steel,server,12).rotation.x=Math.PI/2;
  for(let j=0;j<8;j++){const a=j*Math.PI/4;rod([0,.236,.505],[Math.cos(a)*.147,.236+Math.sin(a)*.147,.505],.008,steel,server);}
  const ledMaterial=new THREE.MeshBasicMaterial({color:0x82daba,toneMapped:false,transparent:true,opacity:.85});
  box(.012,2.22,.018,.455,1.32,.526,ledMaterial,server,false);
  animators.push(t=>{ledMaterial.opacity=.65+Math.sin(t*.72)*.12+(Math.sin(t*5.4)>.93?.15:0);});
  glow(2.78,1.86,-2.08,0x83dabd,.66,.075);
  box(.64,.023,.53,0,2.578,0,slate,server);
  for(let k=0;k<8;k++)box(.018,.018,.42,-.245+k*.07,2.60,0,steel,server,false);
  tube([[2.69,.57,-3.06],[2.47,.49,-3.26],[1.93,.42,-3.12],[1.34,.40,-1.13],[.20,.47,-.94]],.024,dark);

  // Compact wall clock and a simple university-red W tile complete the personal room.
  const clock=group(2.63,3.35,-3.371);
  const clockBody=cyl(.215,.055,0,0,0,brass,clock,32);clockBody.rotation.x=Math.PI/2;
  panel(.375,.375,0,0,.032,(c,W,H)=>{
    c.fillStyle='#e5dfc7';c.beginPath();c.arc(W/2,H/2,W*.49,0,Math.PI*2);c.fill();c.strokeStyle='#58726b';c.lineWidth=5;
    for(let i=0;i<12;i++){const a=i*Math.PI/6;c.beginPath();c.moveTo(W/2+Math.sin(a)*W*.37,H/2-Math.cos(a)*H*.37);c.lineTo(W/2+Math.sin(a)*W*.43,H/2-Math.cos(a)*H*.43);c.stroke();}
    c.lineWidth=9;c.beginPath();c.moveTo(W*.5,H*.5);c.lineTo(W*.33,H*.32);c.moveTo(W*.5,H*.5);c.lineTo(W*.73,H*.43);c.stroke();c.fillStyle='#bc8b69';c.beginPath();c.arc(W*.5,H*.5,W*.04,0,Math.PI*2);c.fill();
  },clock);
  box(.47,.48,.054,-3.316,3.04,-3.32,wood);
  text('W',.403,.410,-3.316,3.04,-3.287,{bg:'#9c5557',color:'#f1e7cf',fontSize:310});
  // A small satchel under the bench and a rolled drawing wait for tomorrow.
  box(.41,.51,.20,1.48,.625,.46,coral);
  box(.36,.095,.23,1.48,.83,.48,warm(0x9a766c,.2));
  tube([[1.33,.83,.46],[1.35,1.00,.46],[1.61,1.00,.46],[1.63,.83,.46]],.017,wood);
  box(.041,.099,.023,1.48,.76,.584,brass,scene,false);
  const roll=cyl(.052,.73,1.60,.755,.43,ivory,scene,16);roll.rotation.z=.20;
}
