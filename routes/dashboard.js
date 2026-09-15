const router = require('express').Router();
const auth = require('../middleware/auth');
const pool = require('../db/pool');

router.get('/', auth, (req,res) => res.redirect('/dashboard'));
router.get('/dashboard', auth, async (req,res,next) => {
  try {
    const uid = req.session.user.id;
    const summary = await pool.query(`SELECT COALESCE(SUM(amount) FILTER (WHERE type='income'),0) income, COALESCE(SUM(amount) FILTER (WHERE type='expense'),0) expenses FROM transactions WHERE user_id=$1`, [uid]);
    const recent = await pool.query(`SELECT * FROM transactions WHERE user_id=$1 ORDER BY transaction_date DESC, id DESC LIMIT 8`, [uid]);
    const categories = await pool.query(`SELECT category, SUM(amount) total FROM transactions WHERE user_id=$1 AND type='expense' GROUP BY category ORDER BY total DESC LIMIT 6`, [uid]);
    const monthly = await pool.query(`SELECT TO_CHAR(DATE_TRUNC('month', transaction_date),'Mon YYYY') AS "month", DATE_TRUNC('month', transaction_date) sort_month, COALESCE(SUM(amount) FILTER (WHERE type='income'),0) income, COALESCE(SUM(amount) FILTER (WHERE type='expense'),0) expenses FROM transactions WHERE user_id=$1 AND transaction_date >= CURRENT_DATE - INTERVAL '5 months' GROUP BY DATE_TRUNC('month', transaction_date) ORDER BY sort_month`, [uid]);
    const s = summary.rows[0];
    res.render('dashboard', { title:'Dashboard', summary:s, balance:Number(s.income)-Number(s.expenses), recent:recent.rows, categories:categories.rows, monthly:monthly.rows });
  } catch(err) { next(err); }
});
module.exports = router;
