// api/subscribe-ws.js
// Vercel Serverless Function — appends or removes a workshop registration row
// in a Google Sheet using the googleapis library.
//
// Required environment variables (set in Vercel Dashboard or .env.local):
//   GOOGLE_SERVICE_ACCOUNT_EMAIL   — e.g. my-bot@my-project.iam.gserviceaccount.com
//   GOOGLE_PRIVATE_KEY             — the full private key from the JSON file
//   GOOGLE_SHEET_ID                — the ID from the Sheet URL (see tutorial below)

const { google } = require('googleapis');

// ── Column map: form field → Sheet header ──────────────────────────────────
// Adjust SHEET_NAME if your tab has a different name.
const SHEET_NAME = 'Sheet1';
const COLUMN_ORDER = ['Username', 'LC', 'Grupo', 'WS', 'Ação'];

// ── Auth ───────────────────────────────────────────────────────────────────
function getAuthClient() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY
    // Vercel stores \n as a literal string; this restores real newlines.
    .replace(/\\n/g, '\n');

  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

// ── Handler ────────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, coach, grupo, workshop, acao } = req.body;

  // Basic validation
  if (!username || !coach || !grupo || !workshop || !acao) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  try {
    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // Build the row in the correct column order
    // COLUMN_ORDER = ['Username', 'LC', 'Grupo', 'WS', 'Ação']
    const newRow = [username, coach, grupo, workshop, acao];

    // Append the new row after the last row with data
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${SHEET_NAME}!A:E`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [newRow],
      },
    });

    return res.status(200).json({ message: 'Inscrição registada com sucesso.' });
  } catch (err) {
    console.error('Google Sheets error:', err.message);
    return res.status(500).json({ error: 'Erro interno. Tenta novamente mais tarde.' });
  }
};
