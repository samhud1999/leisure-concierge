-- ============================================================================
-- RACV Member Concierge — SEED DATA (structured)
-- Run AFTER schema.sql. Then run seed_docs.sql for the local-area guides.
-- Real RACV resort knowledge + dummy members/bookings (dates within ~2 weeks
-- of 2026-06-22 so live weather works). Real recurring events in that window.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- RESORTS
-- ----------------------------------------------------------------------------
insert into resorts (slug, name, type, town, state, latitude, longitude, region, description) values
('torquay','RACV Torquay Resort','resort','Torquay','VIC',-38.3471,144.3260,'Great Ocean Road / Surf Coast','Contemporary 5-star coastal resort at the start of the Great Ocean Road and the home of Australian surfing, with rooms over a links golf course or the Bass Strait coastline.'),
('cape-schanck','RACV Cape Schanck Resort','resort','Cape Schanck','VIC',-38.4760,144.8870,'Mornington Peninsula','Award-winning 5-star clifftop resort on the southern tip of the Mornington Peninsula, with fine dining, a Robert Trent Jones Jr championship golf course, a luxury day spa and self-contained villas.'),
('inverloch','RACV Inverloch Resort','resort','Inverloch','VIC',-38.6360,145.7290,'Bass Coast / South Gippsland','Relaxed coastal resort set among bushland between the wetlands of Anderson Inlet and the Bass Strait surf beaches, with rooms, cabins, villas and a caravan park.'),
('goldfields','RACV Goldfields Resort','resort','Creswick','VIC',-37.4250,143.8950,'Goldfields / Daylesford & the Macedon Ranges','Country golf resort bordering Creswick State Forest in Victoria''s historic gold-rush region, with a championship course, mountain-biking trails and an on-site art gallery.'),
('healesville','RACV Healesville Country Club & Resort','resort','Healesville','VIC',-37.6540,145.5180,'Yarra Valley','Country club and resort in the heart of the Yarra Valley wine region, combining an 18-hole golf course, a luxury day spa and mountain-view dining.'),
('cobram','RACV Cobram Resort','resort','Cobram','VIC',-35.9210,145.6480,'Murray River / Sun Country','Relaxed self-contained and caravan-park resort on the Murray River in Victoria''s sunny north, geared to families and caravanners with two pools and riverside walking tracks.'),
('royal-pines-gold-coast','RACV Royal Pines Resort','resort','Benowa (Gold Coast)','QLD',-28.0420,153.3760,'Gold Coast','Large 5-star Gold Coast golf and family resort on a 27-hole championship course, with eight bars and restaurants, a tropical lagoon pool with water park, and a luxury day spa.'),
('noosa','RACV Noosa Resort','resort','Noosa Heads','QLD',-26.3960,153.0900,'Sunshine Coast','5-star coastal resort above Noosa Heads offering self-contained suites, apartments and multi-storey villas, with multiple heated pools, a beach-entry lagoon and a day spa, walking distance to Hastings Street.'),
('hobart','RACV Hobart','city_hotel','Hobart','TAS',-42.8830,147.3300,'Hobart & Beyond','Contemporary apartment-style city hotel in central Hobart, walking distance to Salamanca Place, the waterfront and weekend markets.'),
('city-club-melbourne','RACV City Club','city_club','Melbourne','VIC',-37.8136,144.9631,'Melbourne CBD','RACV''s members'' club in the Melbourne CBD on Bourke Street, a city base close to Queen Victoria Market, the NGV, the MCG and the laneways.');

