const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

exports.signup = async (req, res) => {
    const { account_name, account_email, account_password, account_type_id } = req.body;

    try {
        // check if email already exists
        const existing = await pool.query(
            'SELECT account_id FROM account WHERE account_email = $1',
            [account_email]
        );
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(account_password, 10);

        const result = await pool.query(
            `INSERT INTO account (account_name, account_email, account_password, account_type_id)
       VALUES ($1, $2, $3, $4)
       RETURNING account_id, account_name, account_email, account_type_id`,
            [account_name, account_email, hashedPassword, account_type_id]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Signup failed' });
    }
};

exports.login = async (req, res) => {
    const { account_email, account_password } = req.body;

    try {
        const result = await pool.query(
            'SELECT * FROM account WHERE account_email = $1',
            [account_email]
        );
        const account = result.rows[0];
        if (!account) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const valid = await bcrypt.compare(account_password, account.account_password);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { account_id: account.account_id, account_type_id: account.account_type_id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            account_id: account.account_id,
            account_name: account.account_name,
            account_type_id: account.account_type_id
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Login failed' });
    }
};