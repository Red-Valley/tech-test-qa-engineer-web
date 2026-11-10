# Tech Test: QA Engineer (Web Platform)

> **Time limit: 2–3 hours.** We value judgment and prioritization over exhaustive coverage. If you run out of time, write down what you would do next.

## Context

**Pixel Market** is a small web store for indie games. It has a product catalog with search, sorting and pagination, a cart with coupons, a checkout flow and an order history. It is built on a REST API backed by SQLite.

The team is about to release it, and you are the QA engineer on the release. **The app contains defects.** Your job is to find them, document them clearly, and leave behind automation that prevents regressions.

## Running the app

Requirements: **Node.js 22.13 or later**. There are no npm dependencies.

> The backend (`server.js`) ships as a compiled build. **Test it as a black box**, the same way you would test a deployed service. Your tools are the UI, the API and the database.

```bash
npm start          # http://localhost:3000
npm run reset      # restore the database to its seed state
```

- The SQLite database is created at `data/store.db`. Inspect it with any client you like, such as the `sqlite3` CLI, DBeaver or TablePlus.
- `POST /api/reset` also restores the seed data. Use it to keep your automated tests isolated.

### Product requirements (source of truth)

| Area | Expected behavior |
|---|---|
| Users | Use the "Signed in as" selector to switch users. The API identifies the user with the `X-User-Id` header. |
| Search | Matches the game **title or developer**. It is **case-insensitive** and supports partial matches. |
| Sorting | Title A–Z / Z–A, price low→high / high→low (numeric), and top rated. |
| Pagination | 6 items per page. Every product appears **exactly once** across the pages. |
| Cart | Quantity is a **whole number ≥ 1** and cannot exceed the available stock. Out-of-stock games cannot be added from the UI **or** the API. The cart counter shows the total number of units. |
| Coupons | The percentage discount applies to the **whole cart subtotal**. Expired coupons are rejected. Codes are case-insensitive. Active codes: `SAVE10` (10%) and `WELCOME5` (5%). `LAUNCH50` expired on 2026-10-31. |
| Money | All amounts are shown in USD with exactly 2 decimals. `total = subtotal − discount`. |
| Checkout | Requires a valid email address. It creates an order with its items and **reduces each product's stock by the quantity purchased**. |
| Orders | A user can see **only their own** orders, in the list and by ID. |
| API errors | Invalid input returns `4xx` with a clear message. Internal details are never exposed. |
| Compatibility | Latest Chrome, Firefox, Safari and Edge, plus mobile viewports (≥ 375px wide). |

### API reference

| Method | Endpoint | Notes |
|---|---|---|
| GET | `/api/health` | |
| POST | `/api/reset` | Resets the database and all carts |
| GET | `/api/users` | |
| GET | `/api/products?search=&sort=title\|price\|rating&order=asc\|desc&page=&pageSize=` | |
| GET | `/api/products/:id` | |
| GET | `/api/cart` | Requires `X-User-Id` |
| POST | `/api/cart/items` | `{ "productId": 1, "quantity": 1 }` |
| PATCH | `/api/cart/items/:productId` | `{ "quantity": 2 }` |
| DELETE | `/api/cart/items/:productId` | |
| POST / DELETE | `/api/cart/coupon` | `{ "code": "SAVE10" }` |
| POST | `/api/checkout` | `{ "email": "you@example.com" }` |
| GET | `/api/orders` | The current user's orders |
| GET | `/api/orders/:id` | |

## What to deliver

### 1. Bug reports: `BUGS.md`

List every defect you find. Each bug needs:

- a title and a **severity** (Critical / High / Medium / Low), plus one line on why you chose that severity,
- the environment (browser and viewport, or API),
- numbered steps to reproduce,
- the expected result versus the actual result,
- evidence (a screenshot, a curl command or a test name) where it helps.

**Order the list by severity.** Quality matters more than quantity.

