import * as k from './kit/iso-kit.mjs';
import * as G from './kit/lathe.mjs';
import * as A from './kit/audit.mjs';

// Closed meridian, cut exactly through the centre: the near half is physically removed.
export function halfBowl(profile,P){
 const F={o:[0,48,65],a:[0,0,1],u:[1,0,0],v:[0,1,0]},points=A.traced(profile),faces=[];
 const world=(s,r,a)=>[r*Math.cos(a),48+r*Math.sin(a),65+s];
 function face(pts,n){const tone=G.toneOf(n,P);faces.push({depth:pts.reduce((s,p)=>s+k.depthOf(p,P),0)/pts.length,d:k.pathOf(pts.map(p=>k.iso(p,P)),true),tone});}
 const light=G.lightOf(P),bands=[-Infinity,0,.2,.42,.62,Infinity];
 const normalAt=i=>{const a=points[(i-1+points.length)%points.length],b=points[i],c=points[(i+1)%points.length];const left=G.unit3([b[0]-a[0],a[1]-b[1],0]),right=G.unit3([c[0]-b[0],b[1]-c[1],0]);return G.unit3(G.add3(left,right));};
 function clip(poly,limit,above){if(!Number.isFinite(limit))return poly;const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],aa=above?a.v>=limit:a.v<=limit,bb=above?b.v>=limit:b.v<=limit;if(aa)out.push(a);if(aa!==bb){const t=(limit-a.v)/(b.v-a.v);out.push({p:G.lerp3(a.p,b.p,t),v:limit})}}return out;}
 function curvedFace(pts,normals){const poly=pts.map((p,i)=>({p,v:G.dot3(normals[i],light)})),depth=pts.reduce((s,p)=>s+k.depthOf(p,P),0)/pts.length;for(let tone=0;tone<5;tone++){const part=clip(clip(poly,bands[tone],true),bands[tone+1],false);if(part.length>2)faces.push({depth,d:k.pathOf(part.map(q=>k.iso(q.p,P)),true),tone});}}
 for(let row=0;row<points.length;row++){
  const a=points[row],b=points[(row+1)%points.length],ds=b[0]-a[0],dr=b[1]-a[1],len=Math.hypot(ds,dr)||1;
  for(let j=0;j<96;j++){const t0=Math.PI+j/96*Math.PI,t1=Math.PI+(j+1)/96*Math.PI,t=(t0+t1)/2;
   const n0=normalAt(row),n1=normalAt((row+1)%points.length),normal=(n,t)=>[n[0]*Math.cos(t),n[0]*Math.sin(t),n[1]];
   curvedFace([world(a[0],a[1],t0),world(a[0],a[1],t1),world(b[0],b[1],t1),world(b[0],b[1],t0)],[normal(n0,t0),normal(n0,t1),normal(n1,t1),normal(n1,t0)]);}
 }
 for(const angle of[Math.PI,2*Math.PI])face(points.map(([s,r])=>world(s,r,angle)),[0,1,0]);
 faces.sort((a,b)=>a.depth-b.depth);
 const edges=[...points.map(([s,r])=>world(s,r,Math.PI)),world(points[0][0],points[0][1],Math.PI)];
 const other=[...points.map(([s,r])=>world(s,r,2*Math.PI)),world(points[0][0],points[0][1],2*Math.PI)];
 const rim=Array.from({length:97},(_,j)=>world(55,39,Math.PI+j/96*Math.PI));
 const svg='<g class="iso-solid">'+faces.map(f=>`<path class="${f.tone===4?'iso-top':'iso-shade'}" data-shade="${f.tone}" d="${f.d}"/>`).join('')+k.lineSvg([edges,other,rim].map(p=>k.pathOf(p.map(q=>k.iso(q,P)))).join(''),{tone:'hi',className:'iso-edge'})+'</g>';
 const cut=A.box([-60,48,0],[60,120,150],{name:'bowl.front-cut'});
 return {svg,shape:A.lathe(F,profile,{name:'porcelain.bowl',cut})};
}
