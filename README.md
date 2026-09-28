# LeaseFlow — ASC 842 demonstration

An interview portfolio prototype for Sorabh Gupta. All contract data and GL balances are fictional.

## Implemented

- Local, text-based PDF extraction using bundled Mozilla PDF.js (Apache-2.0).
- Exact-label template extraction of eight fields with page references.
- Reviewable assumptions and a session-only approval gate.
- Deterministic operating lease and bounded finance lease schedules.
- Commencement and monthly journal proposals, including two AP posting routes.
- Balance-level GL reconciliation with an omitted AP reclassification scenario.
- CSV exports and a printable four-minute presentation guide.

No live language model, OCR service, general-purpose contract interpretation, real ERP posting, durable approval or regulatory assurance is provided. A Microsoft architecture is described as the future production design, not the implementation of this site.

## Architecture

Static HTML/CSS and browser ES modules. No server, database, user uploads, analytics or external runtime script requests. Input state is held in memory and resets on refresh. PDF.js and its worker are bundled in `dist/vendor` with their license. Documents never leave the browser.

The source of truth for calculations is `dist/engine.mjs`. The UI uses the same engine for schedules, exports and journal proposals. Calculations use full precision, contractual cash rounds to cents, and journal movements reconcile rounded balance endpoints. Current liability uses the next twelve months' principal reduction, floored at zero. No modification accounting, foreign exchange or local-GAAP conversion is implemented.

## Default sample

36 months from 2026-01-01, INR 100,000 base rent, first three months rent-free, 5% compound annual escalation, monthly arrears, 8% nominal annual rate compounded monthly, INR 60,000 incentive received at commencement, INR 12,000 qualifying initial direct costs, no prepayment.

- Initial liability: INR 3,048,673.29
- Initial ROU: INR 3,000,673.29
- Monthly operating expense: INR 95,416.67
- Total scheduled rent: INR 3,483,000

## Run locally

No build or package installation is required to run the application.

```sh
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000. Use an HTTP server; opening index.html directly as a file will prevent module/PDF loading in some browsers.

## Deploy to Vercel

1. Upload the contents of this project to `Sorabh-Gupta-Finance/leaseflow-asc842` on GitHub. Keep `dist` as a folder.
2. In Vercel, add a new project and import that repository.
3. Use the repository root as Root Directory and Other as the framework preset.
4. The included `vercel.json` sets the output directory to `dist` and skips build/install commands. No environment variables are needed.
5. Deploy, then test the live page using the checklist below.

Configuration reference: https://vercel.com/docs/project-configuration/vercel-json

This package is prepared for deployment; it does not establish that a GitHub upload or Vercel deployment has succeeded.

## Verification

Run `node verify.mjs` with Node.js 22 or later. The dependency-free accounting checks cover closed-form PV, rent-free periods, annual escalation, zero-rate behavior, roll-forwards, end-of-term balances, current classification, both AP journal routes, initial entries, invalid inputs and CSV formula safety. Seven scenarios exercise 554 monthly journal checks.

The optional PDF integration test requires a canvas package for Node's PDF.js environment:

```sh
npm install --no-save --package-lock=false @napi-rs/canvas
node verify-pdf.mjs
```

This reads the bundled two-page PDF and checks all eight extracted fields and page evidence. The browser application itself needs no installed packages. `PDF_TEST_CANVAS_MODULE` may point to an existing canvas module for the integration test.

### Live deployment checklist

- Open the home page on desktop and mobile.
- Download the fictional sample PDF and upload it through the extraction flow.
- Check eight fields and their page references, then review the accounting assumptions.
- Confirm initial liability INR 3,048,673.29 and initial ROU INR 3,000,673.29.
- Review schedules, both journal routes and the seeded reconciliation exception.
- Export CSVs and open the printable case study.

Automated accounting and PDF checks do not replace browser interaction checks or an independent accounting review. WebMCP is an optional, feature-detected integration; it has not been validated in a supported browser.

`generate_sample.py` optionally regenerates the PDF using Python ReportLab and DejaVu Sans fonts under `/usr/share/fonts/truetype/dejavu`. The ready-to-use PDF is already included; regeneration is unnecessary for deployment.

## Roadmap

- Live AI extraction with source evidence and mandatory reviewer confirmation.
- Documented five-criteria classification assessment and supported IBR rationale.
- Current/noncurrent reclassification journals and matching GL reconciliation.
- A dedicated finance lease example, followed by a modification scenario.
- Reporting-date disclosures and a maturity-to-liability bridge.

These are planned enhancements, not implemented capabilities.

## Future production work

Use an approved document/AI service for arbitrary contracts, retain source/version evidence in a governed register, implement real role-based approval, validate the accounting engine independently, integrate with ERP controls and reconcile transaction-level GL/AP data. Measure real baseline and pilot time before making productivity claims.
