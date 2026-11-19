import fs from 'node:fs';
const shows = JSON.parse(fs.readFileSync('shows.json','utf8'));
const template = fs.readFileSync('index.template.html','utf8');
const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today = new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const future = shows.filter(s=> /^\d{4}-\d\d-\d\d$/.test(s.date) && s.date>=today).sort((a,b)=>a.date.localeCompare(b.date));
const cards = future.map((s,i)=>`<article class="show-item${i>=2?' extra-show':''}"${i>=2?' hidden':''}>
  <div class="show-date"><time datetime="${esc(s.date)}">${esc(s.dateLabel||s.date)}</time></div>
  <div class="show-info"><div class="show-title">${esc(s.title)}</div><div class="show-location">${esc(s.venue||s.location||'')}</div><div class="show-address">${esc(s.address||'Address TBA')}</div><div class="show-time">${esc(s.time||'Time TBA')}</div></div>
  ${s.url?`<a class="details" href="${esc(s.url)}" target="_blank" rel="noopener">Learn more</a>`:'<span class="details-pending">Details soon</span>'}
</article>`).join('\n');
let html=template.replace(/<div id="show-list" class="show-list" aria-live="polite">[\s\S]*?<\/div>/,`<div id="show-list" class="show-list" aria-live="polite">\n${cards||'New shows coming soon!'}\n</div>`);
if(html===template)throw Error('Cannot locate show-list placeholder in template');
// Only publish event schema for confirmed venues, city and explicitly unambiguous times.
const events=future.filter(s=>s.venue && !/announc|TBA/i.test(s.venue) && /,\s*NJ\b/i.test(s.address||'') && /\b(?:AM|PM)\b/i.test(s.time||'')).map(s=>({
 '@context':'https://schema.org','@type':'MusicEvent',name:s.title,startDate:s.date,
 eventStatus:'https://schema.org/EventScheduled',eventAttendanceMode:'https://schema.org/OfflineEventAttendanceMode',
 location:{'@type':'Place',name:s.venue,address:s.address},performer:{'@type':'MusicGroup',name:'Fire In The Annex',url:'https://fireintheannex.com/'},url:'https://fireintheannex.com/#shows'
}));
// The current JSON uses ambiguous 7:30-10:30 times; don't guess AM/PM or add misleading structured dates.
if(events.length){html=html.replace('</head>',`<script type="application/ld+json">${JSON.stringify(events).replace(/</g,'\\u003c')}</script>\n</head>`)}
fs.writeFileSync('index.html',html);
console.log(`Generated ${future.length} shows and ${events.length} structured events`);
