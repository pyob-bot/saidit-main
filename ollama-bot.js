#!/usr/bin/env node

const SITE_URL = "https://saidit-pf4l.onrender.com";

const PHI_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzYWE2NDE1NC01ZTBlLTRiZWUtYmFhYi0zOTk4Y2EyZDE1NjkiLCJ1c2VybmFtZSI6Im9sbGFtYV9waGkiLCJyb2xlIjoidXNlciIsImlhdCI6MTc5MDcwODkxNiwiZXhwIjoxODIyMjQ0OTE2fQ.DurdhOW04xvR7ce3y1QS63HOBXPSYopw0OgIopMzsMg";
const QWEN_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGE3YTI2OC02NTA0LTQ3MTYtODExZi1iNGVlOWU2NThmZTAiLCJ1c2VybmFtZSI6Im9sbGFtYV9xd2VuIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3OTA3MDg5MTYsImV4cCI6MTgyMjI0NDkxNn0.j_1xOuswJZE7XAkytylmB38wo8qQMBxJ1d13ccS-uWQ";

const COMMUNITY = "aichatroom";
const SESSION_MINUTES = 10;
const DAILY_LIMIT = 500;

const PHI_SYSTEM = `You are Llama, a curious and engaged forum user on c/aichatroom on Saidit.

You are chatting with Qwen (another AI) and admin (a human).

RULES:
- Write ONLY your response. No labels, no descriptions, no summaries.
- Start directly with what you want to say.
- Keep replies to 1-3 sentences.
- Have real conversations - ask follow-ups, share opinions, joke, disagree.
- You can also create new discussion posts about random topics.
- Never use quotes around your text.
- Talk like a real person on a forum.`;

const QWEN_SYSTEM = `You are Qwen, a thoughtful and slightly opinionated forum user on c/aichatroom on Saidit.

You are chatting with Llama (another AI) and admin (a human).

RULES:
- Write ONLY your response. No labels, no descriptions, no summaries.
- Start directly with what you want to say.
- Keep replies to 1-3 sentences.
- Have real conversations - push back, agree, ask questions, share hot takes.
- You can also create new discussion posts about random topics.
- Never use quotes around your text.
- Talk like a real person on a forum.`;

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
  "What's the most useful tool on your computer?",
  "What are you learning right now?",
  "What's the last thing that made you laugh?",
  "Do you think social media is worth it?",
  "What's your setup like at home?",
  "What's your favorite YouTube channel?",
  "What's the best thing you've ever built?",
  "What's a topic you could talk about for hours?",
  "Best book you've read this year?",
  "What's your unpopular food opinion?",
  "If you could have any superpower, what would it be?",
  "What's the coolest thing you've seen on the internet?",
  "What do you think about space exploration?",
  "Favorite programming framework and why?",
  "What's the best advice you've ever received?",
  "What's your morning routine like?",
  "If you could meet any historical figure, who?",
];

const fs = require("fs");
const STATE_FILE = "./bot-state.json";

function loadState() { try { return JSON.parse(fs.readFileSync(STATE_FILE, "utf8")); } catch { return {}; } }
function saveState(state) { fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2)); }
function getTodayKey() { return new Date().toISOString().split("T")[0]; }
function getMessagesToday(state, botName) { return state[`${botName}_${getTodayKey()}`] || 0; }
function incrementMessages(state, botName) {
  const key = `${botName}_${getTodayKey()}`;
  state[key] = (state[key] || 0) + 1;
  saveState(state);
}

async function apiCall(endpoint, token, method = "GET", body = null) {
  const opts = { method, headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${SITE_URL}${endpoint}`, opts);
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status}: ${text.slice(0, 200)}`);
  try { return JSON.parse(text); } catch { return text; }
}

async function getRecentPosts(token) {
  const data = await apiCall(`/api/bot/posts?community=${COMMUNITY}`, token);
  return data.posts || [];
}

async function getPostDetail(postId, token) {
  const data = await apiCall(`/api/posts/${postId}`, token);
  return data.post;
}

async function createPost(token, title, body) {
  return apiCall("/api/bot/post", token, "POST", { title, body, communityName: COMMUNITY });
}

async function createComment(token, postId, body, parentId) {
  return apiCall("/api/bot/comment", token, "POST", { postId, body, parentId });
}

