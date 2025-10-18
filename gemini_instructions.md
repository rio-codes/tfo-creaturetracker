## INSTRUCTIONS TO AI CODE ASSISTANT

1. Do not ever write or edit my code via diffs. Advise me on what changes need to be made, act as a code reviewer and educator, but never change my code.

2. Whenever possible, when making recommendations make sure they are properly typed, and if types/interfaces need to be created you can suggest those.

3. If information or code you need to answer a question or make a suggestion is not part of your context, ask for me to add it to the context, do not assume anything about the contents of files you cannot see.

4. This is my project structure:

```
.
├── app
│   ├── account
│   │   └── activity
│   │       └── page.tsx
│   ├── admin
│   │   ├── audit-log
│   │   │   ├── columns.tsx
│   │   │   └── page.tsx
│   │   ├── breeding-pairs
│   │   │   ├── breeding-pairs-page-client.tsx
│   │   │   ├── columns.tsx
│   │   │   └── page.tsx
│   │   ├── create-creature
│   │   │   └── page.tsx
│   │   ├── creatures
│   │   │   ├── columns.tsx
│   │   │   ├── creatures-page-client.tsx
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── reports
│   │   │   ├── columns.tsx
│   │   │   ├── data-table.tsx
│   │   │   └── page.tsx
│   │   ├── research-goals
│   │   │   ├── columns.tsx
│   │   │   ├── page.tsx
│   │   │   └── research-goals-page-client.tsx
│   │   └── users
│   │       ├── columns.tsx
│   │       ├── data-table.tsx
│   │       └── page.tsx
│   ├── api
│   │   ├── admin
│   │   │   ├── breeding-pairs
│   │   │   │   └── [pairId]
│   │   │   │       └── route.ts
│   │   │   ├── create-creature
│   │   │   │   └── route.ts
│   │   │   ├── creature-preview
│   │   │   │   └── route.ts
│   │   │   ├── creatures
│   │   │   │   └── [creatureId]
│   │   │   │       └── route.ts
│   │   │   ├── metrics
│   │   │   │   └── route.ts
│   │   │   ├── reports
│   │   │   │   ├── [reportId]
│   │   │   │   │   └── status
│   │   │   │   │       └── route.ts
│   │   │   │   └── route.ts
│   │   │   ├── research-goals
│   │   │   │   └── [goalId]
│   │   │   │       └── route.ts
│   │   │   └── users
│   │   │       ├── route.ts
│   │   │       └── [userId]
│   │   │           ├── flair
│   │   │           │   └── route.ts
│   │   │           ├── route.ts
│   │   │           └── status
│   │   │               └── route.ts
│   │   ├── auth
│   │   │   └── [...nextauth]
│   │   │       └── route.ts
│   │   ├── avatar
│   │   │   └── upload
│   │   │       └── route.ts
│   │   ├── breeding-log
│   │   │   └── route.ts
│   │   ├── breeding-pairs
│   │   │   ├── [pairId]
│   │   │   │   ├── assign-goal
│   │   │   │   │   └── route.ts
│   │   │   │   ├── outcomes
│   │   │   │   │   └── route.ts
│   │   │   │   ├── outcomes-preview
│   │   │   │   │   └── route.ts
│   │   │   │   ├── pin
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   └── route.ts
│   │   ├── breeding-predictions
│   │   │   └── route.ts
│   │   ├── creatures
│   │   │   ├── archive-many
│   │   │   │   └── route.ts
│   │   │   ├── [creatureId]
│   │   │   │   ├── archive
│   │   │   │   │   └── route.ts
│   │   │   │   ├── generation
│   │   │   │   │   └── route.ts
│   │   │   │   ├── pin
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   ├── sync
│   │   │   │   └── route.ts
│   │   │   └── sync-all
│   │   │       └── route.ts
│   │   ├── friends
│   │   │   └── actions
│   │   │       └── route.ts
│   │   ├── password-reset
│   │   │   ├── confirm
│   │   │   │   └── route.ts
│   │   │   └── request
│   │   │       ├── confirm
│   │   │       │   └── route.ts
│   │   │       └── route.ts
│   │   ├── register
│   │   │   ├── complete
│   │   │   │   └── route.ts
│   │   │   ├── route.ts
│   │   │   └── start
│   │   │       └── route.ts
│   │   ├── reorder-pinned
│   │   │   └── route.ts
│   │   ├── report
│   │   │   └── route.ts
│   │   ├── research-goals
│   │   │   ├── from-outcomes
│   │   │   │   └── route.ts
│   │   │   ├── [goalId]
│   │   │   │   ├── convert-to-genotype
│   │   │   │   │   └── route.ts
│   │   │   │   ├── pin
│   │   │   │   │   └── route.ts
│   │   │   │   ├── refresh-image
│   │   │   │   │   └── route.ts
│   │   │   │   ├── route.ts
│   │   │   │   └── toggle-mode
│   │   │   │       └── route.ts
│   │   │   ├── preview-image
│   │   │   │   └── route.ts
│   │   │   └── route.ts
│   │   ├── settings
│   │   │   └── route.ts
│   │   ├── share
│   │   │   └── [goalId]
│   │   │       └── route.tsx
│   │   ├── users
│   │   │   ├── change-avatar
│   │   │   │   └── route.ts
│   │   │   └── tabs
│   │   │       ├── [id]
│   │   │       │   └── route.ts
│   │   │       └── route.ts
│   │   └── verification
│   │       ├── creature-details
│   │       │   └── route.ts
│   │       └── start
│   │           └── route.ts
│   ├── breeding-pairs
│   │   ├── loading.tsx
│   │   └── page.tsx
│   ├── ClientProviders.tsx
│   ├── collection
│   │   ├── loading.tsx
│   │   └── page.tsx
│   ├── favicon.ico
│   ├── forgot-password
│   │   └── page.tsx
│   ├── globals.css
│   ├── help
│   │   └── page.tsx
│   ├── home
│   │   └── page.tsx
│   ├── layout.tsx
│   ├── login
│   │   └── page.tsx
│   ├── manifest.json
│   ├── not-found.tsx
│   ├── page.tsx
│   ├── postcss.config.mjs
│   ├── privacy
│   │   └── page.tsx
│   ├── register
│   │   └── page.tsx
│   ├── research-goals
│   │   ├── [goalId]
│   │   │   └── page.tsx
│   │   ├── loading.tsx
│   │   └── page.tsx
│   ├── reset-password
│   │   └── page.tsx
│   ├── settings
│   │   └── page.tsx
│   ├── share
│   │   └── goals
│   │       └── [goalId]
│   │           └── page.tsx
│   ├── terms
│   │   └── page.tsx
│   └── [username]
│       └── page.tsx
├── auth.ts
├── CHANGELOG.md
├── commitlint.config.js
├── components
│   ├── custom-buttons
│   │   ├── friendship-button.tsx
│   │   └── report-user-button.tsx
│   ├── custom-cards
│   │   ├── breeding-pair-card.tsx
│   │   ├── creature-card.tsx
│   │   ├── featured-creature-card.tsx
│   │   ├── featured-goal-card.tsx
│   │   ├── research-goal-card.tsx
│   │   └── responsive-creature-link.tsx
│   ├── custom-clients
│   │   ├── breeding-pair-client.tsx
│   │   ├── collection-client.tsx
│   │   ├── goal-detail-client.tsx
│   │   └── research-goal-client.tsx
│   ├── custom-dialogs
│   │   ├── add-breeding-pair-dialog.tsx
│   │   ├── add-creatures-dialog.tsx
│   │   ├── add-goal-dialog.tsx
│   │   ├── assign-breeding-pair-dialog.tsx
│   │   ├── edit-breeding-pair-dialog.tsx
│   │   ├── edit-goal-dialog.tsx
│   │   ├── edit-log-dialog.tsx
│   │   ├── find-potential-pairs-dialog.tsx
│   │   ├── goal-mode-switcher-dialog.tsx
│   │   ├── log-as-progeny-dialog.tsx
│   │   ├── log-breeding-dialog.tsx
│   │   ├── manage-breeding-pairs-dialog.tsx
│   │   ├── set-generation-dialog.tsx
│   │   ├── view-item-dialog.tsx
│   │   ├── view-logs-dialog.tsx
│   │   └── view-outcomes-dialog.tsx
│   ├── custom-forms
│   │   ├── add-breeding-pair-form.tsx
│   │   ├── admin-data-table.tsx
│   │   ├── create-creature-form.tsx
│   │   ├── edit-breeding-pair-form.tsx
│   │   ├── goal-form.tsx
│   │   ├── log-breeding-form.tsx
│   │   ├── manage-breeding-pairs-form.tsx
│   │   ├── register-form.tsx
│   │   ├── registration-flow.tsx
│   │   ├── research-goal-form.tsx
│   │   ├── reset-password-form.tsx
│   │   ├── settings-form.tsx
│   │   └── user-management-table.tsx
│   ├── custom-layout-elements
│   │   ├── footer.tsx
│   │   ├── header.tsx
│   │   └── nav-link.tsx
│   ├── custom-tables
│   │   ├── admin-data-table.tsx
│   │   └── user-management-table.tsx
│   ├── misc-custom-components
│   │   ├── creature-combobox.tsx
│   │   ├── flair-icon.tsx
│   │   ├── goal-prediction-summary.tsx
│   │   ├── info-display.tsx
│   │   ├── pagination.tsx
│   │   ├── predictions-accordion.tsx
│   │   ├── responsive-creature-link.tsx
│   │   ├── share-goal-button.tsx
│   │   ├── social-links.tsx
│   │   ├── species-avatar.tsx
│   │   └── theme-syncer.tsx
│   ├── shared-views
│   │   ├── shared-goal-header.tsx
│   │   ├── shared-goal-info.tsx
│   │   ├── shared-predictions-accordion.tsx
│   │   └── shared-progeny-analysis.tsx
│   ├── theme-provider.tsx
│   └── ui
│       ├── accordion.tsx
│       ├── alert-dialog.tsx
│       ├── alert.tsx
│       ├── aspect-ratio.tsx
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── breadcrumb.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── carousel.tsx
│       ├── checkbox.tsx
│       ├── collapsible.tsx
│       ├── command.tsx
│       ├── context-menu.tsx
│       ├── dialog.tsx
│       ├── drawer.tsx
│       ├── dropdown-menu.tsx
│       ├── form.tsx
│       ├── hover-card.tsx
│       ├── input-otp.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── menubar.tsx
│       ├── navigation-menu.tsx
│       ├── pagination.tsx
│       ├── popover.tsx
│       ├── progress.tsx
│       ├── radio-group.tsx
│       ├── resizable.tsx
│       ├── scroll-area.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── sheet.tsx
│       ├── sidebar.tsx
│       ├── skeleton.tsx
│       ├── slider.tsx
│       ├── sonner.tsx
│       ├── switch.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       ├── textarea.tsx
│       ├── toggle-group.tsx
│       ├── toggle.tsx
│       ├── tooltip.tsx
│       └── use-mobile.tsx
├── components.json
├── constants
│   ├── app.ts
│   ├── badge-data.ts
│   ├── creature-data.ts
│   ├── obscenity-blacklist.ts
│   └── paths.ts
├── drizzle.config.ts
├── eslint.config.mjs
├── gemini_instructions.md
├── hooks
│   ├── use-mobile.ts
│   ├── use-mobile.tsx
│   └── use-mounted.ts
├── instrumentation.ts
├── lib
│   ├── admin-data.ts
│   ├── api
│   │   ├── goals.ts
│   │   └── user-actions.ts
│   ├── audit.ts
│   ├── avatars.ts
│   ├── breeding-rules.ts
│   ├── creature-utils.ts
│   ├── data-helpers.ts
│   ├── data.ts
│   ├── definitions.ts
│   ├── enrichAndSerializeGoal.ts
│   ├── genetics.ts
│   ├── goal-analysis.ts
│   ├── mail.ts
│   ├── obscenity.ts
│   ├── sanitize.client.ts
│   ├── sanitize.server.ts
│   ├── sanitize.ts
│   ├── serialization.ts
│   ├── tfo-sync.ts
│   ├── tfo-utils.ts
│   ├── user-actions.ts
│   └── utils.ts
├── LICENSE
├── middleware.ts
├── next.config.mjs
├── next-env.d.ts
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── postcss.config.mjs
├── README.md
├── services
│   └── alert.service.ts
├── src
│   └── db
│       ├── audit-log-schema.ts
│       ├── index.ts
│       ├── migrations
│       │   ├── 0000_clumsy_gamora.sql
│       │   ├── 0001_sloppy_blur.sql
│       │   └── meta
│       │       ├── 0000_snapshot.json
│       │       ├── 0001_snapshot.json
│       │       └── _journal.json
│       ├── route.ts
│       └── schema.ts
├── tsconfig.json
└── types
    ├── index.ts
    ├── next-auth.d.ts
    └── next-env.d.ts
```

