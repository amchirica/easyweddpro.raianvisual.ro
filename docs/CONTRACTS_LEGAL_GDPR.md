# Contracte — GDPR & limitări juridice (MVP)

**Atenție:** acest document este infrastructură / ghid tehnic. Nu este consiliere juridică. Politica finală trebuie verificată de un avocat.

## Acceptare digitală vs semnătură calificată

EasyWedd Pro înregistrează o **acceptare digitală** (identitate declarată, timestamp, metadate sesiune, hash document).

Aceasta **nu reprezintă implicit** o semnătură electronică calificată (QES) în sensul eIDAS.

## Date colectate la acceptare

| Date | Scop |
|---|---|
| Nume complet declarat | Identificare parte acceptantă |
| Email | Contact / confirmare |
| Timestamp | Probă temporală |
| IP + user-agent | Audit tehnic al sesiunii |
| Hash document / versiune | Integritate conținut acceptat |
| Checkbox termeni / privacy | Dovada consimțământului declarat |

## Perioadă de păstrare (propunere tehnică)

- Documentele contractuale acceptate: păstrate cât timp există interes legitim / obligație contractuală sau legală de arhivare.
- Tokenurile publice: pot expira / fi revocate fără a șterge snapshot-ul acceptat.
- Logurile de activitate: păstrate pentru audit, fără token brut.

Valorile exacte de retenție trebuie definite în politica workspace-ului și verificate juridic.

## Ștergere cont vs documente legale

Ștergerea unui cont utilizator **nu trebuie** să șteargă automat contractele acceptate dacă există temei de păstrare (obligații contractuale, litigiipotentiale, contabilitate).

MVP-ul oferă soft-delete (`deleted_at`) pentru draft-uri; documentele acceptate rămân în workspace până la o politică de ștergere/anonimizare validată juridic.

## Drepturi persoane vizate

Infrastructura permite identificarea datelor pe client/workspace. Procedurile de acces, rectificare, ștergere sau restricționare trebuie operate manual / prin suport până la un modul GDPR complet.

## Limitări tehnice relevante juridic

- Fără semnătură calificată / certificat
- Fără timestamp autoritar terț (TSA)
- Hash-ul demonstrează integritatea snapshot-ului aplicației, nu un sigiliu electronic calificat
- Tokenurile de ofertă sunt încă stocate brut (limitare veche); tokenurile de contract folosesc hash la lookup public
