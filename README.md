# AMR Surveys
AMR Surveys is an app to manage data input and configuration of surveys for AMR.

## User guide

### Hide elements or sections by survey
1. Based on the rules defined in datastore for each parent survey instance, apply HIDEFIELD/HIDESECTION rule for each child form.
2. refactor code in src/domain/usecases/GetSurveyUseCase.ts to break up into functions.

NOTE : datastore structure for survey rules
 ```
"rulesBySurvey": [
      {
        "surveyId": "p91asa2vebZ",
        "surveyRules": [
          {
            "formId": "mesnCzaLc7u",
            "rules": [
              {
                "id": "1",
                "toHide": [
                  "SCYImStXDHM"
                ],
                "type": "HIDEFIELD"
              },
              {
                "id": "2",
                "toHide": [
                  "mIHOCwjHtyu"
                ],
                "type": "HIDESECTION"
              }
            ]
          }
        ]
      }
    ],

```
### :video_camera: Screenshots/Screen capture

[video](https://github.com/EyeSeeTea/amr-surveys/assets/83749675/1c200566-dabf-4e43-aa9a-b40910448c93)

# Developer guide

## Setup

```
$ nvm use # uses node version in .nvmrc
$ yarn install
```

## Build

Build a production distributable DHIS2 zip file:

```
$ yarn build
```

## Development

Copy `.env` to `.env.local` and configure DHIS2 instance to use. Then start the development server:

```
$ yarn start
```

Now in your browser, go to `http://localhost:8081`.

## Tests

```
$ yarn test
```

## Smoke test

Minimum check to run after every code change, before committing or opening a PR.
It catches runtime regressions that the type-checker and unit tests do not.

1. **Type-check**: `yarn tsc --noEmit` — must pass clean.
2. **Lint**: `yarn lint` — must pass clean.
3. **Boot the dev server**: `yarn start` and wait for vite to report `ready in …`.
4. **Browse the app** at `http://localhost:8081` (a headless browser such as
   Playwright works well for automating this):
    - Log in (DHIS2 basic-auth proxy uses the credentials in `.env.local`).
    - Open the **Prevalence** module → pick a country survey → drill into a
      facility → open the patients list (Case Reports) → open one case report
      form.
    - Open the **PPS** module → pick a country survey → drill into a hospital →
      open the patients list.
    - Open **Ward Summary Statistics**.
5. **Pass criteria**: zero uncaught exceptions in the browser console
   (`error`-level messages), no `Failed to fetch` toasts, every page reaches a
   rendered state (no infinite spinners).

If any step fails, the change is not ready to commit. The smoke test does
**not** replace unit tests or manual QA against real data — it is the floor,
not the ceiling.

## Some development tips

### Clean architecture folder structure

-   `src/domain`: Domain layer of the app (entities, use cases, repository definitions)
-   `src/data`: Data of the app (repository implementations)
-   `src/webapp/pages`: Main React components.
-   `src/webapp/components`: React components.
-   `src/utils`: Misc utilities.
-   `i18n/`: Contains literal translations (gettext format)
-   `public/`: General non-React webapp resources.

## Data structures

-   `Future.ts`: Async values, similar to promises, but cancellables and with type-safe errors.
-   `Collection.ts`: Similar to Lodash, provides a wrapper over JS arrays.
-   `Obj.ts`: Similar to Lodash, provides a wrapper over JS objects.
-   `HashMap.ts`: Similar to ES6 map, but immutable.
-   `Struct.ts`: Base class for typical classes with attributes. Features: create, update.
-   `Either.ts`: Either a success value or an error.

## Docs

We use [TypeDoc](https://typedoc.org/example/):

```
$ yarn generate-docs
```

### i18n

Update i18n .po files from `i18n.t(...)` calls in the source code:

```
$ yarn localize
```

### Scripts

Check the example script, entry `"script-example"`in `package.json`->scripts and `src/scripts/example.ts`.

#### Extracting form data (`extract-forms`)

`src/scripts/extract-forms.ts` exports the Prevalence forms into a single Excel
workbook: one sheet per form, plus three sheets of its own: **Read me** (how to read the
workbook and how the sheets link, scope, counts, reconciliation, findings), **Column guide**
(every column of every sheet and where it comes from) and **Joins (technical)** (the
machine-readable join contract).
It is **read-only** — it issues GET requests only and never writes to DHIS2.

##### Credentials

Uses the **same env vars as the glass-dev scripts**, so one `.env.local` drives both.
`.env.local` is git-ignored and is *not* loaded automatically — pass `DOTENV_CONFIG_PATH`:

```
$ cp .env.template .env.local     # then fill in REACT_APP_DHIS2_BASE_URL + a token or auth
$ set DOTENV_CONFIG_PATH=.env.local          # Windows cmd
$ $env:DOTENV_CONFIG_PATH=".env.local"       # PowerShell
```

Auth precedence (see `src/scripts/common.ts`): `REACT_APP_DHIS2_TOKEN_PROD` >
`_PREPROD` > `_TRAINING` > `REACT_APP_DHIS2_TOKEN` > `REACT_APP_DHIS2_AUTH`
(`username:password`). Personal Access Tokens bypass 2FA and are preferred.

##### Usage

```
$ yarn extract-forms --country KEN --discover      # preflight: what exists, no extraction
$ yarn extract-forms --dry-run                     # resolve forms -> program UIDs only
$ yarn extract-forms --country KEN                 # one workbook for one country
$ yarn extract-forms --per-country                 # one workbook per country that has data
$ yarn extract-forms                               # everything the user can read, one workbook
$ yarn extract-forms --country KEN --start-date 2024-01-01 --end-date 2024-12-31
```

`--country` accepts an ISO3 code (`KEN`), an exact org unit name (`Kenya`), or a UID.
`--discover` reports the resolved country, forms detected (including any repeatable-stage
child sheets, with their own row/column counts — see below), record counts, min/max dates,
a full workbook forecast (worksheet count, total cells, an estimated file size range, and
warnings for unusually wide/large sheets), and the planned scope, then exits without writing
anything. The forecast uses extraction's own rule (`programsToExtract`): every form and every
repeatable stage gets a sheet, empty or not, and a program proven to have 0 records is
skipped unless it is the default program of a form with no data at all. So the sheet list
`--discover` prints is the sheet list a real run will produce.

The two ward statistics dataSets (Ward summary statistics: ward x specialty; Ward level
statistics: ward only) are aggregate data. `--start-date` / `--end-date` apply to them only and default
to all periods (2000-01-01 to today); without `--country` / `--org-unit` they are read under
the user's own root org units. The two share their data elements, so DHIS2 returns each
one's values for both; every value is written once, on the sheet of the dataSet that owns
its ward combo, and Read me says how many were left to the other sheet.

##### Default and custom programs

A form is identified by its **default** program. A survey can use a custom variant instead
(datastore `amr-surveys/modules` → `customForms`), so a country's data sits in whichever of
the default and custom programs it used. For each form the script probes the default program
and every custom variant under the requested scope, extracts those with data, and stacks
them into **one sheet per form** with a Form version column saying which program each row
came from. Columns are the union (the programs share almost all their data elements). Read
me lists every program behind each sheet, and reconciliation compares the sheet
to the summed discovered counts.

`--per-country` takes the countries from the Survey records and writes one workbook per
country into `extracts/` (or the directory given by `--output`), then prints which programs
each country used. It cannot be combined with `--country` / `--org-unit`.

##### Sheet layout

Every form sheet has the same four column groups, left to right, with coloured headers. Each
header has a note saying where its value comes from, and the **Column guide** sheet lists
every column of every sheet (group, form section, source, rows filled).

| Group | Header colour | Columns |
| ----- | ------------- | ------- |
| Identification | blue | Survey name, Facility name (Country on the Survey sheet), Unique facility ID, Unique ward ID, Unique survey patient ID: only those that apply to the sheet. Frozen on screen. |
| Data check | orange | Data check, Data check details (see below). Frozen on screen. |
| Form questions | green / yellow bands, one per form section | Every question on the form, in form order, **answered or not**. A field already shown as identification or as a link is not repeated. |
| DHIS2 linking and system | grey, collapsed (click `+`) | Record ID, the record IDs it links to, DHIS2 org unit ID, Date entered, Last changed, Enrolled on / Event date, Status, Form version. |

Every form gets a sheet, even with no records, so workbooks always have the same sheets.

**Identification columns** are the IDs the survey teams type. They nest: patient
`HF025/W16/011` is in ward `HF025/W16`, in facility `HF025`, and are unique only within one
survey. Values are trimmed; the form's own field, if any, is not repeated among the questions.

| Column | Source |
| ------ | ------ |
| Survey name | Survey form SurveyName (`HXnhZ8rsDts`), looked up by Survey record ID. The form's SurveyID field is not filled in on prod. |
| Facility name / Country | The DHIS2 org unit the record was entered under. |
| Unique facility ID | Facility form: the field called "Hospital ID" (`hpNIfydqgkD`). Case report: Unique facility ID (`qgPNgq0Ws7k`). Forms below the case report: "(from case report)". Ward statistics: the Hospital ID of the Facility form at the same org unit. |
| Unique ward ID | Facility form Ward data: Unique ward ID (`yAA33dsnWmY`). Case report: Unique ward/department ID (`KoKmhwZGJnW`). Forms below the case report: "(from case report)". Ward statistics: facility ID + `/` + the ward (`W16`). |
| Unique survey patient ID | `yEkJlUFeJdP`, each record's own value. |

A ward typed without its facility (`W16`) is shown in full (`HF025/W16`). IDs are compared
ignoring case, spaces, leading zeros, a trailing slash and Cyrillic look-alike letters (`hf025/ w1` = `HF025/W01`,
`HF025/` = `HF025`): on preprod most apparent mismatches were only that.

**Headers.** Questions keep their form label (prefixed with the form section on tracker
forms). Where two fields share a label, the header adds the field's DHIS2 name in brackets.
A form's own copy of an identification field gets "(this form's own field)", e.g. the
follow-up form's "Unique facility ID". The follow-up and discharge forms have a second
patient ID field labelled exactly "Unique survey patient ID" in DHIS2 (`qsDC1eNnbgE`,
`Cw0y6iIZ4nb`); it holds the patient ID, or the patient ID + `/C3` for cohort 3, so the
extract heads it "Unique survey patient ID (this form's own field: ___ or ___/C3)".

##### What the cells contain

- Option-set fields are written as the option **name** (the stored code if the option is unknown).
- Numeric and date fields, and the Date entered / Last changed / ... timestamps, are real
  Excel numbers and dates; everything else (including ids and codes) is text. Numbers longer
  than Excel's 15 significant digits stay text so they are never rounded.
- **Questions no longer on the form.** DHIS2 keeps values entered in fields later removed
  from a form (thousands of antibiotic-history values on the Kyrgyz case reports, for
  example). The app no longer shows them; the extract keeps them, after their stage's
  columns, headed with the field's full DHIS2 name (which carries its slot, e.g.
  `Route1.1YES`) and marked `[not on current form]`. Read me lists them with their value counts.
