const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');

const app = express();
app.use(express.json());
app.use(cors());

app.use('/auth', authRoutes);

app.get('/courts', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM court');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));