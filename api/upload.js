import { supabase } from '../supabase.js';
import { getOAuthClient } from '../youtube.js';
import { google } from 'googleapis';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    try {
      const { title, description, videoRecordId } = fields;
      const videoPath = files.video.filepath;

      const { data: tokenRow, error: tokenError } = await supabase
        .from('tokens')
        .select('*')
        .eq('id', 'youtube')
        .single();

      if (tokenError) throw tokenError;

      const oauth2Client = getOAuthClient();
      oauth2Client.setCredentials(tokenRow.tokens);
      const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

      const response = await youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: { title, description },
          status: { privacyStatus: 'private' },
        },
        media: {
          body: fs.createReadStream(videoPath),
        },
      });

      const youtubeId = response.data.id;
      const youtubeUrl = `https://youtu.be/${youtubeId}`;

      await supabase.from('videos').update({
        youtube_id: youtubeId,
        youtube_url: youtubeUrl,
        status: 'pending',
      }).eq('id', videoRecordId);

      res.status(200).json({ success: true, youtubeId, youtubeUrl });
    } catch (err) {
      console.error('Upload failed:', err.message);
      res.status(500).json({ error: err.message });
    }
  });
}
