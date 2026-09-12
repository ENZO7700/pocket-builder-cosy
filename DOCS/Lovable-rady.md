Lovable.dev — forenzná analýza a akčný plán pre Cosy Pocket Builder
Dátum: 12. 9. 2026 Autor analýzy: agent bežiaci priamo v Lovable (prvá ruka, nie reverse engineering)

0. Najdôležitejšia korekcia tvojho modelu
   Tvoj dokument predpokladá, že Lovable je single-shot HTML generátor s dlhým system promptom. To je nesprávne a je to koreň väčšiny rozdielov v kvalite.

Tvoj predpoklad Realita
system + user prompt → 1× LLM call → HTML Agentický tool-loop: model opakovane číta súbory, edituje, spúšťa build, číta chyby, opravuje — desiatky krokov na jednu požiadavku
Výstup = samostatný HTML dokument Výstup = React/TypeScript repozitár (TanStack Start / Vite / Tailwind v4 / shadcn), nie HTML string
Kvalitu robí dĺžka promptu Kvalitu robí uzavretá slučka spätnej väzby (build log, runtime log, Playwright screenshot) + zamknutý template
Prompt ~50 riadkov Reálne ~70 000 znakov naprieč verziami, modulárne skladané podľa kontextu (3)
Dôsledok: zdvojnásobenie max_tokens a pridanie checklistu do promptu ti dá možno +10 %. Validácia + auto-repair loop ti dá +50 %.

