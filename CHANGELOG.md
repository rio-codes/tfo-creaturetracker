# 🧬 TFO.CT Changelog 🧑🏿‍🔬

## 1.26.0 (2026-07-30)

- perf(db): ⚡️ optimize page load speeds with Promise.all concurrency and composite indexes
- fix(ui): 🎨 fix theme switching with data-theme attribute and resolve React 19 script warning
- fix(ui): 🐛 calculate checklist phenotype slot totals and render complete badges
- feat(collection): ✨ add checklist slot match notifications after creature import
- fix(goals): 🐛 exclude optional genes from match score probability average
- feat(pairs): ✨ support hybrid species outcomes and compatible parent pairing filters
- feat(goals): ✨ enable assigning breeding pairs to goals across forms and dialogs

### 1.25.3 (2026-07-20)

- fix(collection): 🐛 wrap all three card footer buttons in explicit grid cell containers for identical width ([5ad7a627](https://github.com/rio-codes/tfo-creaturetracker/commit/5ad7a6275))
- fix(ui): 🎨 use CSS grid for equal creature card buttons and fix Discord social icon recognition ([01657fcd](https://github.com/rio-codes/tfo-creaturetracker/commit/01657fcd4))
- style(admin): 💄 remove decorative borders around details and summary tags in blog posts ([a94e8a51](https://github.com/rio-codes/tfo-creaturetracker/commit/a94e8a514))
- refactor(admin): ♻️ replace TipTap rich text editor with raw HTML textarea editor ([bf493b08](https://github.com/rio-codes/tfo-creaturetracker/commit/bf493b089))
- feat(collection): ✨ navigate Manage Breeding Pairs to Breeding Pairs page with prefilled parent ([8be5fbbd](https://github.com/rio-codes/tfo-creaturetracker/commit/8be5fbbd5))
- feat(pairs): ✨ add Predict Outcomes after pair creation and goal creation for missing checklist traits ([5661a11c](https://github.com/rio-codes/tfo-creaturetracker/commit/5661a11cf))
- fix(collection): 🐛 keep post-sync overlay open when deleting a goal ([7cef0974](https://github.com/rio-codes/tfo-creaturetracker/commit/7cef09740))
- fix(lib): 🐛 add Amikamaro capsule avatar and consolidate Kora Voko species name ([891bef79](https://github.com/rio-codes/tfo-creaturetracker/commit/891bef792))
- fix(lib): 🐛 support Kora Voko species alias and code SPtOw ([7801dc5c](https://github.com/rio-codes/tfo-creaturetracker/commit/7801dc5cd))
- fix(lib): 🐛 update Dolca Dormo species code to YwvYX and resolve phenotypes dynamically ([e5d5c571](https://github.com/rio-codes/tfo-creaturetracker/commit/e5d5c5718))
- feat(lib): ✨ add Dolca Dormo genetics data and capsule image ([3f888cf2](https://github.com/rio-codes/tfo-creaturetracker/commit/3f888cf25))

### 1.25.2 (2026-07-07)

- fix(goals): 🐛 fetch and return achievedGoals in fetchFilteredResearchGoals ([2d4125ff](https://github.com/rio-codes/tfo-creaturetracker/commit/2d4125ffb))
- fix(lib): 🐛 return 50% probability for Gender category in calculateGeneProbability ([7c5ac05a](https://github.com/rio-codes/tfo-creaturetracker/commit/7c5ac05ad))
- fix(homepage): 📝 update homepage title ([910ebed6](https://github.com/rio-codes/tfo-creaturetracker/commit/910ebed63))
- feat(admin): ✨ disable save button and show toast feedback on post save ([368c0822](https://github.com/rio-codes/tfo-creaturetracker/commit/368c08229))
- feat(admin): ✨ allow creating new posts and add details/summary block insertion ([c20c759e](https://github.com/rio-codes/tfo-creaturetracker/commit/c20c759e9))
- fix(goals): 🐛 validate and save isPublic and excludedGenes on goal creation ([d580918c](https://github.com/rio-codes/tfo-creaturetracker/commit/d580918c4))
- fix(goals): 🐛 await searchParams promise on research goals page ([fea69399](https://github.com/rio-codes/tfo-creaturetracker/commit/fea693991))
- fix(api): 🐛 prevent SSE connection close from triggering false sync errors ([ff7ea1e3](https://github.com/rio-codes/tfo-creaturetracker/commit/ff7ea1e34))
- feat(lib): ✨ add genetics and codes for six new species ([e8764e3b](https://github.com/rio-codes/tfo-creaturetracker/commit/e8764e3b4))
- build(deps): ⬆️ update all dependencies to their latest versions ([63e759ef](https://github.com/rio-codes/tfo-creaturetracker/commit/63e759ef1))

### 1.25.1 (2025-11-14)

- docs(homepage): 📝 add changelog to footer ([9fd0c0d7](https://github.com/rio-codes/tfo-creaturetracker/commit/9fd0c0d7e07ba6c1e952bd4c3390c6bd16339b7c))

## 1.25.0 (2025-11-14)

- feat(admin): ✨ add blog post editor ([5f42c205](https://github.com/rio-codes/tfo-creaturetracker/commit/5f42c205398bb8660bf9c111fa11bf52fd1f7a96))

## 1.24.0 (2025-11-14)

- feat(wishlist): ✨ improve checklists with edit/delete/matching notifs (#410) ([5a69638a](https://github.com/rio-codes/tfo-creaturetracker/commit/5a69638a))
- refactor(ui): ⚰️ remove unusused and legacy code, #165 (#409) ([13fc6796](https://github.com/rio-codes/tfo-creaturetracker/commit/13fc6796))

## 1.23.1 (2025-11-13)

- fix(collection): 🐛 save tab order properly, fixes #362 (#408) ([d5d318fc](https://github.com/rio-codes/tfo-creaturetracker/commit/d5d318fc))
- build(deps): bump the all-dependencies group across 1 directory with 15 updates (#405) ([d1ea6d38](https://github.com/rio-codes/tfo-creaturetracker/commit/d1ea6d38))
- fix(goals): 🚑️ fix image preview in goals ([04c7410e](https://github.com/rio-codes/tfo-creaturetracker/commit/04c7410e))
- fix(goals): 🚑️ fix image preview in goals ([7722789a](https://github.com/rio-codes/tfo-creaturetracker/commit/7722789a))
- fix(goals): 🚑️ fix image preview in goals ([c437fd2f](https://github.com/rio-codes/tfo-creaturetracker/commit/c437fd2f))

## 1.23.0 (2025-11-10)

- feat(pairs): ✨ implement pairs and outcomes for hybrids (#401) ([2a96ffdf](https://github.com/rio-codes/tfo-creaturetracker/commit/2a96ffdf))
- fix(goals): 🐛 show goals on breeding pair cards, fixes #385 (#400) ([5ed34e66](https://github.com/rio-codes/tfo-creaturetracker/commit/5ed34e66))
- chore(config): 🗑️ delete empty file ([c4c99827](https://github.com/rio-codes/tfo-creaturetracker/commit/c4c99827))
- Update README.md ([3a16a3d4](https://github.com/rio-codes/tfo-creaturetracker/commit/3a16a3d4))
- fix(goals): 🐛 fix goal achievement dialog ui ([2b6cb8de](https://github.com/rio-codes/tfo-creaturetracker/commit/2b6cb8de))
- fix(goals): 🚑️ fix css on goals page ([9d14152b](https://github.com/rio-codes/tfo-creaturetracker/commit/9d14152b))
- feat(goals): ✨ proper goal achievement on import of matching goal (#398) ([f5c851a3](https://github.com/rio-codes/tfo-creaturetracker/commit/f5c851a3))

## 1.22.0 (2025-11-09)

- feat(goals): ✨ proper goal achievement on import of matching goal (#398) ([5970689d](https://github.com/rio-codes/tfo-creaturetracker/commit/5970689d))

### 1.21.1 (2025-11-08)

- build(deps): 🚨 update pnpm lockfile, bump version ([e722eecf](https://github.com/rio-codes/tfo-creaturetracker/commit/e722eecf))
- refactor(pairs): ⚡️ refactor inbreeding check, add CC license to footer ([47222efc](https://github.com/rio-codes/tfo-creaturetracker/commit/47222efc))
- build(deps): bump the all-dependencies group across 1 directory with 6 updates (#391) ([c20321a4](https://github.com/rio-codes/tfo-creaturetracker/commit/c20321a4))
- fix(profile): 🐛 cleanup component test on profile ([bdc0cf10](https://github.com/rio-codes/tfo-creaturetracker/commit/bdc0cf10))

## 1.21.0 (2025-11-05)

- docs(homepage): 📝 add icon artist credit to footer, version bump ([a0af7926](https://github.com/rio-codes/tfo-creaturetracker/commit/a0af7926))
- feat(homepage): ✨ revert hn theme, redesign homepage, grant first achievment, add checklists (#386) ([a924ce4e](https://github.com/rio-codes/tfo-creaturetracker/commit/a924ce4e))

### 1.20.1 (2025-11-04)

- feat(checklists): ✨ implement checklist feature (#384) ([2d50d009](https://github.com/rio-codes/tfo-creaturetracker/commit/2d50d009))
- fix(breeding-log): 🐛 update breeding log form to use new primary keys, fixes #371 (#382) ([097e763c](https://github.com/rio-codes/tfo-creaturetracker/commit/097e763c))
- build(deps): bump the all-dependencies group across 1 directory with 8 updates (#379) ([f2108924](https://github.com/rio-codes/tfo-creaturetracker/commit/f2108924))
- fix(api): 🚨 fixing type error ([af471d7b](https://github.com/rio-codes/tfo-creaturetracker/commit/af471d7b))
- fix(db): 🐛 final fix for unknown capitalization bug ([e1725353](https://github.com/rio-codes/tfo-creaturetracker/commit/e1725353))
- fix(db): 🐛 fix for unknown gender bug ([fcc9f7c2](https://github.com/rio-codes/tfo-creaturetracker/commit/fcc9f7c2))
- fix(collection): 🐛 make sure sync continues on network error ([ac50f4b3](https://github.com/rio-codes/tfo-creaturetracker/commit/ac50f4b3))
- fix(db): 🐛 fix syncing bug ([9eff9050](https://github.com/rio-codes/tfo-creaturetracker/commit/9eff9050))

## 1.20.0 (2025-10-31)

- feat(collection): ✨ redesign of syncing dialog with progress indicator and helpful errors ([d2a3d8e](https://github.com/rio-codes/tfo-creaturetracker/commit/d2a3d8e))
- fix(wishlist): 🐛 add pinned wishlist goals as separate db column, fix route
- fix(wishlist): 🐛 further fix to wishlist bug, build errors

### 1.19.1 (2025-10-25)

- fix(wishlist/messaging): 🐛 fix many issues introduced by new features ([#357](https://github.com/rio-codes/tfo-creaturetracker/issues/357))
- build(deps): bump next-auth from 5.0.0-beta.29 to 5.0.0-beta.30 ([#359](https://github.com/rio-codes/tfo-creaturetracker/issues/359))
- build(deps): bump next-auth from 5.0.0-beta.29 to 5.0.0-beta.30 ([#359](https://github.com/rio-codes/tfo-creaturetracker/issues/359))
- build(deps): bump actions/upload-artifact from 4 to 5 ([#358](https://github.com/rio-codes/tfo-creaturetracker/issues/358))
- build(deps): bump the all-dependencies group across 1 directory with 2 updates ([#368](https://github.com/rio-codes/tfo-creaturetracker/issues/368))

## 1.19.0 (2025-10-25)

- feat(goals): ✨ implement suggested parent traits on goal tracker, availability for stud/trade/sale
- fix(goals): 🐛 add genotype to suggested parent traits, fix owner link
- fix(goals): 🚑️ fix logic on suggested parents

### 1.18.1 (2025-10-25)

- fix(wishlist): 🐛 fix wishlist pinning route and ui, theming, type errors ([#349](https://github.com/rio-codes/tfo-creaturetracker/issues/349))
- fix(wishlist): 🚑️ add redirect to login for wishlist
- fix(collection): 🚑️ fixing db error
- feat(goals): ✨ implement suggested parent traits on goal tracker, availability for stud/trade/sale

## 1.18.0 (2025-10-25)

- feat(wishlist): ✨ add target gen to public goals, update db and api, add checking for pairs and optional saving ([#347])
- fix(pairs): 🐛 fix archived pair goal assignment bug ([#348](https://github.com/rio-codes/tfo-creaturetracker/issues/348))
- fix(pairs): 🐛 fix for find pairs dialog closing immediately
- fix(wishlist): 🐛 fix wishlist pinning route and ui, theming, type errors ([#349](https://github.com/rio-codes/tfo-creaturetracker/issues/349))
- fix(wishlist): 🚑️ add redirect to login for wishlist
- fix(collection): 🚑️ fixing db error

### 1.17.4 (2025-10-23)

- feat(goals): ✨ add ability to exclude outcomes from optional genes Fixes [#303](https://github.com/rio-codes/tfo-creaturetracker/issues/303)
- chore(config): 🎨 update config files
- style(wishlist): 💄 color tweak on wishlist toggle
- fix(homepage): 🚨 fix build error
- fix(config): 🔧 change next config import in eslint config

See [[#303](https://github.com/rio-codes/tfo-creaturetracker/issues/303)](https://github.com/rio-codes/tfo-creaturetracker/issues/303) for details

### 1.17.3 (2025-10-23)

- feat(goals): ✨ exclude optional traits from goals ([#337](https://github.com/rio-codes/tfo-creaturetracker/issues/337))
- chore(config): 🎨 update config files for next and TS
- fix(config): 🐛 ignore change to next types file
- feat(goals): ✨ add optional traits to goals
- fix(db): 🚨 import GoalGene type into db schema

fixes [#303](https://github.com/rio-codes/tfo-creaturetracker/issues/303)

### 1.17.2 (2025-10-23)

- fix(wishlist): ✨ add sorting by species or recent to wishlist
- fix(supabase): 🐛 fix users online count, closes [#273](https://github.com/rio-codes/tfo-creaturetracker/issues/273)
- fix(collection): 🐛 add batching to sync and sync-all, closes [#247](https://github.com/rio-codes/tfo-creaturetracker/issues/247) ([#336](https://github.com/rio-codes/tfo-creaturetracker/issues/336))

### 1.17.1 (2025-10-23)

- docs(docs): 📝 update news and changelog
- chore(config): 🔧 update gitignore
- fix(wishlist): 💄 fix hallowsnight theme on wishlist
- fix(wishlist): 💄 fix font colors in all three themes on wishlist

## 1.17.0 (2025-10-23)

- feat(wishlist): ✨ Implement public wishlist page and features! ([#335](https://github.com/rio-codes/tfo-creaturetracker/issues/335))

## 1.16.0 (2025-10-20)

- feat(messaging): ✨ implement site-wide messaging with notifications (#327) ([de294ad](https://github.com/rio-codes/tfo-creaturetracker/commit/de294ad)), closes [#327](https://github.com/rio-codes/tfo-creaturetracker/issues/327)

- fix(messaging): 🐛 add messaging button on user profile, fix conversation ui ([#328](https://github.com/rio-codes/tfo-creaturetracker/issues/328))

## 1.15.0 (2025-10-20)

- feat(supabase): 🚀 implement supabase realtime presence (#326) ([f18d9a4](https://github.com/rio-codes/tfo-creaturetracker/commit/f18d9a4)), closes [#326](https://github.com/rio-codes/tfo-creaturetracker/issues/326)

## 1.14.0 (2025-10-21)

- feat(vercel): 📈 implement vercel speed insights (#325) ([2d39d40](https://github.com/rio-codes/tfo-creaturetracker/commit/2d39d40)), closes [#325](https://github.com/rio-codes/tfo-creaturetracker/issues/325)

### 1.13.3 (2025-10-18)

- Fix: Font override (#324) ([296fbd8](https://github.com/rio-codes/tfo-creaturetracker/commit/296fbd8)), closes [#324](https://github.com/rio-codes/tfo-creaturetracker/issues/324)

### 1.13.2 (2025-10-18)

- fix(ui): ⚡️ fix issues with hallowsnight mode, collection perf upgrade ([26dd1c8](https://github.com/rio-codes/tfo-creaturetracker/commit/26dd1c8))
- fix(ui): 💄 fix dark mode styling on profile, settings, and header ([e77abec](https://github.com/rio-codes/tfo-creaturetracker/commit/e77abec))
- fix(pairs): ⚡️ finish refactor for performance, add hallowsnight theme (#323) ([8c70ba2](https://github.com/rio-codes/tfo-creaturetracker/commit/8c70ba2)), closes [#323](https://github.com/rio-codes/tfo-creaturetracker/issues/323)

### 1.13.1 (2025-10-18)

- fix(db): 🚑️ emergency db schema update ([f8fbef0](https://github.com/rio-codes/tfo-creaturetracker/commit/f8fbef0))
- fix(ui): ⚡️ fix issues with hallowsnight mode, collection perf upgrade ([26dd1c8](https://github.com/rio-codes/tfo-creaturetracker/commit/26dd1c8))
- fix(ui): 🚑️ fix add creatures dialog after corrupt merge ([3f1c743](https://github.com/rio-codes/tfo-creaturetracker/commit/3f1c743))

## 1.13.0 (2025-10-18)

- feat(ui): 👻 add hallowsnight theme and update blog (#321) ([405d15b](https://github.com/rio-codes/tfo-creaturetracker/commit/405d15b)), closes [#321](https://github.com/rio-codes/tfo-creaturetracker/issues/321)
- feat(collection): ✨ add "clear filters" button to search ([1516180](https://github.com/rio-codes/tfo-creaturetracker/commit/1516180))
- feat(collection): ✨ implement drag and drop for tab order in sync dialog (#319) ([aa66bf1](https://github.com/rio-codes/tfo-creaturetracker/commit/aa66bf1)), closes [#319](https://github.com/rio-codes/tfo-creaturetracker/issues/319)
- feat(ui): ✨ display online users in footer (#320) ([96c06f0](https://github.com/rio-codes/tfo-creaturetracker/commit/96c06f0)), closes [#320](https://github.com/rio-codes/tfo-creaturetracker/issues/320)

### 1.12.2 (2025-10-18)

- refactor(lib): 🎨 comprehensive refactor to improve performance while scaling (#318) ([6fc582f](https://github.com/rio-codes/tfo-creaturetracker/commit/6fc582f)), closes [#318](https://github.com/rio-codes/tfo-creaturetracker/issues/318)
- build(deps): bump actions/setup-node from 5 to 6 (#316) ([a2e074c](https://github.com/rio-codes/tfo-creaturetracker/commit/a2e074c)), closes [#316](https://github.com/rio-codes/tfo-creaturetracker/issues/316)
- fix(collection): 🐛 fix parent tooltip for responsive design on creature card ([4de446b](https://github.com/rio-codes/tfo-creaturetracker/commit/4de446b))
- fix(goals): 🚑️ fix build errors in outcome logic and auth ([a117d84](https://github.com/rio-codes/tfo-creaturetracker/commit/a117d84))
- fix(goals): 🚑️ resolve merge conflict ([faf0619](https://github.com/rio-codes/tfo-creaturetracker/commit/faf0619))
- fix(goals): 🚑️ revert dimorpic species commit to fix goal issues ([2cd2683](https://github.com/rio-codes/tfo-creaturetracker/commit/2cd2683))
- fix(goals): 🚑️ revert merge branch main into dev-issue291 ([9cd8e07](https://github.com/rio-codes/tfo-creaturetracker/commit/9cd8e07))
- fix(goals): 🚑️ update pnpm lockfile ([309d549](https://github.com/rio-codes/tfo-creaturetracker/commit/309d549))
- fix(goals): 🚨 revert pnpm lockfile ([e255179](https://github.com/rio-codes/tfo-creaturetracker/commit/e255179))

### 1.12.1 (2025-10-13)

- revert dimorphic species changes (#315) ([4e769bb](https://github.com/rio-codes/tfo-creaturetracker/commit/4e769bb)), closes [#315](https://github.com/rio-codes/tfo-creaturetracker/issues/315)
- fix(collection): ⏪ load data for each component as needed rather than passing large arrays" (#313) ([0444520](https://github.com/rio-codes/tfo-creaturetracker/commit/0444520)), closes [#313](https://github.com/rio-codes/tfo-creaturetracker/issues/313) [rio-codes/tfo-creaturetracker#312](https://github.com/rio-codes/tfo-creaturetracker/issues/312)
- fix(collection): 🐛 fix all search queries including regex for genes, add species and phenotye (#311 ([50c3287](https://github.com/rio-codes/tfo-creaturetracker/commit/50c3287)), closes [#311](https://github.com/rio-codes/tfo-creaturetracker/issues/311)
- fix(goals): 🐛 skip gene category in progeny analysis if isOptional, fixes #302 (#309) ([7a7437e](https://github.com/rio-codes/tfo-creaturetracker/commit/7a7437e)), closes [#302](https://github.com/rio-codes/tfo-creaturetracker/issues/302) [#309](https://github.com/rio-codes/tfo-creaturetracker/issues/309) [#302](https://github.com/rio-codes/tfo-creaturetracker/issues/302)
- fix(goals): 🚑️ fix errors related to dimorphic gene change ([50ef522](https://github.com/rio-codes/tfo-creaturetracker/commit/50ef522))
- feat(profile): 💃🏾 allow larger profile pic for lyri's dancing gif ([20d6325](https://github.com/rio-codes/tfo-creaturetracker/commit/20d6325))
- perf(collection): ⚡️ load data for each component as needed rather than passing large arrays (#312) ([bbd1a9a](https://github.com/rio-codes/tfo-creaturetracker/commit/bbd1a9a)), closes [#312](https://github.com/rio-codes/tfo-creaturetracker/issues/312)
- chore(db): 🔧 update pgTable structure to avoid upcoming deprecation, fixes #269 (#310) ([2a4a921](https://github.com/rio-codes/tfo-creaturetracker/commit/2a4a921)), closes [#269](https://github.com/rio-codes/tfo-creaturetracker/issues/269) [#310](https://github.com/rio-codes/tfo-creaturetracker/issues/310) [#269](https://github.com/rio-codes/tfo-creaturetracker/issues/269)

### 1.12.2 (2025-10-11)

- fix(breeding-log): 🐛 automatically determine gen and prevent manual cfg (#308) ([845e485](https://github.com/rio-codes/tfo-creaturetracker/commit/845e485)), closes [#308](https://github.com/rio-codes/tfo-creaturetracker/issues/308) [#300](https://github.com/rio-codes/tfo-creaturetracker/issues/300)
- ci(config) : 👷🏿‍♀️ remove aviator label to stop automerge ([a88c313](https://github.com/rio-codes/tfo-creaturetracker/commit/a88c313))

### 1.12.1 (2025-10-11)

- fix(goals): 🐛 implement dimorphic species genes, fix types throughout codebase (#307) ([00b8a5c](https://github.com/rio-codes/tfo-creaturetracker/commit/00b8a5c)), closes [#307](https://github.com/rio-codes/tfo-creaturetracker/issues/307)
- fix(pairs): 🚑️ deploy fix to ensure all archived pairs are found ([c4dbd9e](https://github.com/rio-codes/tfo-creaturetracker/commit/c4dbd9e))
- build(deps): ⬆️ upgrade dependencies ([f37e21b](https://github.com/rio-codes/tfo-creaturetracker/commit/f37e21b))
- build(deps): bump actions/checkout from 4 to 5 (#298) ([d4d36e6](https://github.com/rio-codes/tfo-creaturetracker/commit/d4d36e6)), closes [#298](https://github.com/rio-codes/tfo-creaturetracker/issues/298)
- build(deps): bump tj-actions/branch-names from 8 to 9 (#299) ([6ce43ed](https://github.com/rio-codes/tfo-creaturetracker/commit/6ce43ed)), closes [#299](https://github.com/rio-codes/tfo-creaturetracker/issues/299)
- refactor(ui): 🎨 apply codemod to await searchParams, fixes [#292](https://github.com/rio-codes/tfo- '[352948f](https://github.com/rio-codes/tfo-creaturetracker/commit/352948f')
- docs(docs): ✨ update changelog with new feature ([f099a41](https://github.com/rio-codes/tfo-creaturetracker/commit/f099a41))
- feat(pairs): ✨ breeding pairs with archived members will also be archived now (#296) ([41da37f](https://github.com/rio-codes/tfo-creaturetracker/commit/41da37f)), closes [#296](https://github.com/rio-codes/tfo-creaturetracker/issues/296)
- chore(docs): 📝 update CHANGELOG.md, bump patch version ([7455e12](https://github.com/rio-codes/tfo-creaturetracker/commit/7455e12))

### 1.11.8 (2025-10-07)

- ci(config): 🚀 add github workflow for dev db branch, fix other workflows (#295) ([298db59](https://github.com/rio-codes/tfo-creaturetracker/commit/298db59)), closes [#295](https://github.com/rio-codes/tfo-creaturetracker/issues/295) [#293](https://github.com/rio-codes/tfo-creaturetracker/issues/293) [#294](https://github.com/rio-codes/tfo-creaturetracker/issues/294)
- build(deps): bump actions/checkout from 4 to 5 (#294) ([32da62c](https://github.com/rio-codes/tfo-creaturetracker/commit/32da62c)), closes [#294](https://github.com/rio-codes/tfo-creaturetracker/issues/294)
- Update db-backup.yml ([0f303b3](https://github.com/rio-codes/tfo-creaturetracker/commit/0f303b3))

### 1.11.7 (2025-10-06)

- fix(admin): 🐛 fix urls on admin page (#285) ([d66c9d3](https://github.com/rio-codes/tfo-creaturetracker/commit/d66c9d3)), closes [#285](https://github.com/rio-codes/tfo-creaturetracker/issues/285)
- fix(collection): 🐛 change archived and unarchived removal dialogs (#287) ([23cd6e6](https://github.com/rio-codes/tfo-creaturetracker/commit/23cd6e6)), closes [#287](https://github.com/rio-codes/tfo-creaturetracker/issues/287)
- fix(collection): 🐛 set minimum generation in filter input, fixes #276 (#286) ([29d02a0](https://github.com/rio-codes/tfo-creaturetracker/commit/29d02a0)), closes [#276](https://github.com/rio-codes/tfo-creaturetracker/issues/276) [#286](https://github.com/rio-codes/tfo-creaturetracker/issues/286) [#276](https://github.com/rio-codes/tfo-creaturetracker/issues/276)
- fix(db): 🚑️ emergency db schema hotfix; revert table names ([77a42ea](https://github.com/rio-codes/tfo-creaturetracker/commit/77a42ea))
- fix(pairs): 🐛 fix breeding pairs db query function (#289) ([ca3409c](https://github.com/rio-codes/tfo-creaturetracker/commit/ca3409c)), closes [#289](https://github.com/rio-codes/tfo-creaturetracker/issues/289)
- build(deps): bump actions/setup-node from 4 to 5 (#290) ([8fad090](https://github.com/rio-codes/tfo-creaturetracker/commit/8fad090)), closes [#290](https://github.com/rio-codes/tfo-creaturetracker/issues/290)
- ci(config): 🚑️ fix github workflows to use correct vers of postgresql and node ([93f71f8](https://github.com/rio-codes/tfo-creaturetracker/commit/93f71f8))
- docs(docs): 📝 update CHANGELOG.md ([0ba1766](https://github.com/rio-codes/tfo-creaturetracker/commit/0ba1766))

### 1.11.6 (2025-10-05)

- fix(pairs): 🐛 exclude existing mates from possible pairs, fixes #260 (#288) ([42820e5](https://github.com/rio-codes/tfo-creaturetracker/commit/42820e5)), closes [#260](https://github.com/rio-codes/tfo-creaturetracker/issues/260) [#288](https://github.com/rio-codes/tfo-creaturetracker/issues/288) [#260](https://github.com/rio-codes/tfo-creaturetracker/issues/260)
- Update lint.yml ([7d32fc4](https://github.com/rio-codes/tfo-creaturetracker/commit/7d32fc4))

### 1.11.5 (2025-10-05)

- ci(config): 👷 add eslint and format github action ([22b9ece](https://github.com/rio-codes/tfo-creaturetracker/commit/22b9ece))
- fix(deps): 🔒️ resolve dependabot alerts ([7fe3716](https://github.com/rio-codes/tfo-creaturetracker/commit/7fe3716))
- fix(deps): 🔒️ update deps to fix vulnerable deps ([f5b6d4d](https://github.com/rio-codes/tfo-creaturetracker/commit/f5b6d4d))

### 1.11.4 (2025-10-05)

- fix(deps): 🔒️ remove unneeded dependency introducing dangerous subdependencies ([e93b23d](https://github.com/rio-codes/tfo-creaturetracker/commit/e93b23d))
- fix(deps): 🔒️ remove unneeded dependency introducing dangerous subdependencies ([7fb2535](https://github.com/rio-codes/tfo-creaturetracker/commit/7fb2535))
- fix(deps): 🔒️ update serve-handler to fix vulnerable dependency ([e1f0ac9](https://github.com/rio-codes/tfo-creaturetracker/commit/e1f0ac9))
- fix(profile): ♿️ add tooltip and aria-label to flair icon component for screen readers (#284) ([2fe36d1](https://github.com/rio-codes/tfo-creaturetracker/commit/2fe36d1)), closes [#284](https://github.com/rio-codes/tfo-creaturetracker/issues/284)

### 1.11.3 (2025-10-05)

- fix(collection): 🐛 add 'unknown' and 'bred' origins, update database and filters, fix #277 (#283) ([aeeb94e](https://github.com/rio-codes/tfo-creaturetracker/commit/aeeb94e)), closes [#277](https://github.com/rio-codes/tfo-creaturetracker/issues/277) [#283](https://github.com/rio-codes/tfo-creaturetracker/issues/283)
- style(docs): 📝 update minor changelog configs ([b7b3b39](https://github.com/rio-codes/tfo-creaturetracker/commit/b7b3b39))

### 1.11.2 (2025-10-05)

- fix(profile): 🎨 refactor emoji picker, enforce dark theme and noto emojis ([6596360](https://github.com/rio-codes/tfo-creaturetracker/commit/6596360))
- style(config): 🎨 remove unnecessary code from globals.css ([f047c87](https://github.com/rio-codes/tfo-creaturetracker/commit/f047c87))
- style(docs): 🎨 update changelog config ([e8fe435](https://github.com/rio-codes/tfo-creaturetracker/commit/e8fe435))

### 1.11.1 (2025-10-05)

- build(deps): ⬆️ update all dependencies to newest patch version, patch v1.11.1 ([d425800](https://github.com/rio-codes/tfo-creaturetracker/commit/d425800))
- chore(docs): 📝 update changelog to include v1.11.0 ([d38dda1](https://github.com/rio-codes/tfo-creaturetracker/commit/d38dda1))
- chore(docs): 📝 update changelog to include v1.11.0 ([5a15e7d](https://github.com/rio-codes/tfo-creaturetracker/commit/5a15e7d))

## 1.11.0 (2025-10-01)

- feat(collection): ✨ add generation, origin, and gene-level filters (#275) ([398b8bc](https://github.com/rio-codes/tfo-creaturetracker/commit/398b8bc)), closes [#275](https://github.com/rio-codes/tfo-creaturetracker/issues/275) [#272](https://github.com/rio-codes/tfo-creaturetracker/issues/272) [#256](https://github.com/rio-codes/tfo-creaturetracker/issues/256)
- fix(collection): 🐛 add raffle to G1 origins (#270) ([42209fe](https://github.com/rio-codes/tfo-creaturetracker/commit/42209fe)), closes [#270](https://github.com/rio-codes/tfo-creaturetracker/issues/270)
- fix(pairs): 🐛 enable hybrid progeny assignment in log breeding dialog, other fixes (#272) ([3fb8de5](https://github.com/rio-codes/tfo-creaturetracker/commit/3fb8de5)), closes [#272](https://github.com/rio-codes/tfo-creaturetracker/issues/272) [#256](https://github.com/rio-codes/tfo-creaturetracker/issues/256)
- docs(docs): 📝 update changelog, version ([52d7a0f](https://github.com/rio-codes/tfo-creaturetracker/commit/52d7a0f))
- style(settings): 🥚 set source in headers function to domain root (#268) ([369c28e](https://github.com/rio-codes/tfo-creaturetracker/commit/369c28e)), closes [#268](https://github.com/rio-codes/tfo-creaturetracker/issues/268)

### 1.10.4 (2025-09-30)

- chore(config): 🎨 upgrade ESLint config file to new "flat config" format (#267) ([df47e8e](https://github.com/rio-codes/tfo-creaturetracker/commit/df47e8e)), closes [#267](https://github.com/rio-codes/tfo-creaturetracker/issues/267)

### 1.10.3 (2025-09-29)

- Create FUNDING.yml ([84cee0b](https://github.com/rio-codes/tfo-creaturetracker/commit/84cee0b))
- Fixes for #249, #257, #262 (#264) ([f79480a](https://github.com/rio-codes/tfo-creaturetracker/commit/f79480a)), closes [#249](https://github.com/rio-codes/tfo-creaturetracker/issues/249) [#257](https://github.com/rio-codes/tfo-creaturetracker/issues/257) [#262](https://github.com/rio-codes/tfo-creaturetracker/issues/262) [#264](https://github.com/rio-codes/tfo-creaturetracker/issues/264)
- build(deps): ⬆️ update dependencies in pnpm lockfile ([a4c5d90](https://github.com/rio-codes/tfo-creaturetracker/commit/a4c5d90))
- build(deps): bump actions/checkout from 4 to 5 (#261) ([25afb39](https://github.com/rio-codes/tfo-creaturetracker/commit/25afb39)), closes [#261](https://github.com/rio-codes/tfo-creaturetracker/issues/261)
- fix(breeding-log): 🐛 update breeding log api to update generation of progeny (#258) ([4291072](https://github.com/rio-codes/tfo-creaturetracker/commit/4291072)), closes [#258](https://github.com/rio-codes/tfo-creaturetracker/issues/258)
- fix(collection): 🐛 check userid when querying for existing tabs (#254) ([093fb42](https://github.com/rio-codes/tfo-creaturetracker/commit/093fb42)), closes [#254](https://github.com/rio-codes/tfo-creaturetracker/issues/254)

### 1.10.2 (2025-09-28)

- style(config): 💄 add new og image asset at proper dimensions ([4d02eb5](https://github.com/rio-codes/tfo-creaturetracker/commit/4d02eb5))
- fix(config): 🔧 correct errors in OG metadata ([4eab32f](https://github.com/rio-codes/tfo-creaturetracker/commit/4eab32f))
- fix(config): 🩹 tweak twitter card definition slightly ([9bd0026](https://github.com/rio-codes/tfo-creaturetracker/commit/9bd0026))
- chore(config): 🔧 add sitemap, update robots.txt ([0fb2fde](https://github.com/rio-codes/tfo-creaturetracker/commit/0fb2fde))

### 1.10.1 (2025-09-28)

- fix(config): 🐛 fix manifest filetype and path ([6e61374](https://github.com/rio-codes/tfo-creaturetracker/commit/6e61374))
- docs(docs): 📝 update CHANGELOG.md ([ffcf305](https://github.com/rio-codes/tfo-creaturetracker/commit/ffcf305))

## 1.10.0 (2025-09-28)

- feat(ui): ✨ new searchable input fields for creatures in all forms and dialogs (#252) ([67f1b98](https://github.com/rio-codes/tfo-creaturetracker/commit/67f1b98)), closes [#252](https://github.com/rio-codes/tfo-creaturetracker/issues/252)
- style(hyperdx): 🧑‍💻 add bg for hyperdx dashboard ([69d9db1](https://github.com/rio-codes/tfo-creaturetracker/commit/69d9db1))

### 1.9.1 (2025-09-28)

- integrating source map upload to hyperdx during build, also minor fix to site manifest link (#250) ([355477b](https://github.com/rio-codes/tfo-creaturetracker/commit/355477b)), closes [#250](https://github.com/rio-codes/tfo-creaturetracker/issues/250)

## 1.9.0 (2025-09-27)

- build(config): ⬆️ update pnpm lockfile to pass build ([503ccb1](https://github.com/rio-codes/tfo-creaturetracker/commit/503ccb1))
- fix(ui): 🐛 remove images array from opengraph spec ([3129aea](https://github.com/rio-codes/tfo-creaturetracker/commit/3129aea))
- fix(ui): 🐛 update metadata format ([733b755](https://github.com/rio-codes/tfo-creaturetracker/commit/733b755))
- style(ui): 💄 improve layout of opengraph embed (#246) ([b9e70dc](https://github.com/rio-codes/tfo-creaturetracker/commit/b9e70dc)), closes [#246](https://github.com/rio-codes/tfo-creaturetracker/issues/246)

### 1.8.5 (2025-09-27)

- chore(release): 🔖 patch version upgrade to v1.8.5 ([e729731](https://github.com/rio-codes/tfo-creaturetracker/commit/e729731))
- chore(release): 🔖 patch version upgrade to v1.8.5 ([f487c06](https://github.com/rio-codes/tfo-creaturetracker/commit/f487c06))
- ci(db): 🚀 add github action to backup db daily @ 2AM UTC ([116f864](https://github.com/rio-codes/tfo-creaturetracker/commit/116f864))

### 1.8.4 (2025-09-27)

- chore(homepage): 👥 add shoutout to new user in news items ([ec561c4](https://github.com/rio-codes/tfo-creaturetracker/commit/ec561c4))
- chore(release): 🔧 add robots.txt to block all ai crawlers and allow all others (#244) ([30ad4d2](https://github.com/rio-codes/tfo-creaturetracker/commit/30ad4d2)), closes [#244](https://github.com/rio-codes/tfo-creaturetracker/issues/244)
- style(pairs): 💄 fix minor ui issues, "G" for generation on form, wording of set-gen dialog ([1564553](https://github.com/rio-codes/tfo-creaturetracker/commit/1564553))
- fix(api): 🐛 make color nullable on creature-count public api (#241) ([dd8e7a2](https://github.com/rio-codes/tfo-creaturetracker/commit/dd8e7a2)), closes [#241](https://github.com/rio-codes/tfo-creaturetracker/issues/241)
- fix(collection): 🐛 remove deleted content from creature card; origin marker and gender (#242) ([e1e7544](https://github.com/rio-codes/tfo-creaturetracker/commit/e1e7544)), closes [#242](https://github.com/rio-codes/tfo-creaturetracker/issues/242)

### 1.8.3 (2025-09-27)

- fix(ui): 🔒️ sanitize html in creature and breeding pair cards ([4005a99](https://github.com/rio-codes/tfo-creaturetracker/commit/4005a99))
- fix(ui): 🔒️ sanitize html in creature and breeding pair cards ([a6e8d2a](https://github.com/rio-codes/tfo-creaturetracker/commit/a6e8d2a))
- feat(homepage): ✨ add fun statistics and random creature to homepage (#235) ([018fe22](https://github.com/rio-codes/tfo-creaturetracker/commit/018fe22)), closes [#235](https://github.com/rio-codes/tfo-creaturetracker/issues/235)

## 1.8.0 (2025-09-27)

- docs(docs): 🎨 recreate changelog with proper semvers, automate changelog (#233) ([b203eca](https://github.com/rio-codes/tfo-creaturetracker/commit/b203eca)), closes [#233](https://github.com/rio-codes/tfo-creaturetracker/issues/233)
- perf(db): ⚡️ set default generation "1" for all creatures in db schema (#232) ([2d4f62f](https://github.com/rio-codes/tfo-creaturetracker/commit/2d4f62f)), closes [#232](https://github.com/rio-codes/tfo-creaturetracker/issues/232)

### 1.7.6 (2025-09-26)

- chore(config): 🔨 update conventional-changelog npm script ([a32dd57](https://github.com/rio-codes/tfo-creaturetracker/commit/a32dd57))

### 1.7.7 (2025-09-26)

- chore(docs): 📝 create changelog, update to semver ([def0f7a](https://github.com/rio-codes/tfo-creaturetracker/commit/def0f7a))
- chore(docs): 📝 create changelog, update to semver ([fa706a9](https://github.com/rio-codes/tfo-creaturetracker/commit/fa706a9))

### 1.7.5 (2025-09-26)

- chore(release): ⬆️ upgrade patch version to reflect recent patches, update drizzle-kit (new version ([8a974de](https://github.com/rio-codes/tfo-creaturetracker/commit/8a974de))
- chore(release): ⬆️ upgrade patch version to reflect recent patches, update drizzle-kit (new version ([494a151](https://github.com/rio-codes/tfo-creaturetracker/commit/494a151))
- fix(api): 🚨 set generation to 1 if undefined/null ([39a5e68](https://github.com/rio-codes/tfo-creaturetracker/commit/39a5e68))

### 1.7.4 (2025-09-26)

- fix(collection): 🐛 allow "another lab" to be set for non G1 creatures, display both pair and 'anoth ([02abbb1](https://github.com/rio-codes/tfo-creaturetracker/commit/02abbb1)), closes [#230](https://github.com/rio-codes/tfo-creaturetracker/issues/230)
- fix(collection): 🐛 allow "another lab" to be set for non G1 creatures, display both pair and 'anoth ([ec63df3](https://github.com/rio-codes/tfo-creaturetracker/commit/ec63df3)), closes [#230](https://github.com/rio-codes/tfo-creaturetracker/issues/230)

### 1.7.3 (2025-09-26)

- fix(api): 🐛 check for existing tab id and return meaningful error message (#228) ([aa6976b](https://github.com/rio-codes/tfo-creaturetracker/commit/aa6976b)), closes [#228](https://github.com/rio-codes/tfo-creaturetracker/issues/228)

### 1.7.2 (2025-09-26)

- fix(collection): 🐛 update breeding log api so adding progeny to existing log entry checks for sourc ([588ab31](https://github.com/rio-codes/tfo-creaturetracker/commit/588ab31)), closes [#224](https://github.com/rio-codes/tfo-creaturetracker/issues/224) [#223](https://github.com/rio-codes/tfo-creaturetracker/issues/223)

### 1.7.1 (2025-09-26)

- feat(collection): 🚸 add generation update to activity log, tiny ui fix (#223) ([dbdc037](https://github.com/rio-codes/tfo-creaturetracker/commit/dbdc037)), closes [#223](https://github.com/rio-codes/tfo-creaturetracker/issues/223)

## 1.7.0 (2025-09-26)

- chore(release): 🚀 update minor version for new generations feature: v.1.3.0 ([a4b89a5](https://github.com/rio-codes/tfo-creaturetracker/commit/a4b89a5))
- fix(db): 🚑️ critical revert to db config with correct env var ([d1aacab](https://github.com/rio-codes/tfo-creaturetracker/commit/d1aacab))
- feat(collection): ✨add generation indicator to db and across site for all creatures (#221) ([b44afa0](https://github.com/rio-codes/tfo-creaturetracker/commit/b44afa0)), closes [#221](https://github.com/rio-codes/tfo-creaturetracker/issues/221) [#218](https://github.com/rio-codes/tfo-creaturetracker/issues/218) [#208](https://github.com/rio-codes/tfo-creaturetracker/issues/208)

### 1.6.2 (2025-09-26)

- fix(admin): 🐛 add force-dynamic to force update of metrics, fix link to user profile (fixes #218, # ([8e86cde](https://github.com/rio-codes/tfo-creaturetracker/commit/8e86cde)), closes [#218](https://github.com/rio-codes/tfo-creaturetracker/issues/218) [#208](https://github.com/rio-codes/tfo-creaturetracker/issues/208) [#220](https://github.com/rio-codes/tfo-creaturetracker/issues/220)

### 1.6.1 (2025-09-26)

- Apply dark mode to all text in registration flow (#219) ([b849832](https://github.com/rio-codes/tfo-creaturetracker/commit/b849832)), closes [#219](https://github.com/rio-codes/tfo-creaturetracker/issues/219)
- build(deps):⬆ bump the all-dependencies group with 4 updates (#215) ([801eddd](https://github.com/rio-codes/tfo-creaturetracker/commit/801eddd)), closes [#215](https://github.com/rio-codes/tfo-creaturetracker/issues/215)
- build(deps): ⬆ bump the all-dependencies group with 6 updates (#217) ([da7f8fd](https://github.com/rio-codes/tfo-creaturetracker/commit/da7f8fd)), closes [#217](https://github.com/rio-codes/tfo-creaturetracker/issues/217)

## 1.6.0 (2025-09-23)

- feat(activity-log): ✨ Add User Activity Log (#214) ([473d252](https://github.com/rio-codes/tfo-creaturetracker/commit/473d252)), closes [#214](https://github.com/rio-codes/tfo-creaturetracker/issues/214)
- build(deps): ⬆ bump the all-dependencies group with 4 updates (#213) ([3a76b14](https://github.com/rio-codes/tfo-creaturetracker/commit/3a76b14)), closes [#213](https://github.com/rio-codes/tfo-creaturetracker/issues/213)

### 1.5.1 (2025-09-22)

- fix(profile): 💄 fix text overflowing featured creature and goal cards (#210) ([2921179](https://github.com/rio-codes/tfo-creaturetracker/commit/2921179)), closes [#210](https://github.com/rio-codes/tfo-creaturetracker/issues/210)
- build(deps): bump @opentelemetry/api in the all-dependencies group (#209) ([c018c90](https://github.com/rio-codes/tfo-creaturetracker/commit/c018c90)), closes [#209](https://github.com/rio-codes/tfo-creaturetracker/issues/209)
- docs(docs): 📝 update news items ([36f9042](https://github.com/rio-codes/tfo-creaturetracker/commit/36f9042))

## 1.5.0 (2025-09-22)

- feat(profile): ✨ add custom FlairIcon component for internal roles and supporter tiers (#206) ([3c4915f](https://github.com/rio-codes/tfo-creaturetracker/commit/3c4915f)), closes [#206](https://github.com/rio-codes/tfo-creaturetracker/issues/206)

## 1.4.0 (2025-09-22)

- feat(profile): ✨ add featuring toggle to featured creature and goal cards on profile (#204) ([d5d2bfe](https://github.com/rio-codes/tfo-creaturetracker/commit/d5d2bfe)), closes [#204](https://github.com/rio-codes/tfo-creaturetracker/issues/204)
- Fix settings validation (#203) ([0eb9439](https://github.com/rio-codes/tfo-creaturetracker/commit/0eb9439)), closes [#203](https://github.com/rio-codes/tfo-creaturetracker/issues/203)

### 1.3.1 (2025-09-21)

- fix(profile): 🚑️ add typing to supporter tiers in flair api ([fdc3e34](https://github.com/rio-codes/tfo-creaturetracker/commit/fdc3e34))
- fix(settings): ⏪️ revert changes to settings page ([5d3c7c3](https://github.com/rio-codes/tfo-creaturetracker/commit/5d3c7c3))
- fix(settings): 🐛 Allow password to be optional and fix validation (#202) ([03f4d16](https://github.com/rio-codes/tfo-creaturetracker/commit/03f4d16)), closes [#202](https://github.com/rio-codes/tfo-creaturetracker/issues/202)
- fix(settings): 🚑️ restore previous settings validation schema ([1def47d](https://github.com/rio-codes/tfo-creaturetracker/commit/1def47d))

## 1.3.0 (2025-09-21)

- feat(profile): 🚧 add new db schema with flair and other updates ([0fdcd82](https://github.com/rio-codes/tfo-creaturetracker/commit/0fdcd82))

### 1.2.4 (2025-09-21)

- fix(pairs): 🐛 change deprecated data validation function in parent ID check ([fc613c2](https://github.com/rio-codes/tfo-creaturetracker/commit/fc613c2))

### 1.2.3 (2025-09-21)

- fix(settings): 🚑️ reverting code on settings page to working version ([3b9a5bb](https://github.com/rio-codes/tfo-creaturetracker/commit/3b9a5bb))

## 1.2.2 (2025-09-21)

- fix(goals): 🐛 change optional prediction logic so probability is set to 100% for optional genes, fi ([d43bb5b](https://github.com/rio-codes/tfo-creaturetracker/commit/d43bb5b)), closes [#190](https://github.com/rio-codes/tfo-creaturetracker/issues/190) [#201](https://github.com/rio-codes/tfo-creaturetracker/issues/201)
- build(deps): ⬆️ update 6 dependencies, allow protobuf build script, increment version due to previou ([38cea31](https://github.com/rio-codes/tfo-creaturetracker/commit/38cea31))

### 1.2.1 (2025-09-21)

- fix(pairs): 🐛 fix overflow on edit breeding pair dialog and form, breeding pair card and manage pai ([0b9856f](https://github.com/rio-codes/tfo-creaturetracker/commit/0b9856f)), closes [#200](https://github.com/rio-codes/tfo-creaturetracker/issues/200)
- Add archiving feature. Fixes #192 (#198) ([fb5a300](https://github.com/rio-codes/tfo-creaturetracker/commit/fb5a300)), closes [#192](https://github.com/rio-codes/tfo-creaturetracker/issues/192) [#198](https://github.com/rio-codes/tfo-creaturetracker/issues/198)

### 1.1.2 (2025-09-20)

- Update schema.ts (#195) ([81e08a7](https://github.com/rio-codes/tfo-creaturetracker/commit/81e08a7)), closes [#195](https://github.com/rio-codes/tfo-creaturetracker/issues/195)

### 1.1.1 (2025-09-20)

- fix(ui): 🚑️ convert text in svg to path for proper display (#196) ([d719ac4](https://github.com/rio-codes/tfo-creaturetracker/commit/d719ac4)), closes [#196](https://github.com/rio-codes/tfo-creaturetracker/issues/196)

## 1.1.0 (2025-09-20)

- feat(admin): ✨ add more metrics to admin dashboard including data statistics and random creature (#1 ([5607635](https://github.com/rio-codes/tfo-creaturetracker/commit/5607635)), closes [#193](https://github.com/rio-codes/tfo-creaturetracker/issues/193)

### 1.0.3 (2025-09-20)

- fix(profile): 🐛 remove link to others' goals from featured card, #185 (#191) ([2d183b2](https://github.com/rio-codes/tfo-creaturetracker/commit/2d183b2)), closes [#185](https://github.com/rio-codes/tfo-creaturetracker/issues/185) [#191](https://github.com/rio-codes/tfo-creaturetracker/issues/191)
- fix(settings): 🐛 fix validation errors: make tabName nullable, make items per page number, not stri ([9a1fb32](https://github.com/rio-codes/tfo-creaturetracker/commit/9a1fb32)), closes [#189](https://github.com/rio-codes/tfo-creaturetracker/issues/189) [#188](https://github.com/rio-codes/tfo-creaturetracker/issues/188) [#181](https://github.com/rio-codes/tfo-creaturetracker/issues/181)

### 1.0.2 (2025-09-20)

- fix(settings): 🐛 coerce input on items per page settings from string to number (#181) (#184) ([c22c0eb](https://github.com/rio-codes/tfo-creaturetracker/commit/c22c0eb)), closes [#181](https://github.com/rio-codes/tfo-creaturetracker/issues/181) [#184](https://github.com/rio-codes/tfo-creaturetracker/issues/184) [#181](https://github.com/rio-codes/tfo-creaturetracker/issues/181)
- fix(settings): 🐛 ensure validation schema has all optional settings (#188) ([8c4bb79](https://github.com/rio-codes/tfo-creaturetracker/commit/8c4bb79)), closes [#188](https://github.com/rio-codes/tfo-creaturetracker/issues/188) [#181](https://github.com/rio-codes/tfo-creaturetracker/issues/181)

### 1.0.1 (2025-09-19)

- fix(hyperdx): 🚑️ move hyperdx init outside of function, add useEffect to get session data ([54921ed](https://github.com/rio-codes/tfo-creaturetracker/commit/54921ed))

## 1.0.0 (2025-09-19)

- Launch Day! v1.1.9 (#180) ([3378838](https://github.com/rio-codes/tfo-creaturetracker/commit/3378838)), closes [#180](https://github.com/rio-codes/tfo-creaturetracker/issues/180)
