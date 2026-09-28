# LeaseFlow — ASC 842 demonstration

An interview portfolio prototype for Sorabh Gupta. All contract data and GL balances are fictional.

## Implemented

- Local, text-based PDF extraction using bundled Mozilla PDF.js (Apache-2.0).
- Exact-label template extraction of eight fields with page references.
- Reviewable assumptions and a session-only approval gate.
- Deterministic operating lease and bounded finance lease schedules.
- Full month-by-month PV working (discount factor and present value per payment), reconciled to the initial liability.
- A single office lease shown under three lessee frameworks — US GAAP (ASC 842), IFRS 16 and Ind AS 116 — toggled on the schedules screen. Framework choice drives the expense pattern only; the liability schedule is identical across all three, since none of them changes how the liability is measured.
- An illustrative ASC 842 five-criteria classification test (ASC 842-10-25-2) with editable facts and policy thresholds, reframed to show that IFRS 16 and Ind AS 116 have no equivalent lessee classification.
- A collapsed-by-default incremental borrowing rate build-up (reference rate + credit spread + adjustment), framed around the discount-rate principle common to all three frameworks.
- Commencement and monthly journal proposals, including two AP posting routes, reflecting whichever framework is selected.
- Monthly current/noncurrent reclassification entries, posted between dedicated subledger accounts and tied out in the GL reconciliation.
- Balance-level GL reconciliation with an omitted AP reclassification scenario.
- CSV exports and a printable four-minute presentation guide.

No live language model, OCR service, general-purpose contract interpretation, real ERP posting, durable approval or regulatory assurance is provided. Classification facts and the IBR build-up are entered illustratively, not derived from the lease document or market data. Ind AS 116 is presented as converged with IFRS 16 for recognition and measurement; disclosure and transition differences between the two are out of scope. A Microsoft architecture is described as the future production design, not the implementation of this site.

## Architecture

Static HTML/CSS and browser ES modules. No server, database, user uploads, analytics or external runtime script requests. Input state is held in memory and resets on refresh. PDF.js and its worker are bundled in `dist/vendor` with their license. Documents never leave the browser.

The source of truth for calculations is `dist/engine.mjs`. The UI uses the same engine for schedules, exports and journal proposals. Calculations use full precision, contractual cash rounds to cents, and journal movements reconcile rounded balance endpoints. Current liability uses the next twelve months' principal reduction, floored at zero. No modification accounting, foreign exchange or local-GAAP conversion is implemented.

## Default sample

36 months from 2026-01-01, INR 100,000 base rent, first three months rent-free, 5% compound annual escalation, monthly arrears, 8% nominal annual rate compounded monthly, INR 60,000 incentive received at commencement, INR 12,000 qualifying initial direct costs, no prepayment.

- Initial liability: INR 3,048,673.29 (identical under all three frameworks — measurement of the liability itself does not vary by framework)
- Initial ROU: INR 3,000,673.29 (also framework-invariant)
- Monthly expense, US GAAP operating lease: INR 95,416.67 straight-line
- Monthly ROU amortization, US GAAP finance lease / IFRS 16 / Ind AS 116: INR 83,352.04, plus separately accreted interest
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

Run `node verify.mjs` with Node.js 22 or later. The dependency-free accounting checks cover closed-form PV, rent-free periods, annual escalation, zero-rate behavior, roll-forwards, end-of-term balances, current classification, both AP journal routes, initial entries, invalid inputs, CSV formula safety, the five-criteria classification test and the IBR build-up. Seven scenarios exercise 554 monthly journal checks. The framework toggle itself needs no separate engine tests — it reuses the same finance-lease calculation path already covered by the `type:'finance'` scenario, applied to the same lease.

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
- Expand the PV working panel and confirm the 36-month total ties to the initial liability.
- Switch the framework toggle between US GAAP, IFRS 16 and Ind AS 116; confirm the liability schedule is unchanged and only the expense pattern switches.
- On the review screen, edit a classification fact (e.g. ownership transfer) and confirm the test flips to finance lease; expand the IBR build-up and apply a computed rate.
- Review schedules, both journal routes, the current/noncurrent reclassification entry and the seeded reconciliation exception.
- Export CSVs and open the printable case study.
- Confirm the "View source on GitHub" link in the sidebar and on the case study page.

Automated accounting and PDF checks do not replace browser interaction checks or an independent accounting review. WebMCP is an optional, feature-detected integration; it has not been validated in a supported browser.

`generate_sample.py` optionally regenerates the PDF using Python ReportLab and DejaVu Sans fonts under `/usr/share/fonts/truetype/dejavu`. The ready-to-use PDF is already included; regeneration is unnecessary for deployment.

## Roadmap

- Live AI extraction with source evidence and mandatory reviewer confirmation.
- Reporting-date disclosures beyond the annual maturity table (weighted-average term and rate, lease cost components), per framework.
- A modification scenario.
- Ind AS 116-specific disclosure and transition differences, once independently verified.

These are planned enhancements, not implemented capabilities.

## Future production work

Use an approved document/AI service for arbitrary contracts, retain source/version evidence in a governed register, implement real role-based approval, validate the accounting engine independently, integrate with ERP controls and reconcile transaction-level GL/AP data. Measure real baseline and pilot time before making productivity claims.
