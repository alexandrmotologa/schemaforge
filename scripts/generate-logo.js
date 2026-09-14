import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resvg } from '@resvg/resvg-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function buildSchemaForgeLogo() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <clipPath id="squircle-clip">
      <rect x="24" y="24" width="976" height="976" rx="220" />
    </clipPath>

    <!-- Gradients -->
    <linearGradient id="indigo-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#818cf8"/>
      <stop offset="50%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#00f5ff"/>
    </linearGradient>

    <linearGradient id="cyan-glow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00f5ff"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>

    <linearGradient id="amber-forge" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#f97316"/>
    </linearGradient>

    <filter id="subtle-shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.16" />
    </filter>
  </defs>

  <!-- Luxury White Squircle Container -->
  <rect x="24" y="24" width="976" height="976" rx="220" fill="#ffffff" stroke="#e2e8f0" stroke-width="6" />

  <g clip-path="url(#squircle-clip)">
    <!-- Architectural grid lines -->
    <circle cx="512" cy="512" r="410" fill="none" stroke="#f1f5f9" stroke-width="3" stroke-dasharray="8 8" />
    <circle cx="512" cy="512" r="300" fill="none" stroke="#f1f5f9" stroke-width="1.5" />

    <g transform="translate(512, 512)" filter="url(#subtle-shadow)">

      <!-- Hexagonal Architectural Gateway Frame -->
      <polygon points="
        0,-385
        333,-192
        333,192
        0,385
        -333,192
        -333,-192
      " fill="none" stroke="#0f172a" stroke-width="34" stroke-linejoin="round" />

      <!-- Inner Relational Gateway Accent -->
      <polygon points="
        0,-350
        303,-175
        303,175
        0,350
        -303,175
        -303,-175
      " fill="none" stroke="#6366f1" stroke-width="3.5" opacity="0.45" stroke-dasharray="14, 10" />

      <!-- ==========================================
           THE ARIES ARCHITECT MASCOT (FORGE RAM)
           ========================================== -->

      <!-- 1. Watertight Solid Obsidian Base Silhouette -->
      <path d="
        M 0,-260
        L 90,-270 L 190,-310 L 290,-290 L 340,-210 L 340,-120 L 290,-30 L 210,10
        L 220,90 L 170,190 L 110,250 L 50,300 L 0,330
        L -50,300 L -110,250 L -170,190 L -220,90 L -210,10
        L -290,-30 L -340,-120 L -340,-210 L -290,-290 L -190,-310 L -90,-270
        Z
      " fill="#090d16" />

      <!-- 2. Sweeping Low-Poly Architectural Ram Horns -->
      <!-- Left Horn Top Facet -->
      <polygon points="-90,-270 -190,-310 -290,-290 -240,-230 -150,-245 -80,-210" fill="#475569" />
      <polygon points="-290,-290 -340,-210 -300,-150 -240,-230" fill="#334155" />
      <!-- Left Horn Ridge & Outer Curl -->
      <polygon points="-340,-210 -340,-120 -280,-80 -250,-140 -300,-150" fill="#1e293b" />
      <polygon points="-340,-120 -290,-30 -220,10 -200,-50 -280,-80" fill="#334155" />
      <!-- Left Horn Inner Core Spiral -->
      <polygon points="-220,10 -160,-20 -180,-70 -200,-50" fill="#6366f1" opacity="0.9" />

      <!-- Right Horn Top Facet -->
      <polygon points="90,-270 190,-310 290,-290 240,-230 150,-245 80,-210" fill="#64748b" />
      <polygon points="290,-290 340,-210 300,-150 240,-230" fill="#475569" />
      <!-- Right Horn Ridge & Outer Curl -->
      <polygon points="340,-210 340,-120 280,-80 250,-140 300,-150" fill="#334155" />
      <polygon points="340,-120 290,-30 220,10 200,-50 280,-80" fill="#475569" />
      <!-- Right Horn Inner Core Spiral -->
      <polygon points="220,10 160,-20 180,-70 200,-50" fill="#818cf8" opacity="0.9" />

      <!-- 3. Forehead Armor Plates & Central Nexus -->
      <polygon points="0,-260 80,-210 0,-170" fill="#475569" />
      <polygon points="0,-260 -80,-210 0,-170" fill="#334155" />

      <!-- Glowing Indigo-Cyan Central Nexus -->
      <polygon points="0,-170 50,-115 0,-60 -50,-115" fill="url(#indigo-cyan)" />
      <polygon points="0,-150 30,-115 0,-80 -30,-115" fill="#00f5ff" />

      <!-- 4. Temple & Brow Armor Plating -->
      <polygon points="0,-60 50,-115 125,-90 85,-40 0,-30" fill="#475569" />
      <polygon points="0,-60 -50,-115 -125,-90 -85,-40 0,-30" fill="#334155" />

      <polygon points="125,-90 190,-100 160,-35 85,-40" fill="#1e293b" />
      <polygon points="-125,-90 -190,-100 -160,-35 -85,-40" fill="#0f172a" />

      <!-- 5. Alert & Precision Predator Optics (Geometric Almond) -->
      <!-- Left Eye -->
      <polygon points="-85,-40 -140,-25 -95,-5 -50,-20" fill="#090d16" />
      <polygon points="-80,-32 -125,-22 -90,-12" fill="#00f5ff" />
      <polygon points="-75,-28 -105,-23 -85,-18" fill="#ffffff" />

      <!-- Right Eye -->
      <polygon points="85,-40 140,-25 95,-5 50,-20" fill="#0f172a" />
      <polygon points="80,-32 125,-22 90,-12" fill="#00f5ff" />
      <polygon points="75,-28 105,-23 85,-18" fill="#ffffff" />

      <!-- 6. Architectural Nasal Bridge & Zygomatic Cheeks -->
      <polygon points="0,-30 45,-20 35,60 0,85" fill="#64748b" />
      <polygon points="0,-30 -45,-20 -35,60 0,85" fill="#475569" />

      <polygon points="45,-20 95,-5 120,50 60,70 35,60" fill="#334155" />
      <polygon points="-45,-20 -95,-5 -120,50 -60,70 -35,60" fill="#1e293b" />

      <!-- 7. Titanium Muzzle & Precision Anvil Jaw (Lateral spread, NO buck teeth) -->
      <polygon points="0,85 30,105 0,125 -30,105" fill="#0f172a" />

      <polygon points="0,125 50,135 80,110 35,60 30,105" fill="#94a3b8" />
      <polygon points="0,125 -50,135 -80,110 -35,60 -30,105" fill="#64748b" />

      <!-- Anvil Chin Wedge -->
      <polygon points="0,125 35,165 0,195 -35,165" fill="#cbd5e1" />
      <polygon points="0,195 35,165 45,200 0,225" fill="#94a3b8" />
      <polygon points="0,195 -35,165 -45,200 0,225" fill="#64748b" />

      <!-- 8. Chest Foundation Armor & Molten Forge Core -->
      <polygon points="0,225 45,200 100,220 70,275 0,295" fill="#475569" />
      <polygon points="0,225 -45,200 -100,220 -70,275 0,295" fill="#334155" />

      <!-- Lateral Flank Armor -->
      <polygon points="100,220 150,180 180,230 120,285 70,275" fill="#1e293b" />
      <polygon points="-100,220 -150,180 -180,230 -120,285 -70,275" fill="#0f172a" />

      <!-- Molten Forge Keystone (Amber/Gold Accent) -->
      <polygon points="0,295 45,285 0,345 -45,285" fill="url(#amber-forge)" />
      <polygon points="0,308 25,298 0,335 -25,298" fill="#fbbf24" />

      <!-- Relational Data Node Connectors -->
      <circle cx="-140" cy="35" r="7" fill="#6366f1" />
      <circle cx="140" cy="35" r="7" fill="#6366f1" />

    </g>
  </g>
</svg>`;
}

async function run() {
  const outputDir = path.resolve(__dirname, '../docs/images');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const svg = buildSchemaForgeLogo();
  const svgPath = path.join(outputDir, 'logo.svg');
  const pngPath = path.join(outputDir, 'logo.png');

  fs.writeFileSync(svgPath, svg, 'utf-8');

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1024 },
  });
  const pngBuffer = resvg.render().asPng();
  fs.writeFileSync(pngPath, pngBuffer);

  // Also copy to public/logo.png
  const publicDir = path.resolve(__dirname, '../public');
  if (fs.existsSync(publicDir)) {
    fs.writeFileSync(path.join(publicDir, 'logo.png'), pngBuffer);
    fs.writeFileSync(path.join(publicDir, 'logo.svg'), svg, 'utf-8');
  }

  console.log('✓ Successfully rendered refined logo.svg and logo.png at 1024x1024');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