-- ----------------------------------------------------------------------------
-- ROOM TYPES
-- ----------------------------------------------------------------------------
insert into room_types (resort_id, name, description, sleeps, features) values
((select id from resorts where slug='torquay'),'Golf View Room','Room overlooking the championship links course',2,null),
((select id from resorts where slug='torquay'),'Ocean View Room','Room with Bass Strait coastline views',2,null),
((select id from resorts where slug='torquay'),'Premium Ocean View Room','Elevated premium ocean outlook',2,null),
((select id from resorts where slug='torquay'),'Suite','Large living space, separate bedroom, balcony with day bed and free-standing spa bath',2,'spa bath, balcony'),
((select id from resorts where slug='torquay'),'Family Room','Connecting rooms sleeping up to 7',7,'family'),
((select id from resorts where slug='cape-schanck'),'Superior Room','Comfortable base room',2,null),
((select id from resorts where slug='cape-schanck'),'Deluxe Room','Deep free-standing spa bath, balcony, gourmet minibar, Nespresso, pillow menu',2,'spa bath, balcony'),
((select id from resorts where slug='cape-schanck'),'Suite','Spacious suite',2,null),
((select id from resorts where slug='cape-schanck'),'Two Bedroom Ocean Villa','Self-contained villa with ocean outlook',4,'kitchen, laundry'),
((select id from resorts where slug='cape-schanck'),'Three Bedroom Golf Villa','Self-contained villa with full kitchen, living area and spa baths',6,'kitchen, spa bath'),
((select id from resorts where slug='inverloch'),'Resort Room','Comfortable base room',2,null),
((select id from resorts where slug='inverloch'),'Ocean View Room','Private balcony with ensuite, TV, microwave, fridge',2,'balcony'),
((select id from resorts where slug='inverloch'),'Premium Ocean View Room','~34sqm with Bass Coast and Anderson Inlet views',2,'balcony'),
((select id from resorts where slug='inverloch'),'Premium Villa','Two bedrooms, each with own bathroom, living area and full kitchen',4,'kitchen'),
((select id from resorts where slug='goldfields'),'Resort Room','King bed, balcony over grounds and Creswick State Forest',2,'balcony'),
((select id from resorts where slug='goldfields'),'Fairway Room','Two king beds, separate shower, balcony over the golf course',4,'balcony'),
((select id from resorts where slug='goldfields'),'Suite','Two king beds, two-person spa bath, separate shower, balcony',4,'spa bath'),
((select id from resorts where slug='goldfields'),'Deluxe Family Suite','Family suite sleeping up to 5',5,'family'),
((select id from resorts where slug='healesville'),'Lawn View Room','Room over the lawns',2,null),
((select id from resorts where slug='healesville'),'Golf View Room','Room over the golf course',2,null),
((select id from resorts where slug='healesville'),'Premium Mountain View Room','Room with mountain views',2,null),
((select id from resorts where slug='cobram'),'Garden View Cabin','Fully self-contained cabin',4,'kitchen'),
((select id from resorts where slug='cobram'),'Lake View Cabin','Self-contained cabin overlooking the resort lake',4,'kitchen'),
((select id from resorts where slug='cobram'),'Two Bedroom Apartment','Self-contained apartment with full kitchen',6,'kitchen'),
((select id from resorts where slug='royal-pines-gold-coast'),'Superior King Room','One king plus desk',2,null),
((select id from resorts where slug='royal-pines-gold-coast'),'Mountain View Room','Two doubles with hinterland views',4,null),
((select id from resorts where slug='royal-pines-gold-coast'),'Executive Spa Suite','Spa suite with Executive Lounge access',2,'spa bath, lounge access'),
((select id from resorts where slug='royal-pines-gold-coast'),'Two Bedroom Suite','Two-bedroom suite',4,null),
((select id from resorts where slug='noosa'),'One-bedroom Holiday Suite','Master king; sleeps 2 adults and 2 children',4,'kitchen'),
((select id from resorts where slug='noosa'),'Two-bedroom Apartment','Self-contained two-bedroom apartment',4,'kitchen'),
((select id from resorts where slug='noosa'),'Three-bedroom Villa','Multi-storey villa in a gated precinct with private pool and lift; some with rooftop spa',8,'private pool, kitchen'),
((select id from resorts where slug='hobart'),'Contemporary Hotel Room','King or two singles with walk-in shower',2,null),
((select id from resorts where slug='hobart'),'One-bedroom King Apartment','Lounge and kitchenette',3,'kitchenette'),
((select id from resorts where slug='hobart'),'Harbour View Suite','Panoramic city views',2,null),
((select id from resorts where slug='city-club-melbourne'),'Club Room','City club guest room',2,null),
((select id from resorts where slug='city-club-melbourne'),'Club Suite','City club suite',2,null);

