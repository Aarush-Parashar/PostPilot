import { supabase } from '../supabase.js';
import { google } from 'googleapis';
import { getOAuthClient } from '../youtube.js';
import fs from 'fs';
import https from 'https';

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { title, description, videoRecordId, signedUrl } = req.body;

  // Load tokens from DB
  const { data: tokenRow } = await supabase
    .from('tokens')
    .select('*')
    .eq('id', 'youtube')
    .single();

  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials(tokenRow.tokens);
  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

  // Download from signed URL into tmp file
  const filePath = '/tmp/video.mp4';
  const file = fs.createWriteStream(filePath);
  await new Promise((resolve, reject) => {
    https.get(signedUrl, response => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', reject);
  });

  const response = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: { title, description },
      status: { privacyStatus: 'private' }
    },
    media: {
      body: fs.createReadStream(filePath)
    }
  });

  // Save video ID and URL
  const videoId = response.data.id;
  const youtubeUrl = `https://youtu.be/${videoId}`;
  await supabase.from('videos').update({
    youtube_id: videoId,
    youtube_url: youtubeUrl,
    status: 'pending'
  }).eq('id', videoRecordId);

  res.status(200).json({ videoId, youtubeUrl });
}
