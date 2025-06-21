import { getOAuthClient } from '../youtube.js';
import { supabase } from '../supabase.js';

export default async function handler(req, res) {
  try {
    const oauth2Client = getOAuthClient();
    const code = req.query.code;
    const { tokens } = await oauth2Client.getToken(code);

    await supabase.from('tokens').upsert({
      id: 'youtube',
      tokens: tokens
    });

    res.send('✅ YouTube Auth Successful. You can close this window.');
  } catch (err) {
    res.status(500).send('❌ OAuth failed: ' + err.message);
  }
}

