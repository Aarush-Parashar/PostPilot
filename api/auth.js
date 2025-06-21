import { getOAuthClient, SCOPES } from '../youtube.js';

export default async function handler(req, res) {
  const oauth2Client = getOAuthClient();
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES
  });
  return res.status(200).json({ url });
}
