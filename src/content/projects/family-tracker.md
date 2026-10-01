---
title: "Family Tracker"
code: "FT-01"
stack: ["Go", "PostgreSQL", "React", "React Native/Expo", "WebSockets", "Fly.io"]
summary: "Multi-tenant household coordination app with live WebSocket sync across web and mobile. Every client applies the same idempotent event fold, so clients converge cleanly on reconnect. Features are registered as data rather than code paths, so new modules need no schema change, and fingerprint-pinned over-the-air updates through EAS can't reach an incompatible native build."
featured: true
order: 3
---
