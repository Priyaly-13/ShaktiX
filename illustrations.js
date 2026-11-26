/**
 * REPLATE — Botanical, Organic & Culinary SVG Illustrations + Clean Iconography
 * Strictly adheres to the exact REPLATE color palette:
 * #F5DDE2 (blush), #DCE8D5 (sage), #7B8154 (olive), #FAF7F0 (ivory),
 * #E8D8C5 (beige), #C78F9B (rose), #45483B (charcoal), #FFFFFF (white)
 */

window.ReplateVisuals = {
  // Minimalist professional UI icons (1.75px stroke)
  icons: {
    logoLeaf: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`,
    dashboard: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/></svg>`,
    donations: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
    matches: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
    pickups: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>`,
    impact: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>`,
    notifications: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>`,
    settings: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
    search: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
    plus: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>`,
    clock: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    pin: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
    arrowRight: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`,
    check: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    menu: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>`,
    sparkles: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`,
    download: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>`,
    close: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
    home: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    sun: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
    moon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`,
    eye: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
    eyeOff: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>`,
    logout: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>`,
    shield: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>`,
    camera: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>`
  },

  // Botanical decorative divider / sprig
  botanicalSprig: (width = 120) => `
    <svg width="${width}" viewBox="0 0 160 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 46C44 42 88 32 146 14" stroke="#7B8154" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M44 40C38 28 45 18 57 18C59 30 53 38 44 40Z" fill="#DCE8D5" stroke="#7B8154" stroke-width="1.3"/>
      <path d="M74 33C70 20 80 10 92 12C92 24 85 32 74 33Z" fill="#F5DDE2" stroke="#C78F9B" stroke-width="1.3"/>
      <path d="M104 25C102 14 112 6 123 9C121 20 113 26 104 25Z" fill="#DCE8D5" stroke="#7B8154" stroke-width="1.3"/>
      <path d="M62 37C67 47 78 52 88 47C82 37 72 34 62 37Z" fill="#DCE8D5" stroke="#7B8154" stroke-width="1.3"/>
      <path d="M97 27C102 37 113 41 122 36C116 26 106 23 97 27Z" fill="#F5DDE2" stroke="#C78F9B" stroke-width="1.3"/>
      <circle cx="136" cy="17" r="3" fill="#C78F9B"/>
      <circle cx="29" cy="43" r="2.5" fill="#7B8154"/>
    </svg>
  `,

  // Handcrafted editorial illustrations by category
  foodIllustration: (kind = 'bakery') => {
    const art = {
      bakery: `
        <svg width="144" height="108" viewBox="0 0 144 108" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="72" cy="86" rx="54" ry="12" fill="#E8D8C5" fill-opacity="0.55"/>
          <path d="M26 70C26 49 46 34 72 34C98 34 118 49 118 70C118 77 111 81 104 81H40C33 81 26 77 26 70Z" fill="#FAF7F0" stroke="#7B8154" stroke-width="1.8"/>
          <path d="M48 44C54 51 58 58 60 66" stroke="#C78F9B" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M72 40C76 48 79 56 80 65" stroke="#C78F9B" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M95 45C98 52 100 58 100 66" stroke="#C78F9B" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M18 32C28 28 36 22 41 13" stroke="#7B8154" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M28 27C23 20 26 12 34 11C36 18 33 24 28 27Z" fill="#DCE8D5" stroke="#7B8154" stroke-width="1.2"/>
          <circle cx="116" cy="24" r="7" fill="#F5DDE2" stroke="#C78F9B" stroke-width="1.3"/>
        </svg>`,
      produce: `
        <svg width="144" height="108" viewBox="0 0 144 108" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="72" cy="87" rx="52" ry="11" fill="#DCE8D5" fill-opacity="0.7"/>
          <path d="M32 58H112C110 76 94 86 72 86C50 86 34 76 32 58Z" fill="#FFFFFF" stroke="#45483B" stroke-width="1.7"/>
          <circle cx="56" cy="50" r="14" fill="#F5DDE2" stroke="#C78F9B" stroke-width="1.6"/>
          <circle cx="84" cy="48" r="15" fill="#DCE8D5" stroke="#7B8154" stroke-width="1.6"/>
          <path d="M72 34C72 22 83 14 94 16C92 27 83 34 72 34Z" fill="#7B8154"/>
          <path d="M56 36C55 27 47 21 39 23C41 31 48 36 56 36Z" fill="#DCE8D5" stroke="#7B8154" stroke-width="1.3"/>
          <circle cx="101" cy="54" r="7" fill="#FAF7F0" stroke="#E8D8C5" stroke-width="1.5"/>
        </svg>`,
      meals: `
        <svg width="144" height="108" viewBox="0 0 144 108" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="72" cy="88" rx="50" ry="10" fill="#E8D8C5" fill-opacity="0.55"/>
          <path d="M30 56H114C112 73 96 84 72 84C48 84 32 73 30 56Z" fill="#FAF7F0" stroke="#45483B" stroke-width="1.7"/>
          <path d="M40 56C43 44 55 37 72 37C89 37 101 44 104 56" fill="#DCE8D5" stroke="#7B8154" stroke-width="1.5"/>
          <path d="M55 28C55 23 59 20 59 15" stroke="#C78F9B" stroke-width="1.6" stroke-linecap="round"/>
          <path d="M72 26C72 21 76 18 76 13" stroke="#7B8154" stroke-width="1.6" stroke-linecap="round"/>
          <path d="M89 28C89 23 93 20 93 15" stroke="#C78F9B" stroke-width="1.6" stroke-linecap="round"/>
          <circle cx="64" cy="48" r="4" fill="#F5DDE2" stroke="#C78F9B" stroke-width="1.2"/>
          <circle cx="82" cy="49" r="3.5" fill="#FFFFFF" stroke="#7B8154" stroke-width="1.2"/>
        </svg>`,
      pantry: `
        <svg width="144" height="108" viewBox="0 0 144 108" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="72" cy="89" rx="48" ry="9" fill="#F5DDE2" fill-opacity="0.7"/>
          <rect x="40" y="34" width="32" height="50" rx="10" fill="#FFFFFF" stroke="#7B8154" stroke-width="1.7"/>
          <rect x="45" y="25" width="22" height="9" rx="4" fill="#E8D8C5" stroke="#45483B" stroke-width="1.4"/>
          <rect x="46" y="48" width="20" height="18" rx="5" fill="#DCE8D5"/>
          <rect x="78" y="42" width="28" height="42" rx="9" fill="#FAF7F0" stroke="#C78F9B" stroke-width="1.7"/>
          <rect x="82" y="34" width="20" height="8" rx="4" fill="#F5DDE2" stroke="#C78F9B" stroke-width="1.3"/>
          <path d="M85 60H99" stroke="#7B8154" stroke-width="1.5" stroke-linecap="round"/>
          <circle cx="56" cy="57" r="3" fill="#7B8154"/>
        </svg>`
    };
    return art[kind] || art.produce;
  },

  // Organic hero background shape
  organicHeroBlob: `
    <svg class="organic-blob-bg" style="top:-36px; right:-24px; width:440px; height:440px; opacity:0.85;" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M311.5 67.5C353.8 103.2 376.4 164.2 365.5 220.4C354.6 276.6 310.1 327.9 253.8 349.1C197.5 370.2 129.4 361.2 82.6 322.1C35.8 283 10.4 213.8 22.9 152.7C35.4 91.6 85.8 38.6 146.9 25.1C208 11.6 269.2 31.8 311.5 67.5Z" fill="#DCE8D5"/>
      <path d="M277 125C308 152 319 201 299 242C279 283 228 315 180 307C132 299 88 250 88 201C88 152 132 103 181 95C230 87 246 98 277 125Z" fill="#F5DDE2" fill-opacity="0.72"/>
    </svg>
  `
};
