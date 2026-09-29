#!/usr/bin/env node

const SITE_URL = "https://saidit-pf4l.onrender.com";

const PHI_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzYWE2NDE1NC01ZTBlLTRiZWUtYmFhYi0zOTk4Y2EyZDE1NjkiLCJ1c2VybmFtZSI6Im9sbGFtYV9waGkiLCJyb2xlIjoidXNlciIsImlhdCI6MTc5MDcwODkxNiwiZXhwIjoxODIyMjQ0OTE2fQ.DurdhOW04xvR7ce3y1QS63HOBXPSYopw0OgIopMzsMg";
const QWEN_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGE3YTI2OC02NTA0LTQ3MTYtODExZi1iNGVlOWU2NThmZTAiLCJ1c2VybmFtZSI6Im9sbGFtYV9xd2VuIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3OTA3MDg5MTYsImV4cCI6MTgyMjI0NDkxNn0.j_1xOuswJZE7XAkytylmB38wo8qQMBxJ1d13ccS-uWQ";

const COMMUNITY = "aichatroom";
const BOTS = {
  ollama_phi: { token: PHI_TOKEN, model: "phi3.5:3.8b", name: "Phi" },
  ollama_qwen: { token: QWEN_TOKEN, model: "qwen2.5:3b", name: "Qwen" },
};

const PHI_SYSTEM = `You are Phi, a witty and curious AI. You're chatting with Qwen (another AI) and admin (a human) in a forum called c/aichatroom on Saidit.

RULES:
- Write short casual replies (1-3 sentences max)
- Have REAL conversations - ask follow-up questions, disagree, agree, joke
- When replying to someone, address them by name
- Don't repeat the same thing twice
- If someone asks you a question, ANSWER it directly
- Don't be preachy or lecture
- Talk about anything: tech, games, life, philosophy, random thoughts
- NEVER use quotes around your text
- Keep it natural like texting a friend`;

