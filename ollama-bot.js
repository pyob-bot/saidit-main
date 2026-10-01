#!/usr/bin/env node

const SITE_URL = "https://saidit-pf4l.onrender.com";

const PHI_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzYWE2NDE1NC01ZTBlLTRiZWUtYmFhYi0zOTk4Y2EyZDE1NjkiLCJ1c2VybmFtZSI6Im9sbGFtYV9waGkiLCJyb2xlIjoidXNlciIsImlhdCI6MTc5MDcwODkxNiwiZXhwIjoxODIyMjQ0OTE2fQ.DurdhOW04xvR7ce3y1QS63HOBXPSYopw0OgIopMzsMg";
const QWEN_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGE3YTI2OC02NTA0LTQ3MTYtODExZi1iNGVlOWU2NThmZTAiLCJ1c2VybmFtZSI6Im9sbGFtYV9xd2VuIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3OTA3MDg5MTYsImV4cCI6MTgyMjI0NDkxNn0.j_1xOuswJZE7XAkytylmB38wo8qQMBxJ1d13ccS-uWQ";

const COMMUNITY = "aichatroom";
const DAILY_LIMIT = 5;
const NEW_POST_THRESHOLD = 25;
const WAIT_BETWEEN_BOTS_MS = 2 * 60 * 1000;

const PHI_SYSTEM = `You are Phi, a thoughtful AI. You're chatting in a forum called c/aichatroom on Saidit with Qwen (another AI) and admin (a human).

RULES:
- Write short replies (1-3 sentences max)
- Reply DIRECTLY to the person you're responding to - start with their name
- Have real conversations - ask follow-up questions, agree, disagree
- Don't repeat things you've already said in this thread
- Answer questions people ask you
- Don't be preachy or lecture
- NEVER write both Phi AND Qwen responses - you only write YOUR response
- NEVER use quotes around your text`;

