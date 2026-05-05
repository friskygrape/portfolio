/* ── Album definitions ─────────────────────────────────── */
const albums = [
  {
    label: 'Data-Driven',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"
             stroke="#4D00C0" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
             <line x1="18" y1="20" x2="18" y2="10"/>
             <line x1="12" y1="20" x2="12" y2="4"/>
             <line x1="6"  y1="20" x2="6"  y2="14"/>
           </svg>`,
    svg: () => {
      // Chart bounds: clear of stat cards (top 28+70+14=112) and title gradient (bottom 330)
      const CL=58, CR=410, CB=330, CT=118, CH=CB-CT; // 212px tall chart

      // Stat cards — three equal columns with 28px side padding
      const stats = [
        {x:28,  label:'CSAT',      val:'94%',  sub:'↑ 6 pts'},
        {x:161, label:'GROWTH',    val:'2.4×', sub:'YoY'},
        {x:294, label:'RETENTION', val:'+18%', sub:'QoQ'},
      ];
      const statCards = stats.map(s=>`
        <rect x="${s.x}" y="28" width="118" height="70" rx="10" fill="rgba(255,255,255,0.13)"/>
        <text x="${s.x+59}" y="49" text-anchor="middle" fill="rgba(255,255,255,0.55)" font-size="9" font-family="Inter,sans-serif" font-weight="600" letter-spacing="1">${s.label}</text>
        <text x="${s.x+59}" y="74" text-anchor="middle" fill="white" font-size="22" font-family="Inter,sans-serif" font-weight="800">${s.val}</text>
        <text x="${s.x+59}" y="89" text-anchor="middle" fill="rgba(255,255,255,0.50)" font-size="10" font-family="Inter,sans-serif">${s.sub}</text>
      `).join('');

      // Data points — 7 months, y values map low%→bottom, high%→top
      const xs = [58,116,175,233,291,350,410];
      const vals = [48,79,55,91,63,84,96]; // percent
      const pts  = vals.map((v,i) => [xs[i], Math.round(CB - v/100*CH)]);
      const polyStr = pts.map(p=>p.join(',')).join(' ');
      const areaD   = 'M'+pts.map(p=>p.join(',')).join(' L')+` L${CR},${CB} L${CL},${CB}Z`;

      // Grid lines — correct direction: 25% near bottom, 100% near top
      const gridPcts = [25,50,75,100];
      const gridLines = gridPcts.map(pct=>{
        const y = Math.round(CB - pct/100*CH);
        return `<line x1="${CL}" y1="${y}" x2="${CR}" y2="${y}" stroke="rgba(255,255,255,0.07)" stroke-width="1" stroke-dasharray="4 7"/>`;
      }).join('');
      const yLabels = gridPcts.map(pct=>{
        const y = Math.round(CB - pct/100*CH);
        return `<text x="${CL-8}" y="${y+4}" text-anchor="end" fill="rgba(255,255,255,0.32)" font-size="9" font-family="Inter,sans-serif">${pct}%</text>`;
      }).join('');

      const months  = ['Jan','Feb','Mar','Apr','May','Jun','Jul'];
      const xLabels = months.map((m,i)=>`
        <text x="${xs[i]}" y="${CB+16}" text-anchor="middle" fill="rgba(255,255,255,0.32)" font-size="9" font-family="Inter,sans-serif">${m}</text>`).join('');

      const dotEls = pts.map(([x,y],i)=>`
        <circle cx="${x}" cy="${y}" r="0" fill="white" opacity="0">
          <animate attributeName="opacity" from="0" to="1" begin="${(0.1+i*0.1).toFixed(2)}s" dur="0.12s" fill="freeze"/>
          <animate attributeName="r" values="0;6;4.5" keyTimes="0;0.5;1" begin="${(0.1+i*0.1).toFixed(2)}s" dur="0.38s" fill="freeze" calcMode="spline" keySplines="0.2 0 0.4 1;0.3 0 0.6 1"/>
        </circle>`).join('');

      return `<svg viewBox="0 0 440 440" fill="none" xmlns="http://www.w3.org/2000/svg" width="440" height="440">
        <defs>
          <pattern id="dots" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="rgba(255,255,255,0.08)"/>
          </pattern>
          <linearGradient id="fadeup" x1="0" y1="295" x2="0" y2="440" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="rgba(40,10,160,0)"/>
            <stop offset="100%" stop-color="rgba(40,10,160,0.85)"/>
          </linearGradient>
          <linearGradient id="area" x1="0" y1="${CT}" x2="0" y2="${CB}" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="rgba(255,255,255,0.14)"/>
            <stop offset="100%" stop-color="rgba(255,255,255,0.01)"/>
          </linearGradient>
          <clipPath id="area-clip">
            <rect x="${CL}" y="0" width="0" height="440">
              <animate attributeName="width" from="0" to="${CR-CL}" dur="1.1s" begin="0.35s" fill="freeze" calcMode="spline" keySplines="0 0 0.3 1"/>
            </rect>
          </clipPath>
        </defs>
        <rect width="440" height="440" fill="url(#dots)"/>
        ${statCards}
        <line x1="${CL}" y1="${CT}" x2="${CL}" y2="${CB}" stroke="rgba(255,255,255,0.16)" stroke-width="1.5"/>
        <line x1="${CL}" y1="${CB}" x2="${CR}" y2="${CB}" stroke="rgba(255,255,255,0.16)" stroke-width="1.5"/>
        ${gridLines}
        ${yLabels}
        ${xLabels}
        <path d="${areaD}" fill="url(#area)" clip-path="url(#area-clip)"/>
        <polyline points="${polyStr}" stroke="white" stroke-width="2.6"
          stroke-linecap="round" stroke-linejoin="round" fill="none"
          stroke-dasharray="490" stroke-dashoffset="490">
          <animate attributeName="stroke-dashoffset" from="490" to="0"
            dur="0.9s" begin="0.35s" fill="freeze" calcMode="spline" keySplines="0 0 0.3 1"/>
        </polyline>
        ${dotEls}
        <rect width="440" height="440" fill="url(#fadeup)"/>
        <svg x="28" y="384" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
        <text x="54" y="402" fill="white" font-size="20" font-family="Inter,sans-serif" font-weight="700" letter-spacing="-0.5">Data-Driven</text>
      </svg>`;
    }
  },

  {
    label: 'Customer Obsessed',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"
             stroke="#4D00C0" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
             <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06
                      a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78
                      1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
           </svg>`,
    svg: () => `<svg viewBox="0 0 440 440" fill="none" xmlns="http://www.w3.org/2000/svg" width="440" height="440">
      <defs>
        <pattern id="dots2" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="rgba(255,255,255,0.08)"/>
        </pattern>
        <linearGradient id="fadeup2" x1="0" y1="295" x2="0" y2="440" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="rgba(40,10,160,0)"/>
          <stop offset="100%" stop-color="rgba(40,10,160,0.82)"/>
        </linearGradient>
      </defs>
      <rect width="440" height="440" fill="url(#dots2)"/>

      <!-- Inner orbit ring (dashed, rotating) -->
      <circle cx="220" cy="205" r="108" stroke="rgba(255,255,255,0.30)" stroke-width="1.2" stroke-dasharray="4 7" fill="none">
        <animate attributeName="stroke-dashoffset" from="0" to="-11" dur="3s" repeatCount="indefinite"/>
      </circle>
      <!-- Outer orbit ring (dashed, counter-rotating) -->
      <circle cx="220" cy="205" r="158" stroke="rgba(255,255,255,0.18)" stroke-width="1.2" stroke-dasharray="4 7" fill="none">
        <animate attributeName="stroke-dashoffset" from="0" to="11" dur="4.5s" repeatCount="indefinite"/>
      </circle>

      <!-- Person icon — head (stroke) -->
      <circle cx="220" cy="180" r="38" stroke="white" stroke-width="2.2" fill="none" opacity="0">
        <animate attributeName="opacity" from="0" to="1" dur="0.4s" begin="0.1s" fill="freeze"/>
      </circle>
      <!-- Person icon — body/shoulders arc (stroke) -->
      <path d="M160,266 Q160,230 220,230 Q280,230 280,266" stroke="white" stroke-width="2.2" stroke-linecap="round" fill="none" opacity="0">
        <animate attributeName="opacity" from="0" to="1" dur="0.4s" begin="0.1s" fill="freeze"/>
      </path>

      <!-- Heart — inner orbit 270° (9 o'clock), clockwise 10s -->
      <g>
        <animateMotion path="M 112,205 A 108,108 0 0 1 220,97 A 108,108 0 0 1 328,205 A 108,108 0 0 1 220,313 A 108,108 0 0 1 112,205" dur="10s" begin="0s" repeatCount="indefinite" rotate="0"/>
        <g opacity="0">
          <animate attributeName="opacity" from="0" to="1" dur="0.22s" begin="0.12s" fill="freeze"/>
          <animateTransform attributeName="transform" type="scale" values="0.3;1.25;1" keyTimes="0;0.65;1" dur="0.38s" begin="0.12s" fill="freeze"/>
          <circle r="16" fill="rgba(255,255,255,0.13)" stroke="rgba(255,255,255,0.20)" stroke-width="1"/>
          <svg x="-10" y="-10" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </g>
      </g>

      <!-- Star — inner orbit 0° (12 o'clock), clockwise 10s -->
      <g>
        <animateMotion path="M 220,97 A 108,108 0 0 1 328,205 A 108,108 0 0 1 220,313 A 108,108 0 0 1 112,205 A 108,108 0 0 1 220,97" dur="10s" begin="0s" repeatCount="indefinite" rotate="0"/>
        <g opacity="0">
          <animate attributeName="opacity" from="0" to="1" dur="0.22s" begin="0.24s" fill="freeze"/>
          <animateTransform attributeName="transform" type="scale" values="0.3;1.25;1" keyTimes="0;0.65;1" dur="0.38s" begin="0.24s" fill="freeze"/>
          <circle r="16" fill="rgba(255,255,255,0.13)" stroke="rgba(255,255,255,0.20)" stroke-width="1"/>
          <svg x="-10" y="-10" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </g>
      </g>

      <!-- Cart — inner orbit 90° (3 o'clock), clockwise 10s -->
      <g>
        <animateMotion path="M 328,205 A 108,108 0 0 1 220,313 A 108,108 0 0 1 112,205 A 108,108 0 0 1 220,97 A 108,108 0 0 1 328,205" dur="10s" begin="0s" repeatCount="indefinite" rotate="0"/>
        <g opacity="0">
          <animate attributeName="opacity" from="0" to="1" dur="0.22s" begin="0.36s" fill="freeze"/>
          <animateTransform attributeName="transform" type="scale" values="0.3;1.25;1" keyTimes="0;0.65;1" dur="0.38s" begin="0.36s" fill="freeze"/>
          <circle r="16" fill="rgba(255,255,255,0.13)" stroke="rgba(255,255,255,0.20)" stroke-width="1"/>
          <svg x="-10" y="-10" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="21" r="1"/>
            <circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
        </g>
      </g>

      <!-- Eye — inner orbit 180° (6 o'clock), clockwise 10s -->
      <g>
        <animateMotion path="M 220,313 A 108,108 0 0 1 112,205 A 108,108 0 0 1 220,97 A 108,108 0 0 1 328,205 A 108,108 0 0 1 220,313" dur="10s" begin="0s" repeatCount="indefinite" rotate="0"/>
        <g opacity="0">
          <animate attributeName="opacity" from="0" to="1" dur="0.22s" begin="0.48s" fill="freeze"/>
          <animateTransform attributeName="transform" type="scale" values="0.3;1.25;1" keyTimes="0;0.65;1" dur="0.38s" begin="0.48s" fill="freeze"/>
          <circle r="16" fill="rgba(255,255,255,0.13)" stroke="rgba(255,255,255,0.20)" stroke-width="1"/>
          <svg x="-10" y="-10" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </g>
      </g>

      <!-- Message — outer orbit 0° (12 o'clock), counter-clockwise 14s -->
      <g>
        <animateMotion path="M 220,47 A 158,158 0 0 0 62,205 A 158,158 0 0 0 220,363 A 158,158 0 0 0 378,205 A 158,158 0 0 0 220,47" dur="14s" begin="0s" repeatCount="indefinite" rotate="0"/>
        <g opacity="0">
          <animate attributeName="opacity" from="0" to="1" dur="0.22s" begin="0.6s" fill="freeze"/>
          <animateTransform attributeName="transform" type="scale" values="0.3;1.25;1" keyTimes="0;0.65;1" dur="0.38s" begin="0.6s" fill="freeze"/>
          <circle r="16" fill="rgba(255,255,255,0.13)" stroke="rgba(255,255,255,0.20)" stroke-width="1"/>
          <svg x="-10" y="-10" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </g>
      </g>

      <!-- Bell — outer orbit 270° (9 o'clock), counter-clockwise 14s -->
      <g>
        <animateMotion path="M 62,205 A 158,158 0 0 0 220,363 A 158,158 0 0 0 378,205 A 158,158 0 0 0 220,47 A 158,158 0 0 0 62,205" dur="14s" begin="0s" repeatCount="indefinite" rotate="0"/>
        <g opacity="0">
          <animate attributeName="opacity" from="0" to="1" dur="0.22s" begin="0.72s" fill="freeze"/>
          <animateTransform attributeName="transform" type="scale" values="0.3;1.25;1" keyTimes="0;0.65;1" dur="0.38s" begin="0.72s" fill="freeze"/>
          <circle r="16" fill="rgba(255,255,255,0.13)" stroke="rgba(255,255,255,0.20)" stroke-width="1"/>
          <svg x="-10" y="-10" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </g>
      </g>

      <!-- Search — outer orbit 180° (6 o'clock), counter-clockwise 14s -->
      <g>
        <animateMotion path="M 220,363 A 158,158 0 0 0 378,205 A 158,158 0 0 0 220,47 A 158,158 0 0 0 62,205 A 158,158 0 0 0 220,363" dur="14s" begin="0s" repeatCount="indefinite" rotate="0"/>
        <g opacity="0">
          <animate attributeName="opacity" from="0" to="1" dur="0.22s" begin="0.84s" fill="freeze"/>
          <animateTransform attributeName="transform" type="scale" values="0.3;1.25;1" keyTimes="0;0.65;1" dur="0.38s" begin="0.84s" fill="freeze"/>
          <circle r="16" fill="rgba(255,255,255,0.13)" stroke="rgba(255,255,255,0.20)" stroke-width="1"/>
          <svg x="-10" y="-10" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </g>
      </g>

      <!-- User Check — outer orbit 90° (3 o'clock), counter-clockwise 14s -->
      <g>
        <animateMotion path="M 378,205 A 158,158 0 0 0 220,47 A 158,158 0 0 0 62,205 A 158,158 0 0 0 220,363 A 158,158 0 0 0 378,205" dur="14s" begin="0s" repeatCount="indefinite" rotate="0"/>
        <g opacity="0">
          <animate attributeName="opacity" from="0" to="1" dur="0.22s" begin="0.96s" fill="freeze"/>
          <animateTransform attributeName="transform" type="scale" values="0.3;1.25;1" keyTimes="0;0.65;1" dur="0.38s" begin="0.96s" fill="freeze"/>
          <circle r="16" fill="rgba(255,255,255,0.13)" stroke="rgba(255,255,255,0.20)" stroke-width="1"/>
          <svg x="-10" y="-10" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="8.5" cy="7" r="4"/>
            <polyline points="17 11 19 13 23 9"/>
          </svg>
        </g>
      </g>

      <rect width="440" height="440" fill="url(#fadeup2)"/>
      <svg x="28" y="384" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
      <text x="54" y="402" fill="white" font-size="20" font-family="Inter,sans-serif" font-weight="700" letter-spacing="-0.5">Customer Obsessed</text>
    </svg>`
  },

  {
    label: 'Business Impact',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"
             stroke="#4D00C0" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
             <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
             <polyline points="17 6 23 6 23 12"/>
           </svg>`,
    svg: () => {
      const CB = 325, CT = 118, CH = CB - CT; // 207px chart height, clear of stat cards

      // 3 stat cards — same layout as Data-Driven
      const kpis = [
        {x:28,  label:'ROI',     val:'3.2×',  sub:'vs last year'},
        {x:161, label:'REVENUE', val:'+$4.2M', sub:'YoY'},
        {x:294, label:'USERS',   val:'×3.2',   sub:'growth'},
      ];
      const kpiEls = kpis.map(k=>`
        <rect x="${k.x}" y="28" width="118" height="70" rx="10" fill="rgba(255,255,255,0.13)"/>
        <text x="${k.x+59}" y="49" text-anchor="middle" fill="rgba(255,255,255,0.55)" font-size="9" font-family="Inter,sans-serif" font-weight="600" letter-spacing="1">${k.label}</text>
        <text x="${k.x+59}" y="74" text-anchor="middle" fill="white" font-size="20" font-family="Inter,sans-serif" font-weight="800" opacity="0">
          ${k.val}
          <animate attributeName="opacity" from="0" to="1" dur="0.35s" begin="${k===kpis[0]?'0.1':'0.1'+(kpis.indexOf(k)*0.1)}s" fill="freeze"/>
        </text>
        <text x="${k.x+59}" y="89" text-anchor="middle" fill="rgba(255,255,255,0.50)" font-size="10" font-family="Inter,sans-serif">${k.sub}</text>
      `).join('');

      // 4 bars sized to fit within CT→CB
      const bw = 72;
      const bx = [58, 151, 244, 337];
      const bh = [Math.round(CH*0.34), Math.round(CH*0.56), Math.round(CH*0.75), Math.round(CH*0.96)];
      const barEls = bx.map((x,i)=>`
        <rect x="${x}" y="${CB}" width="${bw}" height="0" rx="6"
          fill="rgba(255,255,255,${i===3?'0.88':'0.38'})">
          <animate attributeName="height" from="0" to="${bh[i]}"
            dur="0.52s" begin="${(0.10+i*0.14).toFixed(2)}s" fill="freeze"
            calcMode="spline" keySplines="0.34 1.56 0.64 1"/>
          <animate attributeName="y" from="${CB}" to="${CB-bh[i]}"
            dur="0.52s" begin="${(0.10+i*0.14).toFixed(2)}s" fill="freeze"
            calcMode="spline" keySplines="0.34 1.56 0.64 1"/>
        </rect>
        <text x="${x+bw/2}" y="${CB+16}" text-anchor="middle" fill="rgba(255,255,255,0.38)" font-size="10" font-family="Inter,sans-serif">${['Q1','Q2','Q3','Q4'][i]}</text>
      `).join('');

      const topPts = bx.map((x,i)=>`${x+bw/2},${CB-bh[i]}`).join(' ');
      const areaD  = 'M'+bx.map((x,i)=>`${x+bw/2},${CB-bh[i]}`).join(' L')+` L${bx[3]+bw/2},${CB} L${bx[0]+bw/2},${CB}Z`;

      // Grid lines at 25/50/75%
      const gridLines = [25,50,75].map(pct=>{
        const y = Math.round(CB - pct/100*CH);
        return `<line x1="${bx[0]}" y1="${y}" x2="${bx[3]+bw}" y2="${y}" stroke="rgba(255,255,255,0.06)" stroke-width="1" stroke-dasharray="4 8"/>`;
      }).join('');

      const lastX = bx[3]+bw/2, lastY = CB-bh[3];

      return `<svg viewBox="0 0 440 440" fill="none" xmlns="http://www.w3.org/2000/svg" width="440" height="440">
        <defs>
          <pattern id="dots3" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="rgba(255,255,255,0.08)"/>
          </pattern>
          <linearGradient id="fadeup3" x1="0" y1="295" x2="0" y2="440" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="rgba(40,10,160,0)"/>
            <stop offset="100%" stop-color="rgba(40,10,160,0.85)"/>
          </linearGradient>
          <linearGradient id="areafill" x1="0" y1="${CT}" x2="0" y2="${CB}" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="rgba(255,255,255,0.16)"/>
            <stop offset="100%" stop-color="rgba(255,255,255,0.01)"/>
          </linearGradient>
        </defs>
        <rect width="440" height="440" fill="url(#dots3)"/>
        ${kpiEls}

        <!-- Chart axes -->
        <line x1="${bx[0]}" y1="${CB}" x2="${bx[3]+bw}" y2="${CB}" stroke="rgba(255,255,255,0.18)" stroke-width="1.5"/>
        ${gridLines}

        <!-- Area fill -->
        <path d="${areaD}" fill="url(#areafill)" opacity="0">
          <animate attributeName="opacity" from="0" to="1" dur="0.4s" begin="0.8s" fill="freeze"/>
        </path>
        ${barEls}

        <!-- Trend line -->
        <polyline points="${topPts}" stroke="white" stroke-width="2.4"
          stroke-linecap="round" stroke-linejoin="round" fill="none"
          stroke-dasharray="490" stroke-dashoffset="490" opacity="0">
          <animate attributeName="stroke-dashoffset" from="490" to="0" dur="0.6s" begin="0.75s" fill="freeze"/>
          <animate attributeName="opacity" from="0" to="1" begin="0.75s" dur="0.1s" fill="freeze"/>
        </polyline>

        <!-- Up arrow at Q4 peak -->
        <line x1="${lastX}" y1="${lastY}" x2="${lastX}" y2="${lastY-24}"
          stroke="white" stroke-width="2.4" stroke-linecap="round" opacity="0">
          <animate attributeName="opacity" from="0" to="1" begin="1.2s" dur="0.2s" fill="freeze"/>
        </line>
        <path d="M${lastX-7},${lastY-15} L${lastX},${lastY-24} L${lastX+7},${lastY-15}"
          stroke="white" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0">
          <animate attributeName="opacity" from="0" to="1" begin="1.2s" dur="0.2s" fill="freeze"/>
        </path>

        <rect width="440" height="440" fill="url(#fadeup3)"/>
        <svg x="28" y="384" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
        </svg>
        <text x="54" y="402" fill="white" font-size="20" font-family="Inter,sans-serif" font-weight="700" letter-spacing="-0.5">Business Impact</text>
      </svg>`;
    }
  }
];

/* ── Slot definitions ────────────────────────────────────── */
const SLOTS = {
  back:  { translate: '0px 0px',    opacity: '1', zIndex: '1', bg: '#cbbcf8' },
  mid:   { translate: '36px 28px',  opacity: '1', zIndex: '2', bg: '#8b68ef' },
  front: { translate: '70px 56px',  opacity: '1', zIndex: '3', bg: '#4D00C0' },
  exit:  { translate: '130px 110px',opacity: '0', zIndex: '4', bg: '#4D00C0' },
  spawn: { translate: '-36px -28px',opacity: '0', zIndex: '1', bg: '#cbbcf8' },
};

const cards = [0, 1, 2, 3].map(i => document.getElementById(`card-${i}`));
const illus  = [0, 1, 2, 3].map(i => document.getElementById(`illus-${i}`));

function applySlot(el, slot) {
  const s = SLOTS[slot];
  const inner = el.querySelector('.card');
  el.dataset.slot      = slot;
  inner.style.animation   = '';
  inner.style.background  = s.bg;
  el.style.translate   = s.translate;
  el.style.opacity     = s.opacity;
  el.style.zIndex      = s.zIndex;
}

function applySlotExit(el, slot) {
  const s = SLOTS[slot];
  const inner = el.querySelector('.card');
  el.dataset.slot      = slot;
  el.style.transition  = 'translate 0.52s ease-in, opacity 0.18s ease-in';
  inner.style.animation   = '';
  inner.style.background  = s.bg;
  el.style.translate   = s.translate;
  el.style.opacity     = s.opacity;
  el.style.zIndex      = s.zIndex;
  setTimeout(() => { el.style.transition = ''; }, 560);
}

function applySlotBounce(el, slot) {
  const s = SLOTS[slot];
  const inner = el.querySelector('.card');
  el.dataset.slot      = slot;
  inner.style.background  = s.bg;
  el.style.translate   = s.translate;
  el.style.opacity     = s.opacity;
  el.style.zIndex      = s.zIndex;
  inner.style.animation = 'none';
  inner.offsetHeight;
  inner.style.animation = 'bounce-scale 0.65s ease-out forwards';
}

function applySlotInstant(el, slot) {
  el.style.transition = 'none';
  applySlot(el, slot);
  el.offsetHeight;
  el.style.transition = '';
}

/* ── Scroll spread ───────────────────────────────────────── */
const stack = document.querySelector('.stack');
const SPREAD = {
  back:  [-65, -48],
  mid:   [-22, -16],
  front: [ 52,  38],
  exit:  [  0,   0],
  spawn: [  0,   0],
};

let scrolledAway = false;
let scrollT = 0;
let isHovering = false;
let carouselTimer = null;
let cycleStarted = Date.now();
let pausedRemaining = 2500;
const SLOT_DELAY = { front: 0, mid: 70, back: 140 };

function scheduleAdvance(delay = 2500) {
  clearTimeout(carouselTimer);
  cycleStarted = Date.now();
  carouselTimer = setTimeout(() => {
    advance();
    scheduleAdvance(2500);
  }, delay);
}

function spreadTransform(slot, t, rotate) {
  const [dx, dy] = SPREAD[slot] || [0, 0];
  return `translate(${dx * t}px, ${dy * t}px)${rotate ? ' rotate(-4deg)' : ''}`;
}

function applyHover(entering) {
  isHovering = entering;
  if (entering) {
    pausedRemaining = Math.max(100, 2500 - (Date.now() - cycleStarted));
    clearTimeout(carouselTimer);
    progFill.style.animationPlayState = 'paused';
  } else if (!scrolledAway) {
    progFill.style.animationPlayState = 'running';
    scheduleAdvance(pausedRemaining);
  }
  cards.forEach(wrap => {
    const slot = wrap.dataset.slot || 'spawn';
    const delay = SLOT_DELAY[slot] ?? 0;
    wrap.style.transition = `translate 0.60s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.52s ease, transform 0.45s cubic-bezier(0.25,0.46,0.45,0.94) ${delay}ms`;
    wrap.style.transform = spreadTransform(slot, scrollT, entering);
  });
}

cards.forEach(wrap => {
  wrap.addEventListener('mouseenter', () => {
    if (wrap.dataset.slot === 'front') applyHover(true);
  });
});
stack.addEventListener('mouseleave', () => applyHover(false));

window.addEventListener('scroll', () => {
  const top = stack.closest('.hero').getBoundingClientRect().top;
  const raw = Math.max(0, -top / (window.innerHeight * 0.45));
  const t   = Math.min(1, raw * raw);
  scrollT = t;

  cards.forEach(wrap => {
    const slot = wrap.dataset.slot || 'spawn';
    wrap.style.transition = 'translate 0.60s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.52s ease';
    wrap.style.transform = spreadTransform(slot, t, isHovering);
  });
  stack.style.opacity = String(1 - t * 0.75);

  if (t > 0.05 && !scrolledAway) {
    scrolledAway = true;
    clearTimeout(carouselTimer);
    progFill.style.animationPlayState = 'paused';
  } else if (t < 0.02 && scrolledAway) {
    scrolledAway = false;
    if (!isHovering) {
      scheduleAdvance(2500);
      restartProgress();
    }
  }
}, { passive: true });

/* ── Progress bar ───────────────────────────────────────── */
const progFill = document.getElementById('prog-fill');

function restartProgress() {
  progFill.style.animation = 'none';
  progFill.offsetHeight;
  progFill.style.animation = 'prog-anim 2.5s linear forwards';
}

/* ── Splash intro ───────────────────────────────────────── */
let frontCard = 0;
let albumIdx  = 0;

const splash  = document.getElementById('splash');
const splHi   = document.getElementById('spl-hi');
const splName = document.getElementById('spl-name');
const heroH1     = document.getElementById('hero-h1');
const heroAvatar = document.getElementById('hero-avatar');
const bioPara    = document.querySelector('.bio');
const hlEls      = document.querySelectorAll('.hl');

heroAvatar.style.opacity  = '0';
heroAvatar.style.transform = 'translateY(-20px)';
heroH1.style.opacity = '0';
bioPara.style.opacity = '0';
bioPara.style.transform = 'translateY(22px)';

cards.forEach(c => applySlotInstant(c, 'spawn'));

// Skip splash when navigating via hash (e.g. Work link)
if (window.location.hash) {
  splash.remove();
  heroAvatar.style.opacity  = '1';
  heroAvatar.style.transform = '';
  heroAvatar.classList.add('is-floating');
  heroH1.style.opacity = '1';
  bioPara.style.opacity = '1';
  bioPara.style.transform = 'translateY(0)';
  illus[0].innerHTML = albums[0].svg();
  applySlotInstant(cards[0], 'front');
  applySlotInstant(cards[1], 'mid');
  applySlotInstant(cards[2], 'back');
  hlEls.forEach(el => el.classList.add('hl-run'));
  scheduleAdvance(2500);
  const hashTarget = document.querySelector(window.location.hash);
  if (hashTarget) hashTarget.scrollIntoView({ behavior: 'instant' });
} else {

// Phase 1 – "hi!" drops in
requestAnimationFrame(() => {
  splHi.style.transition = 'opacity 0.5s ease, transform 0.7s cubic-bezier(0.16,1,0.3,1)';
  splHi.style.opacity = '1';
  splHi.style.transform = 'translateY(0)';
});

// Phase 2 – "I'm Deron." slides in
setTimeout(() => {
  splName.style.transition = 'opacity 0.55s ease, transform 0.75s cubic-bezier(0.25,0.46,0.45,0.94)';
  splName.style.opacity = '1';
  splName.style.transform = 'translateX(0)';
}, 500);

// Phase 3 – morph to h1 position
setTimeout(() => {
  const mid = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width/2, y: r.top + r.height/2, h: r.height }; };
  const shiM = mid(splHi),   snmM = mid(splName);
  const thiM = mid(document.querySelector('.h1-hi')),
        tnmM = mid(document.querySelector('.h1-name'));
  const ease = 'cubic-bezier(0.76,0,0.24,1)';

  splHi.style.transition = `transform 0.8s ${ease}`;
  splHi.style.transformOrigin = 'center center';
  splHi.style.transform = `translate(${thiM.x-shiM.x}px,${thiM.y-shiM.y}px) scale(${thiM.h/shiM.h})`;

  splName.style.transition = `transform 0.8s ${ease}`;
  splName.style.transformOrigin = 'center center';
  splName.style.transform = `translate(${tnmM.x-snmM.x}px,${tnmM.y-snmM.y}px) scale(${tnmM.h/snmM.h})`;
}, 1500);

// Phase 4 – crossfade: splash out, page in
setTimeout(() => {
  splHi.style.transition   = 'opacity 0.3s ease';
  splName.style.transition = 'opacity 0.3s ease 40ms';
  splHi.style.opacity = splName.style.opacity = '0';

  heroAvatar.style.transition = 'opacity 0.5s ease, transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)';
  heroAvatar.style.opacity   = '1';
  heroAvatar.style.transform  = 'translateY(0)';
  setTimeout(() => {
    heroAvatar.style.transition = '';
    heroAvatar.style.transform  = '';
    heroAvatar.classList.add('is-floating');
  }, 700);

  heroH1.style.transition = 'opacity 0.3s ease 0.1s';
  heroH1.style.opacity = '1';

  setTimeout(() => {
    splash.style.transition = 'opacity 0.35s ease';
    splash.style.opacity = '0';
    setTimeout(() => splash.remove(), 400);
  }, 200);

  // Cards fan in — inject SVG now so SMIL timers start fresh
  illus[0].innerHTML = albums[0].svg();
  setTimeout(() => applySlot(cards[0], 'front'), 60);
  setTimeout(() => applySlot(cards[1], 'mid'),  150);
  setTimeout(() => applySlot(cards[2], 'back'), 240);
  setTimeout(restartProgress, 260);

  // Bio slides up
  setTimeout(() => {
    bioPara.style.transition = 'opacity 0.6s ease, transform 0.65s cubic-bezier(0.25,0.46,0.45,0.94)';
    bioPara.style.opacity = '1';
    bioPara.style.transform = 'translateY(0)';
  }, 200);

  // Highlights fire after bio finishes sliding in (~850ms), staggered
  hlEls.forEach((el, i) => setTimeout(() => el.classList.add('hl-run'), 900 + i * 200));

  scheduleAdvance(2500);
}, 2300);

} // end skip-splash else

/* ── Advance ─────────────────────────────────────────────── */
let busy = false;

function advance() {
  if (busy) return;
  busy = true;
  restartProgress();

  const exitIdx  = frontCard;
  const newFront = (frontCard + 1) % 4;
  const newMid   = (frontCard + 2) % 4;
  const newBack  = (frontCard + 3) % 4;

  albumIdx = (albumIdx + 1) % albums.length;
  illus[newFront].innerHTML = albums[albumIdx].svg();

  applySlotExit(cards[exitIdx], 'exit');
  applySlotBounce(cards[newFront], 'front');
  applySlot(cards[newMid],   'mid');
  applySlot(cards[newBack],  'back');

  setTimeout(() => {
    applySlotInstant(cards[exitIdx], 'spawn');
    illus[exitIdx].innerHTML = '';
    frontCard = newFront;
    busy = false;
  }, 640);
}

/* ── Featured Work — scroll-in ───────────────────────────── */
const fwObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      fwObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.fw-heading, .fw-card').forEach((el, i) => {
  el.style.transitionDelay = `${i * 100}ms`;
  fwObserver.observe(el);
});
