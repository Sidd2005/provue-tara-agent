import express from 'express';
import { tara } from './agent';

const app = express();
app.use(express.json());

app.post('/ask', async (req, res) => {
    try {
        const { question } = req.body;
        if (!question) {
            return res.status(400).json({ error: 'Question is required' });
        }
        
        console.log(`[REQUEST] POST /ask - Question: "${question}"`);
        const startTime = Date.now();

        // Run the agent
        const response = await tara.generate(question);
        
        const latency = Date.now() - startTime;
        console.log(`[RESPONSE] Latency: ${latency}ms`);
        
        res.json({ answer: response.text });
    } catch (err: any) {
        console.error(`[ERROR] POST /ask -`, err.message);
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });
}

export default app;
