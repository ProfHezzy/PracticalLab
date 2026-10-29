# MVP performance test profile

**Status:** Test envelope defined. No real-device or throttled-network benchmark has been recorded in M0.

## Test profile

- Viewport: 360 CSS pixels wide, then tablet/desktop smoke checks.
- Network: cold-load test with browser cache and service worker bypassed; throttle to a reproducible low-end 3G profile in the selected browser test tool. Record downlink, uplink, round-trip latency and tool/version with every result rather than treating “3G” as a fixed measurement.
- Devices: one representative low-end and one mid-range Android device chosen and recorded by the team before the first user pilot. Do not infer a device from desktop emulation.
- Pages: public landing shell first, then content/topic and each on-demand simulation as they are implemented.
- Cache: report cold and warm results separately. The PWA shell may cache only public static assets; private pages and API responses must not enter caches.

## Launch budgets

- Critical homepage assets <=300 KB compressed; initial interaction in under five seconds on the agreed cold network profile.
- Each independently loaded simulation bundle <=1.5 MB.
- Lottie assets <50 KB each; individual sound effects <30 KB.
- Motion targets transform/opacity and should sustain a smooth frame rate on the selected low-end Android device.
- Measure browser navigation timing, JavaScript/CSS transfer, interaction readiness, long tasks, frame rate, memory and API timings. Record tool/device versions, cache state and exact test conditions.

M0 verifies that both Next.js apps produce optimized builds and the PWA shell has no horizontal overflow at 360 px in the integrated browser. Those checks are not a substitute for the cold 3G and physical-device budgets above; complete and record those before launch hardening.
