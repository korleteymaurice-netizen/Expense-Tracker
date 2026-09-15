const router = require('express').Router();
const auth = require('../middleware/auth');
const pool = require('../db/pool');
const categories = ['Salary','Freelance','Business','Food','Transport','Housing','Bills','Shopping','Health','Education','Entertainment','Other'];

function valid(body) {
  const type = body.type === 'income' || body.type === 'expense' ? body.type : null;
  const amount = Number(body.amount);
  const category = String(body.category || '').trim();
  const date = String(body.transaction_date || '').trim();
  return type && Number.isFinite(amount) && amount > 0 && category && /^\d{4}-\d{2}-\d{2}$/.test(date);
}

router.get('/', auth, async (req,res,next) => {
  try {
    const uid=req.session.user.id, { type='', category='', search='' }=req.query;
    const params=[uid]; let where='WHERE user_id=$1';
    if (type) { params.push(type); where += ` AND type=$${params.length}`; }
    if (category) { params.push(category); where += ` AND category=$${params.length}`; }
    if (search) { params.push(`%${search}%`); where += ` AND (description ILIKE $${params.length} OR category ILIKE $${params.length})`; }
    const result=await pool.query(`SELECT * FROM transactions ${where} ORDER BY transaction_date DESC,id DESC`,params);
    res.render('transactions',{title:'Transactions',transactions:result.rows,categories,type,category,search});
  } catch(err){next(err);}
});

router.get('/new', auth, (req,res)=>res.render('transaction-form',{title:'Add transaction',transaction:null,categories}));

router.post('/', auth, async (req,res,next)=>{
  try {
    if(!valid(req.body)) return res.status(400).render('transaction-form',{title:'Add transaction',transaction:req.body,categories,error:'Please enter valid transaction details.'});
    await pool.query(`INSERT INTO transactions(user_id,type,amount,category,description,transaction_date) VALUES($1,$2,$3,$4,$5,$6)`,[req.session.user.id,req.body.type,Number(req.body.amount),req.body.category.trim(),String(req.body.description||'').trim(),req.body.transaction_date]);
    res.redirect('/transactions');
  }catch(err){next(err);}
});

router.get('/:id/edit', auth, async(req,res,next)=>{
  try { const r=await pool.query('SELECT * FROM transactions WHERE id=$1 AND user_id=$2',[req.params.id,req.session.user.id]); if(!r.rowCount)return res.status(404).render('error',{title:'Not found',message:'Transaction not found.'}); res.render('transaction-form',{title:'Edit transaction',transaction:r.rows[0],categories}); } catch(err){next(err);}
});

router.post('/:id/update', auth, async(req,res,next)=>{
  try { if(!valid(req.body)) return res.status(400).render('transaction-form',{title:'Edit transaction',transaction:{...req.body,id:req.params.id},categories,error:'Please enter valid transaction details.'}); const r=await pool.query(`UPDATE transactions SET type=$1,amount=$2,category=$3,description=$4,transaction_date=$5 WHERE id=$6 AND user_id=$7`,[req.body.type,Number(req.body.amount),req.body.category.trim(),String(req.body.description||'').trim(),req.body.transaction_date,req.params.id,req.session.user.id]); if(!r.rowCount)return res.status(404).render('error',{title:'Not found',message:'Transaction not found.'}); res.redirect('/transactions'); } catch(err){next(err);}
});

router.post('/:id/delete', auth, async(req,res,next)=>{try{await pool.query('DELETE FROM transactions WHERE id=$1 AND user_id=$2',[req.params.id,req.session.user.id]);res.redirect('/transactions');}catch(err){next(err);}});
module.exports=router;