Write each bug in `BUGS.md` like a GitHub issue, using this template (do **not** open issues on this repository):

```markdown
## BUG-01: <short title>
- **Severity:** Critical / High / Medium / Low, plus one line on why
- **Environment:** browser + version and viewport, or API

**Steps to reproduce**
1. ...
2. ...

**Expected:** ...
**Actual:** ...
**Evidence:** screenshot, curl command or test name
```

### 2. Test design: `TEST_CASES.md`

- Write test cases for the **cart + coupon + checkout** flow, in whatever format you use at work (a table or Gherkin are both fine). Cover the happy path, boundaries and negative cases.
- Add a short note (5–10 lines) on what you would put in a **regression suite** that runs on every PR, and what you would leave out.

### 3. Automation: `tests/`

In the framework of your choice (**Playwright, Cypress, Selenium WebDriver or pytest**):

- write at least **3 UI tests** and **3 API tests**,
- make the tests independent and repeatable, using `/api/reset` or your own setup,
- you **may** write tests that fail because of a real bug, as long as you mark them clearly (for example `test.fail()`, `xfail` or a comment linking to the bug in `BUGS.md`),
- add the commands to install and run the tests to your submission email.

**Bonus:** a GitHub Actions workflow that starts the app and runs your tests.

### 4. Data validation: `SQL.md`

Write SQL queries against `data/store.db` that answer these questions, and include the result you got for each:

1. Which orders have a `total` that does **not** equal `SUM(quantity × unit_price) − discount` of their items?
2. After you place an order through the UI, which query proves whether the stock was reduced correctly?
3. Are there any order items with a quantity ≤ 0? *(Run this after you have tried to break the cart.)*

### 5. AI workflow: `AI_WORKFLOW.md` (mandatory)

We expect you to use AI tools. We want to see **how** you used them:

- which tools you used (for example Claude Code, Cursor, Copilot or ChatGPT) and why,
- 3–5 representative prompts and what you got from them,
- **one case where the AI was wrong or missed something**, and how you noticed,
- what you would **not** delegate to AI when you do QA.

## Out of scope

- Fixing the bugs. **Don't change the application code.** Only report and test.
- Performance and load testing.
- Authentication beyond the `X-User-Id` header.

## Evaluation

| Criterion | Weight |
|---|---|
| Bug finding and quality of the bug reports (clarity, severity, reproducibility) | 30% |
| Automation (structure, stability, assertions, readability) | 25% |
| Test design and coverage thinking | 15% |
| Use of AI tools (`AI_WORKFLOW.md`) | 15% |
| Data validation (SQL) | 5% |
| Communication (submission email, README, trade-offs) | 10% |

## Submission

**Deadline: 72 hours** from the moment you receive this test.

> ⚠️ **Do not fork this repository, and do not open Pull Requests or Issues here.** This repository is public, so anything posted on it is visible to other candidates.

1. Put your work in **your own private repository**: click **Use this template → Create a new repository** and choose **Private**, or clone this repository and push it to a new private repository. Do not use a fork.
2. Add your deliverables (`BUGS.md`, `TEST_CASES.md`, `SQL.md`, `AI_WORKFLOW.md` and `tests/`).
3. Invite the GitHub user **`aatrv`** as a collaborator on your private repository (Settings → Collaborators).
4. Send an email:
   - **To:** almer.ibarra@rvstaffing.com
   - **CC:** maria.leon@rvstaffing.com
   - **Subject:** `QA Engineer - <Your full name>` (for example `QA Engineer - Jane Doe`)
   - **Attachments:** your markdown files (`BUGS.md`, `TEST_CASES.md`, `SQL.md` and `AI_WORKFLOW.md`). Do **not** attach a `.zip`: email providers block archives that contain code.
   - **Body:**
     - the link to your private repository,
     - the time you spent,
     - how to install and run your tests,
     - the trade-offs you made and what you would do with more time.

Good luck, and have fun breaking things. 🐞
