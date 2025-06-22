import { getOAuthClient } from '../youtube.js';
import { supabase } from '../supabase.js';
import { google } from 'googleapis';

export default async function handler(req, res) {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).send('Missing authorization code');

    const oauth2Client = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // ✅ Save tokens
    const { error: tokenError } = await supabase.from('tokens').upsert({
      id: 'youtube',
      tokens
    });
    if (tokenError) throw tokenError;

    // ✅ Fetch user info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: user } = await oauth2.userinfo.get();

    // ✅ Upsert user info into Supabase
    const { error: userError } = await supabase.from('users').upsert({
      id: user.id,                    // You can also use user.email as ID
      email: user.email,
      name: user.name,
      picture: user.picture,
      role: 'editor'                 // or use logic to determine role
    });
    if (userError) throw userError;

    res.send('✅ YouTube OAuth success. You may close this tab.');
  } catch (err) {
    console.error('[OAuth2 Error]', err.message);
    res.status(500).send('OAuth2 failed: ' + err.message);
  }
}
