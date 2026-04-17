# Workshop Registration System — Setup Tutorial

## Project Structure

```
your-project/
├── api/
│   └── subscribe-ws.js   ← serverless function
├── index.html
├── styles.css
├── .env.local            ← local secrets (never commit this)
├── .gitignore
└── package.json
```

---

## Step 0 — package.json & .gitignore

Create `package.json` in the project root:

```json
{
  "name": "workshop-registration",
  "version": "1.0.0",
  "dependencies": {
    "googleapis": "^140.0.0"
  }
}
```

Then run:

```bash
npm install
```

Create `.gitignore`:

```
node_modules/
.env.local
.vercel/
```

---

## Step 1 — Google Cloud Console: Service Account

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com) and sign in.
2. Click the project dropdown (top-left) → **New Project** → give it a name (e.g. `workshop-ws`) → **Create**.
3. With your new project selected, open the left menu → **APIs & Services** → **Library**.
4. Search for **"Google Sheets API"** → click it → click **Enable**.
5. Open the left menu → **APIs & Services** → **Credentials**.
6. Click **+ Create Credentials** → **Service Account**.
7. Fill in:
   - **Service account name**: `workshop-bot` (or anything you like)
   - **Service account ID**: auto-filled
   - Click **Create and Continue**
8. On the "Grant this service account access" step, skip it (no role needed) → **Continue** → **Done**.
9. You'll see your new service account listed. Click on it to open it.
10. Go to the **Keys** tab → **Add Key** → **Create new key** → choose **JSON** → **Create**.
11. A JSON file downloads to your computer. **Keep it safe — it contains your credentials.**

The JSON file looks like this (values are examples):

```json
{
  "type": "service_account",
  "project_id": "workshop-ws",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN RSA PRIVATE KEY-----\nMIIE...\n-----END RSA PRIVATE KEY-----\n",
  "client_email": "workshop-bot@workshop-ws.iam.gserviceaccount.com",
  "client_id": "...",
  ...
}
```

The two fields you need are **`client_email`** and **`private_key`**.

---

## Step 2 — Google Sheets: Share the Spreadsheet

1. Open your Google Sheet (create one if you don't have it yet).
2. Make sure the **first row contains these headers** exactly (column order matters):

   | A        | B   | C     | D   | E    |
   |----------|-----|-------|-----|------|
   | Username | LC  | Grupo | WS  | Ação |

3. Copy your **Spreadsheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/  ← SPREADSHEET_ID_IS_HERE  /edit
   ```
4. Click **Share** (top-right) → paste the **`client_email`** from the JSON file → set permission to **Editor** → click **Share**.

> ⚠️ If you skip this step, the API will return a 403 Forbidden error.

---

## Step 3 — Environment Variables

You need three environment variables:

| Variable | Where to get it |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `client_email` field in the JSON key |
| `GOOGLE_PRIVATE_KEY` | `private_key` field in the JSON key (the full value including `-----BEGIN...-----`) |
| `GOOGLE_SHEET_ID` | The ID from the Sheet URL (Step 2, item 3) |

### For local development

Create a file called `.env.local` in the project root:

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=workshop-bot@workshop-ws.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIE...rest of key...\n-----END RSA PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms
```

> ⚠️ Keep the private key in **one single line** with literal `\n` characters — do **not** break it into multiple lines in the `.env.local` file.

### For Vercel production

1. Go to your project on [vercel.com](https://vercel.com) → **Settings** → **Environment Variables**.
2. Add each variable one by one:
   - **Name**: `GOOGLE_SERVICE_ACCOUNT_EMAIL` / **Value**: paste the email
   - **Name**: `GOOGLE_PRIVATE_KEY` / **Value**: paste the full private key string
   - **Name**: `GOOGLE_SHEET_ID` / **Value**: paste the sheet ID
3. Make sure the environment scope includes **Production** (and optionally **Preview** and **Development**).
4. Click **Save** for each one.

---

## Step 4 — Local Testing with `vercel dev`

1. Install the Vercel CLI globally (only once):

   ```bash
   npm install -g vercel
   ```

2. Log in:

   ```bash
   vercel login
   ```

3. Link your project (run once in the project folder):

   ```bash
   vercel link
   ```

4. Start the local dev server:

   ```bash
   vercel dev
   ```

   Vercel will:
   - Serve your `index.html` at `http://localhost:3000`
   - Automatically route `POST /api/subscribe-ws` to `api/subscribe-ws.js`
   - Load your `.env.local` variables automatically

5. Open [http://localhost:3000](http://localhost:3000), fill in the form, click **Enviar**, and check your Google Sheet.

---

## Step 5 — Deploy to Vercel

```bash
vercel --prod
```

Or push to GitHub and connect the repo in the Vercel Dashboard for automatic deployments on every push.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `403 Forbidden` from the API | Sheet not shared with the service account email |
| `Error: invalid_grant` | Wrong or malformed private key (check `\n` handling) |
| `Cannot find module 'googleapis'` | Run `npm install` in the project root |
| Form submits but nothing appears in Sheet | Check the `SHEET_NAME` constant in `subscribe-ws.js` matches your tab name |
| `❌ Erro de ligação` in the browser | The serverless function crashed — check Vercel Function Logs |

---

## Security Notes

- Never commit `.env.local` or the JSON key file to Git.
- The Service Account only has access to sheets you explicitly share with it.
- For production, consider adding a simple secret token header check in `subscribe-ws.js` to prevent abuse if the endpoint is ever discovered.
