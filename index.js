const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;

app.post('/search-model', async(req, res) => {
    const prompt = req.body.prompt;
    const query = encodeURIComponent(prompt);
    const SKETCHFAB_API_KEY = process.env.SKETCHFAB_API_KEY;

    try{
        
        const response = await axios.get(`https://sketchfab.com/search?q=${query}&type=models`,{
            headers: {
                Authorization: `Token ${SKETCHFAB_API_KEY}`
            }
        });

        const results = response.data.results;
        const firstGLB = results.find(m=>m.formats?.some(f=>f.format_type === "gltf"));

        if(!firstGLB) return res.status(404).json({error: "No model found"});

        const gltfFormat = firstGLB.formats.find(f => f.format_type === "gltf");
        res.json({name: firstGLB.name, url:gltfFormat.url});
    }catch(err){
        console.error(err.response?.data || err.message);
        res.status(500).json({error: 'Sketchfab error'});
    }
});


app.post('/chat', async (req, res) => {
    try{
        const {message: userMessage, systemPrompt} = req.body;

        const messages = [];
        if(systemPrompt && systemPrompt.trim()) {
            messages.push({role: "system", content: systemPrompt});
        }
        messages.push({role: "user", content: userMessage});

        const response = await axios.post('https://api.together.xyz/v1/chat/completions', {   
              model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
              messages
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
