require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { SiweMessage } = require('siwe');
const jwt = require('jsonwebtoken');

// Express app
const app = express();
app.use(cors({ origin: '*', credentials: true }));
app.use(bodyParser.json());

// Config
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const APP_NAME = process.env.APP_NAME || 'MyDapp';
const DOMAIN = process.env.DOMAIN || 'localhost:4000';



// Simple in-memory nonces for demo (use DB or Redis in prod)
const nonces = new Map();

// 1) Request nonce
app.get('/nonce', (req, res) => {
    const nonce = (Math.random().toString(36) + Date.now().toString(36)).slice(2, 12);
    // for demo store ephemeral; associate with nothing — SIWE message contains it
    nonces.set(nonce, true);
    // cleanup optionally after some time
    setTimeout(() => nonces.delete(nonce), 5 * 60 * 1000);
    res.json({ nonce });
});

// 2) Verify signature and issue JWT
app.post('/verify', async (req, res) => {
    try {
        const { message, signature } = req.body;
        if (!message || !signature) {
            return res.status(400).json({ error: 'Missing message or signature' });
        }

        // ✅ Pass object directly
        const siweMessage = new SiweMessage(message);
        const fields = await siweMessage.validate(signature);

        if (!nonces.has(fields.nonce)) {
            return res.status(400).json({ error: 'Invalid or expired nonce' });
        }

        const payload = { address: fields.address };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

        nonces.delete(fields.nonce);

        return res.json({ token });
    } catch (err) {
        console.error(err);
        return res.status(400).json({ error: 'Invalid SIWE message or signature' });
    }
});



// 3) Protected endpoint example
function authMiddleware(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: 'No token' });
    const token = auth.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

app.get('/me', authMiddleware, (req, res) => {
    res.json({ address: req.user.address });
});



// Swagger setup
const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('./swagger/swagger-output.json');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

// Start server
const PORT = 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
