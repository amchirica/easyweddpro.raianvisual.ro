# Aliasuri UI pentru terminologie generalizată

Nu redenumim agresiv coloanele DB existente. Mapările UI sunt preferate.

| UI / produs | DB / legacy (păstrat) | Note |
|---|---|---|
| Tip eveniment | `event_type` | Deja neutru |
| Data evenimentului | `event_date` | Deja neutru |
| Locație eveniment | `venue` / `event_location` | Alias UI |
| Pipeline proiect | `projects.status` | Statusuri noi `logistics`, `follow_up` + legacy foto-video |
| Unitate ofertă | `proposal_items.description` prefix `Unitate:` | Fără coloană nouă încă |
| Invitați / durată lead | `leads.notes` linii `Invitați:` / `Durată:` | Fără coloane noi încă |
| business_type, vendor_categories, default_* | `workspaces.settings` JSON | Setări industrie |

Template-urile foto-video, DJ, locație, planner, decor, beauty și catering rămân specializate și nu se aplică automat tuturor workspace-urilor.
