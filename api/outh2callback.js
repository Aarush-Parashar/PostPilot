import { getOAuthClient } from '../youtube.js';
import { supabase } from '../supabase.js';

export default async function handler(req, res) {
  try {
    const oauth2Client = getOAuthClient();
    const code = req.query.code;

    console.log('🔁 OAuth Code:', code);

    const { tokens } = await oauth2Client.getToken(code);
    console.log('✅ Tokens received:', tokens);

    const { error } = await supabase.from('tokens').upsert({
      id: 'youtube',
      tokens: tokens
    });

    if (error) {
      console.error('❌ Error saving tokens:', error.message);
      return res.status(500).send('Error saving tokens: ' + error.message);
    }

    res.send('✅ YouTube Auth Success. You may close this tab.');
  } catch (err) {
    console.error('❌ OAuth2 callback failed:', err.message);
    res.status(500).send('OAuth2 callback failed: ' + err.message);
  }
}
