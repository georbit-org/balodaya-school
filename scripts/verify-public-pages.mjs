const routes = [
  '/',
  '/about',
  '/academics',
  '/admissions',
  '/student-life',
  '/facilities',
  '/gallery',
  '/news',
  '/tenders',
  '/careers',
  '/contact',
  '/login',
];

async function verify() {
  console.log('Verifying public site quality...\n');
  let failures = 0;

  for (const r of routes) {
    try {
      const res = await fetch('http://localhost:3000' + r);
      if (res.status !== 200) {
        console.error(`FAIL: ${r} returned status ${res.status}`);
        failures++;
        continue;
      }

      const html = await res.text();
      const hasViewport = html.includes('viewport');
      if (!hasViewport) {
        console.error(`FAIL: ${r} missing viewport meta tag`);
        failures++;
      }

      const imgMatches = [...html.matchAll(/<img([^>]*)>/g)];
      const missingAlt = imgMatches.filter((m) => !m[1].includes('alt='));
      if (missingAlt.length > 0) {
        console.warn(`WARN: ${r} has ${missingAlt.length} images without alt`);
        failures++;
      }

      const genericAlts = imgMatches.filter((m) => {
        const altMatch = m[1].match(/alt=["']([^"']*)["']/i);
        if (!altMatch) return false;
        const text = altMatch[1].trim().toLowerCase();
        return text === 'image' || text === 'photo' || text === 'img' || text === 'picture';
      });

      if (genericAlts.length > 0) {
        console.warn(`WARN: ${r} has ${genericAlts.length} images with generic alt attributes`);
        failures++;
      }

      console.log(`OK: ${r} (Status: 200, Viewport: yes, Images checked: ${imgMatches.length})`);
    } catch (err) {
      console.error(`ERROR: ${r}: ${err.message}`);
      failures++;
    }
  }

  if (failures === 0) {
    console.log('\nAll public pages verified cleanly!');
  } else {
    console.log(`\nCompleted with ${failures} warnings/failures.`);
  }
}

verify();
