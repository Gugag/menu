
# Restaurant Menu Site (Public + Admin)

A lightweight, Firebase-powered menu website:
- **Public page** (`index.html`): shows restaurant name, hero image, categories, and menu items. No ordering.
- **Admin page** (`admin.html`): email/password login; add/edit/delete menu items; upload restaurant photo and item photos; toggle availability; auto‑generates a QR code for guests.

## Quick Start

1. **Create a Firebase project** (https://console.firebase.google.com)
   - Enable **Authentication** → *Email/Password* sign‑in.
   - Create at least **one user** (email/password) for admins.
   - Enable **Firestore** (production mode).
   - Enable **Storage**.

2. **Fill Firebase config**
   - Copy your web app config from Firebase console.
   - Edit `web/firebase.js` and replace the `firebaseConfig` placeholder.

3. **Set Security Rules (recommended)**
   - **Firestore rules** (Console → Firestore → Rules):
     ```
     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         // Public read for menu and settings
         match /settings/{doc} {
           allow read: if true;
           allow write: if request.auth != null;
         }
         match /menuItems/{doc} {
           allow read: if true;
           allow write: if request.auth != null;
         }
       }
     }
     ```
   - **Storage rules** (Console → Storage → Rules):
     ```
     rules_version = '2';
     service firebase.storage {
       match /b/{bucket}/o {
         // Public read for images; writes only if authenticated
         match /{allPaths=**} {
           allow read: if true;
           allow write: if request.auth != null;
         }
       }
     }
     ```

4. **Run locally**
   - You can open `index.html` and `admin.html` directly if your browser allows module imports from file URLs.
   - Prefer a small local server (e.g., `python -m http.server` in this folder) and visit `http://localhost:8000/`.

5. **Deploy**
   - Any static hosting works (Firebase Hosting, GitHub Pages*, Netlify, etc.).
   - *Admin pages using Firebase Auth generally need HTTPS if deployed publicly.*

6. **Use the Admin**
   - Open `/admin.html`, sign in with your admin email & password.
   - In **Restaurant Settings**, set **Restaurant Name** and upload a **Hero Photo**.
   - In **Add Menu Item**, fill fields and upload a photo (optional). Choose a category; categories are free‑text.
   - Items can be edited/deleted from the table. Use the **Availability** toggle to hide/show items without deleting.
   - **QR Code**: use the QR generator to produce a scannable code for the public menu URL (usually your deployed `index.html`).

## Data Model

- `settings/main` (document):
  - `name`: string (restaurant name)
  - `heroImageURL`: string (public URL to hero/banner image)

- `menuItems/{id}` (collection):
  - `name`: string
  - `description`: string
  - `price`: number (store as number for sorting; formatting is handled in the UI)
  - `category`: string (e.g., "Salads", "Mains", "Desserts", "Drinks")
  - `available`: boolean
  - `imageURL`: string (optional)
  - `sort`: number (optional manual sort weight, default 0)

## Notes

- This is a **read‑public/write‑auth** model. If you need stricter admin separation, add role checks via [Custom Claims] and adjust rules.
- Currency formatting defaults to **₾** (Georgian Lari) in the UI. Change in `web/app.js`.
- Guests only view menu; there is **no ordering/checkout**.
