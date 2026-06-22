-- ============================================================================
-- RACV Member Concierge — INTERNAL DOCS (local-area guides)
-- Run AFTER seed.sql. Loads your 10 uploaded guides into internal_docs.
-- Uses dollar-quoting ($doc$) so guide text needs no escaping.
-- ============================================================================
delete from internal_docs where doc_type = 'local_guide';

insert into internal_docs (resort_id, title, doc_type, content, source) values
((select id from resorts where slug='healesville'),
 $doc$RACV HEALESVILLE COUNTRY CLUB & RESORT — YOUR LOCAL AREA GUIDE$doc$,
 'local_guide',
 $doc$================================================================
RACV HEALESVILLE COUNTRY CLUB & RESORT — YOUR LOCAL AREA GUIDE
Yarra Valley, Victoria
Last reviewed: June 2026
================================================================

Welcome to the Yarra Valley — world-class wineries, Australia's
best native wildlife sanctuary, and mountain-ash forest drives,
all within twenty minutes.

----------------------------------------------------------------
WHAT'S ON — WHERE TO CHECK
----------------------------------------------------------------
* Visit Yarra Valley & Dandenong Ranges — What's On (official)
  visityarravalley.com.au/events
* Yarra Ranges Council events calendar
  yarraranges.vic.gov.au/Explore-Yarra-Ranges/Events
* Wine Yarra Valley (winery events, Fireside Festival)
  wineyarravalley.com.au
* Visit Victoria — Yarra Valley What's On
  visitvictoria.com/regions/yarra-valley-and-dandenong-ranges/whats-on
* Healesville Sanctuary — What's On (keeper talks, seasonal events)
  zoo.org.au/healesville/whats-on

----------------------------------------------------------------
REGULAR MARKETS & RECURRING EVENTS
----------------------------------------------------------------
* Yarra Valley Regional Farmers' Market — 3rd Sunday of the
  month, 9am–2pm, at The Barn, Yering Station.
* Healesville Organic Market — every Saturday 8am–1pm,
  Coronation Park, River Street (bigger market on the Saturday
  nearest the full moon).
* Healesville Community Market — 1st Sunday (River St car park)
  and a smaller 3rd-Sunday edition at Coronation Park.
* Yarra Glen Racecourse Market — 1st Sunday, September–June
  only, 9am–2pm.
* Maroondah Dam parkrun, Healesville — every Saturday 8am.
  Free 5km trail course; visitors welcome.
* Live music at cellar doors — Yarrawood Estate has live music
  every Saturday and Sunday year-round; others gig ad hoc
  (check the Visit Yarra Valley events feed).
* Spirits of the Sky bird show — daily 12pm and 3pm at
  Healesville Sanctuary (weather dependent).

----------------------------------------------------------------
THE ESSENTIALS — ALWAYS-ON ATTRACTIONS
----------------------------------------------------------------
* Healesville Sanctuary (~10 min) — bushland zoo devoted to
  Australian natives; open 365 days, 9am–5pm. Kids under 16
  free on weekends and school holidays; tickets cheaper online.
* Four Pillars Gin (~5 min, in town) — one of the world's most
  awarded gin distilleries. Open daily; Friday and Saturday
  nights until 9pm.
* TarraWarra Museum of Art (~10 min) — striking architecture,
  serious Australian art, vineyard views. Tue–Sun 11am–5pm.
* Yering Station (~15 min) — Victoria's first vineyard (1838);
  cellar door takes walk-ins.
* Oakridge Wines (~15 min) — acclaimed restaurant and cellar
  door; seated tastings need bookings.
* Dominique Portet (~15 min) — French-style house; book ahead
  on weekends.
* Coombe Yarra Valley (~15 min) — Dame Nellie Melba's estate;
  7-acre gardens, restaurant Wed–Sun, high tea Wed & Sun.
* Yarra Valley Chocolaterie & Ice Creamery (~15 min) — free
  entry and tastings, daily 9am–5pm.
* Maroondah Reservoir Park (~8 min) — the 1927 dam wall
  lookout, Rose Stairway and grand picnic lawns.
* Badger Weir, Yarra Ranges NP (~12 min) — lyrebird territory
  under mountain ash (gates close 6pm in winter).
* Black Spur Drive (starts ~10 min) — Victoria's most beautiful
  stretch of road: hairpins under towering mountain ash.
* Cement Creek Redwood Forest, East Warburton (~45 min) —
  the famous 1930s redwood plantation.
* Steavenson Falls, Marysville (~45 min via Black Spur) — 84m
  falls, floodlit from dusk to 11pm.
* Rayner's Orchard, Woori Yallock (~25 min) — tractor
  fruit-tasting tours among 450+ varieties, daily.
* Hot air ballooning — sunrise flights over the valley daily
  (weather permitting) with Global Ballooning or Picture This.

----------------------------------------------------------------
FIRST TIME HERE?
----------------------------------------------------------------
Healesville Sanctuary in the morning (book Spirits of the Sky),
a cellar door tasting at Yering Station, and the Black Spur
drive before dinner. The valley's holy trinity.

----------------------------------------------------------------
FOR FAMILIES
----------------------------------------------------------------
* The Sanctuary — plan around the 12pm bird show.
* Chocolaterie — free tastings always land well.
* Rayner's Orchard tractor tour — pick and eat as you go.

----------------------------------------------------------------
FOR COUPLES
----------------------------------------------------------------
* Sunrise balloon flight with a winery breakfast.
* Gin tasting at Four Pillars, late on a Friday or Saturday.
* TarraWarra exhibition, then long lunch at Oakridge.

----------------------------------------------------------------
TRAVELLING SOLO
----------------------------------------------------------------
* Maroondah Dam parkrun Saturday 8am, then the organic market.
* Maroondah Reservoir Park — dam wall lookout and quiet paths.
* A counter tasting at Four Pillars in town.

----------------------------------------------------------------
RAINY DAY?
----------------------------------------------------------------
* Four Pillars distillery door.
* TarraWarra Museum of Art.
* The Chocolaterie.
* Cellar doors — tastings are all indoors; mist on the vines is
  a bonus.

----------------------------------------------------------------
LOCALS' KNOWLEDGE
----------------------------------------------------------------
* At the Sanctuary, go at 9am opening or after 3pm — the
  animals are most active in the cool hours.
* Black Spur care: 80km/h, hairpins stay damp and slippery
  under the canopy, and wildlife crosses at dawn and dusk.
  Avoid it in high winds (tree-fall risk); pull over only at
  the Fernshaw or Dom Dom Saddle picnic areas.
* The Redwood Forest car park (~100 spots) fills by 10am on
  weekends — go early or midweek.
* Ballooning is dawn-only and weather-dependent — book the
  first morning of your stay so a cancellation can be rebooked.
* Bookings matter here: Oakridge seated tastings essential;
  most winery restaurants need weekend reservations. Yering
  Station is the reliable walk-in.

----------------------------------------------------------------
SEASON BY SEASON
----------------------------------------------------------------
* Summer — sunrise ballooning; stone-fruit picking at Rayner's.
* Autumn — vintage season; the valley and Maroondah Reservoir
  Park turn gold.
* Winter — Fireside Festival (mid–late June: winery fire pits
  and mulled-wine trails) and truffle season — Truffle Valley
  at Seville runs dog-led truffle hunts (~25 min).
* Spring — joey season at the Sanctuary; smaller-wineries
  festival weekends (October).

----------------------------------------------------------------
GOOD TO KNOW (current as at June 2026)
----------------------------------------------------------------
* Innocent Bystander no longer exists — the Healesville venue
  was sold in 2025 and is now Zoncello Yarra Valley, a spritz
  bar and pizzeria from the Zonzo Estate team.
* Badger Weir's BBQ hotplates are currently out of action.
* Sections of Yarra Ranges NP have occasional evening closures
  for deer control — daytime visits unaffected.
$doc$,
 'Uploaded local-area guide (RACV_Healesville_Local_Guide.txt)');

insert into internal_docs (resort_id, title, doc_type, content, source) values
((select id from resorts where slug='royal-pines-gold-coast'),
 $doc$RACV ROYAL PINES RESORT — YOUR LOCAL AREA GUIDE$doc$,
 'local_guide',
 $doc$================================================================
RACV ROYAL PINES RESORT — YOUR LOCAL AREA GUIDE
Benowa, Gold Coast, Queensland
Last reviewed: June 2026
================================================================

Welcome to the green heart of the Gold Coast — ten minutes from
Surfers Paradise sand, five from the city's arts precinct, with
the botanic gardens literally next door and the hinterland
within an hour.

----------------------------------------------------------------
WHAT'S ON — WHERE TO CHECK
----------------------------------------------------------------
* Experience Gold Coast — What's On (the official destination
  site) — experiencegoldcoast.com/events
* HOTA, Home of the Arts — program (5 min away)
  hota.com.au/whats-on
* What's On Gold Coast (city listings portal)
  whatsongoldcoast.au
* City of Gold Coast (beach patrol info, parks, free programs)
  goldcoast.qld.gov.au/Things-to-do
* Queensland Parks — Springbrook/Burleigh alerts
  parks.qld.gov.au

