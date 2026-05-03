import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// .env.local 수동 파싱
const envPath = resolve(__dirname, '../.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '');
}

const privateKey = env.FIREBASE_ADMIN_PRIVATE_KEY.includes('\\n')
  ? env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n')
  : env.FIREBASE_ADMIN_PRIVATE_KEY;

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

const auth = getAuth();
const db = getFirestore();

const EMAIL = 'naggu1999@gmail.com';

async function main() {
  const user = await auth.getUserByEmail(EMAIL);
  console.log(`UID: ${user.uid}`);

  await db.collection('users').doc(user.uid).update({
    plan: 'admin',
    isAdmin: true,
    'usage.blogPostsThisMonth': 0,
    'usage.diaryEntriesThisMonth': 0,
    'usage.videosThisMonth': 0,
  });

  console.log(`✅ ${EMAIL} → plan: admin, 제한 없음`);
}

main().catch((e) => { console.error('❌', e.message); process.exit(1); });
