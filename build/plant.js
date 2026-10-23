function rng(seed){let x=seed*9301+49297;return()=>{x=(x*9301+49297)%233280;return x/233280;};}
function plantSVG(L,t,w,pot){
  w=w||0;
  t=Math.max(0,Math.min(1,t||0));const r=rng(7);let g='';
  const gy=112;
  let body='';
  if(L===0){
    body+=`<ellipse cx="60" cy="${gy-3}" rx="${5+t*1.5}" ry="${3.6+t}" fill="var(--trunk)"/><path d="M58 ${gy-5} q2 -2 4 0" stroke="var(--soil)" stroke-width="1" fill="none"/>`;
  }else if(L<=3){
    const h=[0,14,26,40][L]+t*10,top=gy-h;
    body+=`<path d="M60 ${gy} C 60 ${gy-h*0.4}, ${58+L} ${gy-h*0.7}, 60 ${top}" stroke="var(--lf2)" stroke-width="${2+L*0.5}" fill="none" stroke-linecap="round"/>`;
    const leaf=(x,y,rx,ry,a,c)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${a} ${x} ${y})" fill="${c}"/>`;
    if(L===1)body+=leaf(65,top+2,6+t*2,3,-25,'var(--lf3)');
    if(L>=2){body+=leaf(52,top+1,8+t*2,4,20,'var(--lf3)')+leaf(68,top+1,8+t*2,4,-20,'var(--lf1)');}
    if(L>=3){body+=leaf(50,gy-h*0.45,9,4.2,25,'var(--lf1)')+leaf(70,gy-h*0.6,9,4.2,-25,'var(--lf2)')+leaf(60,top-4,4,7,0,'var(--lf3)');}
  }else{
    const k=L-4,H=24+k*6+t*5,R=14+k*4.1+t*3.5,tw=3+k*1.1;
    const cy=gy-H-R*0.15,top=gy-H;
    body+=`<path d="M${60-tw} ${gy} Q ${60-tw*0.6} ${gy-H*0.5} ${60-tw*0.4} ${top} L ${60+tw*0.4} ${top} Q ${60+tw*0.6} ${gy-H*0.5} ${60+tw} ${gy} Z" fill="var(--trunk)"/>`;
    if(L>=6)body+=`<path d="M60 ${gy-H*0.55} q -${R*0.45} -${R*0.25} -${R*0.6} -${R*0.6}" stroke="var(--trunk)" stroke-width="${tw*0.5}" fill="none" stroke-linecap="round"/><path d="M60 ${gy-H*0.65} q ${R*0.45} -${R*0.2} ${R*0.6} -${R*0.55}" stroke="var(--trunk)" stroke-width="${tw*0.5}" fill="none" stroke-linecap="round"/>`;
    const blobs=L===4?[[0,0,1]]:L===5?[[-.45,.15,.68],[.45,.15,.68],[0,-.2,.8]]:[[-.55,.2,.62],[.55,.2,.62],[-.3,-.35,.66],[.3,-.35,.66],[0,0,.78]];
    blobs.forEach(([dx,dy,s],i)=>{body+=`<circle cx="${60+dx*R}" cy="${cy+dy*R}" r="${R*s}" fill="${i%2?'var(--lf1)':'var(--lf2)'}"/>`;});
    body+=`<circle cx="${60-R*0.25}" cy="${cy-R*0.3}" r="${R*0.32}" fill="var(--lf3)" opacity=".55"/>`;
    const dots=(n,fn)=>{const rr=rng(L*13);for(let i=0;i<n;i++){const a=rr()*Math.PI*2,d=Math.sqrt(rr())*R*0.95;fn(60+Math.cos(a)*d,cy+Math.sin(a)*d*0.85);}};
    if(L===7)dots(7+Math.round(t*5),(x,y)=>{body+=`<circle cx="${x}" cy="${y}" r="2.2" fill="var(--bloom)" class="bl"/>`;});
    if(L>=8)dots(L===8?12:8,(x,y)=>{body+=`<g class="bl">${[0,72,144,216,288].map(a=>`<circle cx="${x+Math.cos(a*Math.PI/180)*2.3}" cy="${y+Math.sin(a*Math.PI/180)*2.3}" r="1.8" fill="var(--bloom)"/>`).join('')}<circle cx="${x}" cy="${y}" r="1.2" fill="var(--bloom-c)"/></g>`;});
    if(L>=9){const rr=rng(99);for(let i=0;i<(L===9?6+Math.round(t*4):12);i++){const a=rr()*Math.PI*2,d=Math.sqrt(rr())*R*0.8;body+=`<circle cx="${60+Math.cos(a)*d}" cy="${cy+Math.sin(a)*d*0.85+2}" r="3.2" fill="var(--fruit)" class="fr"/><circle cx="${60+Math.cos(a)*d-1}" cy="${cy+Math.sin(a)*d*0.85+1}" r="1" fill="#fff" opacity=".6" class="fr"/>`;}}
    if(L>=10)[[18,24],[100,30],[22,60],[104,70]].forEach(([x,y])=>{body+=`<path d="M${x} ${y-4} L${x+1} ${y-1} L${x+4} ${y} L${x+1} ${y+1} L${x} ${y+4} L${x-1} ${y+1} L${x-4} ${y} L${x-1} ${y-1} Z" fill="var(--bloom-c)"/>`;});
  }
  if(pot)g+=`<path d="M33 ${gy+8} L87 ${gy+8} L80 ${gy+44} Q79 ${gy+48} 75 ${gy+48} L45 ${gy+48} Q41 ${gy+48} 40 ${gy+44} Z" fill="var(--pot)"/><path d="M36 ${gy+16} L84 ${gy+16} L83 ${gy+20} L37 ${gy+20} Z" fill="var(--pot-2)" opacity=".5"/><rect x="28" y="${gy-1}" width="64" height="11" rx="3" fill="var(--pot-2)"/><ellipse cx="60" cy="${gy+1}" rx="28" ry="4.5" fill="var(--soil-2)"/>`;
  else g+=`<ellipse cx="60" cy="${gy+6}" rx="52" ry="12" fill="var(--soil)"/><ellipse cx="60" cy="${gy+3}" rx="40" ry="6" fill="var(--soil-2)" opacity=".5"/>`;
  let fall='';
  if(w>=2&&L>=1){const rr=rng(31+w);const n=w===2?4:9;for(let i=0;i<n;i++){const x=22+rr()*76,y=gy+1+rr()*8,a=rr()*180;fall+=`<ellipse cx="${x}" cy="${y}" rx="3.2" ry="1.5" transform="rotate(${a} ${x} ${y})" fill="${i%2?'var(--dead)':'var(--wither)'}"/>`;}}
  if(w>=3&&L>=4){const rr=rng(5);for(let i=0;i<3;i++){const x=30+rr()*60,y=40+rr()*40;fall+=`<ellipse class="drop" style="animation-delay:${i*1.3}s" cx="${x}" cy="${y}" rx="3" ry="1.4" fill="var(--dead)"/>`;}}
  if(pot)fall=fall.replace(/<ellipse cx="[\d.]+" cy="1[12]\d[^>]*rotate[^>]*>/g,'');
  return `<svg class="w${w}" viewBox="0 0 120 ${pot?162:128}" xmlns="http://www.w3.org/2000/svg">${pot?'':g}<g class="sway">${body}</g>${pot?g:''}${fall}</svg>`;
}
