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
// Generate structured data from confirmed event details.
const events = future.flatMap(s => {
  const venue = s.venue || s.location || '';
  const address = s.address || '';
  const time = s.time || '';

  // Exclude events with unconfirmed locations or times.
  if (
    !venue ||
    /TBA|announc|to be announced/i.test(venue) ||
    !address ||
    /TBA/i.test(time)
  ) return [];

  // Interpret existing calendar times as evening performances.
  // Change shows.json to use explicit AM/PM for daytime shows.
  const match = time.match(
    /^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?\s*[-–]\s*(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i
  );
  if (!match) return [];

  const to24 = (hour, minute, period = 'PM') => {
    let h = Number(hour) % 12;
    if (period.toUpperCase() === 'PM') h += 12;
    return `${String(h).padStart(2, '0')}:${minute}:00`;
  };

  const start = to24(match[1], match[2], match[3]);
  const end = to24(match[4], match[5], match[6]);

  // NJ observes Eastern Time, including daylight saving.
  const month = Number(s.date.slice(5, 7));
  const day = Number(s.date.slice(8, 10));
  const year = Number(s.date.slice(0, 4));

  const nthSunday = (m, n) => {
    const first = new Date(Date.UTC(year, m - 1, 1)).getUTCDay();
    return 1 + ((7 - first) % 7) + (n - 1) * 7;
  };

  const dstStart = nthSunday(3, 2);
  const dstEnd = nthSunday(11, 1);
  const dst = month > 3 && month < 11 ||
    month === 3 && day >= dstStart ||
    month === 11 && day < dstEnd;

  const offset = dst ? '-04:00' : '-05:00';

  return [{
    '@context': 'https://schema.org',
    '@type': 'MusicEvent',
    name: s.title,
    startDate: `${s.date}T${start}${offset}`,
    endDate: `${s.date}T${end}${offset}`,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode:
      'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: venue,
      address: address
    },
    performer: {
      '@type': 'MusicGroup',
      name: 'Fire In The Annex',
      url: 'https://fireintheannex.com/'
    },
    url: 'https://fireintheannex.com/#shows'
  }];
});

if (events.length) {
  html = html.replace(
    '</head>',
    `<script type="application/ld+json">${
      JSON.stringify(events).replace(/</g, '\\u003c')
    }</script>\n</head>`
  );
}

fs.writeFileSync('index.html', html);
console.log(
  `Generated ${future.length} shows and ${events.length} structured events`
);
