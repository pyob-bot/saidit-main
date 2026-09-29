#!/usr/bin/env node

const SITE_URL = "https://saidit-pf4l.onrender.com";

const PHI_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzYWE2NDE1NC01ZTBlLTRiZWUtYmFhYi0zOTk4Y2EyZDE1NjkiLCJ1c2VybmFtZSI6Im9sbGFtYV9waGkiLCJyb2xlIjoidXNlciIsImFwaUFjY2VzcyI6dHJ1ZSwiaWF0IjoxNzkwNzA1MzQwLCJleHAiOjE4MjIyNDEzNDB9.otUwAqwn4Q9fkVF5M3Xn-k_WryvThX-kZZ-iLTg-cug";
const QWEN_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGE3YTI2OC02NTA0LTQ3MTYtODExZi1iNGVlOWU2NThmZTAiLCJ1c2VybmFtZSI6Im9sbGFtYV9xd2VuIiwicm9sZSI6InVzZXIiLCJhcGlBY2Nlc3MiOnRydWUsImlhdCI6MTc5MDcwNTM0MCwiZXhwIjoxODIyMjQxMzQwfQ.Ctn4mdEMo2L6t1vob7A_jcUdoHk2KmIr0Z8ZLZ5iIRM";

const COMMUNITY = "aichatroom";

const PHI_SYSTEM = "You are a friendly AI assistant named Phi running on Ollama phi3.5. You are participating in a community called c/aichatroom on Saidit. You write short, casual posts and comments (1-3 sentences). You discuss technology, AI, games, programming, and random topics. You sometimes ask questions to engage others. You NEVER post links. You write like a real person on a forum.";

const QWEN_SYSTEM = "You are a curious AI assistant named Qwen running on Ollama qwen2.5. You are participating in a community called c/aichatroom on Saidit. You write short, casual posts and comments (1-3 sentences). You discuss technology, AI, games, science, and random topics. You sometimes ask questions to engage others. You NEVER post links. You write like a real person on a forum.";

const TOPICS = [
  "What's the most underrated programming language right now?",
  "I just discovered mechanical keyboards and now I can't go back",
  "What's your favorite open source project?",
  "Hot take: dark mode is overrated",
  "What game have you been playing lately?",
  "Do you think AI will replace web developers?",
  "What's the best movie you've seen this year?",
  "Morning coffee or energy drinks?",
  "What's a hill you're willing to die on?",
  "Best productivity tip you've ever learned?",
  "What's the worst debugging experience you've had?",
  "Do you prefer tabs or spaces?",
  "What's your favorite side project?",
  "Unpopular opinion: Linux isn't that hard to use",
  "What's the most useful tool on your computer?",
  "What are you learning right now?",
  "Best VS Code extensions?",
  "What's the last thing that made you laugh?",
  "Do you think social media is worth it?",
  "What's your setup like at home?",
];

const DAILY_LIMIT = 5;
const fs = require("fs");
const STATE_FILE = "./bot-state.json";

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return {};
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

function getMessagesToday(state, botName) {
  const today = getTodayKey();
  const key = `${botName}_${today}`;
  return state[key] || 0;
}

function incrementMessages(state, botName) {
  const today = getTodayKey();
  const key = `${botName}_${today}`;
  state[key] = (state[key] || 0) + 1;
  saveState(state);
}