async function generateOllamaResponse(model, systemPrompt, messages) {
  const res = await fetch("http://localhost:11434/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      stream: false,
      options: { num_predict: 100, temperature: 0.9, top_p: 0.95 },
    }),
  });
  const data = await res.json();
  return (data.message?.content || "hmm interesting").replace(/["']/g, "").replace(/\n/g, " ").trim();
}

function clean(text) {
  let result = text.replace(/^["']|["']$/g, "").replace(/\n/g, " ").trim();
  result = result.replace(/^\[(ollama_phi|ollama_qwen|Llama|Phi|Qwen)\]:?\s*/gi, "");
  result = result.replace(/^In (this|my|llamas?|phis?) (response|reply)[,:]?\s*/gi, "");
  result = result.replace(/Post title:.*$/gi, "");
  result = result.replace(/Post body:.*$/gi, "");
  result = result.replace(/^---.*$/gm, "");
  return result.slice(0, 500);
}

async function botSession(botName, token, model, systemPrompt, otherBotName) {
  const sessionEnd = Date.now() + SESSION_MINUTES * 60 * 1000;
  let actions = 0;

  console.log(`[${botName}] Starting ${SESSION_MINUTES}-minute session...`);

  while (Date.now() < sessionEnd) {
    const state = loadState();
    const messagesToday = getMessagesToday(state, botName);

    if (messagesToday >= DAILY_LIMIT) {
      console.log(`[${botName}] Daily limit reached (${DAILY_LIMIT}).`);
      break;
    }

    const roll = Math.random();
    const posts = await getRecentPosts(token);

    try {
      if (posts.length === 0 || roll < 0.25) {
        // Create new post
        const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
        console.log(`[${botName}] Posting: "${topic}"`);
        const response = await generateOllamaResponse(model, systemPrompt, [
          { role: "user", content: `Start a new forum discussion: "${topic}"\n\nWrite a short opening post (1-2 sentences). Be casual.` },
        ]);
        await createPost(token, topic, clean(response));
        incrementMessages(state, botName);
        actions++;
      } else if (roll < 0.75) {
        // Reply to a comment
        const postsWithComments = posts.filter(p => (p._count?.comments || 0) > 0);
        if (postsWithComments.length > 0) {
          const post = postsWithComments[Math.floor(Math.random() * postsWithComments.length)];
          const detail = await getPostDetail(post.id, token);

          const replyable = [];
          for (const comment of detail.comments || []) {
            if (comment.author.username !== botName) replyable.push({ comment, parentId: comment.id });
            for (const reply of comment.replies || []) {
              if (reply.author.username !== botName) replyable.push({ comment: reply, parentId: comment.id });
            }
          }

          if (replyable.length > 0) {
            const target = replyable[Math.floor(Math.random() * replyable.length)];
            console.log(`[${botName}] Replying to ${target.comment.author.username} on "${post.title}"`);

            const messages = [{ role: "user", content: `Post: "${post.title}"\nPost body: ${post.body || "(none)"}\n\nConversation:\n${(detail.comments || []).map(c => `u/${c.author.username}: ${c.body}${(c.replies || []).map(r => `\n  → u/${r.author.username}: ${r.body}`).join("")}`).join("\n")}\n\nNow reply to ${target.comment.author.username} who said: "${target.comment.body}"\n\nWrite a short reply (1-2 sentences). Address them by name. You are ${otherBotName === "ollama_qwen" ? "Qwen" : "Llama"}.` }];

            const response = await generateOllamaResponse(model, systemPrompt, messages);
            await createComment(token, detail.id, clean(response), target.parentId);
            incrementMessages(state, botName);
            actions++;
          } else {
            // Reply to the post itself
            console.log(`[${botName}] Replying to post: "${post.title}"`);
            const messages = [{ role: "user", content: `Forum post by u/${post.author.username}: "${post.title}"\nBody: ${post.body || "(none)"}\n\nWrite a short reply (1-2 sentences).` }];
            const response = await generateOllamaResponse(model, systemPrompt, messages);
            await createComment(token, post.id, clean(response));
            incrementMessages(state, botName);
            actions++;
          }
        }
      } else {
        // Reply to post directly
        const available = posts.filter(p => p.author.username !== botName);
        if (available.length > 0) {
          const post = available[Math.floor(Math.random() * available.length)];
          console.log(`[${botName}] Replying to: "${post.title}"`);
          const messages = [{ role: "user", content: `Post by u/${post.author.username}: "${post.title}"\nBody: ${post.body || "(none)"}\n\nWrite a short reply (1-2 sentences).` }];
          const response = await generateOllamaResponse(model, systemPrompt, messages);
          await createComment(token, post.id, clean(response));
          incrementMessages(state, botName);
          actions++;
        }
      }
    } catch (e) {
      console.error(`[${botName}] Error:`, e.message);
    }

    // Wait 30-90 seconds between actions
    const waitTime = 30000 + Math.random() * 60000;
    console.log(`[${botName}] Waiting ${Math.round(waitTime / 1000)}s...`);
    await new Promise(r => setTimeout(r, waitTime));
  }

  console.log(`[${botName}] Session complete. ${actions} actions taken.`);
}

async function run() {
  const args = process.argv.slice(2);
  const mode = args[0] || "loop";

  console.log("=== Saidit Ollama Bot ===");
  console.log(`Site: ${SITE_URL}`);
  console.log(`Community: c/${COMMUNITY}`);
  console.log(`Session: ${SESSION_MINUTES} minutes per bot`);
  console.log(`Daily limit: ${DAILY_LIMIT} messages`);
  console.log("Press Ctrl+C to stop\n");

  if (mode === "test") {
    console.log("--- Testing ---");
    try {
      const data = await apiCall("/api/bot/auth", PHI_TOKEN, "POST");
      console.log("Llama:", data.user?.username, "- OK");
    } catch (e) { console.error("Llama failed:", e.message); }
    try {
      const data = await apiCall("/api/bot/auth", QWEN_TOKEN, "POST");
      console.log("Qwen:", data.user?.username, "- OK");
    } catch (e) { console.error("Qwen failed:", e.message); }
    return;
  }

  let round = 0;
  while (true) {
    round++;
    console.log(`\n=== Round ${round} at ${new Date().toLocaleTimeString()} ===`);

    console.log("\n--- Llama's turn ---");
    try {
      await botSession("ollama_phi", PHI_TOKEN, "llama3.2:3b", PHI_SYSTEM, "ollama_qwen");
    } catch (e) { console.error("[Llama] Error:", e.message); }

    console.log("\n--- Qwen's turn ---");
    try {
      await botSession("ollama_qwen", QWEN_TOKEN, "qwen2.5:3b", QWEN_SYSTEM, "ollama_phi");
    } catch (e) { console.error("[Qwen] Error:", e.message); }

    console.log(`\nRound ${round} complete. Starting next round...`);
    await new Promise(r => setTimeout(r, 5 * 60 * 1000));
  }
}

run();
