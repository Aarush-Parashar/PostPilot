import { supabase } from '../supabase.js';
import { getOAuthClient } from '../youtube.js';
import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { videoId } = req.body;

  const { data: tokenRow } = await supabase
    .from('tokens')
    .select('*')
    .eq('id', 'youtube')
    .single();

  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials(tokenRow.tokens);
  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

  await youtube.videos.update({
    part: ['status'],
    requestBody: {
      id: videoId,
      status: { privacyStatus: 'public' }
    }
  });

  await supabase.from('videos').update({ status: 'approved' }).eq('youtube_id', videoId);

  res.status(200).json({ success: true });
}
