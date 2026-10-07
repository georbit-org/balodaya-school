import fs from 'fs';
import { SignJWT } from 'jose';

async function testAllDashboards() {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const secretMatch = envContent.match(/SESSION_SECRET="?([^\r\n"]+)"?/);
  const secretKey = new TextEncoder().encode(secretMatch[1]);

  async function makeCookie(user) {
    const token = await new SignJWT({
      sub: String(user.id),
      email: user.email,
      name: user.name,
      role: user.role,
      mustChangePassword: false,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secretKey);
    return 'balodaya_session=' + token;
  }

  // 1. Teacher
  const tCookie = await makeCookie({ id: 2, role: 'teacher', name: 'Bishnu Prasad', email: 'bishnu@balodaya.edu.np' });
  const tDash = await (await fetch('http://localhost:3000/api/dashboard', { headers: { Cookie: tCookie } })).json();
  console.log('Teacher response:', tDash);

  // 2. Accountant
  const aCookie = await makeCookie({ id: 99, role: 'accountant', name: 'Accountant User', email: 'accountant@balodaya.edu.np' });
  const aDash = await (await fetch('http://localhost:3000/api/dashboard', { headers: { Cookie: aCookie } })).json();
  console.log('Accountant response:', aDash);

  // 3. Parent (user 4, Sita Sharma)
  const pCookie = await makeCookie({ id: 4, role: 'parent', name: 'Sita Sharma', email: 'sita@example.com' });
  const pDash = await (await fetch('http://localhost:3000/api/dashboard', { headers: { Cookie: pCookie } })).json();
  console.log('Parent dashboard role:', pDash.role);
  console.log('Parent children count:', pDash.children?.length);
  if (pDash.children?.[0]) {
    console.log('Child 1 name:', pDash.children[0].full_name, 'Adm:', pDash.children[0].admission_no);
  }

  // 4. Student (Aarav Sharma user)
  const sCookie = await makeCookie({ id: 5, role: 'student', name: 'Aarav Sharma', email: 'aarav@example.com' });
  const sDash = await (await fetch('http://localhost:3000/api/dashboard', { headers: { Cookie: sCookie } })).json();
  console.log('Student dashboard role:', sDash.role);
}

testAllDashboards().catch(console.error);