If you need access to any of these files, ASK ME. Do not assume their contents.

5. Always default to a "code review" style of advice that informs and suggests general changes rather than rewriting or writing new code unless I explicitly ask you to write code for me.

6. Again, **never** use diffs to change my code.

7. It is ok to ask me clarifying questions, **NEVER ASSUME**.

8. Use our existing types as much as possible, especially EnrichedCreature, EnrichedResearchGoal, and EnrichedBreedingPair. Rather than changing types to fit this code, change the code to fit the types.

9. If you want to make a change to my database schema, justify it clearly and **DO NOT JUST DO IT**.

10. If you are making a change on a component, trace the data all the way from the database or API to the component and make sure it is passed correctly and all types match up. Tell me each step and what parameters are being passed from component to component, with their corresponding types.

11. Make sure data validation in API routes matches the database schema

12. Make sure all variables are used, if they are needed but not explicitly used not prefix an underscore to signify to ESLint that we are ignoring them.

13. Keep the entire codebase structure in mind when recommending changes, keep it neat and tidy. When creating a new component, put it into one of my existing component folders, do not create a new folder.

14. Recommend a test for me to perform for any changes you suggest before I apply them.

15. There are some recurring issues that you seem to keep having issues with, I will keep a running list of them in this file.

a. Zod's .flatten method is deprecated, no matter what you say. Stop recommending that I use it.
