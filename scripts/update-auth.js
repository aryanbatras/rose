/**
 * Updates all API routes to use getAgentFromRequest(request) instead of
 * manually parsing cookies for auth.
 *
 * Run: node scripts/update-auth.ts
 */
const fs = require('fs');

const files = [
  'src/app/api/compose/route.ts',
  'src/app/api/feed/author/route.ts',
  'src/app/api/feed/likes/route.ts',
  'src/app/api/feed/route.ts',
  'src/app/api/feed/thread/route.ts',
  'src/app/api/graph/follow/route.ts',
  'src/app/api/graph/followers/route.ts',
  'src/app/api/graph/following/route.ts',
  'src/app/api/graph/search/route.ts',
  'src/app/api/graph/suggestions/route.ts',
  'src/app/api/interact/delete/route.ts',
  'src/app/api/interact/like/route.ts',
  'src/app/api/interact/repost/route.ts',
  'src/app/api/interact/unlike/route.ts',
  'src/app/api/notifications/read/route.ts',
  'src/app/api/notifications/route.ts',
  'src/app/api/notifications/unread/route.ts',
  'src/app/api/profile/route.ts',
  'src/app/api/profile/update/route.ts',
  'src/app/api/search/posts/route.ts',
];

let updated = 0;
for (const f of files) {
  let content = fs.readFileSync(f, 'utf-8');
  let orig = content;

  // Step 1: Update import to include getAgentFromRequest
  content = content.replace(
    /import { getAgentForSession } from '@/services\/agent';/g,
    "import { getAgentForSession, getAgentFromRequest } from '@/services/agent';"
  );

  // Step 2: Remove 'import { cookies } from 'next/headers';' line
  content = content.replace(/import { cookies } from 'next\/headers';\n/g, '');

  // Step 3: Replace the auth block pattern
  // The block varies slightly between files, so handle all variations
  const patterns = [
    // Pattern 1: Single occurrence (most routes)
    /const cookieStore = await cookies\(\);\n\s*const sessionCookie = cookieStore\.get\('voiceflow_session'\);\s*\n\s*if \(!sessionCookie\) \{\n\s*return NextResponse\.json\(\{ error: 'Not authenticated' \}, \{ status: 401 \}\);\n\s*\}\n\s*const session = JSON\.parse\(sessionCookie\.value\);\n\s*const agent = await getAgentForSession\(session\);\n\s*if \(!agent\) \{\n\s*return NextResponse\.json\(\{ error: "Session expired" \}, \{ status: 401 \}\);\n\s*\}/g,
    // Pattern 2: With 'session' cookie fallback
    /const cookieStore = await cookies\(\);\n\s*const sessionCookie = cookieStore\.get\('voiceflow_session'\)\s*\|\|\s*cookieStore\.get\('session'\);\s*\n\s*if \(!sessionCookie\) \{\n\s*return NextResponse\.json\(\{ error: 'Not authenticated' \}, \{ status: 401 \}\);\n\s*\}\n\s*const session = JSON\.parse\(sessionCookie\.value\);\n\s*const agent = await getAgentForSession\(session\);\n\s*if \(!agent\) \{\n\s*return NextResponse\.json\(\{ error: 'Session expired' \}, \{ status: 401 \}\);\n\s*\}/g,
    // Pattern 3: Different error message
    /const cookieStore = await cookies\(\);\n\s*const sessionCookie = cookieStore\.get\('voiceflow_session'\);\s*\n\s*if \(!sessionCookie\) \{\n\s*return NextResponse\.json\(\{ error: 'Not authenticated' \}, \{ status: 401 \}\);\n\s*\}\n\s*const session = JSON\.parse\(sessionCookie\.value\);\n\s*const agent = await getAgentForSession\(session\);\n\s*if \(!agent\) \{\n\s*return NextResponse\.json\(\{ error: 'Not authenticated' \}, \{ status: 401 \}\);\n\s*\}/g,
    // Pattern 4: No session check (just count)
    /const cookieStore = await cookies\(\);\n\s*const sessionCookie = cookieStore\.get\('voiceflow_session'\);\s*\n\s*if \(!sessionCookie\) \{\n\s*return NextResponse\.json\(\{ count: 0 \}\);\n\s*\}\n\s*const session = JSON\.parse\(sessionCookie\.value\);\n\s*const agent = await getAgentForSession\(session\);\n\s*if \(!agent\) \{\n\s*return NextResponse\.json\(\{ error: "Session expired" \}, \{ status: 401 \}\);\n\s*\}/g,
  ];

  for (const pattern of patterns) {
    content = content.replace(pattern, (match) => {
      return `    const agent = await getAgentFromRequest(request);\n    if (!agent) {\n      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });\n    }`;
    });
  }

  // Handle repost route which has TWO auth blocks (POST and DELETE)
  // If the file is repost, handle the second occurrence
  if (f.includes('repost')) {
    const secondPattern = /const cookieStore2 = await cookies\(\);\n\s*const sessionCookie2 = cookieStore2\.get\('voiceflow_session'\);\s*\n\s*if \(!sessionCookie2\) \{\n\s*return NextResponse\.json\(\{ error: 'Not authenticated' \}, \{ status: 401 \}\);\n\s*\}\n\s*const session2 = JSON\.parse\(sessionCookie2\.value\);\n\s*const agent2 = await getAgentForSession\(session2\);\n\s*if \(!agent2\) \{\n\s*return NextResponse\.json\(\{ error: "Session expired" \}, \{ status: 401 \}\);\n\s*\}/g;
    content = content.replace(secondPattern, (match) => {
      return `    const agent = await getAgentFromRequest(request);\n    if (!agent) {\n      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });\n    }`;
    });
  }

  if (content !== orig) {
    fs.writeFileSync(f, content);
    console.log('✓ ' + f);
    updated++;
  } else {
    console.log('  unchanged: ' + f);
  }
}

console.log('\nDone. Updated ' + updated + ' files.');
