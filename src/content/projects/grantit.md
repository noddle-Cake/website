---
title: "Grantit — Grant Management for Small Nonprofits"
code: "GI-01"
stack: ["TypeScript", "React", "Vite", "Tailwind CSS", "Hono", "PostgreSQL", "Drizzle", "Claude API"]
summary: "Grant management for small nonprofits, split into two workspaces. **Find & apply** recommends open opportunities from the organization's approved facts, tracks applications on a kanban board, and drafts answers **grounded only in approved facts and PDFs**: every sentence quotes its source, a PDF citation opens on the cited page with the quote highlighted, and an unmatched or disputed quote blocks approval. **Manage funds** checks spending against each grant's categories **in the funder's own reporting period** rather than the fiscal year, flags grants that are off pace or past their spending deadline, and breaks each budget category down grant by grant. Business rules live in a shared package used by both the React app and the Hono + Postgres API, covered by **387 unit tests**, and the interface follows Apple's Human Interface Guidelines with contrast checked in CI."
github: "https://github.com/noddle-Cake/grantit"
demo: "https://grantit.joseyandco.com"
tagline: "Find grants, draft applications **grounded in approved facts**, and track every grant's spending **in its funder's own period**."
featured: true
order: 3
---
