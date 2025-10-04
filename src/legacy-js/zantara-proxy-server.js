const express = require('express');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static('.'));

// Proxy endpoint for API calls
app.use('/api/*', express.json(), async (req, res) => {
    const apiPath = req.params[0];
    try {
        const response = await axios({
            method: req.method,
            url: `http://localhost:8080/${apiPath}`,
            data: req.body,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': req.headers['x-api-key'] || 'zantara-internal-dev-key-2025'
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Proxy error:', error.message);
        res.status(error.response?.status || 500).json({
            ok: false,
            error: error.response?.data?.error || error.message
        });
    }
});

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'zantara-intelligence-v7-fixed.html'));
});

app.listen(PORT, () => {
    console.log(`✨ ZANTARA Proxy Server running at http://localhost:${PORT}`);
    console.log(`📱 Open http://localhost:${PORT} in your browser`);
});