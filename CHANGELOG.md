# 🧬 TFO.CT Changelog 🧑🏿‍🔬

## <small>1.10.5 (2025-09-29)</small>

- fix(pairs): 🚨 pass proper parameters to view logs dialog, fix type error in goal tracker

- fix(pairs): 🐛 check for possible offspring species in log as progeny dialog

- style(config): 🎨 remove unused imports from eslint config
- refactor(pairs): 🎨 implement null coalescing on error handling in view logs dialog
- fix(api): 🐛 remove deprecated, unnecessary "uuid" zod prop
- docs(release): 📝 update changelog, version bump to 1.10.5

## <small>1.10.4 (2025-09-29)</small>

- chore(config): 🎨 upgrade ESLint config file to new "flat config" format
- style(settings): 🥚 set source in headers function to domain root
- fix(collection): 🐛 add raffle to G1 origins

## <small>1.10.3 (2025-09-29)</small>

- Create FUNDING.yml ([84cee0b](https://github.com/rio-codes/tfo-creaturetracker/commit/84cee0b))
- Fixes for #249, #257, #262 (#264) ([f79480a](https://github.com/rio-codes/tfo-creaturetracker/commit/f79480a)), closes [#249](https://github.com/rio-codes/tfo-creaturetracker/issues/249) [#257](https://github.com/rio-codes/tfo-creaturetracker/issues/257) [#262](https://github.com/rio-codes/tfo-creaturetracker/issues/262) [#264](https://github.com/rio-codes/tfo-creaturetracker/issues/264)
- build(deps): ⬆️ update dependencies in pnpm lockfile ([a4c5d90](https://github.com/rio-codes/tfo-creaturetracker/commit/a4c5d90))
- build(deps): bump actions/checkout from 4 to 5 (#261) ([25afb39](https://github.com/rio-codes/tfo-creaturetracker/commit/25afb39)), closes [#261](https://github.com/rio-codes/tfo-creaturetracker/issues/261)
- fix(breeding-log): 🐛 update breeding log api to update generation of progeny (#258) ([4291072](https://github.com/rio-codes/tfo-creaturetracker/commit/4291072)), closes [#258](https://github.com/rio-codes/tfo-creaturetracker/issues/258)
- fix(collection): 🐛 check userid when querying for existing tabs (#254) ([093fb42](https://github.com/rio-codes/tfo-creaturetracker/commit/093fb42)), closes [#254](https://github.com/rio-codes/tfo-creaturetracker/issues/254)

## <small>1.10.2 (2025-09-28)</small>

- style(config): 💄 add new og image asset at proper dimensions ([4d02eb5](https://github.com/rio-codes/tfo-creaturetracker/commit/4d02eb5))
- fix(config): 🔧 correct errors in OG metadata ([4eab32f](https://github.com/rio-codes/tfo-creaturetracker/commit/4eab32f))
- fix(config): 🩹 tweak twitter card definition slightly ([9bd0026](https://github.com/rio-codes/tfo-creaturetracker/commit/9bd0026))
- chore(config): 🔧 add sitemap, update robots.txt ([0fb2fde](https://github.com/rio-codes/tfo-creaturetracker/commit/0fb2fde))

## <small>1.10.1 (2025-09-28)</small>

- fix(config): 🐛 fix manifest filetype and path ([6e61374](https://github.com/rio-codes/tfo-creaturetracker/commit/6e61374))
- docs(docs): 📝 update CHANGELOG.md ([ffcf305](https://github.com/rio-codes/tfo-creaturetracker/commit/ffcf305))

## 1.10.0 (2025-09-28)

- feat(ui): ✨ new searchable input fields for creatures in all forms and dialogs (#252) ([67f1b98](https://github.com/rio-codes/tfo-creaturetracker/commit/67f1b98)), closes [#252](https://github.com/rio-codes/tfo-creaturetracker/issues/252)
- style(hyperdx): 🧑‍💻 add bg for hyperdx dashboard ([69d9db1](https://github.com/rio-codes/tfo-creaturetracker/commit/69d9db1))

## <small>1.9.1 (2025-09-28)</small>

- integrating source map upload to hyperdx during build, also minor fix to site manifest link (#250) ([355477b](https://github.com/rio-codes/tfo-creaturetracker/commit/355477b)), closes [#250](https://github.com/rio-codes/tfo-creaturetracker/issues/250)

## 1.9.0 (2025-09-27)

- build(config): ⬆️ update pnpm lockfile to pass build ([503ccb1](https://github.com/rio-codes/tfo-creaturetracker/commit/503ccb1))
- fix(ui): 🐛 remove images array from opengraph spec ([3129aea](https://github.com/rio-codes/tfo-creaturetracker/commit/3129aea))
- fix(ui): 🐛 update metadata format ([733b755](https://github.com/rio-codes/tfo-creaturetracker/commit/733b755))
- style(ui): 💄 improve layout of opengraph embed (#246) ([b9e70dc](https://github.com/rio-codes/tfo-creaturetracker/commit/b9e70dc)), closes [#246](https://github.com/rio-codes/tfo-creaturetracker/issues/246)

## <small>1.8.5 (2025-09-27)</small>

- chore(release): 🔖 patch version upgrade to v1.8.5 ([e729731](https://github.com/rio-codes/tfo-creaturetracker/commit/e729731))
- chore(release): 🔖 patch version upgrade to v1.8.5 ([f487c06](https://github.com/rio-codes/tfo-creaturetracker/commit/f487c06))
- ci(db): 🚀 add github action to backup db daily @ 2AM UTC ([116f864](https://github.com/rio-codes/tfo-creaturetracker/commit/116f864))

## <small>1.8.4 (2025-09-27)</small>

- chore(homepage): 👥 add shoutout to new user in news items ([ec561c4](https://github.com/rio-codes/tfo-creaturetracker/commit/ec561c4))
- chore(release): 🔧 add robots.txt to block all ai crawlers and allow all others (#244) ([30ad4d2](https://github.com/rio-codes/tfo-creaturetracker/commit/30ad4d2)), closes [#244](https://github.com/rio-codes/tfo-creaturetracker/issues/244)
- style(pairs): 💄 fix minor ui issues, "G" for generation on form, wording of set-gen dialog ([1564553](https://github.com/rio-codes/tfo-creaturetracker/commit/1564553))
- fix(api): 🐛 make color nullable on creature-count public api (#241) ([dd8e7a2](https://github.com/rio-codes/tfo-creaturetracker/commit/dd8e7a2)), closes [#241](https://github.com/rio-codes/tfo-creaturetracker/issues/241)
- fix(collection): 🐛 remove deleted content from creature card; origin marker and gender (#242) ([e1e7544](https://github.com/rio-codes/tfo-creaturetracker/commit/e1e7544)), closes [#242](https://github.com/rio-codes/tfo-creaturetracker/issues/242)

## <small>1.8.3 (2025-09-27)</small>

- fix(ui): 🔒️ sanitize html in creature and breeding pair cards ([4005a99](https://github.com/rio-codes/tfo-creaturetracker/commit/4005a99))
- fix(ui): 🔒️ sanitize html in creature and breeding pair cards ([a6e8d2a](https://github.com/rio-codes/tfo-creaturetracker/commit/a6e8d2a))
- feat(homepage): ✨ add fun statistics and random creature to homepage (#235) ([018fe22](https://github.com/rio-codes/tfo-creaturetracker/commit/018fe22)), closes [#235](https://github.com/rio-codes/tfo-creaturetracker/issues/235)

## 1.8.0 (2025-09-27)

- docs(docs): 🎨 recreate changelog with proper semvers, automate changelog (#233) ([b203eca](https://github.com/rio-codes/tfo-creaturetracker/commit/b203eca)), closes [#233](https://github.com/rio-codes/tfo-creaturetracker/issues/233)
- perf(db): ⚡️ set default generation "1" for all creatures in db schema (#232) ([2d4f62f](https://github.com/rio-codes/tfo-creaturetracker/commit/2d4f62f)), closes [#232](https://github.com/rio-codes/tfo-creaturetracker/issues/232)

## <small>1.7.6 (2025-09-26)</small>

- chore(config): 🔨 update conventional-changelog npm script ([a32dd57](https://github.com/rio-codes/tfo-creaturetracker/commit/a32dd57))

## <small>1.7.7 (2025-09-26)</small>

- chore(docs): 📝 create changelog, update to semver ([def0f7a](https://github.com/rio-codes/tfo-creaturetracker/commit/def0f7a))
- chore(docs): 📝 create changelog, update to semver ([fa706a9](https://github.com/rio-codes/tfo-creaturetracker/commit/fa706a9))

## <small>1.7.5 (2025-09-26)</small>

- chore(release): ⬆️ upgrade patch version to reflect recent patches, update drizzle-kit (new version ([8a974de](https://github.com/rio-codes/tfo-creaturetracker/commit/8a974de))
- chore(release): ⬆️ upgrade patch version to reflect recent patches, update drizzle-kit (new version ([494a151](https://github.com/rio-codes/tfo-creaturetracker/commit/494a151))
- fix(api): 🚨 set generation to 1 if undefined/null ([39a5e68](https://github.com/rio-codes/tfo-creaturetracker/commit/39a5e68))

## <small>1.7.4 (2025-09-26)</small>

- fix(collection): 🐛 allow "another lab" to be set for non G1 creatures, display both pair and 'anoth ([02abbb1](https://github.com/rio-codes/tfo-creaturetracker/commit/02abbb1)), closes [#230](https://github.com/rio-codes/tfo-creaturetracker/issues/230)
- fix(collection): 🐛 allow "another lab" to be set for non G1 creatures, display both pair and 'anoth ([ec63df3](https://github.com/rio-codes/tfo-creaturetracker/commit/ec63df3)), closes [#230](https://github.com/rio-codes/tfo-creaturetracker/issues/230)

## <small>1.7.3 (2025-09-26)</small>

- fix(api): 🐛 check for existing tab id and return meaningful error message (#228) ([aa6976b](https://github.com/rio-codes/tfo-creaturetracker/commit/aa6976b)), closes [#228](https://github.com/rio-codes/tfo-creaturetracker/issues/228)

## <small>1.7.2 (2025-09-26)</small>

- fix(collection): 🐛 update breeding log api so adding progeny to existing log entry checks for sourc ([588ab31](https://github.com/rio-codes/tfo-creaturetracker/commit/588ab31)), closes [#224](https://github.com/rio-codes/tfo-creaturetracker/issues/224) [#223](https://github.com/rio-codes/tfo-creaturetracker/issues/223)

## <small>1.7.1 (2025-09-26)</small>

- feat(collection): 🚸 add generation update to activity log, tiny ui fix (#223) ([dbdc037](https://github.com/rio-codes/tfo-creaturetracker/commit/dbdc037)), closes [#223](https://github.com/rio-codes/tfo-creaturetracker/issues/223)

## 1.7.0 (2025-09-26)

- chore(release): 🚀 update minor version for new generations feature: v.1.3.0 ([a4b89a5](https://github.com/rio-codes/tfo-creaturetracker/commit/a4b89a5))
- fix(db): 🚑️ critical revert to db config with correct env var ([d1aacab](https://github.com/rio-codes/tfo-creaturetracker/commit/d1aacab))
- feat(collection): ✨add generation indicator to db and across site for all creatures (#221) ([b44afa0](https://github.com/rio-codes/tfo-creaturetracker/commit/b44afa0)), closes [#221](https://github.com/rio-codes/tfo-creaturetracker/issues/221) [#218](https://github.com/rio-codes/tfo-creaturetracker/issues/218) [#208](https://github.com/rio-codes/tfo-creaturetracker/issues/208)

## <small>1.6.2 (2025-09-26)</small>

- fix(admin): 🐛 add force-dynamic to force update of metrics, fix link to user profile (fixes #218, # ([8e86cde](https://github.com/rio-codes/tfo-creaturetracker/commit/8e86cde)), closes [#218](https://github.com/rio-codes/tfo-creaturetracker/issues/218) [#208](https://github.com/rio-codes/tfo-creaturetracker/issues/208) [#220](https://github.com/rio-codes/tfo-creaturetracker/issues/220)

## <small>1.6.1 (2025-09-26)</small>

- Apply dark mode to all text in registration flow (#219) ([b849832](https://github.com/rio-codes/tfo-creaturetracker/commit/b849832)), closes [#219](https://github.com/rio-codes/tfo-creaturetracker/issues/219)
- build(deps):⬆ bump the all-dependencies group with 4 updates (#215) ([801eddd](https://github.com/rio-codes/tfo-creaturetracker/commit/801eddd)), closes [#215](https://github.com/rio-codes/tfo-creaturetracker/issues/215)
- build(deps): ⬆ bump the all-dependencies group with 6 updates (#217) ([da7f8fd](https://github.com/rio-codes/tfo-creaturetracker/commit/da7f8fd)), closes [#217](https://github.com/rio-codes/tfo-creaturetracker/issues/217)

## 1.6.0 (2025-09-23)

- feat(activity-log): ✨ Add User Activity Log (#214) ([473d252](https://github.com/rio-codes/tfo-creaturetracker/commit/473d252)), closes [#214](https://github.com/rio-codes/tfo-creaturetracker/issues/214)
- build(deps): ⬆ bump the all-dependencies group with 4 updates (#213) ([3a76b14](https://github.com/rio-codes/tfo-creaturetracker/commit/3a76b14)), closes [#213](https://github.com/rio-codes/tfo-creaturetracker/issues/213)

## <small>1.5.1 (2025-09-22)</small>

- fix(profile): 💄 fix text overflowing featured creature and goal cards (#210) ([2921179](https://github.com/rio-codes/tfo-creaturetracker/commit/2921179)), closes [#210](https://github.com/rio-codes/tfo-creaturetracker/issues/210)
- build(deps): bump @opentelemetry/api in the all-dependencies group (#209) ([c018c90](https://github.com/rio-codes/tfo-creaturetracker/commit/c018c90)), closes [#209](https://github.com/rio-codes/tfo-creaturetracker/issues/209)
- docs(docs): 📝 update news items ([36f9042](https://github.com/rio-codes/tfo-creaturetracker/commit/36f9042))

## 1.5.0 (2025-09-22)

- feat(profile): ✨ add custom FlairIcon component for internal roles and supporter tiers (#206) ([3c4915f](https://github.com/rio-codes/tfo-creaturetracker/commit/3c4915f)), closes [#206](https://github.com/rio-codes/tfo-creaturetracker/issues/206)

## 1.4.0 (2025-09-22)

- feat(profile): ✨ add featuring toggle to featured creature and goal cards on profile (#204) ([d5d2bfe](https://github.com/rio-codes/tfo-creaturetracker/commit/d5d2bfe)), closes [#204](https://github.com/rio-codes/tfo-creaturetracker/issues/204)
- Fix settings validation (#203) ([0eb9439](https://github.com/rio-codes/tfo-creaturetracker/commit/0eb9439)), closes [#203](https://github.com/rio-codes/tfo-creaturetracker/issues/203)

## <small>1.3.1 (2025-09-21)</small>

- fix(profile): 🚑️ add typing to supporter tiers in flair api ([fdc3e34](https://github.com/rio-codes/tfo-creaturetracker/commit/fdc3e34))
- fix(settings): ⏪️ revert changes to settings page ([5d3c7c3](https://github.com/rio-codes/tfo-creaturetracker/commit/5d3c7c3))
- fix(settings): 🐛 Allow password to be optional and fix validation (#202) ([03f4d16](https://github.com/rio-codes/tfo-creaturetracker/commit/03f4d16)), closes [#202](https://github.com/rio-codes/tfo-creaturetracker/issues/202)
- fix(settings): 🚑️ restore previous settings validation schema ([1def47d](https://github.com/rio-codes/tfo-creaturetracker/commit/1def47d))

## 1.3.0 (2025-09-21)

- feat(profile): 🚧 add new db schema with flair and other updates ([0fdcd82](https://github.com/rio-codes/tfo-creaturetracker/commit/0fdcd82))

## <small>1.2.4 (2025-09-21)</small>

- fix(pairs): 🐛 change deprecated data validation function in parent ID check ([fc613c2](https://github.com/rio-codes/tfo-creaturetracker/commit/fc613c2))

## <small>1.2.3 (2025-09-21)</small>

- fix(settings): 🚑️ reverting code on settings page to working version ([3b9a5bb](https://github.com/rio-codes/tfo-creaturetracker/commit/3b9a5bb))

## <small>1.2.2 (2025-09-21)</small>

- fix(goals): 🐛 change optional prediction logic so probability is set to 100% for optional genes, fi ([d43bb5b](https://github.com/rio-codes/tfo-creaturetracker/commit/d43bb5b)), closes [#190](https://github.com/rio-codes/tfo-creaturetracker/issues/190) [#201](https://github.com/rio-codes/tfo-creaturetracker/issues/201)
- build(deps): ⬆️ update 6 dependencies, allow protobuf build script, increment version due to previou ([38cea31](https://github.com/rio-codes/tfo-creaturetracker/commit/38cea31))

## <small>1.2.1 (2025-09-21)</small>

- fix(pairs): 🐛 fix overflow on edit breeding pair dialog and form, breeding pair card and manage pai ([0b9856f](https://github.com/rio-codes/tfo-creaturetracker/commit/0b9856f)), closes [#200](https://github.com/rio-codes/tfo-creaturetracker/issues/200)
- Add archiving feature. Fixes #192 (#198) ([fb5a300](https://github.com/rio-codes/tfo-creaturetracker/commit/fb5a300)), closes [#192](https://github.com/rio-codes/tfo-creaturetracker/issues/192) [#198](https://github.com/rio-codes/tfo-creaturetracker/issues/198)

## <small>1.1.2 (2025-09-20)</small>

- Update schema.ts (#195) ([81e08a7](https://github.com/rio-codes/tfo-creaturetracker/commit/81e08a7)), closes [#195](https://github.com/rio-codes/tfo-creaturetracker/issues/195)

## <small>1.1.1 (2025-09-20)</small>

- fix(ui): 🚑️ convert text in svg to path for proper display (#196) ([d719ac4](https://github.com/rio-codes/tfo-creaturetracker/commit/d719ac4)), closes [#196](https://github.com/rio-codes/tfo-creaturetracker/issues/196)

## 1.1.0 (2025-09-20)

- feat(admin): ✨ add more metrics to admin dashboard including data statistics and random creature (#1 ([5607635](https://github.com/rio-codes/tfo-creaturetracker/commit/5607635)), closes [#193](https://github.com/rio-codes/tfo-creaturetracker/issues/193)

## <small>1.0.3 (2025-09-20)</small>

- fix(profile): 🐛 remove link to others' goals from featured card, #185 (#191) ([2d183b2](https://github.com/rio-codes/tfo-creaturetracker/commit/2d183b2)), closes [#185](https://github.com/rio-codes/tfo-creaturetracker/issues/185) [#191](https://github.com/rio-codes/tfo-creaturetracker/issues/191)
- fix(settings): 🐛 fix validation errors: make tabName nullable, make items per page number, not stri ([9a1fb32](https://github.com/rio-codes/tfo-creaturetracker/commit/9a1fb32)), closes [#189](https://github.com/rio-codes/tfo-creaturetracker/issues/189) [#188](https://github.com/rio-codes/tfo-creaturetracker/issues/188) [#181](https://github.com/rio-codes/tfo-creaturetracker/issues/181)

## <small>1.0.2 (2025-09-20)</small>

- fix(settings): 🐛 coerce input on items per page settings from string to number (#181) (#184) ([c22c0eb](https://github.com/rio-codes/tfo-creaturetracker/commit/c22c0eb)), closes [#181](https://github.com/rio-codes/tfo-creaturetracker/issues/181) [#184](https://github.com/rio-codes/tfo-creaturetracker/issues/184) [#181](https://github.com/rio-codes/tfo-creaturetracker/issues/181)
- fix(settings): 🐛 ensure validation schema has all optional settings (#188) ([8c4bb79](https://github.com/rio-codes/tfo-creaturetracker/commit/8c4bb79)), closes [#188](https://github.com/rio-codes/tfo-creaturetracker/issues/188) [#181](https://github.com/rio-codes/tfo-creaturetracker/issues/181)

## <small>1.0.1 (2025-09-19)</small>

- fix(hyperdx): 🚑️ move hyperdx init outside of function, add useEffect to get session data ([54921ed](https://github.com/rio-codes/tfo-creaturetracker/commit/54921ed))

## 1.0.0 (2025-09-19)

- Launch Day! v1.1.9 (#180) ([3378838](https://github.com/rio-codes/tfo-creaturetracker/commit/3378838)), closes [#180](https://github.com/rio-codes/tfo-creaturetracker/issues/180)