----------------------------------------------------------------
REGULAR MARKETS & RECURRING EVENTS
----------------------------------------------------------------
* HOTA Farmers & Artisan Markets — every Sunday 6–11.30am at
  the HOTA precinct, Bundall (~5–7 min). The closest market to
  the resort, beside the free gallery.
* Carrara Markets — every Saturday and Sunday 8am–3pm (~10
  min). 300+ stalls; Australia's biggest permanent weekend
  market.
* Miami Marketta — street food and live music, currently
  Wednesday–Saturday evenings from 5pm (~15–18 min). Check
  miamimarketta.com for the night's line-up.
* Surfers Paradise Beachfront Markets — evening markets on the
  Esplanade several nights a week (currently listed Wed/Fri/Sat
  4–9pm — check before going).
* Marina Mirage Farmers Market — Saturday mornings, undercover,
  Main Beach (precinct under redevelopment — confirm first).
* Main Beach parkrun — Saturday 7am, Hollindale Park (~10–12
  min). Free 5km.
* Currumbin wild lorikeet feeding — 8am daily outside Currumbin
  Wildlife Sanctuary; free, no ticket needed.

----------------------------------------------------------------
THE ESSENTIALS — ALWAYS-ON ATTRACTIONS
----------------------------------------------------------------
* Gold Coast Regional Botanic Gardens (next door, walkable) —
  free, open daily, lake boardwalks, butterfly garden and a
  great playground.
* HOTA (5–7 min) — Australia's largest regional gallery, free
  general entry, outdoor stage, rooftop bar.
* Surfers Paradise Beach (10 min) — the famous one; patrolled.
* SkyPoint Observation Deck, Q1 (10 min) — levels 77–78, the
  best wet-or-dry view on the coast.
* Broadbeach (10–12 min) — the dining precinct, Pacific Fair
  shopping and The Star casino.
* Burleigh Heads (20–25 min) — the ocean path around the
  headland, James Street's eat strip, and the grassy hill.
* Currumbin Wildlife Sanctuary (30 min) — daily 9am–4pm;
  koalas, lorikeet feeding morning and afternoon.
* David Fleay Wildlife Park, West Burleigh (25 min) — the
  quieter, government-run native wildlife park; platypus.
* Springbrook National Park — Natural Bridge (45–60 min) —
  waterfall through a cave roof, with glow worms after dark.
* Tamborine Mountain (45 min) — Gallery Walk's 70+ shops,
  rainforest Skywalk canopy bridge, wineries.
* Theme parks — Movie World, Sea World, Wet'n'Wild (~20–25
  min), Dreamworld (~25–30 min). Check ride maintenance
  calendars online before picking your day.
* Sea World Cruises, Main Beach (15 min) — Broadwater cruises
  year-round; whale watching roughly June–November.

----------------------------------------------------------------
FIRST TIME HERE?
----------------------------------------------------------------
Morning swim between the flags at Surfers, sunset picnic on
Burleigh Hill, and a theme park or hinterland day in between.
That's the Gold Coast in three moves.

----------------------------------------------------------------
FOR FAMILIES
----------------------------------------------------------------
* Currumbin Wildlife Sanctuary — and the free 8am lorikeet
  feeding even without tickets.
* A theme park day (Movie World or Sea World are closest).
* The botanic gardens playground — next door, free, shaded.
* Currumbin Creek rock pools — calm water for littlies at
  low-to-mid tide.

----------------------------------------------------------------
FOR COUPLES
----------------------------------------------------------------
* Miami Marketta — street food, live music, no cooking.
* Tamborine Mountain: Gallery Walk, a winery, the Skywalk.
* Broadbeach dinner, then the skyline from SkyPoint at night.

----------------------------------------------------------------
TRAVELLING SOLO
----------------------------------------------------------------
* Main Beach parkrun Saturday 7am.
* HOTA: Sunday market, free gallery, rooftop coffee.
* The Burleigh ocean path — walk it early with the swimmers
  and surfers.

----------------------------------------------------------------
RAINY DAY?
----------------------------------------------------------------
* HOTA gallery (free) — easily half a day.
* Pacific Fair, Broadbeach — serious undercover retail.
* SkyPoint between showers — storm-watching is spectacular.
* Carrara Markets — substantially under cover.

----------------------------------------------------------------
LOCALS' KNOWLEDGE
----------------------------------------------------------------
* Burleigh Hill at sunset: bring a picnic rug and look north to
  the lit-up Surfers skyline. The classic local evening.
* Glow worms at Natural Bridge appear only in full darkness:
  go well after dusk, keep torches off the worms, skip insect
  repellent near the cave, and allow a full hour each way on
  the winding mountain road (or book a guided night tour).
* Swim only between the flags. Around 35 Gold Coast beaches are
  patrolled by professional lifeguards year-round (roughly
  8am–5pm), with volunteers boosting summer patrols.
* Sunday formula: HOTA markets at 7am, free gallery at 10am,
  botanic gardens stroll after — all within ten minutes of
  the resort.
* The free lorikeet feeding at Currumbin happens at 8am —
  before the sanctuary even opens.

----------------------------------------------------------------
SEASON BY SEASON
----------------------------------------------------------------
* Winter — whale season (June–November, peak July–Sept), daily
  cruises from Main Beach; Pacific Airshow over Surfers
  (August).
* Spring — Gold Coast 500 Supercars street race (late October;
  expect major road closures around Surfers).
* Summer — theme park peak season; Magic Millions racing
  carnival in January; bluebottles possible on onshore winds.
* Autumn — Blues on Broadbeach (May) — a huge, free,
  multi-stage music festival.

----------------------------------------------------------------
GOOD TO KNOW (current as at June 2026)
----------------------------------------------------------------
* NightQuarter no longer exists on the Gold Coast (closed in
  2019; its Sunshine Coast successor has also closed). Miami
  Marketta is the street-food night out.
* Marina Mirage is mid-redevelopment — check the Saturday
  farmers market is on before driving over.
* Dreamworld publishes a ride-maintenance calendar — worth a
  look before choosing your theme park day.
$doc$,
 'Uploaded local-area guide (RACV_Royal_Pines_Gold_Coast_Local_Guide.txt)');

