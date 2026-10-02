# Smart Water Services Design & Learning System

React/TypeScript application for preliminary institutional water-services design, starting with Kilinochchi training centres. The app includes a 15-step workflow, a separate pipework page, learning/professional modes, local projects and JSON/PDF/XLSX/DOCX export.

## Run and validate

```sh
npm ci
npm run dev
npm run typecheck
npm run lint
npm test
npm run test:exports
npm run build
```

Export checks write temporary verification files under `../work/export-checks`. No backend or API key is needed. Browser projects remain on the current browser/origin; export JSON for portable backups.

## Engineering basis

- Daily domestic demand uses either occupancy-group allowances, a uniform per-person rate, or detailed end uses. These are alternative estimates; occupancy demand is never added to domestic demand a second time. Special-use allowances must be additional to the selected domestic scope.
- Daily factors are editable assumptions. Demand is for the modeled operating day; monthly/yearly summaries currently use 30/365 identical days, not an occupancy calendar.
- Fixture schedules do not use the previous unsupported square-root conversion. Peak flow requires an external calculation, a source reference and explicit user confirmation. This is not independent certification by the software. See [BSI EN 806-3 scope](https://knowledge.bsigroup.com/products/specifications-for-installations-inside-buildings-conveying-water-for-human-consumption-pipe-sizing-simplified-method). Exact licensed tables and applicability still need verification.
- Pipework uses Hazen-Williams with SI units, an editable C factor, inlet pressure head, signed elevation rise and a user-defined velocity criterion. It models individual reaches, not a solved network. See [EPA EPANET hydraulic methods](https://www.epa.gov/water-research/epanet).
- Greywater savings are bounded by available wastewater and selected reuse demand. Rainwater is allocated to remaining eligible non-potable uses. Monthly rainfall is a distribution scaled to the entered annual rainfall, with a monthly first-flush allowance. Annual-average offset is potential, not a guarantee of seasonal supply.
- Fire storage is independently calculated from entered flow and duration; it is never derived from domestic demand.
- Full precision is retained in calculation results. Display/report helpers round values only for presentation.
- Review status never treats populated data or enabled fire-water inputs as proof of standards compliance.

## Implemented in this update

Fixed the initial calculation/checklist crash; removed duplicate domestic demand; corrected pipe velocity and friction units; removed unverified standards claims for fixture conversion; added editable demand factors, pipe inputs and bounded reuse; validated imported/stored project structure; added local-storage error feedback and persisted duplication; fixed sample population/process/cleaning values; added export error feedback, XLSX occupancy formulas/widths/filters and A4 Word headers/footers; added regression and export generation checks.

## Remaining against the master brief

This is a functional preliminary-design iteration, not final acceptance of all 72 sections. Remaining work includes a licensed/verified automated fixture method, comprehensive factor metadata/editing for every module, standards selection and independent review sign-off, full calendar-based demand and future-growth/scenario comparison, rainwater tank time-series balancing, full tank allocation handling for multiple tanks of one type, and the complete requested report structure/charts and workbook styling. DOCX/XLSX structures are tested programmatically; opening in desktop Word/Excel has not been verified. Annual-average reuse outputs require project review before design adoption.

## Validation

Twelve engineering regressions cover empty/one-user/large-campus calculations, alternative domestic methods, editable factors, peak-flow gating, SI hydraulics, no-reuse behavior, rainwater reconciliation and source balance, independent fire water, JSON migration and rejected invalid inputs. Export checks generate/reopen PDF and XLSX and generate a genuine DOCX package. Browser smoke checks cover every workflow page and report export feedback; responsive width checks cover 1920/1366 desktop, 768 tablet and 390 mobile.
