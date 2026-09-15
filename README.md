# Expense Tracker

A full-stack personal expense tracker built with Node.js, Express, EJS, Bootstrap 5, vanilla JavaScript and PostgreSQL. It does not use an ORM.

## Features
- User registration and login
- Session-based authentication
- Add, edit and delete income/expense transactions
- Dashboard with income, expenses and balance
- Category spending summary
- Monthly income vs expense report
- Search, type and category filters
- Responsive Bootstrap UI
- Password hashing with bcrypt

## Setup

1. Install Node.js 18+ and PostgreSQL.
2. Create a PostgreSQL database named `expense_tracker`.
3. Copy `.env.example` to `.env` and update `DATABASE_URL` and `SESSION_SECRET`.
4. Install dependencies:

```bash
npm install
```

5. Initialize the database:

```bash
psql -U postgres -d expense_tracker -f db/schema.sql
```

6. Start the application:

```bash
npm run dev
```

Open http://localhost:3000.

## Database
The application uses the `pg` package directly. There is no Prisma or other ORM.

## Production notes
Use HTTPS, a strong session secret, a persistent session store, secure cookies, and a managed PostgreSQL database in production.