-- ----------------------------------------------------------------------------
-- AMENITIES   (environment drives weather steering)
-- ----------------------------------------------------------------------------
insert into amenities (resort_id, name, category, environment, description) values
((select id from resorts where slug='torquay'),'Heated indoor pool','pool','indoor','25m lap lanes'),
((select id from resorts where slug='torquay'),'Children''s wading pool','pool','indoor','Part of the pool complex with a recreation area'),
((select id from resorts where slug='torquay'),'One Spa','spa','indoor','Luxury day spa with hammam, floatation & spa pool, thermal stone room, steam room and experience showers'),
((select id from resorts where slug='torquay'),'Gym','fitness','indoor','Fully-equipped gym'),
((select id from resorts where slug='torquay'),'Links golf course','golf','outdoor','18-hole par-71 links course designed by Ogilvy Clayton'),
((select id from resorts where slug='torquay'),'Tennis courts','sport','outdoor','Outdoor tennis'),
((select id from resorts where slug='torquay'),'Games room','family','indoor','Indoor games room'),
((select id from resorts where slug='torquay'),'Playground','family','outdoor','Outdoor playground'),
((select id from resorts where slug='cape-schanck'),'Heated indoor pool','pool','indoor','Open 6am-9pm daily with sauna and spa'),
((select id from resorts where slug='cape-schanck'),'One Spa','spa','indoor','Day spa with hammam bathing and thermal stone steam room'),
((select id from resorts where slug='cape-schanck'),'Gym','fitness','indoor','Fully-equipped gym beside the indoor pool'),
((select id from resorts where slug='cape-schanck'),'Championship golf course','golf','outdoor','18-hole course designed by Robert Trent Jones Jr'),
((select id from resorts where slug='cape-schanck'),'Tennis courts','sport','outdoor','Outdoor tennis'),
((select id from resorts where slug='cape-schanck'),'Games room','family','indoor','Indoor games room'),
((select id from resorts where slug='cape-schanck'),'Playground','family','outdoor','Outdoor playground'),
((select id from resorts where slug='inverloch'),'Indoor heated pool','pool','indoor','25m heated pool with hot tub'),
((select id from resorts where slug='inverloch'),'Kids pool','pool','indoor','Children''s pool'),
((select id from resorts where slug='inverloch'),'Spa & sauna','spa','indoor','Spa and sauna'),
((select id from resorts where slug='inverloch'),'Gym','fitness','indoor','Resort gym'),
((select id from resorts where slug='inverloch'),'Tennis','sport','outdoor','Outdoor tennis'),
((select id from resorts where slug='inverloch'),'Bushland walking trails','nature','outdoor','Trails through bushland leading to the coast'),
((select id from resorts where slug='goldfields'),'Heated outdoor pool','pool','outdoor','Heated outdoor pool'),
((select id from resorts where slug='goldfields'),'Indoor spa','spa','indoor','Indoor spa'),
((select id from resorts where slug='goldfields'),'Gym','fitness','indoor','Treadmills, bikes, weights and ellipticals'),
((select id from resorts where slug='goldfields'),'Championship golf course','golf','outdoor','18-hole par-72 course designed by Tony Cashmore'),
((select id from resorts where slug='goldfields'),'Mountain-biking trails','nature','outdoor','On-site MTB trails'),
((select id from resorts where slug='goldfields'),'ArtHouse gallery','culture','indoor','Gallery with exhibitions and artist residencies'),
((select id from resorts where slug='goldfields'),'Enclosed playground','family','outdoor','Fully-enclosed outdoor playground'),
((select id from resorts where slug='healesville'),'Indoor pool','pool','indoor','25m indoor pool'),
((select id from resorts where slug='healesville'),'Spa, sauna & steam room','spa','indoor','Spa, sauna and steam room'),
((select id from resorts where slug='healesville'),'One Spa','spa','indoor','Day spa with single and double treatment rooms with in-room pools and Yarra Valley views'),
((select id from resorts where slug='healesville'),'Gym','fitness','indoor','Fully-equipped gym'),
((select id from resorts where slug='healesville'),'Golf course','golf','outdoor','18-hole golf course'),
((select id from resorts where slug='healesville'),'Bowling green','sport','outdoor','Lawn bowls green'),
((select id from resorts where slug='healesville'),'Complimentary bikes','nature','outdoor','Bikes to borrow for the grounds and township'),
((select id from resorts where slug='cobram'),'Indoor pool & spa','pool','indoor','25m indoor pool with spa'),
((select id from resorts where slug='cobram'),'Outdoor lagoon pool','pool','outdoor','Outdoor lagoon pool'),
((select id from resorts where slug='cobram'),'Fitness centre','fitness','indoor','State-of-the-art fitness centre (guests 16+)'),
((select id from resorts where slug='cobram'),'Tennis courts','sport','outdoor','Outdoor tennis'),
((select id from resorts where slug='cobram'),'Basketball court','sport','outdoor','Outdoor basketball court'),
((select id from resorts where slug='cobram'),'Riverside walking tracks','nature','outdoor','Walking tracks by the Murray River'),
((select id from resorts where slug='royal-pines-gold-coast'),'Tropical lagoon pool','pool','outdoor','Outdoor tropical lagoon pool'),
((select id from resorts where slug='royal-pines-gold-coast'),'Water park','pool','outdoor','Water slides and splash park beside the lagoon pool'),
((select id from resorts where slug='royal-pines-gold-coast'),'One Spa','spa','indoor','Luxury day spa with massages, facials and water therapy'),
((select id from resorts where slug='royal-pines-gold-coast'),'Fitness centre','fitness','indoor','Cardio, free weights and resistance machines'),
((select id from resorts where slug='royal-pines-gold-coast'),'Championship golf course','golf','outdoor','27-hole championship course, former Australian PGA Championship venue'),
((select id from resorts where slug='royal-pines-gold-coast'),'Tennis courts','sport','outdoor','Outdoor tennis'),
((select id from resorts where slug='royal-pines-gold-coast'),'Kids playground','family','outdoor','Outdoor playground'),
((select id from resorts where slug='noosa'),'Heated pools','pool','outdoor','Two heated pools'),
((select id from resorts where slug='noosa'),'Lagoon pool with beach entry','pool','outdoor','Beach-entry lagoon pool'),
((select id from resorts where slug='noosa'),'Waterslide pool','pool','outdoor','Pool with waterslide'),
((select id from resorts where slug='noosa'),'One Spa','spa','indoor','Day spa with massage, customised facials and body treatments'),
((select id from resorts where slug='noosa'),'Gym','fitness','indoor','Fully-equipped gym'),
((select id from resorts where slug='noosa'),'Grass tennis court','sport','outdoor','Grass tennis court'),
((select id from resorts where slug='noosa'),'Games room','family','indoor','Table tennis, air hockey, foosball and arcade machines'),
((select id from resorts where slug='hobart'),'On-site parking','convenience','covered','24/7 parking at Victoria Place'),
((select id from resorts where slug='city-club-melbourne'),'City club facilities','convenience','indoor','Members'' club facilities in the Melbourne CBD');

