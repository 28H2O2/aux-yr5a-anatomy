import {writeFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import * as k from './kit/iso-kit.mjs';
import * as G from './kit/lathe.mjs';
import * as A from './kit/audit.mjs';
import {tubePieces,tubeSvg} from './kit/tube.mjs';
import {stages,urinalState} from './urinal-model.mjs';
import {flowRuntime} from './urinal-motion.mjs';
import {halfBowl} from './urinal-bowl.mjs';
const ROOT=dirname(fileURLToPath(import.meta.url)),theme=process.argv.includes('--light')?'light':'dark';
function drawing(kind,lift=0,pilot=false){
 const whole=kind==='whole',W=600,H=whole?650:470;
 const base=whole?{x:-83,y:-12,w:169,d:120,r:4}:{x:-65,y:-30,w:155,d:110,r:4};
 const P=k.fitProjection([...k.boxCorners(base,-4,6),[0,10,whole?287:123],[0,95,20]],W,H,{pad:55,azimuth:58,elevation:31}),R=A.recorder(P),S=k.solidSvg,L=k.lineSvg;
 const paths=[],flows=[];
 function put(name,group,at,svg,shape){if(group==='frame'){name='stand.'+name;shape.name=name}R.put({name,piece:'fixed',group,at,svg,shapes:[R.solid(shape)]});}
 function box(name,group,x,y,z,w,d,h,tone='mid',extra=''){const p={x,y,w,d,r:.8};put(name,group,[x+w/2,y+d/2,z+h/2],S(k.slabOf(p,z,h,P,6,.4),{tone})+extra,A.slab(p,z,h,{name},6));}
 function cyl(name,group,x,y,z,r,h,tone='mid'){put(name,group,[x,y,z+h/2],S(k.cylinder(x,y,r,z,h,P,72,.25),{tone}),A.cylinder(x,y,r,z,h,{name}));}
 function ring(name,group,x,y,z,ri,ro,h,tone='mid'){const F=G.frameAlong([x,y,z],[0,0,1]);put(name,group,[x,y,z+h/2],S(G.ringBand(0,h,ri,ro,F,P),{tone}),A.ring(F,0,h,ri,ro,{name}));}
 function sector(name,group,x,y,z,ri,ro,h,tone='hi',start=145,end=325){const pts=[];for(let i=0;i<=48;i++){let a=(start+(end-start)*i/48)*Math.PI/180;pts.push([x+ro*Math.cos(a),y+ro*Math.sin(a)])}if(ri===0)pts.push([x,y]);else for(let i=48;i>=0;i--){let a=(start+(end-start)*i/48)*Math.PI/180;pts.push([x+ri*Math.cos(a),y+ri*Math.sin(a)])}put(name,group,[x,y,z+h/2],S(k.extrude(pts,z,h,P,{convex:false}),{tone}),A.extruded(pts,z,h,{name}));}
 function tube(name,group,points,r,limp=false){const route=G.fillet(points,Math.max(8,r*4),12,{P,tube:r});R.route(name,route,r,{piece:'fixed',limp});const chunks=tubePieces(route,r,P,{maxLength:10,spacing:1});const color=group==='pilot'?'var(--pilot)':group==='bypass'?'var(--bypass)':group==='sensor'?'var(--anatomy-hi)':'var(--water)';chunks.forEach((t,i)=>R.put({name:name+':'+i,piece:'fixed',group,at:t.mid,svg:`<g data-flow-route="${name}" data-chunk="${i}">${tubeSvg(t,{tone:'hi'})}${i===0?Array.from({length:4},()=>`<circle data-flow-dot="${name}" cx="${k.iso(t.mid,P)[0]}" cy="${k.iso(t.mid,P)[1]}" r="1" opacity="0" fill="${color}"/>`).join(''):''}</g>`,shapes:[A.tube(t.points,t.radii)],route:name,chunk:i}));paths.push({name,group,points:route});let walked=0;const nodes=route.map((p,i)=>{if(i)walked+=G.len3(G.sub3(p,route[i-1]));return {s:walked,p:k.iso(p,P)}});flows.push({name,group,total:walked,nodes,chunks:chunks.map(({from,to})=>({from,to}))});}
 function faceDisc(name,group,p,r,h,tone='mid'){const F=G.frameAlong(p,[0,1,0]);put(name,group,[p[0],p[1]+h/2,p[2]],S(G.disc(0,h,r,F,P),{tone}),A.disc(F,0,h,r,{name}));}
 for(const [i,[x,y]]of[[base.x+10,base.y+10],[base.x+base.w-10,base.y+10],[base.x+10,base.y+base.d-10],[base.x+base.w-10,base.y+base.d-10]].entries())cyl('foot'+i,'frame',x,y,-4,3,4,'lo');
 box('base','frame',base.x,base.y,0,base.w,base.d,6,'lo',L(k.planOutline(k.insetPlan(base,4),6,P),{tone:'faint'}));
 if(whole){
  box('wall','frame',-80,-12,6,160,3,278,'lo');
  for(const x of[-29,23])box('hanger'+x,'frame',x,-9,195,6,14,5,'mid');
  box('porcelain.back','ceramic',-42,5,123,84,5,102,'hi');
  for(const x of[-46,40])box('porcelain.shield'+x,'ceramic',x,10,123,6,31,96,'hi');
  const F=G.frameAlong([0,48,65],[0,0,1]);
  const bowl=[[0,6],[3,12,1],[14,28,1],[36,38,1],[55,39,1],[55,35,1],[35,34,1],[14,23,1],[5,8,1],[5,6]];
  const bowlCut=halfBowl(bowl,P);put('porcelain.bowl','ceramic',[0,30,93],bowlCut.svg,bowlCut.shape);
  sector('porcelain.lip','ceramic',0,48,120,35,40,3,'hi',180,360);
  ring('drain.neck','drain',0,48,62,3,6,3,'mid');
  ring('drain.strainer','drain',0,48,70,2,6,1,'mid');
  for(let i=0;i<4;i++){const a=i*Math.PI/2;cyl('strainer.fix'+i,'drain',4*Math.cos(a),48+4*Math.sin(a),71,.45,.3,'lo');}
  box('spreader','wash',-11,10,204,22,7,7,'hi');
  for(const x of[-7,0,7])faceDisc('jet'+x,'wash',[x,17,207],1.15,.7,'mid');
  cyl('spud','wash',0,14,225,5,4,'hi');
  tube('flush.lower','wash',[[0,14,229],[0,14,234]],2.6);
  tube('flush.upper','wash',[[0,14,239],[0,14,244]],2.6);
  cyl('vacuum-breaker','wash',0,14,234,4.8,5,'mid');
  box('valve.body','supply',-12,2,244,24,24,28,'hi');
  cyl('valve.cap','supply',0,14,272,12,4,'mid');
  box('sensor.case','sensor',-13,26,249,26,5,20,'mid');
  box('sensor.window','sensor',-10,31,253,20,1,12,'lo');
  for(const x of[-4,4])faceDisc(x<0?'IR.emitter':'IR.receiver','sensor',[x,32,259],2.1,.6,x<0?'hi':'mid');
  for(const x of[-10,10])faceDisc('sensor.screw'+x,'sensor',[x,31,251],.7,.4,'mid');
  box('stop.body','supply',-64,10,253,9,8,10,'mid');
  cyl('stop.stem','supply',-60,14,263,1.8,5,'mid');cyl('stop.cap','supply',-60,14,268,4,2,'hi');
  tube('supply.pipe','supply',[[-55,14,258],[-12,14,258]],2.6);
  faceDisc('wall.inlet','supply',[-60,-9,258],4,3,'mid');
  tube('inlet.pipe','supply',[[-60,-6,258],[-60,10,258]],2.2);
  for(const x of[-32,32])faceDisc('mount.screw'+x,'ceramic',[x,10,217],1.1,.5,'mid');
  // A ceramic trap sliced along the viewing side: shape and water share the real section.
  const TF={o:[0,48,0],a:[0,1,0],u:[1,0,0],v:[0,0,1]};
  for(const [i,[x,z,w,h]]of[[-6,26,2,36],[4,36,2,26],[-6,24,48,2],[6,34,26,2],[40,26,2,19],[30,36,2,17],[32,53,29,2],[42,43,19,2]].entries())box('trap.wall'+i,'trap',x,48,z,w,8,h,'hi');
  for(const [i,[x,z,w,h]]of[[-4,26,8,19],[4,26,28,8],[32,26,8,19],[32,45,29,8],[-4,45,8,8]].entries())box('trap.water'+i,'trap',x,48,z,w,8,h,'hi');
  for(const [i,[y,z,d,h]]of[[46,43,2,12],[56,43,2,12],[48,41,8,4],[48,53,8,4]].entries())box('drain.coupling'+i,'drain',61,y,z,3,d,h,'mid');
  // Water film follows the glazed inner back; IR rays are explanatory, actually invisible.
  const q=p=>k.iso(p,P),poly=p=>k.pathOf(p.map(q),true);
  const films= [-7,0,7].map(x=>`<path class="wash-film" d="${poly([[x-1,17.9,206],[x+1,17.9,206],[x+3,11,122],[x-3,11,122]])}"/>`).join('');
  const a=q([-4,33,259]),b=q([0,92,259]),c=q([4,33,259]);
  const head=q([0,92,278]);
  const rays=`<g class="ir-rays"><path d="M${a[0]},${a[1]} L${b[0]-6},${b[1]} L${b[0]+6},${b[1]} Z"/><path class="ir-return" d="M${c[0]},${c[1]} L${b[0]-3},${b[1]} L${b[0]+3},${b[1]} Z"/></g><g class="target"><path d="${poly([[-13,92,168],[13,92,168],[13,92,263],[-13,92,263]])}"/><path d="${poly([[-11,92,6],[-2,92,6],[-2,92,168],[-11,92,168]])+poly([[2,92,6],[11,92,6],[11,92,168],[2,92,168]])}"/><ellipse cx="${head[0]}" cy="${head[1]}" rx="12" ry="14"/></g>`;
  paths.push({overlay:films+rays});
 }else{
  for(const x of[-18,18])cyl('leg'+x,'frame',x,-18,6,2,12,'lo');
  ring('valve.floor','main',0,0,18,8,29,4,'hi');
  sector('lower.shell','main',0,0,22,26,29,28);
  sector('upper.shell','upper',0,0,53,26,29,33);
  sector('cover','upper',0,0,86,0,29,4,'mid');
  ring('outlet.barrel','main',0,0,22,7,9,28,'hi');
  ring('main.seat','main',0,0,50,7,10,2,'hi');
  ring('membrane.rim','membrane',0,0,50,24,26,1,'mid');
  const DF=G.frameAlong([0,0,0],[0,0,1]),z=52+lift*8;
  const diaphragm=[[51,24],[z,11],[z+1,11],[52,24]];
  put('membrane.flex','membrane',[0,0,(51+z)/2],S(G.lathe(diaphragm,DF,P),{tone:'hi',lit:true}),A.lathe(DF,diaphragm,{name:'membrane.flex'}));
  cyl('membrane.seal','membrane',0,0,z,11,1,'hi');
  cyl('membrane.plate','membrane',0,0,z+1,9,2,'mid');
  cyl('membrane.boss','membrane',0,0,z+3,3,3,'mid');
  // Open chambers are intentionally empty; tinted exposed back surfaces encode relative pressure.
  sector('upper.water','upper',0,0,70,0,26,14,'hi');
  sector('lower.water','supply',0,0,23,9,26,20,'hi');
  const IF=G.frameAlong([-29,0,37],[-1,0,0]);
  put('inlet.port','supply',[-33,0,37],S(G.disc(0,8,5,IF,P),{tone:'hi'}),A.disc(IF,0,8,5,{name:'inlet.port'}));
  sector('outlet.port.back','outlet',0,0,15,2,9,3,'hi');
  sector('outlet.port.front','outlet',0,0,15,2,9,3,'hi',325,505);
  cyl('outlet.water','outlet',0,0,15,2,3,'hi');
  tube('outlet.pipe','outlet',[[0,0,15],[0,0,10],[54,0,10],[54,0,22]],2);
  cyl('outlet.end','outlet',54,0,22,4,4,'hi');
  // Pilot passage is expanded outside the shell; actual products usually hide these bores.
  cyl('pilot.source','pilot',-18,-10,90,2.5,3,'mid');
  tube('pilot.high','pilot',[[-18,-10,93],[-18,-10,119],[34,-10,119],[34,-10,86],[56,-10,86]],.8);
  cyl('pilot.seat','pilot',62,-10,84,3,4,'hi');
  box('pilot.sideport','pilot',56,-12,84,3,4,4,'mid');
  sector('pilot.cage','pilot',62,-10,88,2,4,21,'mid');
  cyl('pilot.seal','pilot',62,-10,88+(pilot?3:0),1.8,1,'hi');
  cyl('pilot.armature','pilot',62,-10,89+(pilot?3:0),1.5,9,'hi');
  sector('coil','pilot',62,-10,94,4,8,12,'mid');
  sector('coil.end','pilot',62,-10,106,4,8,2,'mid');
  // Spring shown as a complete metal helix, terminating on the guide/armature end faces.
  const bottom=98+(pilot?3:0),spring=Array.from({length:81},(_,i)=>[62+1.2*Math.cos(i/80*Math.PI*6),-10+1.2*Math.sin(i/80*Math.PI*6),bottom+(109-bottom)*i/80]);
  put('pilot.spring','pilot',[62,-10,104],L(k.pathOf(spring.map(p=>k.iso(p,P))),{tone:'mid'}),A.tube(spring,.15,{name:'pilot.spring'}));
  cyl('pilot.cap','pilot',62,-10,109,4,2,'mid');
  cyl('pilot.downport','pilot',62,-10,81,3,3,'mid');
  tube('pilot.low','pilot',[[62,-10,81],[62,-10,42],[54,-10,42],[54,0,42],[54,0,26]],.8);
  // By-pass restriction, laid out beside the housing with both ends seated on real fittings.
  cyl('bypass.lower','bypass',-20,9,15,2,3,'mid');
  cyl('bypass.upper','bypass',-20,9,90,2,3,'mid');
  tube('bypass.pipe','bypass',[[-20,9,15],[-20,9,8],[-41,9,8],[-41,9,100],[-20,9,100],[-20,9,93]],.6);
  for(const [x,y]of[[-23,-8],[18,-18]])cyl('cover.screw'+x,'upper',x,y,90,1,2,'mid');
  box('circuit.base','sensor',-59,38,6,58,30,2,'lo');
  box('circuit.board','sensor',-56,41,8,52,24,1.4,'mid');
  box('circuit.chip','sensor',-36,47,9.4,10,10,3,'hi');
  box('circuit.driver','sensor',-19,48,9.4,6,8,4,'mid');
  for(const x of[-51,-41])cyl('sensor.lens'+x,'sensor',x,59,9.4,2.4,4,'hi');
  box('circuit.connector','sensor',-12,58,9.4,6,5,3,'mid');
  box('battery','sensor',-59,70,6,58,8,6,'mid');
  cyl('coil.connector','sensor',62,-16,108,1.5,2,'mid');
  tube('control.cable','sensor',[[-6,60,11],[75,60,11],[75,-16,11],[75,-16,120],[62,-16,120],[62,-16,110]],.45,true);
 }
 // The diaphragm and its bonded seal form one physical assembly; record both exact shapes.
 if(!whole){const flex=R.items.find(i=>i.name==='membrane.flex'),seal=R.items.find(i=>i.name==='membrane.seal');flex.svg+=seal.svg;flex.shapes.push(...seal.shapes);R.items=R.items.filter(i=>i!==seal);}
 A.settle(R,P);R.items.sort((a,b)=>a.key-b.key);A.auditOrExit(R,P);
 const art=R.items.map(i=>`<g data-part="${i.name}" data-system="${i.group}">${i.svg}</g>`).join('')+paths.filter(p=>p.overlay).map(p=>p.overlay).join('');
 return {svg:k.figureSvg({width:W,height:H,label:whole?'红外感应冲水小便池及展开的水封剖面':'先导泄压、膜片主阀与补水小孔的放大剖面',body:art}),parts:R.solids.map(s=>s.name),P,paths,flows};
}
const whole=drawing('whole');
const closed=drawing('detail',0,false),triggered=drawing('detail',0,true),opened=drawing('detail',1,true),closing=drawing('detail',.45,false);
const detailViews=[closed.svg,closed.svg,triggered.svg,opened.svg,closing.svg,closed.svg];
const nav=`<nav class="u-steps" aria-label="冲水过程">${stages.map((s,i)=>`<button data-step="${i}" aria-pressed="${i===0}"><small>0${i+1}</small>${s[0]}</button>`).join('')}</nav>`;
const body=`<style>${css()}</style><header><p class="eyebrow">EVERYDAY ANATOMY / INFRARED URINAL</p><h1>感应器看见人，<br>水压打开冲水阀。</h1><p class="lead">普通冲水式小便池 · 红外反射检测 · 膜片式冲水阀</p></header>${nav}<div class="u-layout"><div>${k.plateHtml({fig:'FIG. 03',title:'便池 · 感应器 · 水路',hint:'剖开水封，展开隐藏通道',readout:'待机',body:whole.svg,caption:'蓝色为冲洗水与水封；紫色光路仅用于解释，实际红外光不可见。'})}</div><aside class="u-inspector"><p class="eyebrow" id="u-number">01 / 工作过程</p><h2 id="u-title">待机</h2><p class="u-summary" id="u-summary">${stages[0][1]}</p><p id="u-description">${stages[0][2]}</p><div class="u-readings" aria-live="polite"><p>人体回波 <b id="u-echo">无</b></p><p>先导小阀 <b id="u-pilot">关闭</b></p><p>膜片主阀 <b id="u-main">关闭</b></p><p>上腔压力 <b id="u-upper">接近供水压力</b></p></div><div class="u-controls"><button id="u-next">下一步 →</button><button id="u-play">自动切换步骤</button><button id="u-theme">切换明暗</button></div><p class="u-note">动画节奏与放大比例为教学安排。检测距离、确认时间、冲水量因型号而异。</p></aside></div><div class="u-detail-layout"><div class="u-detail">${k.plateHtml({fig:'DETAIL',title:'为什么小电磁阀能控制大水流？',hint:'主阀由水压开启',readout:'上腔保压',body:`<div id="u-valve-view">${closed.svg}</div>`,caption:'阀壳切去近侧一半，内部通道在阀外展开。青色表示上腔压力状态，不表示水位；正常供水时阀内腔充水。'})}</div><aside class="u-detail-copy"><h2>两个阀，各做一件事。</h2><p><strong>小阀负责泄压。</strong>线圈、动铁芯、密封头和复位弹簧组成先导执行机构。小阀开启时，上腔少量水泄向下游。</p><p><strong>大阀负责冲水。</strong>上腔压力降低后，供水侧的压力使柔性膜片抬起。中间的主阀座打开，大股水从下方出口流走。</p><p><strong>小孔负责补压。</strong>先导口关闭后，小孔补水恢复上腔压力。膜片回到主阀座上，水流停止。</p><div class="u-key"><span class="water-key">蓝：供水侧 / 冲洗水</span><span class="pressure-key">青：上腔压力状态</span><span>亮色圆盘：膜片及主密封</span><span class="pilot-key">紫：先导阀与泄压通道</span><span class="bypass-key">绿：补水小孔通道</span></div><p class="u-note">这是膜片式先导控制的通用教学剖面；活塞式等产品内部形状不同。关闭状态下，上下腔压力可接近，但膜片两侧有效受压面积不同，因此仍能压住主阀座。</p></aside></div><section class="u-bottom"><h2>冲洗水从哪里来，去了哪里？</h2><div class="u-facts"><p><strong>水源是有压力的供水管。</strong>检修阀常开，冲水阀按需开启；本图没有冲洗水箱。防虹吸组件位于冲水管，减少倒吸风险。</p><p><strong>分水口把水铺向内壁。</strong>水洗过釉面，与尿液一起经排水口进入存水弯，再流往下水管。本图选择洗冲式，不演示虹吸喷射式结构。</p><p><strong>弯道里留下水封。</strong>水停留在低处，堵住气体回到室内的路径。冲洗结束不是把弯道抽干；本图的水封剖面被展开以便观察。</p></div><details><summary>绘图依据与适用范围</summary><p>没有指定实物型号；陶瓷外形、阀体行程和外露通道为解释机制所作的简化，不是安装尺寸图。电源可用电池或低压供电，图中仅示意电源与控制板。</p><ul><li><a href="https://sloan.in/sites/default/files/2025-11/diaphragm-piston-whitepaper_0.pdf" target="_blank" rel="noopener noreferrer">Sloan：膜片式冲水阀的压力与小孔补水机制，pp.1–2</a></li><li><a href="https://www.sloan.com/resources/technical-documents" target="_blank" rel="noopener noreferrer">Sloan：Sensors 101 与 G2/ECOS 安装说明，红外反射及离开后触发</a></li><li><a href="https://eu.toto.com/en/products/product-details/UWN926ETS" target="_blank" rel="noopener noreferrer">TOTO：带内置存水弯的小便池实例</a></li></ul></details></section>`;
const live=`const stages=${JSON.stringify(stages)},views=${JSON.stringify(detailViews)};const model=${urinalState.toString()};let step=0,playing=false,last=0,age=0,visible=true;const reduce=matchMedia('(prefers-reduced-motion:reduce)');function render(){const s=model(step);document.body.dataset.flush=s.flow;document.body.dataset.present=s.present;document.body.dataset.pilot=s.pilot;document.body.dataset.refill=s.refill;document.querySelectorAll('[data-step]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.step===step)));for(const [id,value]of[['u-number','0'+(step+1)+' / 工作过程'],['u-title',stages[step][0]],['u-summary',stages[step][1]],['u-description',stages[step][2]],['u-echo',s.present?'有 · 已确认停留':'无'],['u-pilot',s.pilot?'开启':'关闭'],['u-main',s.lift===1?'开启':s.lift?'正在关闭':'关闭'],['u-upper',s.upper]])document.getElementById(id).textContent=value;document.getElementById('u-valve-view').innerHTML=views[step];document.querySelectorAll('[data-readout]')[0].textContent=stages[step][0];document.querySelectorAll('[data-readout]')[1].textContent=s.upper;document.getElementById('u-play').textContent=playing?'停止自动切换':'自动切换步骤';document.body.dataset.step=step;}
function setStep(n){step=(n+6)%6;age=0;render()}document.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>{playing=false;setStep(+b.dataset.step)});document.getElementById('u-next').onclick=()=>{playing=false;setStep(step+1)};document.getElementById('u-play').onclick=()=>{if(reduce.matches){setStep(step+1);return}playing=!playing;age=0;render()};document.getElementById('u-theme').onclick=()=>document.body.dataset.theme=document.body.dataset.theme==='light'?'dark':'light';document.addEventListener('keydown',e=>{if(e.target.matches('button,a,input,summary'))return;if(e.key==='ArrowRight'){e.preventDefault();playing=false;setStep(step+1)}if(e.key==='ArrowLeft'){e.preventDefault();playing=false;setStep(step-1)}});new IntersectionObserver(es=>{visible=es.some(e=>e.isIntersecting);last=0}).observe(document.querySelector('.u-layout'));document.addEventListener('visibilitychange',()=>last=0);reduce.addEventListener('change',()=>{playing=false;render()});function tick(t){const dt=last?Math.min((t-last)/1000,.1):0;last=t;if(visible&&!document.hidden&&!reduce.matches){age+=dt;if(playing&&age>3.5)setStep(step+1);document.querySelectorAll('.wash-film').forEach((e,i)=>e.style.opacity=model(step).flow?String(.5+.25*Math.sin(age*2+i)):0)}requestAnimationFrame(tick)}render();requestAnimationFrame(tick);window.__urinal={getState:()=>model(step),setStep};`;
function css(){return `.iso-page{width:min(1160px,100% - 48px);margin:40px auto 60px}body{--water:#548eaf;--pressure:#70a99f;--pilot:#9d85bb;--bypass:#6e9a6c}.eyebrow{font:10px/1.5 var(--anatomy-mono);letter-spacing:.12em;color:var(--anatomy-muted)}h1{font-size:32px;line-height:1.35;font-weight:550;letter-spacing:-.025em;color:var(--anatomy-strong);margin:12px 0}h2{font-size:20px;font-weight:550;color:var(--anatomy-strong);margin:10px 0 16px}.lead{font-size:13px;color:var(--anatomy-text);margin-bottom:27px}.u-steps{display:flex;gap:7px;flex-wrap:wrap;margin:0 0 20px}button{font:12px/1.6 inherit;color:var(--anatomy-text);background:var(--anatomy-card);border:1px solid var(--anatomy-lo);border-radius:5px;padding:9px 12px;cursor:pointer}button:hover,button[aria-pressed=true]{border-color:var(--anatomy-hi);color:var(--anatomy-strong)}button:focus-visible,a:focus-visible,summary:focus-visible{outline:2px solid var(--water);outline-offset:4px}button small{color:var(--anatomy-muted);margin-right:7px}.u-layout,.u-detail-layout{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(260px,1fr);gap:32px;align-items:center}.u-inspector{padding:10px 0}.u-summary{color:var(--anatomy-strong);font-size:15px}.u-inspector>p,.u-detail-copy p,.u-facts p{font-size:13px;line-height:1.95}.u-readings{margin:23px 0;border-top:1px solid var(--anatomy-faint);border-bottom:1px solid var(--anatomy-faint);padding:12px 0}.u-readings p{display:flex;justify-content:space-between;font-size:11px;margin:8px 0;gap:10px}.u-readings b{font-weight:500;color:var(--anatomy-strong)}.u-controls{display:flex;gap:7px;flex-wrap:wrap}.u-note{font-size:11px!important;color:var(--anatomy-muted);line-height:1.8}.u-detail-layout{margin-top:34px}.iso-figure{margin:0}.iso-plate svg{width:100%;height:auto}.iso-legend{font-size:11px!important;line-height:1.8!important}.u-key{display:grid;gap:7px;padding:15px 0;border-top:1px solid var(--anatomy-faint);font-size:11px}.water-key{color:var(--water)}.pressure-key{color:var(--pressure)}.pilot-key{color:var(--pilot)}.bypass-key{color:var(--bypass)}.u-bottom{border-top:1px solid var(--anatomy-faint);margin-top:37px;padding-top:26px}.u-facts{display:grid;grid-template-columns:repeat(3,1fr);gap:25px}.u-facts strong{display:block;color:var(--anatomy-strong);margin-bottom:8px;font-weight:550}details{margin-top:22px;font-size:11px;line-height:1.9}summary{cursor:pointer}a{color:var(--anatomy-text);text-underline-offset:3px}.wash-film{fill:var(--water);opacity:0}.ir-rays path{fill:var(--pilot);opacity:.12}.ir-return,.target{opacity:0}.target path,.target ellipse{fill:var(--anatomy-mid)}body[data-present=true] .target{opacity:.25}body[data-present=true] .ir-return{opacity:.28}.trap-water{fill:var(--water);opacity:.9}[data-part='upper.water'] .iso-solid{--anatomy-paper:var(--pressure);--anatomy-top:var(--pressure);--anatomy-shade-0:#47776d;--anatomy-shade-1:#508478;--anatomy-shade-2:#65968c;--anatomy-shade-3:#6ca297}[data-part='lower.water'] .iso-solid{--anatomy-paper:var(--water);--anatomy-top:var(--water)}[data-system=pilot] .iso-solid{--anatomy-hi:var(--pilot)}[data-system=bypass] .tb{--anatomy-hi:var(--bypass)}body[data-step='2'] [data-part='upper.water'],body[data-step='3'] [data-part='upper.water']{opacity:.4}body[data-flush='1'] [data-system=wash] .tb-edge,body[data-flush='0.45'] [data-system=wash] .tb-edge{stroke:var(--water)}@media(max-width:700px){.iso-page{width:calc(100% - 32px);margin:30px auto 50px}h1{font-size:27px}.u-layout,.u-detail-layout{grid-template-columns:1fr;gap:14px}.u-facts{grid-template-columns:1fr;gap:0}.u-steps{gap:6px}button{padding:8px 9px;font-size:11px}.u-detail-layout{margin-top:25px}.u-inspector{padding:0}.u-readings{margin:15px 0}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}.wash-film{opacity:.65}body[data-flush='0'] .wash-film{opacity:0}}`}
const fluidCSS=`[data-part^='trap.water'] .iso-solid,[data-part='lower.water'] .iso-solid,[data-part='outlet.water'] .iso-solid{--anatomy-paper:#79a6bf;--anatomy-top:#a3c5d7;--anatomy-shade-0:#4b7f9b;--anatomy-shade-1:#588daa;--anatomy-shade-2:#6a9cb7;--anatomy-shade-3:#79a6bf}[data-part='trap.water3'],[data-part='trap.water4']{display:none}body[data-step='3'] [data-part='trap.water3'],body[data-step='4'] [data-part='trap.water3'],body[data-step='3'] [data-part='trap.water4'],body[data-step='4'] [data-part='trap.water4']{display:block}[data-system='pilot'] .tb-edge{stroke:var(--pilot)}[data-system='bypass'] .tb-edge{stroke:var(--bypass)}body[data-step='2'] [data-part='upper.water'],body[data-step='3'] [data-part='upper.water']{opacity:1}body[data-step='2'] [data-part='upper.water'] .iso-solid,body[data-step='3'] [data-part='upper.water'] .iso-solid{--anatomy-paper:#b8d0ca;--anatomy-top:#d0e2dc;--anatomy-shade-0:#9fbfb7;--anatomy-shade-1:#adc9c1;--anatomy-shade-2:#b6d0c8;--anatomy-shade-3:#bfd6d0}`;
const patchedLive=live.replace('function render(){',flowRuntime([...whole.flows,...closed.flows])+'function render(){').replace("document.getElementById('u-play').textContent=playing?'停止自动切换':'自动切换步骤';","document.getElementById('u-play').textContent=reduce.matches?'下一步演示':playing?'停止自动切换':'自动切换步骤';document.getElementById('u-play').setAttribute('aria-pressed',String(playing));refreshFlow();updateFlow(0);").replace("if(visible&&!document.hidden&&!reduce.matches){age+=dt;","if(visible&&!document.hidden&&!reduce.matches){age+=dt;updateFlow(age);").replace("new IntersectionObserver(es=>{visible=es.some(e=>e.isIntersecting);last=0}).observe(document.querySelector('.u-layout'));","const observed=new Map();const observer=new IntersectionObserver(es=>{es.forEach(e=>observed.set(e.target,e.isIntersecting));visible=[...observed.values()].some(Boolean);last=0});document.querySelectorAll('.u-layout,.u-detail-layout').forEach(e=>observer.observe(e));");
const html=k.pageHtml({title:'红外感应小便池 · 冲水与水封原理',theme,body:body.replace('</style>',fluidCSS+`[data-part='porcelain.bowl'] .iso-fill,[data-part='porcelain.lip'] .iso-fill{fill-rule:evenodd}`+'</style>'),script:patchedLive,width:1160}).replace('<html lang="en">','<html lang="zh-CN">');
writeFileSync(join(ROOT,theme==='light'?'urinal-light.html':'urinal.html'),html);
writeFileSync(join(ROOT,'urinal-parts.json'),JSON.stringify({concept:'红外反射检测与膜片式先导冲水阀',fixture:whole.parts,valve:closed.parts},null,2));
console.log('Urinal built: '+whole.parts.length+' fixture parts, '+closed.parts.length+' valve parts.');