- Single-entry stages that had more than one event with data (the last event's values win),
  skipped events and fields deleted from DHIS2 metadata are listed on Read me.

##### Data checks

The Data check and Data check details columns say why a record needs a second look; such
rows are also shaded orange, and every header has a filter. Read me counts them per sheet
and explains each one:

| Data check | Meaning |
| ---------- | ------- |
| `TEST/INVALID` | Its survey link is missing or is not a survey in DHIS2 ("test", "TEST SURVEY ID"...) |
| `PARENT DELETED` | The case report (or survey) it belongs to was deleted in DHIS2; this record was not |
| `PARENT MISSING` | The record it belongs to does not exist in DHIS2, or no link was recorded |
| `OUTSIDE EXTRACT` | The record it belongs to exists, but under another org unit |
| `SURVEY MISMATCH` | Its own survey link differs from its parent's |
| `PARENT FLAGGED` | The record it belongs to is itself flagged (flags pass down to children) |
| `ID MISMATCH` | Its typed IDs disagree: a case report's Unique facility ID vs the Facility form's, its ward vs that facility's wards, ward not starting with facility, patient not starting with ward; a form's patient ID vs its case report's; or a form's own patient ID field that is neither the patient ID nor the patient ID + `/C3`. Blanks are never a mismatch. Does not pass down to children (the DHIS2 links still hold). |

Deleted and missing parents are told apart by looking the dangling ids up in DHIS2,
deleted records included. A data check never removes a record.

##### Speed and load

A country takes about a minute (Kyrgyzstan, the largest: ~23,000 records, ~60 s end to end).
With discovery's record counts, all of a program's pages are requested at once; one shared
cap (`REQUEST_CONCURRENCY`, 4) bounds the full-page requests in flight across the whole run,
so the load on DHIS2 stays the same however pages and programs overlap. The workbook is
streamed to disk (`<name>.xlsx.partial`, renamed when complete, so an interrupted run never
leaves a file that looks finished). `--per-country` carries on past a failed country and
exits non-zero at the end, naming it.

##### Joins

Every sheet's key is its **Record ID** column. The workbook's **Joins (technical)** sheet
lists every join at runtime for downstream tools.

| Sheet | Belongs to | Linked by | Rows per parent |
| ----- | ---------- | --------- | --------------- |
| Survey | (top level) | — | — |
| Facility | Survey | Survey record ID (`Log2Y4uqBBo`) | many per survey |
| Facility - Ward data | Facility | Facility record ID | many per facility |
| Case report | Survey | Survey record ID (`tlRPoWumrSa`) | many per survey |
| Sample shipment, Central ref lab, Pathogen isolates, Supranational ref lab, Follow-up D28 | Case report | Case report record ID (`mUaaSzbeMmj`, `M1D2XXokPWl`, `yq8en6ZkENB`, `l4Y96YlhYyF`) | many per case report |
| Discharge clinical, Discharge economic, Cohort enrolment | Case report | Case report record ID (`oT6f0BG74xs`, `HkBG3DVELBM`, `mGYxog3at84`) | none or more per case report |
| Ward summary statistics, Ward level statistics | (none) | DHIS2 org unit ID, Unique ward ID | aggregate |

**Case report links to Survey, not Facility.** This is not obvious from the UI's visual
nesting, but it is what the app filters on: `GetPaginatedSurveysUseCase.ts` uses
`parentPatientId` only for the 8 leaf forms (`isPrevalencePatientChild`) and
`parentSurveyId` for Facility and Case report. So `tlRPoWumrSa` holds a **Survey** id.
Case report has no link to Facility at all — the UI scopes it by org unit.

Consequently:

-   Survey record ID is read **directly** from each record's own survey-link field (every
    leaf form carries one — see `parentPrevalenceSurveyIdList`), so every record traces to
    its survey without walking the chain.
