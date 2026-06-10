# Magazina — Menaxhimi i Inventarit

## 1. Hapja lokale
1. Instalo Node.js: https://nodejs.org (versioni LTS)
2. Hap terminalin në këtë dosje
3. `npm install`
4. `npm run dev` → hap http://localhost:5173

Pa konfigurim, aplikacioni punon në **modalitet demo** (të dhënat humbasin me rifreskim).

## 2. Lidhja me bazën e të dhënave (Supabase — falas)
1. Krijo llogari në https://supabase.com → "New project"
2. Në projekt: **SQL Editor → New query** → ngjit përmbajtjen e `supabase-setup.sql` → Run
3. **Project Settings → API** → kopjo "Project URL" dhe "anon public key"
4. Kopjo `.env.example` si `.env` dhe vendos vlerat
5. Rinis `npm run dev` — në fund të menusë do shohësh "● Të dhënat ruhen (Supabase)"

Tani produktet ruhen përgjithmonë.

## 3. Publikimi online (Vercel — falas)
1. Ngarko dosjen në GitHub (repo i ri)
2. https://vercel.com → Add New Project → importo repon
3. Te "Environment Variables" shto VITE_SUPABASE_URL dhe VITE_SUPABASE_ANON_KEY
4. Deploy → merr URL live. Mund të lidhësh domain-in tënd te Settings → Domains.

## Shënim sigurie
Skripti SQL e lë bazën të hapur për lexim/shkrim që të nisësh shpejt.
Para përdorimit real me staf, shto login (Supabase Auth) — kërkoji Claude ta shtojë.
