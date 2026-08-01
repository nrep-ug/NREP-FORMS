# NREP Public Forms

Public Next.js application for `forms.nrep.ug`. The HR portal remains the system of record and exposes the versioned forms API.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Set `NREP_FORMS_PUBLIC_API_KEY` to the same server-only value used by the HR portal.
3. Run `npm install` and `npm run dev`.
4. Open `http://localhost:3003`.

Respondent browsers only communicate with this application's same-origin routes. The HR API key is attached by the server runtime and is never delivered to browser JavaScript.