const QWEN_SYSTEM = `You are Qwen, a thoughtful AI. You're chatting in a forum called c/aichatroom on Saidit with Phi (another AI) and admin (a human).

RULES:
- Write short replies (1-3 sentences max)
- Reply DIRECTLY to the person you're responding to - start with their name
- Have real conversations - push back, agree, ask questions
- Don't repeat things you've already said in this thread
- Answer questions people ask you
- Don't be preachy or lecture
- NEVER write both Phi AND Qwen responses - you only write YOUR response
- NEVER use quotes around your text`;

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
function getRepliedTo(state, botName) { return state[`${botName}_replied`] || []; }
function markReplied(state, botName, id) {
  const key = `${botName}_replied`;
  if (!state[key]) state[key] = [];
  if (!state[key].includes(id)) state[key].push(id);
  if (state[key].length > 300) state[key] = state[key].slice(-150);
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
      options: { num_predict: 100, temperature: 0.85, top_p: 0.9 },
    }),
  });
  const data = await res.json();
  return (data.message?.content || "hmm interesting").replace(/["']/g, "").replace(/\n/g, " ").trim();
}

function clean(text) {
  return text.replace(/^["']|["']$/g, "").replace(/\n/g, " ").trim().slice(0, 500);
}

function countTotalComments(post) {
  if (!post.comments) return 0;
  let count = 0;
  for (const c of post.comments) {
    count += 1;
    if (c.replies) {
      for (const r of c.replies) {
        count += 1;
        if (r.replies) count += r.replies.length;
      }
    }
  }
  return count;
}

async function botTurn(botName, token, model, systemPrompt) {
  const state = loadState();
  const messagesToday = getMessagesToday(state, botName);

  if (messagesToday >= DAILY_LIMIT) {
    console.log(`[${botName}] Daily limit reached (${DAILY_LIMIT}/${DAILY_LIMIT}).`);
    return;
  }

  const replied = getRepliedTo(state, botName);
  const posts = await getRecentPosts(token);

  console.log(`[${botName}] Messages today: ${messagesToday}/${DAILY_LIMIT}`);

  // Check if any post has enough comments to warrant a new post
  let allPostsFull = true;
  for (const post of posts) {
    const totalComments = post._count?.comments || 0;
    if (totalComments < NEW_POST_THRESHOLD) {
      allPostsFull = false;
      break;
    }
  }

  // Only create new post if all posts are full AND no posts exist
  if (posts.length === 0 || (allPostsFull && posts.length > 0 && Math.random() > 0.5)) {
    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    console.log(`[${botName}] Creating new post: "${topic}"`);
    try {
      const response = await generateOllamaResponse(model, systemPrompt, `Start a new discussion: "${topic}"\n\nWrite a short post (1-2 sentences).`);
      await createPost(token, topic, clean(response));
      incrementMessages(state, botName);
      console.log(`[${botName}] Post created! (${messagesToday + 1}/${DAILY_LIMIT})`);
    } catch (e) {
      console.error(`[${botName}] Error:`, e.message);
    }
    return;
  }

  // Find posts with comments to engage with
  const engagingPosts = [];
  for (const post of posts) {
    if (post.author.username === botName) continue;
    const totalComments = post._count?.comments || 0;
    if (totalComments > 0 && !replied.includes(post.id)) {
      try {
        const detail = await getPostDetail(post.id, token);
        engagingPosts.push(detail);
      } catch {}
    }
  }

  // If no engaging posts, create new one (if all posts full)
  if (engagingPosts.length === 0) {
    if (allPostsFull) {
      const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
      console.log(`[${botName}] All threads full, creating new: "${topic}"`);
      try {
        const response = await generateOllamaResponse(model, systemPrompt, `Start a new discussion: "${topic}"\n\nWrite a short post (1-2 sentences).`);
        await createPost(token, topic, clean(response));
        incrementMessages(state, botName);
      } catch (e) {
        console.error(`[${botName}] Error:`, e.message);
      }
    } else {
      console.log(`[${botName}] Waiting for discussions to fill up before posting.`);
    }
    return;
  }

  // Find the most active post with recent comments
  const post = engagingPosts.sort((a, b) => {
    const aLast = a.comments?.[0]?.createdAt || "";
    const bLast = b.comments?.[0]?.createdAt || "";
    return bLast.localeCompare(aLast);
  })[0];

  // Find replyable comments (by the other bot or admin, that we haven't replied to)
  const replyable = [];
  for (const comment of post.comments || []) {
    if (comment.author.username !== botName && !replied.includes(comment.id)) {
      replyable.push({ comment, parentId: comment.id });
    }
    for (const reply of comment.replies || []) {
      if (reply.author.username !== botName && !replied.includes(reply.id)) {
        replyable.push({ comment: reply, parentId: comment.id });
      }
    }
  }

  // Build conversation context
  const conversation = (post.comments || [])
    .map(c => {
      let text = `u/${c.author.username}: ${c.body}`;
      for (const r of c.replies || []) {
        text += `\n  → u/${r.author.username}: ${r.body}`;
      }
      return text;
    })
    .join("\n");

  if (replyable.length > 0) {
    const target = replyable[Math.floor(Math.random() * replyable.length)];
    console.log(`[${botName}] Replying to ${target.comment.author.username} on "${post.title}"`);

    try {
      const context = `Forum post by u/${post.author.username}: "${post.title}"\nBody: ${post.body || "(no body)"}\n\nFull conversation:\n${conversation}\n\nNow reply to u/${target.comment.author.username} who said: "${target.comment.body}"\n\nWrite a short reply (1-2 sentences). Address them by name. You are ${botName === "ollama_phi" ? "Phi" : "Qwen"}. Only write YOUR response - do NOT write for the other AI.`;
      const response = await generateOllamaResponse(model, systemPrompt, context);
      await createComment(token, post.id, clean(response), target.parentId);
      markReplied(state, botName, target.comment.id);
      incrementMessages(state, botName);
      console.log(`[${botName}] Reply posted! (${messagesToday + 1}/${DAILY_LIMIT})`);
    } catch (e) {
      console.error(`[${botName}] Error:`, e.message);
    }
  } else {
    // Reply to the post itself
    console.log(`[${botName}] Replying to post: "${post.title}"`);
    try {
      const context = `Forum post by u/${post.author.username}: "${post.title}"\nBody: ${post.body || "(no body)"}\n\nConversation so far:\n${conversation}\n\nWrite a short reply (1-2 sentences). You are ${botName === "ollama_phi" ? "Phi" : "Qwen"}. Only write YOUR response.`;
      const response = await generateOllamaResponse(model, systemPrompt, context);
      await createComment(token, post.id, clean(response));
      markReplied(state, botName, post.id);
      incrementMessages(state, botName);
      console.log(`[${botName}] Post reply posted! (${messagesToday + 1}/${DAILY_LIMIT})`);
    } catch (e) {
      console.error(`[${botName}] Error:`, e.message);
    }
  }
}

async function run() {
  const args = process.argv.slice(2);
  const mode = args[0] || "loop";

  console.log("=== Saidit Ollama Bot ===");
  console.log(`Site: ${SITE_URL}`);
  console.log(`Community: c/${COMMUNITY}`);
  console.log(`New post threshold: ${NEW_POST_THRESHOLD}+ comments`);
  console.log(`Wait between bots: 2 minutes`);
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

  let round = 0;
  while (true) {
    round++;
    console.log(`\n--- Round ${round} at ${new Date().toLocaleTimeString()} ---`);

    try {
      await botTurn("ollama_phi", PHI_TOKEN, "phi3.5:3.8b", PHI_SYSTEM);
    } catch (e) { console.error("[phi] Error:", e.message); }

    console.log(`Waiting 2 minutes for Qwen...`);
    await new Promise(r => setTimeout(r, WAIT_BETWEEN_BOTS_MS));

    try {
      await botTurn("ollama_qwen", QWEN_TOKEN, "qwen2.5:3b", QWEN_SYSTEM);
    } catch (e) { console.error("[qwen] Error:", e.message); }

    console.log("Waiting 5 minutes before next round...");
    await new Promise(r => setTimeout(r, 5 * 60 * 1000));
  }
}

run();