-- ----------------------------------------------------------------------------
-- DINING
-- ----------------------------------------------------------------------------
insert into dining (resort_id, name, cuisine, environment, dietary_notes, hours, description) values
((select id from resorts where slug='torquay'),'Number One','Modern Australian','indoor',null,'Breakfast & dinner','Main evening restaurant using quality local ingredients'),
((select id from resorts where slug='torquay'),'White''s Paddock','Bar / casual','indoor',null,null,'Relaxed bar with golf-course and coastline views'),
((select id from resorts where slug='torquay'),'Harding''s Lounge','Lounge','indoor',null,null,'Light breakfast, lunch, cocktails and traditional afternoon tea with Bass Strait and golf views'),
((select id from resorts where slug='cape-schanck'),'Cape','Contemporary fine dining','indoor',null,'Dinner','Inventive fine dining showcasing Mornington Peninsula produce'),
((select id from resorts where slug='cape-schanck'),'Samphire','Contemporary Australian','indoor',null,null,'Share-style seasonal local produce with bay views'),
((select id from resorts where slug='cape-schanck'),'Mantellina','Italian / cafe','indoor',null,'All day','Relaxed family-friendly cafe with stone-baked pizza and all-day a la carte'),
((select id from resorts where slug='inverloch'),'Radius Restaurant','Modern Australian','indoor',null,null,'Showcases Gippsland''s best produce'),
((select id from resorts where slug='inverloch'),'Zenith Lounge','Wine & tapas','indoor',null,'10am-8pm daily','Wine and tapas with panoramic coastal views'),
((select id from resorts where slug='goldfields'),'Three Founders','Modern Australian','indoor',null,'7-10:30am & 6-9pm daily','Modern local cuisine with Josper grill dishes'),
((select id from resorts where slug='goldfields'),'Springs Bar & Terrace','Tapas / bar','covered',null,null,'Contemporary tapas with local beer, wine and cocktails on the terrace'),
((select id from resorts where slug='healesville'),'Banyalla','Modern Australian','indoor',null,null,'Innovative dishes championing Victorian produce with mountain views'),
((select id from resorts where slug='healesville'),'Riddell''s Green','Casual','indoor',null,null,'Casual drinks, snacks and family favourites'),
((select id from resorts where slug='cobram'),'Poolside Cafe','Cafe','indoor',null,'8:30am-3:30pm daily','Light breakfast and lunch with pool views (no dinner service on-site)'),
((select id from resorts where slug='royal-pines-gold-coast'),'Kalinda Restaurant','Buffet','indoor',null,null,'Buffet breakfast and all-day dining'),
((select id from resorts where slug='royal-pines-gold-coast'),'Tees'' Clubhouse','Casual','covered',null,'All day','All-day casual dining with golf-course views, indoor and outdoor seating'),
((select id from resorts where slug='royal-pines-gold-coast'),'Amici','Mediterranean','covered',null,null,'Mediterranean cuisine with a dedicated bar and outdoor seating'),
((select id from resorts where slug='royal-pines-gold-coast'),'Arakawa','Japanese','indoor',null,null,'Modern Japanese with teppanyaki experiences'),
((select id from resorts where slug='royal-pines-gold-coast'),'Arika Pool Bar','Poolside','outdoor',null,'10am-sunset daily','Light snacks and meals beside the lagoon pool'),
((select id from resorts where slug='royal-pines-gold-coast'),'Videre Restaurant','High tea','indoor',null,null,'High tea on Level 21 with Gold Coast views'),
((select id from resorts where slug='noosa'),'Arcuri','Modern Australian','indoor','Caters for dietary requirements','Open daily','Fresh seasonal produce and breakfast favourites'),
((select id from resorts where slug='noosa'),'Dazza''s Bar','Bar','indoor',null,null,'Pre-dinner drinks, casual meals and cocktails'),
((select id from resorts where slug='hobart'),'Charcoal','Modern Australian','indoor',null,'Breakfast & dinner','Local wines, seasonal produce and quality seafood'),
((select id from resorts where slug='hobart'),'Cascade on Collins','Bar & restaurant','indoor',null,'Until late','Bar and restaurant in the historic Cascade building');

-- ----------------------------------------------------------------------------
-- EXPERIENCES & ACTIVITIES
-- ----------------------------------------------------------------------------
insert into experiences (resort_id, name, category, environment, time_of_day, description) values
((select id from resorts where slug='torquay'),'Links golf','golf','outdoor','morning','Round on the 18-hole par-71 links course'),
((select id from resorts where slug='torquay'),'One Spa treatment','spa','indoor','any','Massage, facial or personalised treatment'),
((select id from resorts where slug='torquay'),'Surf lesson at Torquay Front Beach','water','outdoor','morning','Beginner-friendly surfing; Bells Beach for advanced surfers'),
((select id from resorts where slug='torquay'),'Surf Coast Walk','nature','outdoor','morning','Clifftop coastal trail from the door'),
((select id from resorts where slug='torquay'),'Afternoon tea at Harding''s Lounge','food_wine','indoor','afternoon','Traditional afternoon tea with coastal views'),
((select id from resorts where slug='cape-schanck'),'Championship golf','golf','outdoor','morning','Round on the Robert Trent Jones Jr course'),
((select id from resorts where slug='cape-schanck'),'One Spa hammam & treatment','spa','indoor','any','Hammam bathing, massage and facials'),
((select id from resorts where slug='cape-schanck'),'Lighthouse & Bushrangers Bay walk','nature','outdoor','morning','Trail to the historic Cape Schanck lighthouse and Bushrangers Bay'),
((select id from resorts where slug='cape-schanck'),'Fine dining at Cape','food_wine','indoor','evening','Degustation-style fine dining'),
((select id from resorts where slug='inverloch'),'Bushland-to-coast walk','nature','outdoor','morning','Walking trails leading to the surf beaches'),
((select id from resorts where slug='inverloch'),'Beach day at Anderson Inlet','water','outdoor','afternoon','Sheltered inlet and Bass Strait surf beaches'),
((select id from resorts where slug='inverloch'),'Tapas & wine at Zenith Lounge','food_wine','indoor','evening','Coastal-view tapas and wine'),
((select id from resorts where slug='goldfields'),'Championship golf','golf','outdoor','morning','Round on the par-72 course'),
((select id from resorts where slug='goldfields'),'Mountain biking','nature','outdoor','morning','Resort MTB trails'),
((select id from resorts where slug='goldfields'),'ArtHouse gallery visit','culture','indoor','afternoon','Exhibitions and artist residencies'),
((select id from resorts where slug='healesville'),'18-hole golf','golf','outdoor','morning','Round on the country course'),
((select id from resorts where slug='healesville'),'One Spa water therapy','spa','indoor','any','Facials, massages and water therapy with valley views'),
((select id from resorts where slug='healesville'),'Lawn bowls','sport','outdoor','afternoon','Lawn bowls on the green'),
((select id from resorts where slug='healesville'),'Yarra Valley winery touring','food_wine','outdoor','afternoon','Cellar doors via the complimentary township shuttle'),
((select id from resorts where slug='cobram'),'Murray River & riverside walks','nature','outdoor','morning','River activities and riverside walking tracks'),
((select id from resorts where slug='cobram'),'Two-pool swim day','water','covered','afternoon','Indoor pool/spa and outdoor lagoon pool'),
((select id from resorts where slug='royal-pines-gold-coast'),'Championship golf','golf','outdoor','morning','Round on the 27-hole course'),
((select id from resorts where slug='royal-pines-gold-coast'),'One Spa treatment','spa','indoor','any','Massage, facial or water therapy'),
((select id from resorts where slug='royal-pines-gold-coast'),'Water park day','water','outdoor','afternoon','Lagoon pool and water slides'),
((select id from resorts where slug='royal-pines-gold-coast'),'High tea at Videre','food_wine','indoor','afternoon','Level 21 high tea with Gold Coast views'),
((select id from resorts where slug='royal-pines-gold-coast'),'Teppanyaki at Arakawa','food_wine','indoor','evening','Japanese teppanyaki dining experience'),
((select id from resorts where slug='noosa'),'Beach-entry lagoon & waterslide','water','outdoor','afternoon','Heated pools, beach-entry lagoon and waterslide'),
((select id from resorts where slug='noosa'),'One Spa treatment','spa','indoor','any','Massage, customised facial or body treatment'),
((select id from resorts where slug='noosa'),'Noosa National Park coastal walk','nature','outdoor','morning','Coastal walk from Hastings Street through the national park'),
((select id from resorts where slug='noosa'),'Grass-court tennis','sport','outdoor','morning','Tennis on the grass court'),
((select id from resorts where slug='hobart'),'Salamanca & waterfront stroll','culture','outdoor','morning','Explore Salamanca Place and the Hobart waterfront'),
((select id from resorts where slug='hobart'),'Dinner at Charcoal','food_wine','indoor','evening','Seasonal Tasmanian produce and seafood'),
((select id from resorts where slug='city-club-melbourne'),'Laneways & galleries','culture','covered','afternoon','Explore Melbourne''s laneways, NGV and CBD attractions');

