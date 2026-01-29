# Rudraram Survey - Technical Handover Guide

## Project Overview
A production-grade geospatial and analytics platform for water infrastructure monitoring.

## Architecture
- **Frontend**: React (TypeScript) + Vite
  - State: Context API
  - UI: Vanilla CSS + Lucide Icons + Framer Motion
  - Maps: Leaflet + Deck.gl + Mapbox
  - Performance: Virtualized tables (react-window), Code splitting
- **Backend**: FastAPI (Python)
  - Security: JWT-based RBAC, CORS, GZip Compression
  - Caching: In-memory cache for Supabase responses
  - Storage: Supabase JS SDK + Supabase Buckets
- **Database**: Supabase (PostgreSQL)
  - Schemas: `borewells`, `sumps`, `overhead_tanks`, `sync_history`, `device_images`

## Key Implementation Highlights
- **PWA Support**: Offline map tile caching and data persistence.
- **Sync Pipeline**: Hybrid engine supporting both GitHub-Excel live sync and Supabase persistence.
- **Rich Media**: High-performance image gallery with client-side compression (HD/Thumbnails).
- **Virtualization**: Highly responsive Data Center view handling 10k+ rows.

## Deployment
- **Platform**: Render.com (Unified Blueprint)
- **CI/CD**: GitHub Actions for automated GH-Pages builds.
- **Environment Variables**: Managed via `.env.production` (See `env_manifest.yaml` for full mapping).

## Maintenance
- **Database Scaling**: Recommended PostGIS integration for >50k units.
- **Sync Frequency**: Excel sync is limited by GitHub raw URL caching (approx. 5-10 mins).
- **Storage**: Monitor bucket limits for high-resolution photo uploads.

## Contact & Credits
Version: 1.0.0
Status: Production Ready
Author: Antigravity AI
