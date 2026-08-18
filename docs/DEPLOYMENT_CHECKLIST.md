# Deployment checklist

- [ ] `npm ci && npm test && npm run build` passes
- [ ] Repository Settings → Pages → Source: GitHub Actions
- [ ] Actions workflow completes and Pages URL opens
- [ ] `assets/og-image.png` loads from the deployed URL
- [ ] `manifest.webmanifest`, icons, `robots.txt`, `sitemap.xml` return 200
- [ ] Demo project loads and all 3 scenes play
- [ ] Mobile widths 320 / 375 / 430 and tablet 768 checked
- [ ] Gateway `ALLOWED_ORIGIN` matches deployed Pages/custom domain
- [ ] Provider API keys exist only as Worker Secrets
- [ ] Custom domain (if used) is verified and Enforce HTTPS is enabled