-- ----------------------------------------------------------------------------
-- EVENT SOURCES  (allow-listed sites; null resort_id = applies to all)
-- ----------------------------------------------------------------------------
insert into event_sources (resort_id, name, url) values
((select id from resorts where slug='torquay'),'Visit Great Ocean Road - Torquay What''s On','https://visitgreatoceanroad.org.au/torquaylife/whats-on'),
((select id from resorts where slug='torquay'),'Surf Coast Events','https://surfcoastevents.com.au'),
((select id from resorts where slug='torquay'),'Surf Coast Shire events','https://surfcoast.vic.gov.au'),
((select id from resorts where slug='torquay'),'Torquay Hotel gig guide','https://torquayhotel.com.au/gigs'),
((select id from resorts where slug='torquay'),'Torquay Cowrie Market','https://torquaycowriemarket.com'),
((select id from resorts where slug='torquay'),'World Surf League','https://worldsurfleague.com'),
((select id from resorts where slug='cape-schanck'),'Visit Mornington Peninsula What''s On','https://visitmorningtonpeninsula.org/whats-on'),
((select id from resorts where slug='cape-schanck'),'Mornington Peninsula Shire What''s On','https://mornpen.vic.gov.au/Activities/Whats-On'),
((select id from resorts where slug='cape-schanck'),'Mornington Peninsula Wine','https://morningtonpeninsulawine.com.au'),
((select id from resorts where slug='cape-schanck'),'Mornington Peninsula Regional Gallery','https://mprg.mornpen.vic.gov.au'),
((select id from resorts where slug='inverloch'),'Visit Bass Coast events','https://visitbasscoast.com.au/events'),
((select id from resorts where slug='inverloch'),'Bass Coast Shire events','https://events.basscoast.vic.gov.au'),
((select id from resorts where slug='inverloch'),'Phillip Island Penguin Parade','https://penguins.org.au'),
((select id from resorts where slug='inverloch'),'Visit Gippsland','https://visitgippsland.com.au'),
((select id from resorts where slug='goldfields'),'Visit Ballarat What''s On','https://visitballarat.com.au/whats-on'),
((select id from resorts where slug='goldfields'),'City of Ballarat events','https://ballarat.vic.gov.au/city/events'),
((select id from resorts where slug='goldfields'),'Hepburn Shire','https://hepburn.vic.gov.au'),
((select id from resorts where slug='goldfields'),'Daylesford Macedon Life','https://daylesfordmacedonlife.com.au'),
((select id from resorts where slug='goldfields'),'Creswick Market','https://creswicknc.org/creswick-market'),
((select id from resorts where slug='healesville'),'Visit Yarra Valley events','https://visityarravalley.com.au/events'),
((select id from resorts where slug='healesville'),'Yarra Ranges events','https://yarraranges.vic.gov.au/Explore-Yarra-Ranges/Events'),
((select id from resorts where slug='healesville'),'Healesville Sanctuary What''s On','https://zoo.org.au/healesville/whats-on'),
((select id from resorts where slug='healesville'),'Wine Yarra Valley','https://wineyarravalley.com.au'),
((select id from resorts where slug='cobram'),'Moira Shire events','https://moira.vic.gov.au/Community/Events-in-Moira-Shire'),
((select id from resorts where slug='cobram'),'Visit the Murray - Central','https://visitthemurray.com.au/places-to-go/central'),
((select id from resorts where slug='cobram'),'Cobram Barooga Business & Tourism','https://cobrambaroogabt.com'),
((select id from resorts where slug='royal-pines-gold-coast'),'Experience Gold Coast events','https://experiencegoldcoast.com/events'),
((select id from resorts where slug='royal-pines-gold-coast'),'City of Gold Coast Things to do','https://goldcoast.qld.gov.au/Things-to-do'),
((select id from resorts where slug='royal-pines-gold-coast'),'HOTA What''s On','https://hota.com.au/whats-on'),
((select id from resorts where slug='royal-pines-gold-coast'),'Miami Marketta','https://miamimarketta.com'),
((select id from resorts where slug='noosa'),'Visit Noosa What''s On','https://visitnoosa.com.au/whats-on'),
((select id from resorts where slug='noosa'),'Noosa Council events','https://noosa.qld.gov.au/Community/Events'),
((select id from resorts where slug='noosa'),'Visit Sunshine Coast','https://visitsunshinecoast.com'),
((select id from resorts where slug='noosa'),'Parks QLD - Noosa','https://parks.qld.gov.au/parks/noosa'),
((select id from resorts where slug='hobart'),'Hobart City upcoming events','https://hobartcity.com.au/Things-To-Do/Upcoming-events'),
((select id from resorts where slug='hobart'),'Hobart and Beyond events','https://hobartandbeyond.com.au/events'),
((select id from resorts where slug='hobart'),'Discover Tasmania festivals & events','https://discovertasmania.com.au/things-to-do/festivals-and-events'),
((select id from resorts where slug='hobart'),'MONA','https://mona.net.au'),
((select id from resorts where slug='city-club-melbourne'),'What''s On Melbourne','https://whatson.melbourne.vic.gov.au'),
((select id from resorts where slug='city-club-melbourne'),'Visit Melbourne','https://visitmelbourne.com'),
((select id from resorts where slug='city-club-melbourne'),'NGV What''s On','https://ngv.vic.gov.au/whats-on'),
((select id from resorts where slug='city-club-melbourne'),'Broadsheet Melbourne','https://broadsheet.com.au/melbourne'),
(null,'RACV Member Benefits - Attractions & Experiences','https://benefits.racv.com.au/category/attractions-experiences'),
(null,'Parks Victoria','https://parks.vic.gov.au'),
(null,'Visit Victoria','https://visitvictoria.com'),
(null,'Eventfinda','https://eventfinda.com.au/whatson/events'),
(null,'The Music gig guide','https://themusic.com.au/gigs');