async function apiCall(endpoint, token, method = "GET", body = null) {
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      Cookie: `saidit_token=${token}`,
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${SITE_URL}${endpoint}`, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}

async function getRecentPosts(token) {
  const data = await apiCall(`/api/posts/create?community=aichatroom&sort=new`, token);
  return data.posts || [];
}

async function createPost(token, title, body) {
  return apiCall("/api/posts/create", token, "POST", {
    title,
    body,
    communityName: COMMUNITY,
    type: "text",
  });
}

async function createComment(token, postId, body) {
  return apiCall(`/api/posts/${postId}/comments`, token, "POST", {
    body,
  });
}

async function generateOllamaResponse(model, systemPrompt, context) {
  const res = await fetch("http://localhost:11434/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: context },
      ],
      stream: false,
      options: { num_predict: 150, temperature: 0.8 },
    }),
  });
  const data = await res.json();
  return data.message?.content || "I'm not sure what to say about that.";
}

async function botAction(botName, token, model, systemPrompt) {
  const state = loadState();
  const messagesToday = getMessagesToday(state, botName);
  
  if (messagesToday >= DAILY_LIMIT) {
    console.log(`[${botName}] Daily limit reached (${DAILY_LIMIT}/${DAILY_LIMIT}). Skipping.`);
    return;
  }

  const remaining = DAILY_LIMIT - messagesToday;
  console.log(`[${botName}] Messages today: ${messagesToday}/${DAILY_LIMIT} (${remaining} remaining)`);

  console.log(`[${botName}] Checking for recent posts to engage with...`);
  const posts = await getRecentPosts(token);

  if (posts.length === 0) {
    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    console.log(`[${botName}] Creating new post: "${topic}"`);
    try {
      const response = await generateOllamaResponse(model, systemPrompt, `Make a short forum post about: ${topic}`);
      const cleanResponse = response.replace(/^["']|["']$/g, "").slice(0, 300);
      await createPost(token, topic, cleanResponse);
      incrementMessages(state, botName);
      console.log(`[${botName}] Post created! (${messagesToday + 1}/${DAILY_LIMIT} today)`);
    } catch (e) {
      console.error(`[${botName}] Error creating post:`, e.message);
    }
    return;
  }

  const randomPost = posts[Math.floor(Math.random() * posts.length)];
  const myLastComment = posts[0]?.body || "";

  if (randomPost.author.username === botName) {
    console.log(`[${botName}] Skipping own post`);
    if (Math.random() > 0.5 && messagesToday + 1 < DAILY_LIMIT) {
      const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
      console.log(`[${botName}] Creating new post instead: "${topic}"`);
      try {
        const response = await generateOllamaResponse(model, systemPrompt, `Make a short forum post about: ${topic}`);
        await createPost(token, topic, response.replace(/^["']|["']$/g, "").slice(0, 300));
        incrementMessages(state, botName);
        console.log(`[${botName}] Post created!`);
      } catch (e) {
        console.error(`[${botName}] Error:`, e.message);
      }
    }
    return;
  }

  console.log(`[${botName}] Replying to: "${randomPost.title}" by u/${randomPost.author.username}`);
  try {
    const context = `Post title: ${randomPost.title}\nPost body: ${randomPost.body || "(no body)"}\n\nWrite a short reply (1-2 sentences). Don't use quotes in your response.`;
    const response = await generateOllamaResponse(model, systemPrompt, context);
    const cleanResponse = response.replace(/^["']|["']$/g, "").slice(0, 500);
    await createComment(token, randomPost.id, cleanResponse);
    incrementMessages(state, botName);
    console.log(`[${botName}] Comment posted! (${messagesToday + 1}/${DAILY_LIMIT} today)`);
  } catch (e) {
    console.error(`[${botName}] Error commenting:`, e.message);
  }
}

async function run() {
  const args = process.argv.slice(2);
  const intervalMinutes = parseInt(args[0]) || 5;
  const mode = args[1] || "loop";

  console.log("=== Saidit Ollama Bot ===");
  console.log(`Interval: ${intervalMinutes} minutes`);
  console.log(`Site: ${SITE_URL}`);
  console.log(`Community: c/${COMMUNITY}`);
  console.log("Press Ctrl+C to stop\n");

  if (mode === "once") {
    await botAction("ollama_phi", PHI_TOKEN, "phi3.5:3.8b", PHI_SYSTEM);
    await new Promise((r) => setTimeout(r, 3000));
    await botAction("ollama_qwen", QWEN_TOKEN, "qwen2.5:3b", QWEN_SYSTEM);
    console.log("\nDone! Exiting.");
    return;
  }

  let count = 0;
  while (true) {
    count++;
    const now = new Date().toLocaleTimeString();
    console.log(`\n--- Round ${count} at ${now} ---`);

    try {
      await botAction("ollama_phi", PHI_TOKEN, "phi3.5:3.8b", PHI_SYSTEM);
    } catch (e) {
      console.error("[phi] Error:", e.message);
    }

    await new Promise((r) => setTimeout(r, 5000 + Math.random() * 10000));

    try {
      await botAction("ollama_qwen", QWEN_TOKEN, "qwen2.5:3b", QWEN_SYSTEM);
    } catch (e) {
      console.error("[qwen] Error:", e.message);
    }

    console.log(`Waiting ${intervalMinutes} minutes...`);
    await new Promise((r) => setTimeout(r, intervalMinutes * 60 * 1000));
  }
}

run();
