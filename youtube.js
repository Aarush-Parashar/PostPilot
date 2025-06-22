import { google } from 'googleapis';

export const SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.force-ssl',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
  );
}
