import { getOAuthClient } from '../youtube.js';
import { supabase } from '../supabase.js';

export default async function handler(req, res) {
  const oauth2Client = getOAuthClient();
  const code = req.query.code;

  try {
    const { tokens } = await oauth2Client.getToken(code);
    // Store tokens in Supabase
    const { error } = await supabase.from('tokens').upsert({
      id: 'youtube',
      tokens: tokens
    });

    if (error) throw error;

    res.send('✅ YouTube OAuth success. You may close this window.');
  } catch (err) {
    console.error('[OAuth Callback Error]', err.message);
    res.status(500).send('❌ OAuth2 failed: ' + err.message);
  }
}
