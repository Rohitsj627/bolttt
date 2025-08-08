require("dotenv").config();
import express from "express";
import Groq from "groq-sdk";
import { BASE_PROMPT, getSystemPrompt } from "./prompts";
import {basePrompt as nodeBasePrompt} from "./defaults/node";
import {basePrompt as reactBasePrompt} from "./defaults/react";
import cors from "cors";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});


const app = express();
app.use(cors())
app.use(express.json())

app.post("/template", async (req, res) => {
    const prompt = req.body.prompt;
    
    try {
        const response = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: "Return either node or react based on what you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra."
                },
                {
                    role: 'user', 
                    content: prompt
                }
            ],
             model: 'llama3-70b-8192', // updated model
            max_tokens: 200,
            temperature: 0.1
        });

        const answer = response.choices[0]?.message?.content?.trim().toLowerCase();
        
        if (answer === "react") {
            res.json({
                prompts: [
                    BASE_PROMPT, 
                    `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`
                ],
                uiPrompts: [reactBasePrompt]
            });
            return;
        }

        if (answer === "node") {
            res.json({
                prompts: [
                    `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nodeBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`
                ],
                uiPrompts: [nodeBasePrompt]
            });
            return;
        }

        // Default to react if unclear
        res.json({
            prompts: [
                BASE_PROMPT, 
                `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`
            ],
            uiPrompts: [reactBasePrompt]
        });

    } catch (error) {
        console.error('Error calling GROQ API:', error);
        res.status(500).json({message: "Error processing request"});
    }
});


app.post("/chat", async (req, res) => {
    const messages = req.body.messages;
    
    try {
        const response = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: getSystemPrompt()
                },
                ...messages
            ],
             model: 'llama3-70b-8192', // updated model
            max_tokens: 8000,
            temperature: 0.1
        });

        console.log(response);

        res.json({
            response: response.choices[0]?.message?.content || "No response generated"
        });
    } catch (error) {
        console.error('Error calling GROQ API:', error);
        res.status(500).json({message: "Error processing chat request"});
    }
})

app.listen(3000, () => {
    console.log('Server running on port 3000');
    console.log('Make sure to set your GROQ_API_KEY in the .env file');
    console.log("Groq key loaded:", process.env.GROQ_API_KEY);

});