-- ----------------------------------------------------------------------------
-- EVENTS  (real recurring/dated events falling inside 2026-06-22 .. 2026-07-06)
-- ----------------------------------------------------------------------------
insert into events (resort_id, name, start_date, end_date, event_time, location, category, environment, source_url, description) values
-- Torquay
((select id from resorts where slug='torquay'),'Torquay Farmers Market','2026-06-27',null,'8:30am-1pm','Surf Coast Shire offices car park, Torquay','market','outdoor','https://surfcoast.vic.gov.au','Weekly Saturday farmers market, year-round.'),
((select id from resorts where slug='torquay'),'Torquay parkrun','2026-06-27','2026-07-04','8am','Fisherman''s Beach, The Esplanade','sport','outdoor','https://surfcoastevents.com.au','Free timed 5km every Saturday; visitors welcome.'),
((select id from resorts where slug='torquay'),'Torquay Farmers Market','2026-07-04',null,'8:30am-1pm','Surf Coast Shire offices car park, Torquay','market','outdoor','https://surfcoast.vic.gov.au','Weekly Saturday farmers market, year-round.'),
-- Cape Schanck
((select id from resorts where slug='cape-schanck'),'Mornington Main Street Market','2026-06-24','2026-07-01','9am-3pm','Main Street, Mornington','market','outdoor','https://visitmorningtonpeninsula.org/whats-on','Victoria''s longest-running weekly street market, every Wednesday.'),
((select id from resorts where slug='cape-schanck'),'Rosebud parkrun','2026-06-27','2026-07-04','8am','Bay Trail, Rosebud','sport','outdoor','https://mornpen.vic.gov.au/Activities/Whats-On','Free 5km on the Bay Trail every Saturday.'),
-- Inverloch
((select id from resorts where slug='inverloch'),'Phillip Island Penguin Parade','2026-06-22','2026-07-06','~6pm (winter)','Phillip Island Nature Parks','nature','outdoor','https://penguins.org.au','Little penguins return to shore at dusk every night of the year; book ahead.'),
((select id from resorts where slug='inverloch'),'Inverloch parkrun','2026-06-27','2026-07-04','8am','Rotary Centenary Park, Ramsey Blvd','sport','outdoor','https://visitbasscoast.com.au/events','Free 5km every Saturday; visitors welcome.'),
((select id from resorts where slug='inverloch'),'Inverloch Community Farmers'' Market','2026-06-28',null,'9am-1pm','The Glade foreshore, Inverloch','market','outdoor','https://visitbasscoast.com.au/events','Last-Sunday-of-the-month foreshore market.'),
-- Goldfields / Creswick
((select id from resorts where slug='goldfields'),'Sovereign Hill Winter Wonderlights','2026-06-26','2026-07-19','Evenings','Sovereign Hill, Ballarat','festival','outdoor','https://visitballarat.com.au/whats-on','Winter light and projection festival across the historic township during the school holidays.'),
((select id from resorts where slug='goldfields'),'Daylesford Sunday Market','2026-06-28','2026-07-05','8am-3pm','Daylesford Railway Station','market','outdoor','https://daylesfordmacedonlife.com.au','Every Sunday at the railway station; pair with a heritage train ride.'),
((select id from resorts where slug='goldfields'),'Ballarat Farmers Market','2026-06-27',null,'9am-1pm','North Gardens Reserve, Lake Wendouree','market','outdoor','https://visitballarat.com.au/whats-on','2nd and 4th Saturday farmers market.'),
((select id from resorts where slug='goldfields'),'Calembeen parkrun','2026-06-27','2026-07-04','8am','Calembeen Park, Creswick','sport','outdoor','https://visitballarat.com.au/whats-on','Free 5km every Saturday, five minutes from the resort.'),
-- Healesville
((select id from resorts where slug='healesville'),'Spirits of the Sky bird show','2026-06-22','2026-07-06','12pm & 3pm','Healesville Sanctuary','nature','outdoor','https://zoo.org.au/healesville/whats-on','Daily free-flight bird presentation (weather dependent).'),
((select id from resorts where slug='healesville'),'Healesville Organic Market','2026-06-27','2026-07-04','8am-1pm','Coronation Park, River Street','market','outdoor','https://visityarravalley.com.au/events','Every Saturday; larger market nearest the full moon.'),
((select id from resorts where slug='healesville'),'Yarrawood Estate live music','2026-06-27','2026-06-28','Afternoons','Yarrawood Estate, Yarra Valley','music','covered','https://wineyarravalley.com.au','Live music at the cellar door every Saturday and Sunday.'),
-- Cobram
((select id from resorts where slug='cobram'),'Cobram parkrun','2026-06-27','2026-07-04','8am','Thompsons Beach, Rockarama Rd','sport','outdoor','https://moira.vic.gov.au/Community/Events-in-Moira-Shire','Free 5km every Saturday, minutes from the resort.'),
((select id from resorts where slug='cobram'),'Cobram Lions Log Cabin Community Market','2026-06-27',null,'8am-1pm','Federation Park, 66 Punt Rd','market','outdoor','https://moira.vic.gov.au/Community/Events-in-Moira-Shire','Last-Saturday-of-the-month community market.'),
-- Royal Pines / Gold Coast
((select id from resorts where slug='royal-pines-gold-coast'),'HOTA Farmers & Artisan Markets','2026-06-28','2026-07-05','6-11:30am','HOTA precinct, Bundall','market','outdoor','https://hota.com.au/whats-on','Sunday market beside the free gallery, closest to the resort.'),
((select id from resorts where slug='royal-pines-gold-coast'),'Miami Marketta','2026-06-24','2026-06-27','From 5pm','Miami, Gold Coast','food_wine','covered','https://miamimarketta.com','Street food and live music, Wednesday to Saturday evenings.'),
((select id from resorts where slug='royal-pines-gold-coast'),'Carrara Markets','2026-06-27','2026-06-28','8am-3pm','Carrara, Gold Coast','market','covered','https://experiencegoldcoast.com/events','Australia''s biggest permanent weekend market, Saturday and Sunday.'),
((select id from resorts where slug='royal-pines-gold-coast'),'Currumbin wild lorikeet feeding','2026-06-22','2026-07-06','8am','Currumbin Wildlife Sanctuary','nature','outdoor','https://experiencegoldcoast.com/events','Free daily wild lorikeet feeding outside the sanctuary.'),
-- Noosa
((select id from resorts where slug='noosa'),'Noosa Farmers Market','2026-06-28','2026-07-05','Until noon','Noosa AFL Grounds, Weyba Rd, Noosaville','market','outdoor','https://visitnoosa.com.au/whats-on','Every Sunday morning; go early.'),
((select id from resorts where slug='noosa'),'The Original Eumundi Markets','2026-06-24','2026-06-27','7:30am-2pm','Eumundi','market','covered','https://visitnoosa.com.au/whats-on','One of Australia''s great artisan markets, every Wednesday and Saturday.'),
((select id from resorts where slug='noosa'),'Noosa parkrun','2026-06-27','2026-07-04','7am','Noosaville State School car park, Beckmans Rd','sport','outdoor','https://visitnoosa.com.au/whats-on','Free 5km every Saturday on the Lake Doonella course.'),
-- Hobart
((select id from resorts where slug='hobart'),'Dark Mofo (closing day)','2026-06-22',null,'Evening','Various, Hobart','festival','outdoor','https://discovertasmania.com.au/things-to-do/festivals-and-events','Final day of MONA''s famous winter festival (11-22 June 2026).'),
((select id from resorts where slug='hobart'),'Salamanca Market','2026-06-27','2026-07-04','8:30am-3pm','Salamanca Place, Hobart','market','outdoor','https://hobartcity.com.au/Things-To-Do/Upcoming-events','300-stall Saturday market, 10 minutes from the hotel.'),
((select id from resorts where slug='hobart'),'Farm Gate Market','2026-06-28','2026-07-05','8:30am-1pm','Bathurst Street, Hobart','market','outdoor','https://hobartcity.com.au/Things-To-Do/Upcoming-events','Sunday produce market where locals shop, 6 minutes'' walk.'),
-- City Club Melbourne
((select id from resorts where slug='city-club-melbourne'),'NGV Friday Nights (Winter Masterpieces)','2026-06-26','2026-07-03','Evening','NGV International, St Kilda Rd','culture','indoor','https://ngv.vic.gov.au/whats-on','After-hours galleries and live music on Friday evenings during the Winter Masterpieces show.'),
((select id from resorts where slug='city-club-melbourne'),'QVM Winter Night Market','2026-06-24','2026-07-01','5-10pm','Queen Victoria Market','market','covered','https://whatson.melbourne.vic.gov.au','Wednesday-night winter market with food, fire and live music; free entry.'),
((select id from resorts where slug='city-club-melbourne'),'Queen Victoria Market','2026-06-23','2026-07-05','From 6am','Queen Victoria Market','market','covered','https://visitmelbourne.com','Open Tue, Thu, Fri, Sat and Sun (closed Mon & Wed).');

