// Returns the origin where the backend API is reachable from the browser.
//
// In production the SPA and the API share a single origin (nginx proxies /api/*
// to the backend container), so the API origin is just window.location.origin —
// e.g. https://crm.axxeler.in. In local development the Vite dev server runs on
// port 3000 while the API runs on port 4000, so we swap to the API port.
//
// This is used to build OAuth redirect URIs and webhook URLs that must point at
// a publicly reachable backend address. Hardcoding ":4000" broke production
// because https://crm.axxeler.in:4000 is not exposed.
export function getServerOrigin(): string {
  const { protocol, hostname, origin } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${hostname}:4000`;
  }
  return origin;
}