1. SYSTEM PROMPT ANALYSIS
   Štruktúra
   Dĺžka: rádovo 20–70 tis. znakov, nie fixný blok. Skladá sa dynamicky: základná identita + pravidlá stacku + „knowledge cards" relevantné k úlohe (routing, server functions, auth, konektory, SEO) + kontext projektu (súbory, pamäť, logy).
   Sekcie (reálne poradie):
   Identita a rola (You are Lovable, an AI editor that creates and modifies web applications…) (4)
   Popis rozhrania (užívateľ vidí live preview vpravo) — model vie, že jeho výstup je okamžite viditeľný
   Katalóg nástrojov (~25 tool definícií: read, write, line-replace, exec, search, image-gen, DB, logy)
   Workflow pravidlá (najprv čítaj, potom edituj; batchuj paralelne; nikdy needituj bez obsahu súboru)
   Design system direktíva (najvplyvnejšia časť — viď nižšie)
   Stack-špecifické constraints (zoznam zakázaných knižníc, povinné konvencie)
   Response formát a komunikačné pravidlá
   Bezpečnostné pravidlá (RLS, role v separátnej tabuľke, žiadne secrets v klientovi)
   Constraints: veľmi explicitné negatívne inštrukcie. Napr. zákaz react-router-dom, zákaz text-white/bg-[#hex] v komponentoch, zákaz dark-mode toggle bez vyžiadania, zákaz generických AI estetík (Inter/Poppins, fialové gradienty na bielej).
   Edge cases: riešené ako recovery protokoly, nie ako prevencia. Napr.: „ak edit zlyhá 3×, zmeň prístup"; „ak build log ukazuje chybu, oprav ju aj keď nie je tvoja"; „error loop → diagnostikuj → izoluj → over signálom".
   Quality standards (verbatim duch, nie citácia)
   Oblasť Pravidlo
   Design Všetky farby/gradienty/tiene výhradne ako sémantické tokeny v jednom CSS súbore (HSL/OKLCH). Komponenty nikdy nemajú hardcoded farbu.
   Kód Semantic HTML, malé komponenty, žiadne mŕtve importy, každý import musí rezolvovať
   Responzivita Mobile-first, bez horizontálneho pretečenia
   A11y ARIA kde treba, alt texty, focus states, prefers-reduced-motion
   SEO <60 znakov title s keywordom, <160 meta description, jeden <h1>, JSON-LD, canonical, unikátne meta na každej route
   Obrázky Zákaz placeholderov — obrázky sa generujú image-gen nástrojom
   Kľúčový insight: Lovable nekáže modelu „urob to pekne". Káže mu najprv definovať design systém a až potom písať komponenty. Farba, ktorá nie je token, je porušenie pravidla — a to je strojovo detegovateľné.

2. GENERATION QUALITY
   Ako vzniká výstup
   user prompt
   → (voliteľne) plan mode: napíš plán, nechaj schváliť
   → tool loop:
   read files → write/line_replace (paralelne, dávkovo)
   → build beží automaticky, chyby → /tmp/observability/build-errors.log
   → agent číta log v ďalšom kroku → opravuje
   → voliteľne Playwright screenshot / console log / network
   → hotovo až keď build log hovorí "build OK"
   To je ten rozdiel. Nie post-processing, ale feedback loop. Validátor nie je regex nad stringom — je to reálny TypeScript build + reálny prehliadač.

Quality bars
Build musí prejsť — agent nesmie ohlásiť hotovo, kým log ukazuje chybu
Žiadne placeholder obrázky, žiadny lorem ipsum
Žiadna stránka, na ktorú odkazuje Link, nesmie chýbať
Preview sa nesmie zlomiť medzi krokmi (HMR)
Slabiny Lovable (tvoje príležitosti)
Pomalé pri veľkých refactoroch (sériový loop)
Drahé v kredite — každý tool call stojí
Zamknutý template: nedá sa Vue/Svelte/native
Vendor lock-in na Cloud/Supabase pri backendoch 3. TECHNICAL IMPLEMENTATION
Stack (generovaného appu)
Frontend: React 19 + TypeScript, TanStack Start v1 (file-based routing, SSR), Vite 7
Styling: Tailwind v4 (CSS-first @theme, OKLCH tokeny), shadcn/ui
Backend: createServerFn RPC + server routes; Supabase (branding „Lovable Cloud")
Hosting: edge runtime (Cloudflare workerd) — preto zákaz child_process, sharp, natívnych addonov
AI vo vnútri generovaného appu: Lovable AI Gateway (Gemini + OpenAI bez user API kľúčov)
Stack (samotného agenta)
Hlavný model: Claude-trieda, jeden agent, jedna slučka, ~25 nástrojov (5)
Sub-agenti na paralelný research/exploráciu (read-only)
Konektory idú cez vlastný gateway (connector-gateway.lovable.dev) — nie priame provider volania; gateway rieši auth, refresh, rate limit, kvóty (napr. 6000 req/24 h na workspace)
Riadenie
Oblasť Prístup
Streaming Áno, token-level streaming odpovede + tool callov; preview sa aktualizuje cez HMR, nie cez prerenderovanie stringu
Rate limiting Kreditový systém na workspace + per-connector kvóty na gatewayi
Error handling Vrstvené: build log, runtime error log, console log, network log — všetko sa vracia späť do kontextu agenta
Caching Kontextové okno + perzistentná projektová pamäť (mem://) — pravidlá, ktoré prežijú session 4. UI/UX DESIGN
Dashboard
Dvojpanel: chat vľavo, live preview vpravo (iframe). Toto je explicitne uvedené v system prompte, takže model píše odpovede s vedomím, že užívateľ vidí výsledok okamžite.

Ďalšie plochy: prepínač Code/Preview, viewport prepínač (mobile/desktop), Cloud tab (tabuľky, RLS, secrets, logy), git history + revert, publish dialog, custom domain.

UX patterns, ktoré stoja za skopírovanie
Plan mode — pri veľkej požiadavke agent najprv ukáže plán ako schvaľovaciu kartu. Znižuje počet drahých zlých generovaní.
HITL karty v chate — connect/approve/publish sa deje ako interaktívna karta priamo v konverzácii, nie preklikom do settings.
Chat-only odpovede — nie každá správa musí generovať kód. Agent vie len odpovedať.
Revert na commit — každá zmena je commit, jeden klik späť. Toto je psychologicky to, čo dovoľuje užívateľom riskovať.
Selektor elementu — klik na prvok v preview ho pripne do promptu.
Perzistentná pamäť — „nikdy nepoužívaj fialovú" sa pamätá naprieč sessions.
Non-technical tón — agent má zakázané používať slová ako „component", „route", „build" voči netechnickému užívateľovi. 5. BUSINESS MODEL
Free plan $0, Pro od $25/mes., Business od $50/mes., obe so 100 kreditmi (5), Enterprise custom (1)
Jeden kreditový balans pokrýva build, hosting, Cloud backend aj AI funkcie bežiace v publikovanej appke (3)
Denné free kredity na buildovanie + top-upy; billing zjednodušený v júni 2026 (4)
Competitive advantage: end-to-end (build → DB → auth → platby → doména → publish) bez toho, aby užívateľ mal externý účet
Limitations: kredity horia rýchlo pri debug loopoch, zamknutý stack, netransparentná cena za požiadavku
6. COMPETITIVE COMPARISON
Feature	Lovable	Bolt.new	Base44	v0.dev	Cosy PB (dnes)
Výstup	React repo + backend	React repo (WebContainer)	full-stack app	komponenty/stránky	1 HTML súbor
Kvalita designu	⭐⭐⭐⭐⭐	⭐⭐⭐⭐	⭐⭐⭐	⭐⭐⭐⭐⭐ (shadcn native)	⭐⭐⭐
Iterácia / oprava chýb	agent loop + build log	terminál v prehliadači	agent	slabšia	žiadna
Backend/DB/auth	vstavané	BYO Supabase	vstavané	nie	nie
Deploy	1 klik + doména	Netlify	vstavaný	Vercel	manuálne
Rýchlosť prvého výsledku	stredná	rýchla	rýchla	najrýchlejšia	rýchla
Cena vstup	$25 $20	$20 $20 —
Zdroje na porovnanie: 1, 2, 5

USP Lovable: netechnický človek dostane appku s databázou, loginom a doménou bez toho, aby sa dotkol terminálu.

Tvoj realistický USP: Cosy PB nesúperí s Lovable v backende. Súperí v rýchlosti a jednoduchosti single-file výstupu. To je legitímna nika — landing pages, one-pagers, prototypy, embedovateľné widgety. Nesnaž sa stať Lovable; staň sa najlepším single-file generátorom, ktorý nikdy nevydá rozbitý HTML.

7. ODPORÚČANIA PRE COSY POCKET BUILDER
   Priority 1 — Quick wins (1–2 dni)
   Self-repair loop namiesto validátora. Tvoj validateHtml() je dobrý, ale chýba mu druhá polovica: keď nájde chyby, pošli ich späť modelu ako druhý turn (Tvoj výstup má tieto chyby: … Vráť opravený kompletný dokument.). Max 2 retry. Toto je jediná zmena s najväčším dopadom.
   Headless validácia, nie regex. Regex nad <img> nechytí rozbitý layout. Spusti výstup v Playwrighte, pozbieraj console.error + page.evaluate na document.scrollingElement.scrollWidth > innerWidth (horizontálne pretečenie). Tieto dva signály chytia ~80 % reálnych chýb.
   max_tokens 16384 a temperature nižšie (0.3–0.5) pre kód.
   Design tokens do promptu. Vynúť, aby model najprv vypísal :root { --color-…: … } blok a potom používal iba var(--…). Hardcoded hex v CSS mimo :root = validačná chyba. Presne toto robí Lovable a je to strojovo vynútiteľné.
   Priority 2 — Core (1 týždeň)
   Streaming (SSE) — tvoj kód v dokumente má bug: fullText += chunk aj fullText += content, čo obsah zduplikuje. Akumuluj iba content z delty. Buffruj nekompletné SSE riadky medzi read() volaniami (chunk sa môže rozdeliť v strede riadku).
   Progresívny preview. Neparsuj nedokončený HTML regexom. Namiesto toho streamuj priamo do iframe cez document.write na už otvorený dokument — prehliadač inkrementálny HTML parsing zvláda natívne a dostaneš „stavia sa pred očami" efekt zadarmo.
   Rate limiting + quota — tvoj návrh je v poriadku, ale in-memory Map na Verceli nefunguje (serverless, každý invoke nová inštancia). Použi Upstash Redis alebo Vercel KV.
   Cache — rovnaký problém. Kľúč = sha256(system + prompt + model), hodnota v KV, TTL 1 h.
   Prompt templates/kategórie (Landing, Portfolio, E-shop, Dashboard, Docs) — lacné na implementáciu, obrovský dopad na vnímanú kvalitu, lebo šablóna dopĺňa chýbajúci kontext za užívateľa.
   Priority 3 — Long-term (2–8 týždňov)
   Element picker + targeted edit — klik na prvok v preview → pošli modelu iba tú sekciu na úpravu, nie celý dokument. Dramaticky šetrí tokeny a zrýchľuje iteráciu.
   Verzie a revert — každá generácia ako snapshot, jeden klik späť. Toto je to, čo robí nástroj použiteľným, nie demom.
   Perzistentná pamäť preferencií (farby, tón, zakázané veci) naprieč generáciami.
   Deploy target (Netlify/Vercel drop) + zdieľateľný read-only link.
   Usage tracking → monetizácia. Sleduj metriku „koľko generácií vyžadovalo manuálny fix" — to je tvoj jediný skutočný ukazovateľ kvality.
   Čo NErobiť
   Component library ako string konštanty. PREBUILT_COMPONENTS s hardcoded HTML urobí každý output identický a rozpoznateľný ako šablóna. Lovable to nerobí. Namiesto toho daj do promptu pravidlá kompozície (aké sekcie musí mať landing page), nie hotový markup.
   CSS „optimizer" s radením a odstraňovaním nepoužitých selektorov. Riziko rozbitia je vyššie než prínos. Minifikácia stačí — a ani tá nie je potrebná pri výstupe pod 500 kB.
   Sortenie CSS properties abecedne — nemá žiadny efekt na kvalitu ani veľkosť.
8. Odpovede na tvoje špecifické otázky
   Otázka Odpoveď
   Prečo výstup vyzerá „profesionálne"? Sémantické tokeny + zákaz hardcoded farieb + explicitný zákaz generickej AI estetiky + reálne generované obrázky namiesto placeholderov
   Ako spracúvajú prompty? Neprepisujú ich. Pri nejasnosti sa pýtajú (question karty) alebo ukážu plán. Úzku požiadavku implementujú priamo.
   Error rate? Nepublikovaný. Ale architektúra ho maskuje: chyby sa opravujú v slučke pred tým, než ich užívateľ uvidí.
   Rýchlosť? Pomalšia než single-shot nástroje — vedomý trade-off za správnosť.
   Value proposition? Od promptu k publikovanej appke s databázou a loginom, bez terminálu a bez externých účtov.
9. Jednoveta
   Lovable nevyhráva dlhším promptom — vyhráva tým, že nikdy nevydá výstup, ktorý sám nepreveril. Postav si túto slučku a dobehneš 80 % rozdielu za dva dni.

10. 🔥 Implement Self-Repair Loop (2 hod) - Nejväčší dopad
11. 🔥 Add Playwright Validation (3 hod) - Chytí 80% chýb
12. 🔥 Increase max_tokens to 16384 (5 min) - Viac priestoru
13. 🔥 Design Tokens in Prompt (1 hod) - Konzistentný štýl
