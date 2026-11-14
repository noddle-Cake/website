---
title: "Fudi Eats — Local Food Marketplace"
code: "FE-01"
stack: ["Flutter", "Dart", "Rust", "Axum", "PostgreSQL", "PostGIS", "Stripe Connect", "Firebase", "Astro"]
summary: "A marketplace for the home cooks, bakers and cottage-food sellers already feeding their neighborhoods through Instagram stories and WhatsApp groups. One **Flutter app for iPhone and Android** in buyer and seller modes, in **English and Spanish**: buyers browse what's being made nearby, pay in the app and **show a pickup code** that the seller scans; sellers list food with photos, prices and pickup times, see their **exact payout before publishing**, work from one order queue, and are paid through Stripe Connect. A Rust (Axum) API holds every business rule, from nearby search and checkout to **10-minute item holds** and ratings, on PostgreSQL with PostGIS, which also **blurs each seller's location by 250–500 m** for buyers. Deploys roll back automatically if the API's readiness check fails, the database is backed up nightly with encryption, and the backend is covered by **256 tests**."
demo: "https://fudieats.app"
tagline: "Order **home-made food from your neighbors** and pick it up nearby, in a **Flutter app for iPhone and Android**."
featured: true
order: 4
---
