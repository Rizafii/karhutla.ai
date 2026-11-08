# Deployment Karhutla Fostifest

URL: https://karhutla-fostifest.rizafi.my.id
Checkout: /srv/docker/apps/karhutla-fostifest
Source: git@github.com:Rizafii/karhutla.ai.git, commit 4aac4773c726b9ca6ba36f8e676dc80ea324ab19.

Production changes stay local: isolated Compose project app-karhutla-fostifest, private Postgres network, shared Caddy proxy network, configured host/origin allowlists, random credentials in .env (0600), bounded build workers, Next.js 16.4.5 security patch. No changes pushed upstream.

Runtime limits: Postgres 1 CPU/1.5 GiB, backend 2 CPU/1.5 GiB, vision 8 CPU/4 GiB, frontend 1 CPU/1 GiB. One backend and one vision worker only. No host ports. Internal API is blocked by Caddy. Demo controls remain publicly accessible as implemented by the project; all drone/team operations are simulated.

Commands:

```bash
cd /srv/docker/apps/karhutla-fostifest
docker compose ps
docker compose logs --tail 100
COMPOSE_PARALLEL_LIMIT=1 BUILDX_BUILDER=karhutla-builder docker compose build
docker compose up -d --no-build --wait --wait-timeout 180
```

Caddy site: /srv/docker/infra/caddy/sites/karhutla-fostifest.caddy. Validate before graceful reload:

```bash
docker exec server-caddy-caddy-1 caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
docker exec server-caddy-caddy-1 caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile --address 127.0.0.1:2019
```

Credentials, database volume app-karhutla-fostifest_postgres_data, and data/ are separate from every other service. Videos/model are checksum verified against assets/manifest.json. Old Karhutla is removed without a data backup per owner instruction. No scheduled backup or auto deployment was added.

Verification 2026-11-08: 40 API tests, 13 vision tests, 16 frontend tests passed; typecheck and production build passed; npm production audit reports zero vulnerabilities. Real AI automatic-recon smoke passed in 51.67 s with 35 WebSocket telemetry messages and valid JPEG evidence. Public HTTPS, WebSocket, MJPEG, byte-range footage, host/origin restrictions and blocked internal endpoints verified. Demo reset after testing. All 22 previously running containers retained their IDs, start times and restart counts. Browser visual interaction was not tested.

Simulation defaults to 1x in application settings, model and .env.example. Production .env and persisted demo speed are set to 1x as well. Existing database speeds are updated through /api/demo/control, without resetting demo data.

1x update validation: backend rebuilt, 40 API tests passed with seeded default speed asserted as 1. Lifecycle tests advance sufficient simulation time for 1x. Only backend is recreated for deployment; frontend and database remain running.
