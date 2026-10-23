import { db, auth } from 'hatchable';

export const access = 'user';
export const methods = ['GET', 'POST'];

export default async function (req, res) {
  const user = await auth.requireUser(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    const result = await db.query(
      'SELECT email, full_name, organization, created_at, updated_at FROM drainmitra_profiles WHERE user_id = $1 LIMIT 1',
      [user.id]
    );
    return res.json({ profile: result.rows[0] || null, account: { email: user.email, name: user.name || '' } });
  }

  if (req.method === 'POST') {
    const fullName = String(req.body?.fullName || '').trim().slice(0, 80);
    const organization = String(req.body?.organization || '').trim().slice(0, 100);
    if (fullName.length < 2) return res.status(400).json({ error: 'Please enter your full name.' });
    const email = String(user.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'Your verified account email was not available.' });
    const existing = await db.query(
      'SELECT user_id FROM drainmitra_profiles WHERE lower(email) = $1 LIMIT 1',
      [email]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'This email address is already registered. Please sign in instead.' });
    }
    const result = await db.query(
      'INSERT INTO drainmitra_profiles (user_id, email, full_name, organization) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, organization = EXCLUDED.organization, updated_at = NOW() RETURNING email, full_name, organization, created_at, updated_at',
      [user.id, email, fullName, organization]
    );
    return res.json({ profile: result.rows[0] });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}