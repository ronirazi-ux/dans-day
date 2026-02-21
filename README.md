# היום של דן 🌟 — Dan's Day Behavior Tracker

A mobile-friendly Hebrew web app for tracking Dan's daily behavior at kindergarten. Data syncs across all caregivers via Google Sheets.

---

## Features

- ✅ Log each day as **יום טוב** (good) or **היה אלים** (violent incident)
- 📝 Add an optional short note per day
- 🕊️ Live streak counter — consecutive days without violence
- 📅 Shows the last 5 days at a glance
- 🖼️ Dan's photo in the header (shared via Google Drive)
- 📱 Mobile-first design, works great on phones
- ☁️ Google Sheets as the database — all caregivers share the same data

---

## Setup Guide

### Step 1 — Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet
2. Name it **"היום של דן"** (or anything you like)
3. You don't need to create any columns — the script does this automatically

---

### Step 2 — Set up the Apps Script

1. In your Google Sheet, click **Extensions → Apps Script**
2. Delete all the default code in the editor
3. Copy the entire contents of [`apps-script.gs`](./apps-script.gs) from this repo and paste it in
4. Click **Save** (💾 or Ctrl+S)

---

### Step 3 — Deploy the Apps Script as a Web App

1. In the Apps Script editor, click **Deploy → New deployment**
2. Click the gear icon ⚙️ next to **"Select type"** → choose **Web app**
3. Set the following:
   - **Description**: `Dans Day API`
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
4. Click **Deploy**
5. You'll be asked to authorize — click **Authorize access** and follow the prompts
6. **Copy the Web App URL** — it looks like:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```
   This is your secret URL. Keep it safe and share it with caregivers.

> **Note:** After any future code changes, you must create a **new deployment** (not "manage existing") for changes to take effect.

---

### Step 4 — Configure the App

Each caregiver needs to do this **once** on their device:

1. Open the app (GitHub Pages URL or `index.html` locally)
2. Scroll to the bottom and tap **⚙️ הגדרות**
3. Paste the Apps Script Web App URL into the first field
4. Tap **שמור הגדרות**

Done! The app will now load and save data to the shared Google Sheet.

---

### Step 5 — Add Dan's Photo (Admin only, done once)

1. Upload Dan's photo to [Google Drive](https://drive.google.com)
2. Right-click the photo → **Share** → **Change to Anyone with the link**
3. Click **Copy link** — it looks like:
   ```
   https://drive.google.com/file/d/1abc123XYZ/view?usp=sharing
   ```
4. Open the app → ⚙️ הגדרות → paste the link into the **photo field**
5. Tap **שמור הגדרות**

The photo is saved to the Google Sheet's config tab and automatically appears for **all caregivers** when they refresh the app.

---

### Step 6 — Host on GitHub Pages (optional)

1. Fork this repository (or push it to your own GitHub repo)
2. Go to **Settings → Pages**
3. Under **Source**, select **Deploy from a branch → main → / (root)**
4. Click **Save**
5. Your app will be available at `https://<your-username>.github.io/<repo-name>/`

Share this URL with all caregivers — no installation needed, works on any phone browser.

---

## How the Sync Works

```
Caregiver 1 taps "יום טוב"
    → app sends POST to Google Apps Script URL
        → Apps Script writes row to Google Sheet

Caregiver 2 opens the app
    → app sends GET to Google Apps Script URL
        → Apps Script reads rows from Google Sheet
            → app displays latest data
```

The Apps Script URL is the shared "key" — anyone who has it can read and write data.

---

## Files

| File | Description |
|------|-------------|
| `index.html` | The entire app — HTML, CSS, and JavaScript in one file |
| `apps-script.gs` | Google Apps Script code to copy into the Apps Script editor |
| `README.md` | This setup guide |

---

## Privacy Note

The Google Apps Script Web App is deployed as "Anyone can access" — meaning anyone who knows the URL can view and edit the data. For a family app this is fine; the URL itself acts as the access control. Do not share the URL publicly.