insert into internal_docs (resort_id, title, doc_type, content, source) values
((select id from resorts where slug='hobart'),
 $doc$RACV HOBART HOTEL — YOUR LOCAL AREA GUIDE$doc$,
 'local_guide',
 $doc$================================================================
RACV HOBART HOTEL — YOUR LOCAL AREA GUIDE
Collins Street, Hobart CBD, Tasmania
Last reviewed: June 2026
================================================================

Welcome to Hobart — a sandstone harbour city where the mountain,
the market and the world's strangest museum are all an easy
reach from your door on Collins Street.

----------------------------------------------------------------
WHAT'S ON — WHERE TO CHECK
----------------------------------------------------------------
* Discover Tasmania — Festivals & Events (state tourism body)
  discovertasmania.com.au/things-to-do/festivals-and-events
* City of Hobart — Upcoming Events (council; also runs
  Salamanca Market and Taste of Summer)
  hobartcity.com.au/Things-To-Do/Upcoming-events
* Hobart and Beyond (official Southern Tasmania tourism)
  hobartandbeyond.com.au/events
* Eventfinda Hobart (gigs, theatre, comedy)
  eventfinda.com.au/whatson/events/hobart
* The Music — Hobart gig guide (free alternative to the
  paywalled Mercury)
  themusic.com.au/gigs/hobart

----------------------------------------------------------------
REGULAR MARKETS & RECURRING EVENTS
----------------------------------------------------------------
* Salamanca Market — every Saturday 8.30am–3pm, year-round,
  rain or shine. 300 stalls along the sandstone warehouses;
  10 minutes' walk from the hotel.
* Farm Gate Market — every Sunday 8.30am–1pm, Bathurst Street,
  6 minutes' walk. This is where locals actually shop: oysters
  and coffee at 9am.
* MONA — open Friday–Monday 10am–5pm (closed Tue–Thu, with
  Thursdays added in summer) — check mona.net.au. The ferry
  leaves Brooke St Pier, 8 minutes' walk away. Book both
  museum and ferry ahead.
* Pennicott Wilderness Journeys — multi-award-winning coastal
  cruises depart daily from the waterfront (Bruny Island,
  Tasman Island).
* Dark Mofo — the famous winter festival each June (11–22 June
  in 2026): red lights, Winter Feast, Night Mass, the Nude
  Solstice Swim. Book everything early that fortnight.

----------------------------------------------------------------
THE ESSENTIALS — ALWAYS-ON ATTRACTIONS
----------------------------------------------------------------
* Salamanca Place (10 min walk) — Georgian warehouses full of
  galleries, studios and bars; market epicentre on Saturdays.
* Battery Point via Kelly's Steps (15 min walk) — 1830s village
  lanes and the cafes of Hampden Road, reached by the 1839
  sandstone steps off Salamanca.
* MONA (25 min ferry) — Australia's most provocative museum,
  carved into a peninsula. Allow at least half a day.
* kunanyi / Mt Wellington (~30 min drive) — 1,271m summit
  boardwalks above the city; the Organ Pipes cliffs are
  walkable from The Springs partway up.
* TMAG — Tasmanian Museum and Art Gallery (10 min walk) — free
  entry, Tue–Sun (closed Mondays). Thylacine footage included.
* Maritime Museum of Tasmania (10 min walk) — small, charming,
  opposite Constitution Dock.
* Constitution Dock fish punts (10 min walk) — fish and chips
  from floating barges; a Hobart institution.
* Royal Tasmanian Botanical Gardens (5 min drive / 25–30 min
  riverside walk) — free, open daily from 8am; the beloved
  Subantarctic Plant House is kept at Macquarie Island chill.
* Lark Distillery cellar door, 14 Davey St (8 min walk) — the
  birthplace of modern Tasmanian whisky; walk-in flights daily.
* Cascade Brewery, South Hobart (10 min drive) — Australia's
  oldest operating brewery; book tours ahead.
* Richmond (~25–30 min drive) — Australia's oldest bridge
  (1823), convict gaol and village bakeries.
* Day trips — Bruny Island (full-day cruise/food tours; book
  days ahead) and Mt Field National Park (~80 min) for Russell
  Falls and, in late April–May, the turning of the fagus.

----------------------------------------------------------------
FIRST TIME HERE?
----------------------------------------------------------------
Salamanca (market day if you can), the MONA ferry, and the
kunanyi summit. Hobart's big three, all within a day and a half.

----------------------------------------------------------------
FOR FAMILIES
----------------------------------------------------------------
* TMAG — free, and genuinely good for kids.
* Fish and chips on the docks, watching the boats.
* Botanical Gardens lawns and the Subantarctic Plant House.
* Richmond — bridge, ducks, bakery, gaol (older kids).

----------------------------------------------------------------
FOR COUPLES
----------------------------------------------------------------
* A whisky flight at Lark, then dinner in Salamanca.
* Twilight wander through Battery Point's lanes.
* A long lunch cruise down the Derwent (Peppermint Bay) or a
  Bruny Island day.

----------------------------------------------------------------
TRAVELLING SOLO
----------------------------------------------------------------
* MONA solo is arguably the best way to do MONA.
* Farm Gate Market breakfast on Sunday.
* The Maritime Museum and a waterfront ramble.

----------------------------------------------------------------
RAINY DAY?
----------------------------------------------------------------
* MONA — most of it is underground anyway.
* TMAG (free) and the Maritime Museum.
* Lark cellar door and the Salamanca galleries.
* The summit often sits above or below the weather — check the
  webcams before writing the mountain off.

----------------------------------------------------------------
LOCALS' KNOWLEDGE
----------------------------------------------------------------
* Dress for the summit in every season — it can snow on the
  pinnacle in January, and it is always far colder and windier
  than the city. Check Pinnacle Road status (hobartcity.com.au)
  before driving up; it closes for snow and ice.
* Book the MONA ferry, not just the museum — sailings sell out
  on weekends and festivals. Arrive at Brooke St Pier 20
  minutes early.
* Salamanca: arrive before 9.30am for parking and first pick
  of the produce.
* Sunday belongs to Farm Gate — fewer tourists, better
  breakfast.
* Whisky without a car: Lark is a level 8-minute walk; no
  booking needed for a flight.
* During Dark Mofo (mid June), reserve restaurants and tours
  well ahead — the city genuinely books out.

----------------------------------------------------------------
SEASON BY SEASON
----------------------------------------------------------------
* Winter — Dark Mofo (June); whisky by open fires; snow dusted
  on the mountain.
* Spring — the Botanical Gardens in bloom; quieter shoulder-
  season waterfront.
* Summer — Taste of Summer festival on the docks (late Dec–
  early Jan); Sydney–Hobart yachts arriving just after
  Christmas.
* Autumn — the turning of the fagus, Australia's only winter-
  deciduous tree, late April–May at Mt Field (peak around
  Anzac Day).

----------------------------------------------------------------
GOOD TO KNOW (current as at June 2026)
----------------------------------------------------------------
* MONA opens Friday–Monday only (Thursdays added in summer) —
  plan your stay's MONA day around this and book ahead.
* TMAG is closed Mondays.
* The Mercury newspaper's gig guide is paywalled — use The
  Music or Eventfinda instead.
$doc$,
 'Uploaded local-area guide (RACV_Hobart_Local_Guide.txt)');

insert into internal_docs (resort_id, title, doc_type, content, source) values
((select id from resorts where slug='cape-schanck'),
 $doc$RACV CAPE SCHANCK RESORT — YOUR LOCAL AREA GUIDE$doc$,
 'local_guide',
 $doc$================================================================
RACV CAPE SCHANCK RESORT — YOUR LOCAL AREA GUIDE
Mornington Peninsula, Victoria
Last reviewed: June 2026
================================================================

Welcome to the wild southern tip of the Mornington Peninsula —
clifftops and ocean beaches on one side, wineries and hot springs
twenty minutes the other way.

----------------------------------------------------------------
WHAT'S ON — WHERE TO CHECK
----------------------------------------------------------------
For time-based events (festivals, gigs, exhibitions), these are
the trusted local sources:

* Visit Mornington Peninsula — What's On (official tourism board)
  visitmorningtonpeninsula.org/whats-on
  Includes dedicated Markets and Live Music pages.
* Mornington Peninsula Shire — What's On (council calendar)
  mornpen.vic.gov.au/Activities/Whats-On
* Visit Victoria — Mornington Peninsula
  visitmelbourne.com/regions/mornington-peninsula/whats-on
* Mornington Peninsula Wine (winery events, festivals)
  morningtonpeninsulawine.com.au
* MPRG — Mornington Peninsula Regional Gallery (exhibitions, free)
  mprg.mornpen.vic.gov.au

----------------------------------------------------------------
REGULAR MARKETS & RECURRING EVENTS
----------------------------------------------------------------
* Hill & Ridge Community Market, Red Hill — 1st Saturday of the
  month, September to May, 9am–2pm, Red Hill Recreation Reserve.
  (This is the famous Red Hill market under its new name — no
  market in March, when the Red Hill Show runs instead.)
* Mornington Main Street Market — every Wednesday 9am–3pm.
  Victoria's longest-running weekly street market (since 1979).
* Emu Plains Market, Balnarring — 3rd Saturday, October to April,
  9am–2pm, plus a January twilight market.
* Rosebud parkrun — every Saturday 8am, free 5km on the Bay
  Trail (~20 min drive). Locals debrief over coffee afterwards.
* Winter Wine Weekend — King's Birthday June long weekend at Red
  Hill Showgrounds; dozens of wineries pouring under one roof.

----------------------------------------------------------------
THE ESSENTIALS — ALWAYS-ON ATTRACTIONS
----------------------------------------------------------------
* Cape Schanck Lighthouse & boardwalk (next door) — 1859
  lighthouse with guided tours; dramatic basalt coastline.
  Note: boardwalk sections have had repair works through 2026 —
  check parks.vic.gov.au before planning beach access.
* Bushrangers Bay Walk (from the lighthouse car park) — 5.4km
  return, around 2 hours, to a wild basalt-framed beach.
* Peninsula Hot Springs, Fingal (~10 min) — 70+ geothermal
  bathing experiences. Book ahead, especially weekends.
* St Andrews Beach Brewery (~10 min) — beers in racing legend
  Makybe Diva's former training stables. Open daily.
* Pt. Leo Estate, Merricks (~15 min) — clifftop sculpture park
  (daily from 11am), cellar door, and Laura fine dining.
* Ten Minutes by Tractor, Main Ridge (~15 min) — two-hatted
  winery restaurant, Wed–Sun. Books out weeks ahead.
* Montalto, Red Hill South (~15 min) — winery restaurant plus a
  free 1km sculpture trail through the vines.
* Ashcombe Maze & Lavender Gardens, Shoreham (~12 min) —
  Australia's oldest hedge maze. Check trading days before going.
* Flinders village (~12 min) — galleries, golf clifftops and a
  classic pier (pier restoration works ongoing — access varies).
* Arthurs Seat Eagle, Dromana (~20–25 min) — gondola to the
  peninsula's highest point. Weather closures possible.
* Point Nepean National Park, Portsea (~30–35 min) — Quarantine
  Station and Fort Nepean, with a hop-on hop-off shuttle.
* Sorrento & Portsea (~25 min) — boutiques and calm bay beaches.
  The Searoad ferry to Queenscliff leaves hourly, every day.

----------------------------------------------------------------
FIRST TIME HERE?
----------------------------------------------------------------
Walk the lighthouse boardwalk at your doorstep, soak at Peninsula
Hot Springs, and spend an afternoon at Pt. Leo Estate's sculpture
park with a tasting. That's the Cape Schanck trifecta.

----------------------------------------------------------------
FOR FAMILIES
----------------------------------------------------------------
* Ashcombe Maze — kids love the lavender labyrinth.
* Arthurs Seat Eagle gondola, then the playground at the summit.
* Point Nepean — ride the shuttle and explore the old forts.
* Night out: Dromana 3 Drive-In (~20 min), Australia's longest
  continuously running drive-in (since 1962), with a 1950s diner.
* Swimming: take children to the calm bay beaches (Rosebud,
  Dromana, Sorrento front beach) — not the ocean beaches.

----------------------------------------------------------------
FOR COUPLES
----------------------------------------------------------------
* Twilight bathing at Peninsula Hot Springs.
* Long lunch at Ten Minutes by Tractor or Laura (book well ahead).
* Golden-hour walk to Bushrangers Bay, then dinner in Flinders.

----------------------------------------------------------------
TRAVELLING SOLO
----------------------------------------------------------------
* Bushrangers Bay walk early morning — you'll likely have it
  almost to yourself.
* Rosebud parkrun Saturday 8am — instant local company.
* Wednesday: Mornington street market plus the regional gallery
  (MPRG, free entry).

----------------------------------------------------------------
RAINY DAY?
----------------------------------------------------------------
* Peninsula Hot Springs — bathing in the rain is the best version.
* MPRG gallery in Mornington (free).
* Cellar doors: Montalto, Ten Minutes by Tractor — tastings are
  an indoor sport.
* Dromana Drive-In — movie from the dry comfort of your car.

----------------------------------------------------------------
LOCALS' KNOWLEDGE
----------------------------------------------------------------
* Do Bushrangers Bay in the morning: there's little shade, snakes
  sun themselves on the track in warm months, and the Main Creek
  estuary crossing is easiest at low tide.
* Never swim at Bushrangers Bay or Gunnamatta. Gunnamatta is one
  of Victoria's most rescue-prone beaches (Surf Life Saving rates
  it very hazardous). Swim only between the flags in season, or
  stick to bay beaches.
