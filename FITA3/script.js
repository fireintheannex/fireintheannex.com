document.getElementById('year').textContent=new Date().getFullYear();
async function loadShows(){
 const host=document.getElementById('show-list'),button=document.getElementById('show-more');
 try{
  const r=await fetch('shows.json');if(!r.ok)throw Error('Could not load shows');
  const shows=await r.json();host.replaceChildren();
  if(!shows.length){host.textContent='New shows coming soon!';return}
  const pageSize=2;let visibleCount=Math.min(pageSize,shows.length);
  const items=shows.map((show,i)=>{
   const item=document.createElement('article');item.className='show-item';
   const date=document.createElement('div');date.className='show-date';date.textContent=show.dateLabel||show.date;
   const info=document.createElement('div');info.className='show-info';
   const title=document.createElement('div');title.className='show-title';title.textContent=show.title;
   const loc=document.createElement('div');loc.className='show-location';loc.textContent=show.venue||show.location||'';
   info.append(title,loc);
   const addr=document.createElement('div');addr.className='show-address';addr.textContent=show.address||'Address TBA';info.append(addr);
   const time=document.createElement('div');time.className='show-time';time.textContent=show.time||'Time TBA';info.append(time);
   item.append(date,info);
   if(show.url){const a=document.createElement('a');a.className='details';a.href=show.url;a.textContent='Learn more';a.target='_blank';a.rel='noopener';item.append(a)}
   else {const placeholder=document.createElement('span');placeholder.className='details-pending';placeholder.textContent='Details soon';item.append(placeholder)}
   if(i>=visibleCount){item.hidden=true;item.classList.add('extra-show')}
   host.append(item);return item;
  });
  if(shows.length>pageSize){
   button.hidden=false;
   button.textContent='Load 2 More Shows ↓';
   button.addEventListener('click',()=>{
    visibleCount=Math.min(visibleCount+pageSize,items.length);
    items.forEach((item,i)=>{item.hidden=i>=visibleCount});
    button.hidden=visibleCount>=items.length;
    button.setAttribute('aria-expanded',String(visibleCount>pageSize));
   });
  } else {button.hidden=true;}

 }catch(e){host.textContent='Shows are temporarily unavailable.'}
}
loadShows();
const frames=[...document.querySelectorAll('.photo-frame')];let scheduled=false;function zoomOnScroll(){scheduled=false;if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;for(const el of frames){const r=el.getBoundingClientRect(),h=innerHeight;const p=Math.max(0,Math.min(1,(h-r.top)/(h+r.height)));el.querySelector('img').style.transform=`scale(${(matchMedia('(max-width: 650px)').matches ? 1.22-p*.20 : 1+p*.085).toFixed(3)})`}}addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(zoomOnScroll)}},{passive:true});addEventListener('resize',zoomOnScroll);zoomOnScroll();
// One canvas, one lettering mask: prevents double-drawn/offset glyphs.
(function(){
 const canvas=document.getElementById('fire-canvas'),title=document.getElementById('fire-title');
 if(!canvas||!title)return;
 const ctx=canvas.getContext('2d',{alpha:true});if(!ctx)return;
 const mask=document.createElement('canvas'),mctx=mask.getContext('2d');
 const texture=document.createElement('canvas'),tctx=texture.getContext('2d');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let width=0,height=0,last=0;
 function resize(){
  const r=canvas.getBoundingClientRect();const dpr=Math.min(devicePixelRatio||1,2);
  width=Math.max(1,Math.round(r.width*dpr));height=Math.max(1,Math.round(r.height*dpr));
  canvas.width=mask.width=texture.width=width;canvas.height=mask.height=texture.height=height;
  mctx.clearRect(0,0,width,height);
  const size=height*.91;
  mctx.font=`900 ${size}px Impact, 'Arial Narrow', sans-serif`;
  const label=title.textContent.trim();
  const measured=mctx.measureText(label).width;
  const scale=Math.min(1,(width-8*dpr)/measured);
  mctx.save();mctx.translate(width/2,height*.87);mctx.scale(scale,1);
  mctx.textAlign='center';mctx.textBaseline='alphabetic';mctx.fillStyle='#fff';mctx.fillText(label,0,0);mctx.restore();
 }
 resize();addEventListener('resize',resize);
 function draw(ms){
  if(ms-last<55&&!reduced){requestAnimationFrame(draw);return}last=ms;
  const t=reduced?0:ms*.001;
  // Layered moving light and shadow, sampled at a small resolution for a soft photographic flame texture.
  const low=document.createElement('canvas');low.width=300;low.height=50;
  const lc=low.getContext('2d');const data=lc.createImageData(low.width,low.height);
  for(let y=0;y<low.height;y++)for(let x=0;x<low.width;x++){
   const u=x/low.width,v=y/low.height;
   const turbulence=Math.sin(x*.085+t*1.7+Math.sin(y*.18-t)*2)*.18+Math.sin(x*.035-y*.12-t*2.5)*.12+Math.sin(x*.19+y*.1+t*3.3)*.065;
   const boundary=.35+Math.sin(u*18-t*1.7)*.13+Math.sin(u*34+t*2.4)*.06+turbulence;
   const glow=Math.max(0,Math.min(1,(v-boundary)*3.2));
   const k=(y*low.width+x)*4;
   const stops=glow<.3?[35+glow*420,9+glow*120,18]:glow<.65?[165+(glow-.3)*255,45+(glow-.3)*400,9+(glow-.3)*130]:[255,185+(glow-.65)*185,65+(glow-.65)*430];
   data.data[k]=Math.min(255,stops[0]);data.data[k+1]=Math.min(255,stops[1]);data.data[k+2]=Math.min(255,stops[2]);data.data[k+3]=255;
  }
  lc.putImageData(data,0,0);
  tctx.clearRect(0,0,width,height);tctx.imageSmoothingEnabled=true;tctx.drawImage(low,0,0,width,height);
  ctx.clearRect(0,0,width,height);ctx.drawImage(texture,0,0);
  ctx.globalCompositeOperation='destination-in';ctx.drawImage(mask,0,0);
  ctx.globalCompositeOperation='source-over';
  canvas.parentElement.classList.add('flame-ready');
  if(!reduced)requestAnimationFrame(draw);
 }
 requestAnimationFrame(draw);
})();