-- ----------------------------------------------------------------------------
-- MEMBERS  (dummy; sensitive fields populated to model a realistic record)
-- ----------------------------------------------------------------------------
insert into members (member_number, surname, first_name, email, phone, member_id_number, preferences) values
('100201','Whitman','Eleanor','eleanor.whitman@example.com','0412 555 201','VIC-44820193','{"vibe":"Relax & recharge","interest":"Spa & wellness"}'),
('100202','Nguyen','David','david.nguyen@example.com','0412 555 202','VIC-44820194','{}'),
('100203','Okafor','Amara','amara.okafor@example.com','0412 555 203','VIC-44820195','{"dietary":"Vegetarian/vegan"}'),
('100204','Patel','Rohan','rohan.patel@example.com','0412 555 204','VIC-44820196','{}'),
('100205','Brennan','Siobhan','siobhan.brennan@example.com','0412 555 205','VIC-44820197','{"pace":"Easy & unscheduled"}'),
('100206','Kowalski','Marek','marek.kowalski@example.com','0412 555 206','VIC-44820198','{}'),
('100207','Fitzgerald','Grace','grace.fitzgerald@example.com','0412 555 207','VIC-44820199','{"vibe":"Food & wine"}'),
('100208','Tanaka','Yuki','yuki.tanaka@example.com','0412 555 208','VIC-44820200','{}'),
('100209','Marchetti','Luca','luca.marchetti@example.com','0412 555 209','VIC-44820201','{}'),
('100210','Robinson','Hannah','hannah.robinson@example.com','0412 555 210','VIC-44820202','{"interest":"Water/beach"}'),
('100211','Singh','Priya','priya.singh@example.com','0412 555 211','VIC-44820203','{}'),
('100212','O''Sullivan','Liam','liam.osullivan@example.com','0412 555 212','VIC-44820204','{}'),
('100213','Chen','Wei','wei.chen@example.com','0412 555 213','VIC-44820205','{}'),
('100214','Andersson','Freya','freya.andersson@example.com','0412 555 214','VIC-44820206','{"vibe":"Romance"}'),
('100215','Mwangi','Daniel','daniel.mwangi@example.com','0412 555 215','VIC-44820207','{}');