* Flinders Sourdough, hidden down a driveway off Cook Street —
  wood-fired organic loaves and Little Rebel coffee. The queue of
  locals tells you everything.
* The Red Hill market changed hands — locals now call it Hill &
  Ridge. Same first-Saturday rhythm, same growers.
* Saturday formula: parkrun at Rosebud 8am, coffee at Zarb & Ru,
  then a winery lunch.

----------------------------------------------------------------
SEASON BY SEASON
----------------------------------------------------------------
* Summer — bay beach season; Emu Plains twilight market (Jan).
* Autumn — harvest colour in the vines; Red Hill Show (March).
* Winter — Winter Wine Weekend (June long weekend); storm-watching
  from the lighthouse boardwalk; hot springs at their steamy best.
* Spring — Hill & Ridge market returns (first Sat of September);
  MPRG's National Works on Paper exhibition (Sep–Nov 2026).

----------------------------------------------------------------
GOOD TO KNOW (current as at June 2026)
----------------------------------------------------------------
* Cape Schanck boardwalk: intermittent closures for repairs —
  check Parks Victoria before promising yourself beach access.
* Flinders Pier: restoration works paused in April 2026; outer
  pier access may vary.
* Lighthouse tours run via a licensed Parks Victoria operator;
  book on TryBooking.
$doc$,
 'Uploaded local-area guide (RACV_Cape_Schanck_Local_Guide.txt)');

insert into internal_docs (resort_id, title, doc_type, content, source) values
((select id from resorts where slug='cobram'),
 $doc$RACV COBRAM RESORT — YOUR LOCAL AREA GUIDE$doc$,
 'local_guide',
 $doc$================================================================
RACV COBRAM RESORT — YOUR LOCAL AREA GUIDE
Murray River / Sun Country, Victoria
Last reviewed: June 2026
================================================================

Welcome to "Peaches and Cream Country" — river red gums, sandy
inland beaches and twin border towns (Cobram VIC / Barooga NSW)
joined by the Murray.

----------------------------------------------------------------
WHAT'S ON — WHERE TO CHECK
----------------------------------------------------------------
* Visit the Murray — Sun Country (official regional tourism)
  visitthemurray.com.au/places-to-go/central/suncountry
  (includes an annual events page)
* Moira Shire Council — Events in Moira Shire
  moira.vic.gov.au/Community/Events-in-Moira-Shire
* Cobram Barooga Business & Tourism (local event organiser)
  cobrambaroogabt.com
* Visit Victoria — The Murray What's On
  visitmelbourne.com/regions/the-murray/whats-on

----------------------------------------------------------------
REGULAR MARKETS & RECURRING EVENTS
----------------------------------------------------------------
* Cobram Lions Club Log Cabin Community Market — last Saturday
  of each month, 8am–1pm, Federation Park (66 Punt Rd). Specialty markets
  on holiday weekends, plus a December twilight market.
* Cobram parkrun — every Saturday 8am at Thompsons Beach
  (Rockarama Rd), minutes from the resort. Free; all welcome.
* Easter River Beaches Festival — Easter Sunday, Thompsons
  Beach: free live music and the famous 3pm rubber-duck race
  from the old Cobram–Barooga bridge.
* Peaches and Cream Festival — Australia's oldest continuously
  running festival (since 1973), held every second January at
  Thompsons Beach with a town parade. Confirm next dates with
  organisers.
* Tocumwal Foreshore Markets — roughly 8 times a year on the
  NSW side (~20 min).

----------------------------------------------------------------
THE ESSENTIALS — ALWAYS-ON ATTRACTIONS
----------------------------------------------------------------
* Thompsons Beach (~5 min) — billed as the largest inland beach
  in the Southern Hemisphere. Sandy Murray riverfront, BBQs,
  playground. The town's living room in summer.
* Quinn Island Wetlands Sanctuary (~5 min) — 40-hectare island
  reached by footbridge; 2.4km red-gum loop and a bird hide
  over a billabong.
* Scotts Beach / Cobram Nature Reserve (~10 min) — the quieter
  grassed riverbank locals favour for picnics.
* Cobram Barooga Golf Club (~8 min) — 36 public-access
  championship holes; the Old Course (1928) is a regular in
  Australia's top-100 lists.
* Barooga Botanic Gardens (~8 min) — free, volunteer-built
  6-acre gardens beside the Murray.
* The Big Strawberry, Koonoomoo (~10 min) — cafe, farmgate and
  seasonal pick-your-own strawberries (roughly Apr–Jul and
  Oct–Jan).
* Cactus Country, Strathmerton (~20 min) — 12 acres of
  spectacular cacti gardens. Open Wed–Sun 10am–5pm (closed
  Mon–Tue — plan accordingly).
* Monichino Wines, Katunga (~20–25 min) — family-run,
  Italian-style winery. Cellar door Sat–Sun 11am–4pm; weekdays
  by appointment.
* Tocumwal (~20 min) — the 7-metre Big Murray Cod, splash park
  and sandy town beaches on the NSW bank.
* Yarrawonga / Lake Mulwala (~30–35 min) — haunting dead-tree
  lake vistas; the MV Paradise Queen runs daily lunch and
  scenic cruises (a modern enclosed cruiser).
* Kingfisher Cruises, Barmah National Park (~45–50 min) —
  two-hour eco cruise through the world's largest river red gum
  forest, run with Yorta Yorta guides. Book ahead.
* Echuca (~1hr 15) — the nearest genuine paddlesteamer fleet,
  a classic day trip.

----------------------------------------------------------------
FIRST TIME HERE?
----------------------------------------------------------------
Swim or stroll at Thompsons Beach, walk the Quinn Island loop,
and play (or just walk) the Old Course. That's Cobram distilled.

----------------------------------------------------------------
FOR FAMILIES
----------------------------------------------------------------
* The Big Strawberry — picking in season, big breakfasts always.
* Tocumwal foreshore — splash park, sand and the Big Cod photo.
* Thompsons Beach playground and shallow-edge paddling (see
  river safety below).
* Easter Sunday duck race if your stay lines up.

----------------------------------------------------------------
FOR COUPLES
----------------------------------------------------------------
* Weekend tasting at Monichino, then a riverbank picnic.
* MV Paradise Queen lunch cruise on Lake Mulwala.
* Golden-hour photos among the cacti at Cactus Country.

----------------------------------------------------------------
TRAVELLING SOLO
----------------------------------------------------------------
* Cobram parkrun Saturday 8am — the fastest way to meet locals.
* Kingfisher eco-cruise through Barmah's red gums.
* A quiet line in the water at Scotts Beach.

----------------------------------------------------------------
RAINY DAY?
----------------------------------------------------------------
* Cobram Cinema on Main Street.
* Monichino cellar door (weekends) — tastings are indoors.
* Drive to Yarrawonga for the all-weather enclosed lake cruise.

----------------------------------------------------------------
LOCALS' KNOWLEDGE
----------------------------------------------------------------
* Respect the river. The Murray is Australia's most dangerous
  river for drowning — cold water, strong currents and submerged
  snags exist even at pretty, calm-looking beaches. Swim shallow
  and slow, supervise children at arm's length, never dive from
  banks or bridges, and skip the swim after drinks. There are no
  lifeguards on the river.
* Quinn Island's bird hide at dawn is the spot for kingfishers
  and azure wrens.
* Market-day combo: last-Saturday Lions market, then a swim at
  Thompsons Beach — they're minutes apart.
* Walk across the river into NSW near Quinn Island — two states
  in one stroll.
* Cobram Estate olive oil is from here, but there's no public
  tasting room in town — buy it at local stores instead.

----------------------------------------------------------------
SEASON BY SEASON
----------------------------------------------------------------
* Summer — river beach season; Peaches and Cream Festival
  (biennial January).
* Autumn — Easter River Beaches Festival and duck race; the
  tail-end of stone fruit harvest.
* Winter — crisp Sun Country golf on the Old Course; misty
  red-gum river walks.
* Spring — strawberry picking resumes at Koonoomoo (from
  October); Barmah wetland birdlife at its peak.

----------------------------------------------------------------
GOOD TO KNOW (current as at June 2026)
----------------------------------------------------------------
* Cactus Country is closed Mondays and Tuesdays.
* Monichino is weekends-only for walk-ins.
* The Lions market is the LAST Saturday of the month (some old
  listings say otherwise).
$doc$,
 'Uploaded local-area guide (RACV_Cobram_Local_Guide.txt)');

