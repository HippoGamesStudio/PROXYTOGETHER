const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;

app.post('/chat', async (req, res) => {
    try{
        const userMessage = req.body.message;

        const response = await axios.post('https://api.together.xyz/v1/chat/completions', {   
              model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
              messages: [{role: "user", content: userMessage}]
            }, {
                headers: {
                    'Authorization': `Bearer ${TOGETHER_API_KEY}`,
                    'Content-Type': 'application/json'
               }
            });

        const aiReply = response.data.choices[0].message.content;

        const emotionPrompt = `Ответ: "${aiReply}". Какая в нём эмоция? И пожалуйста не добавляй ничего на конце! Ответь одним словом: радость, грусть, злость, удивление, нейтрально.`;

        
        const responseEmotion = await axios.post('https://api.together.xyz/v1/chat/completions', {   
              model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
              messages: [{role: "user", content: emotionPrompt}]
            }, {
                headers: {
                    'Authorization': `Bearer ${TOGETHER_API_KEY}`,
                    'Content-Type': 'application/json'
               }
            });
        const emotionRaw = responseEmotion.data.choices[0].message.content.trim().toLowerCase();

        res.json({
            reply: aiReply,
            emotion: emotionRaw,
        });
        
    }   catch (err){
        console.error(err.response?.data || err.message);
        res.status(500).json({error: 'Someothing went wrong'});
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🟢 Proxy server running on port ${PORT}`);
})