-   Facility record ID is **worked out**: the Facility row with the same Survey record ID
    and DHIS2 org unit ID. Ambiguous or unresolvable matches are reported on Read me rather
    than silently guessed.
-   Ward record ID is **worked out** too, on Case report and every sheet below it: the
    Facility - Ward data row with the same Facility record ID and Unique ward ID. Forms
    below the case report copy their case report's. Case reports naming a ward that is not
    on their facility's list are counted on Read me.

Sheets are flat tables with a single header row and text-formatted ids, so they load
directly into Power BI or a SQL loader as a star schema (Survey and Facility as dimensions,
the patient forms as facts).

##### Notes

-   Form UIDs are resolved from **live server metadata by name**, not hardcoded.
    "Custom" forms are configured per parent survey in the datastore
    (`amr-surveys` -> `modules` -> `customForms`) and so cannot be known from the
    code alone. The constants in `src/data/entities/D2Survey.ts` are used only as
    a cross-check, and a mismatch is reported as a warning.
-   Optimisation never narrows the result: the only programs skipped are those a probe
    proves have **exactly zero** records (their form still gets its sheet), and a
    reconciliation check compares extracted counts against the discovered totals, reporting
    any mismatch on Read me.
-   `src/scripts/common.ts` is a deliberate port of glass-dev's script auth layer
    (PAT handling, `backend: "fetch"`, session warm-up, refresh + backoff). Keep the two
    in sync when either changes.