insert into internal_docs (resort_id, title, doc_type, content, source) values
((select id from resorts where slug='goldfields'),
 $doc$RACV GOLDFIELDS RESORT — YOUR LOCAL AREA GUIDE$doc$,
 'local_guide',
 $doc$================================================================
RACV GOLDFIELDS RESORT — YOUR LOCAL AREA GUIDE
Creswick, between Ballarat (~20 min) and Daylesford (~25 min)
Last reviewed: June 2026
================================================================

Welcome to the goldfields — regrowth forest at the door, gold
rush history in Ballarat one way, spa country in Daylesford and
Hepburn Springs the other.

----------------------------------------------------------------
WHAT'S ON — WHERE TO CHECK
----------------------------------------------------------------
* Visit Ballarat — What's On (official; covers Creswick)
  visitballarat.com.au/whats-on
* City of Ballarat events calendar
  ballarat.vic.gov.au/city/events/whats-ballarat
* Daylesford Macedon Life (official tourism board for
  Daylesford / Hepburn / Trentham)
  daylesfordmacedonlife.com.au
* Hepburn Shire Council (Creswick sits in Hepburn Shire)
  hepburn.vic.gov.au
* Creswick Neighbourhood Centre (market organiser)
  creswicknc.org/creswick-market

----------------------------------------------------------------
REGULAR MARKETS & RECURRING EVENTS
----------------------------------------------------------------
* Creswick Market — 3rd Saturday of the month, 9am–1pm, at the
  Creswick Neighbourhood Centre. 90+ stalls, rain or shine.
* Daylesford Sunday Market — every Sunday 8am–3pm at Daylesford
  Railway Station (quietens after 1pm). Pair it with a heritage
  train ride on the Daylesford Spa Country Railway, which runs
  from the same platform on Sundays.
* Ballarat Farmers Market — 2nd and 4th Saturdays, 9am–1pm,
  North Gardens Reserve at Lake Wendouree.
* Calembeen parkrun, Creswick — every Saturday 8am at Calembeen
  Park, five minutes away. Free 5km; visitors welcome.
* Annual anchors: Ballarat Begonia Festival (Labour Day weekend,
  March, free); ChillOut Festival, Daylesford (early March —
  Australia's biggest regional pride festival); Sovereign Hill's
  Winter Wonderlights (winter school holidays; 26 Jun – 19 Jul
  in 2026).

----------------------------------------------------------------
THE ESSENTIALS — ALWAYS-ON ATTRACTIONS
----------------------------------------------------------------
* Creswick township (~4 min) — gold-rush streetscape, cafes and
  bakeries.
* St Georges Lake (~7 min) — a former mining dam ringed by an
  easy 1.6km forest loop. Picnic tables, birdlife, swimming
  jetty in summer.
* La Gerche Forest Walk (~6 min) — 3.5km loop through 1880s
  reforestation plantings; the story of Australia's first
  forest nursery.
* Creswick Woollen Mills (~5 min) — the last coloured woollen
  mill in Australia. Open 7 days; free self-guided exhibit;
  animal farm Fri–Sun.
* Djuwang Baring (Creswick Trails) (~5 min, Hammon Park
  trailhead) — 60km of purpose-built mountain bike trails,
  fully opened late 2024, including all-abilities trails.
* Sovereign Hill, Ballarat (~22 min) — Australia's benchmark
  gold-rush open-air museum: gold pours, underground mine
  tours, costumed streets.
* Lake Wendouree & Ballarat Botanical Gardens (~20 min) — 6km
  lakeside circuit and a free begonia conservatory.
* Ballarat Wildlife Park (~25 min) — koalas, quokkas and crocs,
  daily 9am–5pm.
* Kryal Castle (~30 min) — medieval adventure park, open
  weekends and Victorian school holidays only.
* Daylesford (~25 min) — Lake Daylesford circuit and boathouse,
  Convent Gallery (Thu–Mon), Wombat Hill Botanic Gardens (free,
  with lookout tower), and the Mill Markets antiques warehouse
  (open daily).
* Hepburn Bathhouse & Spa (~30 min) — mineral bathing on this
  site since 1895. Open daily; book ahead on weekends.
* Trentham Falls (~40 min) — one of Victoria's tallest
  single-drop falls; short walk to the lookout (no base access
  — the cliffs are unstable).
* Hanging Rock (~1 hr) — the "Picnic at Hanging Rock" summit
  walk; entry per car, card only.

----------------------------------------------------------------
FIRST TIME HERE?
----------------------------------------------------------------
Sovereign Hill one day; Daylesford's lake, Sunday market and a
mineral-springs wander the next; St Georges Lake loop any
morning. Gold and spa country, both boxes ticked.

----------------------------------------------------------------
FOR FAMILIES
----------------------------------------------------------------
* Sovereign Hill — pan for real gold; Winter Wonderlights in
  the July school holidays.
* Ballarat Wildlife Park — hand-feed kangaroos.
* Kryal Castle on a weekend.
* Creswick Woollen Mills animal farm (Fri–Sun).

----------------------------------------------------------------
FOR COUPLES
----------------------------------------------------------------
* Twilight bathing at Hepburn Bathhouse.
* Convent Gallery + Wombat Hill gardens, then a Daylesford
  dinner (book ahead — this is spa country's peak demand).
* Fossick the Mill Markets for an afternoon.

----------------------------------------------------------------
TRAVELLING SOLO
----------------------------------------------------------------
* Calembeen parkrun Saturday 8am.
* Hire a mountain bike and ride Djuwang Baring's flow trails.
* La Gerche forest walk — quiet, shaded, full of history.

----------------------------------------------------------------
RAINY DAY?
----------------------------------------------------------------
* Hepburn Bathhouse — warm mineral water, weather irrelevant.
* Mill Markets, Daylesford — hours of undercover treasure
  hunting, open daily.
* Creswick Woollen Mills exhibit and shop.
* Sovereign Hill's indoor exhibits and Gold Museum precinct.

----------------------------------------------------------------
LOCALS' KNOWLEDGE
----------------------------------------------------------------
* Pump your own mineral water: Hepburn Mineral Springs Reserve
  has free hand-pumps — taste Soda, Sulphur, Locarno and Wyuna
  springs. Bring empty bottles; locals fill boots-full.
* Sunday formula: Daylesford market early (it winds down after
  1pm), then the heritage train from the same platform.
* La Gerche and St Georges Lake link via the Goldfields Track
  for a half-day heritage circuit from Creswick.
* The Convent Gallery is closed Tue–Wed, but the gardens are
  still wanderable.
* Trentham Falls is at its thundering best in winter and spring
  after rain — stay behind the barriers.

----------------------------------------------------------------
SEASON BY SEASON
----------------------------------------------------------------
* Summer — St Georges Lake swims; long evenings around Lake
  Wendouree.
* Autumn — exotic-tree colour in Creswick and Daylesford;
  Begonia Festival and ChillOut (March).
* Winter — spa season at Hepburn; Sovereign Hill Winter
  Wonderlights (June–July).
* Spring — Wombat Hill and the Ballarat gardens in bloom.

----------------------------------------------------------------
GOOD TO KNOW (current as at June 2026)
----------------------------------------------------------------
* Art Gallery of Ballarat is CLOSED for major upgrades, with
  reopening expected during 2027. A pop-up program runs
  off-site (43 Mair St and 50 Lydiard St North). Don't build a
  day around the main gallery.
* Kryal Castle opens weekends + Victorian school holidays only.
* Hanging Rock is closed to non-racegoers on 1 Jan and 26 Jan
  (race days).
$doc$,
 'Uploaded local-area guide (RACV_Goldfields_Creswick_Local_Guide.txt)');

insert into internal_docs (resort_id, title, doc_type, content, source) values
((select id from resorts where slug='torquay'),
 $doc$RACV TORQUAY RESORT — YOUR LOCAL AREA GUIDE$doc$,
 'local_guide',
 $doc$================================================================
RACV TORQUAY RESORT — YOUR LOCAL AREA GUIDE
Great Ocean Road / Surf Coast, Victoria
Last reviewed: June 2026
================================================================

Welcome to the official start of the Great Ocean Road and the
home of Australian surfing. Bells Beach is ten minutes away; the
whole Surf Coast unrolls from your door.

----------------------------------------------------------------
WHAT'S ON — WHERE TO CHECK
----------------------------------------------------------------
* Visit Great Ocean Road — Torquay What's On (official tourism)
  visitgreatoceanroad.org.au/torquaylife/whats-on
* Surf Coast Events (local aggregator — markets, parkrun, comps)
  surfcoastevents.com.au
* Surf Coast Shire events calendar (council; also runs the
  farmers market and surfing museum)
  surfcoast.vic.gov.au
* Torquay Hotel gig guide (the main live music venue)
  torquayhotel.com.au/gigs
* World Surf League (Rip Curl Pro dates) — worldsurfleague.com

----------------------------------------------------------------
REGULAR MARKETS & RECURRING EVENTS
----------------------------------------------------------------
* Torquay Farmers Market — every Saturday 8.30am–1pm, Surf Coast
  Shire offices car park. Year-round, rain or shine.
* Torquay parkrun — every Saturday 8am at Fisherman's Beach on
  The Esplanade, starting beside the Salty Dog Cafe. Minutes from
  the resort; visitors welcome (free, register online once).
* Torquay Cowrie Market — 3rd Sunday of the month on the
  foreshore lawns, core season September–April (~10am–3pm).
* Live music — most weekends at the Torquay Hotel; Bells Beach
  Brewing (Thu–Sun) hosts gigs and surf-film nights.
* Rip Curl Pro, Bells Beach — around Easter each year. Free to
  spectate from the clifftop, but expect traffic and full car
  parks all week.
* Nightjar Festival — January, now run as a multi-week summer
  festival series. Check nightjarfestival.com.au for the format.

----------------------------------------------------------------
THE ESSENTIALS — ALWAYS-ON ATTRACTIONS
----------------------------------------------------------------
* Torquay Front Beach & Cosy Corner (walkable) — sheltered,
  family-friendly swimming, patrolled in season.
* Bells Beach (~10 min) — the world's most famous surf reserve.
  Clifftop viewing platforms; surfers only, not a swimming beach.
* Australian National Surfing Museum (~3 min) — open daily
  9am–5pm; the world's largest surf museum and home of the
  Australian Surfing Hall of Fame.
* Surf Coast Walk (from the door) — 44km of clifftop trail. The
  Jan Juc – Bird Rock – Bells section is the classic short hit.
* Point Danger lookout (2 min) — marine sanctuary views and
  winter whale spotting, right in town.
* Blackman's Brewery, 26 Bell St (~3 min) — Torquay's original
  craft brewery, great pizzas (closed Mon–Tue).
* Bells Beach Brewing, Baines Cres (~4 min) — taproom Thu–Sun in
  the surf outlet precinct; kid- and dog-friendly.
* Great Ocean Road Chocolaterie & Ice Creamery, Bellbrae
  (~10 min) — free entry, daily 9am–5pm, tastings and workshops.
* Anglesea Golf Club kangaroo tours (~15–18 min) — daily 25-min
  tours among a mob of ~300 resident kangaroos.
* Split Point Lighthouse, Aireys Inlet (~25 min) — the "Round
  the Twist" lighthouse; daily tower climbs.
* Memorial Arch, Eastern View (~20 min) — the essential Great
  Ocean Road photo stop.
* Lorne & Erskine Falls (~45–50 min) — the classic GOR day out.

----------------------------------------------------------------
FIRST TIME HERE?
----------------------------------------------------------------
Stand on the clifftop at Bells, do the surfing museum, then drive
the Great Ocean Road to Split Point Lighthouse or Lorne, stopping
at the Memorial Arch. You've done the icons in a day.

----------------------------------------------------------------
FOR FAMILIES
----------------------------------------------------------------
* The Chocolaterie — free tastings, ice cream, kids' workshops.
* Anglesea kangaroo tour — guaranteed roos, safely, up close.
* Swim at Cosy Corner / Front Beach (calm, patrolled in season)
  or book a surf lesson with one of Torquay's surf schools.

----------------------------------------------------------------
FOR COUPLES
----------------------------------------------------------------
* Split Point Lighthouse at golden hour, dinner back in Torquay.
* A clifftop section of the Surf Coast Walk, then Blackman's.
* Winery cellar doors around Bellbrae on a slow afternoon.

----------------------------------------------------------------
TRAVELLING SOLO
----------------------------------------------------------------
* Torquay parkrun, Saturday 8am at Fisherman's Beach — then walk
  100m to the farmers market. The perfect solo Saturday.
* Walk Bird Rock to Bells and back along the clifftops.
* Museum, then a counter seat at a Bell Street taproom.

----------------------------------------------------------------
RAINY DAY?
----------------------------------------------------------------
* Australian National Surfing Museum.
* Chocolaterie — tastings and a workshop under cover.
* Brewery crawl: Blackman's and Bells Beach Brewing.
* Surf-brand outlet shopping on Baines Crescent.

----------------------------------------------------------------
LOCALS' KNOWLEDGE
----------------------------------------------------------------
* Coffee like a local: the Salty Dog kiosk at Fisherman's Beach
  opens 6am for surfers and dog-walkers; Ocean Grind roasts in
  the industrial estate; Swell at Jan Juc feeds everyone from
  tradies to prams.
* Swim where it's flagged. Front Beach and Cosy Corner are the
  calm options; Jan Juc and Bells have powerful rips.
* Whales pass within ~100m of this coast June–October. Point
  Danger and Split Point lookout are the local vantage points —
  bring binoculars.
* Easter = Rip Curl Pro week. Brilliant to watch, busy to drive.
* Baines Crescent loop: outlet shopping + Bells Beach Brewing in
  one easy circuit.

----------------------------------------------------------------
SEASON BY SEASON
----------------------------------------------------------------
* Summer — Nightjar Festival; long evenings on Front Beach.
* Autumn — Rip Curl Pro at Bells (around Easter).
* Winter — whale season June–October; Surf Coast Trail Marathon
  and the Surf Coast Writers Festival (June).
* Spring — Cowrie Market returns (3rd Sunday from September);
  wildflowers in the Anglesea heathlands.

----------------------------------------------------------------
GOOD TO KNOW (current as at June 2026)
----------------------------------------------------------------
* The Chocolaterie has recently rebranded as "The Chocolateries"
  — same place, same chocolate.
* Cowrie Market season dates vary slightly year to year — check
  torquaycowriemarket.com before a special trip.
* Bells is for watching and surfing only — there is no safe
  swimming there.
$doc$,
 'Uploaded local-area guide (RACV_Torquay_Local_Guide.txt)');

insert into internal_docs (resort_id, title, doc_type, content, source) values
((select id from resorts where slug='city-club-melbourne'),
 $doc$RACV CITY CLUB — YOUR LOCAL AREA GUIDE$doc$,
 'local_guide',
 $doc$================================================================
RACV CITY CLUB — YOUR LOCAL AREA GUIDE
501 Bourke Street, Melbourne CBD, Victoria
Last reviewed: June 2026
================================================================

Welcome to the middle of Melbourne — laneways, arcades, galleries
and the MCG, with the Free Tram Zone at the door.

----------------------------------------------------------------
WHAT'S ON — WHERE TO CHECK
----------------------------------------------------------------
* What's On Melbourne (City of Melbourne — the official guide)
  whatson.melbourne.vic.gov.au
* Visit Victoria / Visit Melbourne
  visitmelbourne.com
* NGV — exhibitions and programs
  ngv.vic.gov.au/whats-on
* Marriner Group theatres (Regent, Princess, Comedy, Forum —
  the East End Theatre District)
  marrinergroup.com.au/shows
* Broadsheet Melbourne — the best independent food/bar guide
  (editorial, not official; venues churn, so double-check hours)
  broadsheet.com.au/melbourne

----------------------------------------------------------------
REGULAR MARKETS & RECURRING EVENTS
----------------------------------------------------------------
* Queen Victoria Market — Tue/Thu/Fri from 6am, Sat from 6am,
  Sun from 9am. CLOSED Mondays and Wednesdays. 12–15 minutes'
  walk, or the free tram 58 up William Street.
* QVM Winter Night Market — Wednesday nights, June–August,
  5–10pm, free entry. (The summer edition runs Wednesdays in
  the warm months.)
* NGV Friday Nights — Friday evenings during major exhibitions
  (June–October 2026 for the Winter Masterpieces show): live
  music and after-hours galleries, ticketed.
* Rose St. Artists' Market, Fitzroy — Saturdays and Sundays
  (tram 96 from Bourke St).
* AFL at the MCG — most weekends April–September; general
  admission is cheap ($27) and walk-ups usually work for
  non-blockbuster games.
* Arts Centre Melbourne — guided tours Tue–Sat at 11am.
* Albert parkrun — Saturday 8am, Albert Park Lake (tram 12
  from Collins St). Free 5km.

----------------------------------------------------------------
THE ESSENTIALS — ALWAYS-ON ATTRACTIONS
----------------------------------------------------------------
* Hardware Lane (5 min walk) — cobbled cafe lane; the closest
  alfresco lunch to the Club.
* Block Arcade & Royal Arcade (8–10 min walk) — 1890s mosaic-
  floored shopping arcades; Hopetoun Tea Rooms' cake window.
* Queen Victoria Market (12–15 min walk) — the historic
  open-air market (see days above).
* State Library Victoria (10–12 min walk) — free; the domed
  La Trobe Reading Room is one of the world's great rooms.
* Fed Square & ACMI (13–15 min walk) — ACMI's Story of the
  Moving Image is free, open daily.
* Hosier Lane, Degraves St, Centre Place (10–15 min walk) —
  street art and espresso, the Melbourne cliches that earn it.
* NGV International & The Ian Potter Centre (15–20 min walk) —
  free general entry daily; the Winter Masterpieces blockbuster
  runs June–October 2026.
* Melbourne Skydeck, Southbank (15–18 min walk) — level 88
  views, open daily from midday. (It's the venue formerly
  known as Eureka Skydeck.)
* MCG tours & Australian Sports Museum (tram 70/75, ~15–20
  min) — tours most days 10am–3pm from Gate 3, except event
  days.
* Melbourne Museum & Carlton Gardens (tram 86/96, ~15 min) —
  natural history under a dramatic roof, beside the Royal
  Exhibition Building.
* Royal Botanic Gardens & Shrine of Remembrance (tram down St
  Kilda Rd, ~20 min) — free, vast, beautiful in any season.
* Chinatown, Little Bourke St (12–14 min walk) — the oldest
  continuous Chinatown in the Western world; late-night
  dumplings.

----------------------------------------------------------------
FIRST TIME HERE?
----------------------------------------------------------------
Laneways (Hosier–Degraves–Centre Place), the Queen Vic Market,
and an evening at the Skydeck or a show in the East End theatres.
If it's footy season, add the MCG — it explains Melbourne.

----------------------------------------------------------------
FOR FAMILIES
----------------------------------------------------------------
* ACMI at Fed Square — free and genuinely fun for kids.
* Melbourne Museum — the dinosaurs and the Children's Gallery.
* QVM doughnuts (see below) and market wandering.
* SEA LIFE Aquarium is an 8-minute walk away.

----------------------------------------------------------------
FOR COUPLES
----------------------------------------------------------------
* NGV Friday Nights — art, music and a bar, after hours.
* High tea or cake at the Block Arcade.
* Southbank river walk to dinner, skyline included.

----------------------------------------------------------------
TRAVELLING SOLO
----------------------------------------------------------------
* The State Library dome with a notebook.
* A laneway coffee crawl: Degraves, Centre Place, Hardware Ln.
* An MCG tour — solo-friendly, and the museum is excellent.

----------------------------------------------------------------
RAINY DAY?
----------------------------------------------------------------
Melbourne is built for it. The almost-entirely-undercover route:
Degraves St → Centre Place → Block Arcade → Royal Arcade →
Bourke St Mall. Then NGV or ACMI (both free) — or simply stay
under the arcades with the locals.

----------------------------------------------------------------
LOCALS' KNOWLEDGE
----------------------------------------------------------------
* You're inside the Free Tram Zone — it covers the CBD grid
  plus Queen Vic Market and Docklands. Don't touch on with
  Myki inside the zone, or you may be charged. NGV is just
  outside it: ride free to Fed Square, then walk 5 minutes
  over Princes Bridge.
* QVM's hot jam doughnuts: the American Doughnut Kitchen van
  has fried them on site since 1950 — outside D-Shed from
  about 7am on market days. Cash-friendly, queue moves fast.
* The best laneway bars have no signage — Presgrave Place and
  Meyers Place reward the curious. (Venues churn; half the fun
  is the hunt.)
* Footy: GA walk-ups work for most non-blockbuster MCG games —
  but never for finals or Anzac Day.
* The Winter Night Market (Wednesdays, June–Aug) is the locals'
  midweek dinner out.

----------------------------------------------------------------
SEASON BY SEASON
----------------------------------------------------------------
* Winter — AFL season; RISING festival (late May–early June);
  QVM Winter Night Market on Wednesdays. (White Night no longer
  exists — it merged into RISING.)
* Spring — Spring Racing Carnival, Flemington (the Melbourne
  Cup is the first Tuesday of November).
* Summer — Australian Open tennis, Melbourne Park (January).
* Autumn — Melbourne International Comedy Festival (late
  March–April), citywide.

----------------------------------------------------------------
GOOD TO KNOW (current as at June 2026)
----------------------------------------------------------------
* Queen Victoria Market is closed Mondays and Wednesdays
  (daytime) — plan around it.
* "Eureka Skydeck" is now Melbourne Skydeck.
* Melbourne Museum standard admission applies; most galleries
  (NGV, ACMI, SLV) are free for general entry.
$doc$,
 'Uploaded local-area guide (RACV_City_Club_Melbourne_Local_Guide.txt)');

insert into internal_docs (resort_id, title, doc_type, content, source) values
((select id from resorts where slug='inverloch'),
 $doc$RACV INVERLOCH RESORT — YOUR LOCAL AREA GUIDE$doc$,
 'local_guide',
 $doc$================================================================
RACV INVERLOCH RESORT — YOUR LOCAL AREA GUIDE
Bass Coast, Gippsland, Victoria
Last reviewed: June 2026
================================================================

Welcome to the Bass Coast — surf beach on one side, calm inlet
on the other, dinosaur fossils in the rock platforms, and
Victoria's "mini Great Ocean Road" starting at your door.

----------------------------------------------------------------
WHAT'S ON — WHERE TO CHECK
----------------------------------------------------------------
* Visit Bass Coast — Events (official; includes a downloadable
  regional market calendar)
  visitbasscoast.com.au/events
* Bass Coast Shire Council events calendar
  events.basscoast.vic.gov.au
* Visit Inverloch (town-level events and markets)
  visitinverloch.co/events
* Visit Gippsland (regional what's on)
  visitgippsland.com.au
* Phillip Island Nature Parks (Penguin Parade times/bookings)
  penguins.org.au

----------------------------------------------------------------
REGULAR MARKETS & RECURRING EVENTS
----------------------------------------------------------------
* Inverloch Community Farmers' Market — last Sunday of every
  month at The Glade foreshore, roughly 9am–1pm.
* Inverloch Farmers' Market at The Glade — 3rd Saturday of the
  month, 8am–1pm. (Yes — two different markets; both worth it.)
* Inverloch Rotary Craft Market — about five Saturdays a year
  on holiday weekends (Melbourne Cup, New Year's Day, Australia
  Day, Labour Day, Easter), now at the Inverloch Community Hub.
* Koonwarra Farmers' Market — 1st Saturday, 8.30am–12.30pm
  (~20 min).
* Wonthaggi Rotary Market — 2nd Sunday, September–May.
* Inverloch parkrun — every Saturday 8am, Rotary Centenary
  Park, Ramsey Blvd. Free; visitors welcome.
* Penguin Parade, Phillip Island — every night of the year at
  dusk (around 6pm in winter, 9pm midsummer). Book ahead.

----------------------------------------------------------------
THE ESSENTIALS — ALWAYS-ON ATTRACTIONS
----------------------------------------------------------------
* Inverloch Surf Beach (~5 min) — long, learner-friendly surf
  beach, patrolled in season.
* Anderson Inlet beaches (~5 min) — shallow, protected water on
  the town side; the family swimming option.
* Bunurong Coastal Drive (from the resort to Cape Paterson) —
  clifftop lookouts the whole way; Victoria's mini Great Ocean
  Road, now part of Yallock-Bulluk Marine & Coastal Park.
* Eagles Nest (~10 min) — dramatic sea stack, and the site of
  Australia's first dinosaur fossil find (1903).
* The Caves (~12 min) — the famous Dinosaur Dreaming dig area;
  126-million-year-old fossils in the rock platform. Guided
  Dinosaur Discovery tours run in school holidays via the
  Bunurong Environment Centre in town.
* Screw Creek Nature Walk (~8 min) — 1.7km estuary boardwalk
  to Townsend Bluff lookout.
* Cape Paterson Bay Beach rock pool (~10 min) — a 1960s ocean
  wading pool; patrolled weekends Dec–Easter.
* State Coal Mine, Wonthaggi (~15–20 min) — heritage area with
  surface tours running. (Underground tours are suspended until
  about August 2026 during restoration.)
* Wonthaggi Heathlands & Rifle Range Wetlands (~15–20 min) —
  bird hide, 100+ species.
* Dirty Three Wines, Inverloch township (~5 min) — Gippsland
  wines, cellar door Thu–Sun (daily in summer holidays).
* Phillip Island & Penguin Parade (allow a full hour's drive)
  — penguins at dusk, The Nobbies, Cowes.
* Wilsons Promontory (~1.5 hr to Tidal River) — Squeaky Beach
  and the Prom Wildlife Walk; the classic big day trip.
* Kilcunda & the George Bass Coastal Walk (~25 min) — trestle
  bridge and winter whale vantage points.

----------------------------------------------------------------
FIRST TIME HERE?
----------------------------------------------------------------
Drive the Bunurong Coastal Drive stopping at Eagles Nest and
The Caves, taste at Dirty Three, and book a night at the
Penguin Parade. Coast, wine, penguins — done.

----------------------------------------------------------------
FOR FAMILIES
----------------------------------------------------------------
* Cape Paterson rock pool — safe, shallow ocean swimming.
* Dinosaur Discovery tour at The Caves (school holidays) — real
  fossil sites with a guide.
* Anderson Inlet beaches for little ones (see tide note below).
* Penguin Parade — arrive an hour before sunset, dress warm.

----------------------------------------------------------------
FOR COUPLES
----------------------------------------------------------------
* Sunset at Eagles Nest.
* A tasting flight at Dirty Three — it's walkable from town.
* A Wilsons Prom day: Squeaky Beach and a lookout walk.

----------------------------------------------------------------
TRAVELLING SOLO
----------------------------------------------------------------
* Inverloch parkrun Saturday 8am.
* Screw Creek boardwalk at high tide.
* Winter whale-spotting with binoculars along the Whale Trail.

----------------------------------------------------------------
RAINY DAY?
----------------------------------------------------------------
* State Coal Mine surface tour and heritage displays.
* Bunurong Environment Centre in town — fossils and natural
  history under a roof.
* Berninneit cultural centre, Cowes (gallery, museum, library).
* Wonthaggi's shops and bakeries.

----------------------------------------------------------------
LOCALS' KNOWLEDGE
----------------------------------------------------------------
* Surf beach patrols run weekends from late November to Anzac
  Day, plus weekdays in summer school holidays. Swim between
  the flags — the beach near the inlet mouth has strong rips
  and is unpatrolled.
* Anderson Inlet looks calm but hides a deep tidal channel with
  strong flows close to shore. Supervise children, swim well
  inside the inlet, and avoid the entrance/dune area.
* Fossil hunting: visit the rock platforms at LOW tide; they're
  slippery and swell-exposed. Fossils are protected — look and
  photograph, never dig or hammer. The guided tour is the way
  to actually find things.
* Winter is whale season (late May–September, peak June–July):
  humpbacks and southern rights pass Eagles Nest, Cape Paterson
  and Kilcunda. The Bass Coast Whale Trail maps the lookouts.
* No penguin photos at the Parade — phones away at dusk.

----------------------------------------------------------------
SEASON BY SEASON
----------------------------------------------------------------
* Summer — patrolled surf beach; holiday craft markets (New
  Year's Day, Australia Day).
* Autumn — Inverloch Equinox Festival (March); calm, warm seas.
* Winter — whale season on the Whale Trail; Island Whale
  Festival at Cowes (early July).
* Spring — heathland wildflowers and waterbirds at Wonthaggi;
  the Rotary market resumes in September.

----------------------------------------------------------------
GOOD TO KNOW (current as at June 2026)
----------------------------------------------------------------
* State Coal Mine underground tours are paused until roughly
  August 2026 — surface tours still run.
* The much-loved Koonwarra Store has closed; the Koonwarra
  Farmers' Market still runs on first Saturdays.
* Allow a full hour to the Penguin Parade — and book days ahead
  in holiday periods.
$doc$,
 'Uploaded local-area guide (RACV_Inverloch_Local_Guide.txt)');

insert into internal_docs (resort_id, title, doc_type, content, source) values
((select id from resorts where slug='noosa'),
 $doc$RACV NOOSA RESORT — YOUR LOCAL AREA GUIDE$doc$,
 'local_guide',
 $doc$================================================================
RACV NOOSA RESORT — YOUR LOCAL AREA GUIDE
Noosa Heads, Sunshine Coast, Queensland
Last reviewed: June 2026
================================================================

Welcome to Noosa — a national park coastal walk, a gentle
north-facing beach, the river, the everglades and the hinterland,
all from one leafy hill.

----------------------------------------------------------------
WHAT'S ON — WHERE TO CHECK
----------------------------------------------------------------
* Visit Noosa — What's On (official; includes an events calendar
  and a "This Week in Noosa" digest)
  visitnoosa.com.au/whats-on
* Noosa Shire Council events calendar
  noosa.qld.gov.au/Community/Events/Events-Calendar
* Visit Sunshine Coast (region-wide)
  visitsunshinecoast.com
* Queensland Parks — Noosa NP alerts (track/condition updates)
  parks.qld.gov.au/parks/noosa
* Noosa Today (local paper, community listings)
  noosatoday.com.au

----------------------------------------------------------------
REGULAR MARKETS & RECURRING EVENTS
----------------------------------------------------------------
* Noosa Farmers Market — every Sunday morning until noon, Noosa
  AFL Grounds, Weyba Rd, Noosaville (~7 min). Go early.
* The Original Eumundi Markets — every Wednesday AND Saturday,
  7.30am–2pm, rain or shine (~20–25 min). One of Australia's
  great artisan markets.
* Noosa Marina Sunday Markets — every Sunday 8am–1.30pm,
  Tewantin, with live music from 10am.
* Noosa parkrun — Saturday 7am. Note: it starts at Noosaville
  State School car park on Beckmans Rd (Lake Doonella course),
  not at Main Beach.
* Penguin-rule for events: the Visit Noosa weekly digest is the
  best single check for what's on during your stay.

----------------------------------------------------------------
THE ESSENTIALS — ALWAYS-ON ATTRACTIONS
----------------------------------------------------------------
* Noosa National Park Coastal Walk (walk in via the Hastings St
  boardwalk) — 5.4km one-way past Boiling Pot, Tea Tree Bay,
  Dolphin Point and Hell's Gates to Sunshine Beach. Hell's
  Gates (~an hour in) has 270-degree ocean views.
* Noosa Main Beach (5 min) — rare north-facing beach with a
  gentle break; patrolled every day of the year.
* Hastings Street (3–5 min) — the dining and boutique strip.
* Laguna Lookout, Viewland Dr — on the resort's own hill; the
  classic Laguna Bay panorama.
* Noosa River & Gympie Terrace, Noosaville (5–7 min) —
  riverside eating, free BBQs, boat/kayak/SUP hire.
* Sunshine Beach (7 min) — the locals' surf beach, with a surf
  club lunch and ocean views.
* Noosa Everglades, from Boreen Point (30–35 min) — one of only
  two everglades systems on Earth: kayak it with a guide or
  take an eco cruise.
* Mount Tinbeerwah, Tewantin (20 min) — 1km return summit walk
  from the car park; the first lookout is wheelchair/pram
  accessible. Sunset favourite.
* Noosa Botanic Gardens, Lake MacDonald (25 min) — free,
  lakeside, with an open-air amphitheatre.
* Montville & Maleny hinterland (50–60 min) — galleries,
  cheese, chocolate and Glass House Mountains lookouts.
* Learn to surf — daily lessons on Main Beach with long-running
  schools (Merrick's, Go Ride A Wave); SUP and kayak hire at
  Noosa Woods.

----------------------------------------------------------------
FIRST TIME HERE?
----------------------------------------------------------------
Walk the coastal track to Hell's Gates early, swim Main Beach
between the flags, dawdle down Hastings Street, and finish with
sunset at Laguna Lookout or Mount Tinbeerwah.

----------------------------------------------------------------
FOR FAMILIES
----------------------------------------------------------------
* Main Beach — flagged, gentle, patrolled 365 days a year.
* Gympie Terrace — free riverside BBQs, pelicans, boat hire.
* Eumundi Markets on a Wednesday or Saturday.
* Australia Zoo at Beerwah is about an hour away if you want
  the big day out.

----------------------------------------------------------------
FOR COUPLES
----------------------------------------------------------------
* A guided everglades kayak or a serene river cruise.
* Sunset and a sundowner at the Sunshine Beach surf club.
* Dinner on Hastings Street — book the good rooms early.

----------------------------------------------------------------
TRAVELLING SOLO
----------------------------------------------------------------
* Noosa parkrun Saturday 7am.
* The full coastal walk to Sunshine Beach and bus back.
* A morning surf lesson — solo-friendly by design.

----------------------------------------------------------------
RAINY DAY?
----------------------------------------------------------------
* Eumundi Markets — largely covered, runs rain, hail or shine.
* Hinterland drive to Montville and Maleny (galleries, cheese
  and chocolate factories are all indoors).
* Cinema and shopping around Noosa Junction / Hastings St.

----------------------------------------------------------------
LOCALS' KNOWLEDGE
----------------------------------------------------------------
* The Fairy Pools (Noosa NP): only attempt at LOW tide in calm
  seas. There's no path, no signage and no lifeguards — it's a
  rock scramble in closed shoes, and dangerous in any swell.
  Not for small children.
* Do the coastal walk at dawn (5.30–7am): cool light, best
  chance of koalas at Tea Tree Bay, and the tiny national park
  car park fills by 7.30am — walk in from Hastings St instead.
* Whales pass June–November: Hell's Gates and Dolphin Point are
  the free lookouts.
* Rips form near the river mouth and groyne ends — stay between
  the flags at Main Beach.
* Sunday double: farmers market early, then the Marina markets
  at Tewantin and a ferry ride along the river.
* Beach yoga at Noosa Woods runs daily but is paid; the council
  runs genuinely free community yoga classes in Noosaville
  (see noosa.qld.gov.au, Living Well program).

----------------------------------------------------------------
SEASON BY SEASON
----------------------------------------------------------------
* Winter — whale season begins (June–November); Noosa Food &
  Wine Festival (mid June); NOOSA alive! arts festival (July).
* Spring — Noosa Triathlon week (late Oct/early Nov): brilliant
  atmosphere, but the town books out and roads close.
* Summer — Noosa Summer Swim Festival; bluebottles possible on
  onshore winds (heed lifeguard signage).
* Autumn — Noosa Festival of Surfing at First Point (March).

----------------------------------------------------------------
GOOD TO KNOW (current as at June 2026)
----------------------------------------------------------------
* The food festival has reverted to its original name — "Noosa
  Food & Wine" (formerly Noosa Eat & Drink).
* The everglades kayak operator Kanu Kapers is now part of
  Adventure Tribe — bookings still live online.
* National park beaches (Tea Tree, Alexandria Bay) are
  unpatrolled — Alexandria Bay's surf is genuinely dangerous.
$doc$,
 'Uploaded local-area guide (RACV_Noosa_Local_Guide.txt)');

