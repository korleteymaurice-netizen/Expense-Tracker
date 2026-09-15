const app = require('./server');
const pool = require('./db/pool');

const port = process.env.PORT || 3000;

pool.query('SELECT 1')
  .then(() => {
    app.listen(port, () => {
      console.log(`Expense Tracker running at http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });
