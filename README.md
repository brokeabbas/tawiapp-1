# TAWI Field Operations Portal

A responsive operational frontend for field agents and location managers working across the TAWI agricultural network.

**Live interface:** [tawiapp-1.vercel.app](https://tawiapp-1.vercel.app)

**Programme website:** [fics.com.ng](https://fics.com.ng)

## Core workflows

- Agent dashboards and assignment tracking
- Linked-location views and operational context
- Farm registration and capture workflows
- Location-manager dashboards
- Captured-farm and agent directory views
- Map-based farm and location exploration
- Responsive layouts for field and mobile use

## Stack

React 19, TypeScript, React Router, Axios, MapLibre, React Map GL, Framer Motion, Tailwind CSS and Vite.

## Run locally

```bash
cp .env.example .env
npm ci
npm run dev
```

Create a production build with `npm run build`.

## Configuration

Set `VITE_API_BASE_URL` to the relevant TAWI API endpoint. Protected production services and operational records are not included in this public repository.

## Authorship

Designed and built independently by Yakubu Abbas Yakubu as part of the wider TAWI/FICS platform.