##### Program-stage data (not just attributes)

A tracker program's data lives in two places: tracked-entity **attributes**, and events on
the enrollment's **program stages**. Both are extracted:

-   A **non-repeatable** stage has at most one event per record, so its dataValues are
    flattened onto the same row as extra columns, labelled `<stage name>: <field name>`
    to disambiguate fields that share a name across stages.
-   A **repeatable** stage (e.g. Facility's "Ward data", which can occur many times per
    facility) becomes its **own child sheet** — one row per event — because a TEI can have
    many events for that stage, which is a different cardinality than the flat one-row-per-
    record model everything else uses. Its sheet is named `<owning form> - <stage name>`
    (e.g. "Facility - Ward data"), and it carries the same link columns as any other child
    sheet, plus `<owning form> record ID` (except where the owner IS an ancestor already
    linked, e.g. Facility's own repeatable stages don't get a second Facility record ID).

This matters for completeness: on the AMR Surveys prevalence programs, the large majority of
real fields live at the stage level, not as attributes (e.g. Case report currently has ~17
attributes but 6 stages totalling ~195 additional fields). Extracting attributes alone would
silently drop most of the data.

##### Sheet-name safety and diagnostics

Excel sheet names must be unique and <=31 characters. `assignSheetNames()` computes every
sheet's actual tab name in one deterministic pass: names are sorted by their stable internal
key (never by API/discovery encounter order, which is not guaranteed stable run-to-run for a
live dataset), sanitized, and truncated. If two different keys would truncate to the *same*
31-char name — verified live: two `SampleShipment` stage names differing only after
character 31 — the later one gets a short, stable disambiguation suffix derived from its own
DHIS2 uid, not a running counter, so the same input metadata always produces the same output
names. Read me, Column guide and Joins (technical) are reserved so a form can never
collide with them.

Nothing fails silently: a resolved collision, an event on an unresolvable program stage
(data that had to be skipped), an ambiguous Facility match, and a Survey/parent id mismatch
are all counted and listed in the Read me sheet's "Other findings" section, not just
logged and forgotten.

### Misc Notes

-   Requests to DHIS2 will be transparently proxied (see `vite.config.ts` -> `server.proxy`) from `http://localhost:8081/dhis2/xyz` to `${VITE_DHIS2_BASE_URL}/xyz`. This prevents CORS and cross-domain problems.

-   You can use `.env` variables within the React app: `const value = import.meta.env.NAME;`