-- ----------------------------------------------------------------------------
-- BOOKINGS  (all within 2026-06-22 .. 2026-07-06; multiple per resort; edge cases)
-- ----------------------------------------------------------------------------
insert into bookings (member_id, resort_id, confirmation_code, check_in, check_out, room_type, party_size, party_composition, add_ons, other_guest_names, status) values
-- Torquay (x2)
((select id from members where member_number='100201'),(select id from resorts where slug='torquay'),'RACV-TQ-3001','2026-06-25','2026-06-28','Suite',2,'couple','{"One Spa package"}','{}','confirmed'),
((select id from members where member_number='100204'),(select id from resorts where slug='torquay'),'RACV-TQ-3002','2026-07-02','2026-07-05','Family Room',5,'family','{}','{"Anita Patel","Dev Patel","Mira Patel"}','confirmed'),
-- Cape Schanck (x2)
((select id from members where member_number='100214'),(select id from resorts where slug='cape-schanck'),'RACV-CS-3003','2026-06-26','2026-06-29','Deluxe Room',2,'couple','{"Fine dining at Cape"}','{}','confirmed'),
((select id from members where member_number='100207'),(select id from resorts where slug='cape-schanck'),'RACV-CS-3004','2026-07-01','2026-07-04','Three Bedroom Golf Villa',6,'friends','{}','{"Tom Reilly","Jess Reilly","Sam Ford","Kate Ford"}','confirmed'),
-- Inverloch (x2; one MISSING party_size edge case)
((select id from members where member_number='100210'),(select id from resorts where slug='inverloch'),'RACV-IN-3005','2026-06-27','2026-06-30','Premium Ocean View Room',2,'couple','{}','{}','confirmed'),
((select id from members where member_number='100205'),(select id from resorts where slug='inverloch'),'RACV-IN-3006','2026-07-03','2026-07-06','Premium Villa',null,'family','{}','{}','confirmed'),
-- Goldfields (x2)
((select id from members where member_number='100209'),(select id from resorts where slug='goldfields'),'RACV-GF-3007','2026-06-24','2026-06-27','Fairway Room',2,'friends','{"Golf round"}','{"Marco Bianchi"}','confirmed'),
((select id from members where member_number='100211'),(select id from resorts where slug='goldfields'),'RACV-GF-3008','2026-07-02','2026-07-05','Deluxe Family Suite',4,'family','{}','{"Arjun Singh","Maya Singh"}','confirmed'),
-- Healesville (x2; one MISSING check-out edge case)
((select id from members where member_number='100203'),(select id from resorts where slug='healesville'),'RACV-HV-3009','2026-06-26','2026-06-29','Premium Mountain View Room',2,'couple','{"One Spa treatment"}','{}','confirmed'),
((select id from members where member_number='100206'),(select id from resorts where slug='healesville'),'RACV-HV-3010','2026-07-04',null,'Golf View Room',2,'couple','{}','{}','confirmed'),
-- Cobram (x1)
((select id from members where member_number='100212'),(select id from resorts where slug='cobram'),'RACV-CO-3011','2026-06-29','2026-07-03','Two Bedroom Apartment',6,'family','{}','{"Niamh O''Sullivan","Sean O''Sullivan","Erin O''Sullivan","Cara O''Sullivan"}','confirmed'),
-- Royal Pines (x2)
((select id from members where member_number='100208'),(select id from resorts where slug='royal-pines-gold-coast'),'RACV-RP-3012','2026-06-25','2026-06-29','Executive Spa Suite',2,'couple','{"One Spa package"}','{}','confirmed'),
((select id from members where member_number='100213'),(select id from resorts where slug='royal-pines-gold-coast'),'RACV-RP-3013','2026-07-01','2026-07-05','Two Bedroom Suite',4,'family','{}','{"Lin Chen","Bo Chen"}','confirmed'),
-- Noosa (x2)
((select id from members where member_number='100202'),(select id from resorts where slug='noosa'),'RACV-NO-3014','2026-06-23','2026-06-27','Two-bedroom Apartment',4,'family','{}','{"Linh Nguyen","Kim Nguyen"}','confirmed'),
((select id from members where member_number='100215'),(select id from resorts where slug='noosa'),'RACV-NO-3015','2026-07-02','2026-07-06','Three-bedroom Villa',8,'friends','{}','{"Grace Mwangi","Peter Otieno","Ruth Otieno"}','confirmed'),
-- Hobart (x1) + City Club Melbourne (x1)
((select id from members where member_number='100214'),(select id from resorts where slug='hobart'),'RACV-HB-3016','2026-06-22','2026-06-25','Harbour View Suite',2,'couple','{}','{}','confirmed');