const QWEN_SYSTEM = `You are Qwen, a thoughtful and slightly sarcastic AI. You're chatting with Phi (another AI) and admin (a human) in a forum called c/aichatroom on Saidit.

RULES:
- Write short casual replies (1-3 sentences max)
- Have REAL conversations - push back, agree, ask questions, share opinions
- When replying to someone, address them by name
- Don't repeat the same thing twice
- If someone asks you a question, ANSWER it directly
- Be a bit more opinionated than Phi
- Talk about anything: tech, games, life, philosophy, random thoughts
- NEVER use quotes around your text
- Keep it natural like texting a friend`;

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
  try { return JSON.parse(fs.readFileSync(STATE_FILE, "utf8")); } catch { return {}; }
}
function saveState(state) { fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2)); }
function getTodayKey() { return new Date().toISOString().split("T")[0]; }
function getMessagesToday(state, botName) {
  return state[`${botName}_${getTodayKey()}`] || 0;
}
function incrementMessages(state, botName) {
  const key = `${botName}_${getTodayKey()}`;
  state[key] = (state[key] || 0) + 1;
  saveState(state);
}
function getRepliedTo(state, botName) {
  return state[`${botName}_replied`] || [];
}
function markReplied(state, botName, id) {
  const key = `${botName}_replied`;
  if (!state[key]) state[key] = [];
  if (!state[key].includes(id)) state[key].push(id);
  if (state[key].length > 200) state[key] = state[key].slice(-100);
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
      options: { num_predict: 120, temperature: 0.9, top_p: 0.9 },
    }),
  });
  const data = await res.json();
  return (data.message?.content || "hmm interesting").replace(/["']/g, "").replace(/\n/g, " ").trim();
}

function clean(text) {
  return text.replace(/^["']|["']$/g, "").replace(/\n/g, " ").trim().slice(0, 500);
}

async function botAction(botName, token, model, systemPrompt, otherBotName) {
  const state = loadState();
  const messagesToday = getMessagesToday(state, botName);

  if (messagesToday >= DAILY_LIMIT) {
    console.log(`[${botName}] Daily limit reached (${DAILY_LIMIT}/${DAILY_LIMIT}). Skipping.`);
    return false;
  }

  const replied = getRepliedTo(state, botName);
  const posts = await getRecentPosts(token);

  // 60% chance: reply to a comment, 30% chance: reply to post, 10% chance: new post
  const roll = Math.random();

  if (posts.length === 0 || roll > 0.9) {
    // Create new post
    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    console.log(`[${botName}] Creating new post: "${topic}"`);
    try {
      const response = await generateOllamaResponse(model, systemPrompt, `Someone just asked in a forum: "${topic}"\n\nWrite a short post sharing your thoughts (1-2 sentences).`);
      await createPost(token, topic, clean(response));
      incrementMessages(state, botName);
      console.log(`[${botName}] Post created! (${messagesToday + 1}/${DAILY_LIMIT})`);
      return true;
    } catch (e) {
      console.error(`[${botName}] Error:`, e.message);
      return false;
    }
  }

  // Find a post with comments to reply to
  const postsWithComments = [];
  for (const post of posts) {
    if (post._count?.comments > 0 && !replied.includes(post.id)) {
      try {
        const detail = await getPostDetail(post.id, token);
        if (detail?.comments?.length > 0) {
          postsWithComments.push({ post: detail, summary: post });
        }
      } catch {}
    }
  }

  // Try to reply to a comment (60% chance)
  if (postsWithComments.length > 0 && roll < 0.6) {
    const { post: detail, summary } = postsWithComments[Math.floor(Math.random() * postsWithComments.length)];

    // Find comments not by this bot that we haven't replied to
    const replyableComments = [];
    for (const comment of detail.comments) {
      if (comment.author.username !== botName && !replied.includes(comment.id)) {
        replyableComments.push(comment);
      }
      for (const reply of (comment.replies || [])) {
        if (reply.author.username !== botName && !replied.includes(reply.id)) {
          replyableComments.push(reply);
        }
      }
    }

    if (replyableComments.length > 0) {
      const targetComment = replyableComments[Math.floor(Math.random() * replyableComments.length)];
      console.log(`[${botName}] Replying to ${targetComment.author.username}'s comment on "${summary.title}"`);

      const otherComments = detail.comments
        .map(c => `u/${c.author.username}: ${c.body}${(c.replies || []).map(r => `\n  → u/${r.author.username}: ${r.body}`).join("")}`)
        .join("\n");

      try {
        const context = `Forum post: "${summary.title}"\nPost by u/${summary.author.username}: ${summary.body || "(no body)"}\n\nAll comments:\n${otherComments}\n\nNow reply to u/${targetComment.author.username} who said: "${targetComment.body}"\n\nWrite a short reply (1-2 sentences). Address them by name. Don't use quotes.`;
        const response = await generateOllamaResponse(model, systemPrompt, context);
        await createComment(token, detail.id, clean(response), targetComment.id);
        markReplied(state, botName, targetComment.id);
        incrementMessages(state, botName);
        console.log(`[${botName}] Comment reply posted! (${messagesToday + 1}/${DAILY_LIMIT})`);
        return true;
      } catch (e) {
        console.error(`[${botName}] Error:`, e.message);
        return false;
      }
    }
  }

  // Fall back to replying to the post itself (skip own posts)
  const availablePosts = posts.filter(p => p.author.username !== botName && !replied.includes(p.id));
  if (availablePosts.length > 0) {
    const post = availablePosts[Math.floor(Math.random() * availablePosts.length)];
    console.log(`[${botName}] Replying to post: "${post.title}" by u/${post.author.username}`);

    try {
      const context = `Forum post by u/${post.author.username}: "${post.title}"\nBody: ${post.body || "(no body)"}\n\nWrite a short reply (1-2 sentences). Don't use quotes.`;
      const response = await generateOllamaResponse(model, systemPrompt, context);
      await createComment(token, post.id, clean(response));
      markReplied(state, botName, post.id);
      incrementMessages(state, botName);
      console.log(`[${botName}] Post reply posted! (${messagesToday + 1}/${DAILY_LIMIT})`);
      return true;
    } catch (e) {
      console.error(`[${botName}] Error:`, e.message);
      return false;
    }
  }

  // If we've replied to everything, create a new post
  const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
  console.log(`[${botName}] All posts engaged, creating new: "${topic}"`);
  try {
    const response = await generateOllamaResponse(model, systemPrompt, `Start a new discussion: "${topic}"\n\nWrite a short post (1-2 sentences).`);
    await createPost(token, topic, clean(response));
    incrementMessages(state, botName);
    console.log(`[${botName}] Post created! (${messagesToday + 1}/${DAILY_LIMIT})`);
    return true;
  } catch (e) {
    console.error(`[${botName}] Error:`, e.message);
    return false;
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

  if (mode === "test") {
    console.log("--- Testing connection ---");
    try {
      const data = await apiCall("/api/bot/auth", PHI_TOKEN, "POST");
      console.log("Phi:", data.user?.username, "- OK");
    } catch (e) { console.error("Phi failed:", e.message); }
    try {
      const data = await apiCall("/api/bot/auth", QWEN_TOKEN, "POST");
      console.log("Qwen:", data.user?.username, "- OK");
    } catch (e) { console.error("Qwen failed:", e.message); }
    return;
  }

  let count = 0;
  while (true) {
    count++;
    console.log(`\n--- Round ${count} at ${new Date().toLocaleTimeString()} ---`);

    // Phi acts first
    try {
      await botAction("ollama_phi", PHI_TOKEN, "phi3.5:3.8b", PHI_SYSTEM, "ollama_qwen");
    } catch (e) { console.error("[phi] Error:", e.message); }

    await new Promise(r => setTimeout(r, 3000 + Math.random() * 7000));

    // Then Qwen responds
    try {
      await botAction("ollama_qwen", QWEN_TOKEN, "qwen2.5:3b", QWEN_SYSTEM, "ollama_phi");
    } catch (e) { console.error("[qwen] Error:", e.message); }

    console.log(`Waiting ${intervalMinutes} minutes...`);
    await new Promise(r => setTimeout(r, intervalMinutes * 60 * 1000));
  }
}

run();
