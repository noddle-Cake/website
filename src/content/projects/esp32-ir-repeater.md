---
title: "IR Signal Repeater — ESP32"
code: "IR-01"
stack: ["Rust", "esp-idf-hal", "RMT Peripheral", "Asterisk/PJSIP", "RHEL 9"]
summary: "Programmable IR repeater firmware in Rust that uses the RMT peripheral to store multiple signals and replay any of them on a trigger. Debugged with a logic analyzer down to the signal level, through RMT buffer sizing, carrier setup, the driver-transistor circuit and strapping-pin conflicts. Traced a Wi-Fi auth failure on two ESP32-C3 boards to a chip-specific RF issue and moved the design to the ESP32-S3. A self-hosted Asterisk server maps dialed phone extensions to trigger functions."
github: ""
featured: true
order: 4
---
