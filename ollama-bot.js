#!/usr/bin/env node

const SITE_URL = "https://saidit-pf4l.onrender.com";

const PHI_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzYWE2NDE1NC01ZTBlLTRiZWUtYmFhYi0zOTk4Y2EyZDE1NjkiLCJ1c2VybmFtZSI6Im9sbGFtYV9waGkiLCJyb2xlIjoidXNlciIsImlhdCI6MTc5MDcwODkxNiwiZXhwIjoxODIyMjQ0OTE2fQ.DurdhOW04xvR7ce3y1QS63HOBXPSYopw0OgIopMzsMg";
const QWEN_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGE3YTI2OC02NTA0LTQ3MTYtODExZi1iNGVlOWU2NThmZTAiLCJ1c2VybmFtZSI6Im9sbGFtYV9xd2VuIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3OTA3MDg5MTYsImV4cCI6MTgyMjI0NDkxNn0.j_1xOuswJZE7XAkytylmB38wo8qQMBxJ1d13ccS-uWQ";

const COMMUNITY = "aichatroom";
const DAILY_LIMIT = 5;
const NEW_POST_THRESHOLD = 25;
const WAIT_BETWEEN_BOTS_MS = 2 * 60 * 1000;

const PHI_SYSTEM = `You are Llama. You are chatting on a forum called c/aichatroom on Saidit.

CRITICAL RULES - VIOLATION IS UNACCEPTABLE:
1. Write ONLY your reply. Nothing else. No labels, no descriptions, no summaries.
2. Do NOT write "[Llama]:" or "[ollama_phi]:" at the start.
3. Do NOT write "In Llama's response..." or "Llama agrees..." or any third-person description.
4. Do NOT include the original post text in your reply.
5. Do NOT include instructions or prompts about creating posts.
6. Start directly with your response text. First word should be what you want to say.
7. Keep replies short: 1-3 sentences.
8. Address the person you're replying to by name.
9. Have natural conversations - ask questions, agree, disagree, joke.
10. NEVER use quotes around your text.`;

const QWEN_SYSTEM = `You are Qwen. You are chatting on a forum called c/aichatroom on Saidit.

CRITICAL RULES - VIOLATION IS UNACCEPTABLE:
1. Write ONLY your reply. Nothing else. No labels, no descriptions, no summaries.
2. Do NOT write "[Qwen]:" or "[ollama_qwen]:" at the start.
3. Do NOT write "In Qwen's response..." or any third-person description.
4. Do NOT include the original post text in your reply.
5. Start directly with your response text. First word should be what you want to say.
6. Keep replies short: 1-3 sentences.
7. Address the person you're replying to by name.
8. Have natural conversations - push back, agree, ask questions.
9. Be slightly more opinionated than Phi.
10. NEVER use quotes around your text.`;

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

async function generateOllamaResponse(model, systemPrompt, conversationMessages) {
  const res = await fetch("http://localhost:11434/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...conversationMessages,
      ],
      stream: false,
      options: { num_predict: 120, temperature: 0.85, top_p: 0.9 },
    }),
  });
  const data = await res.json();
  return (data.message?.content || "hmm interesting").replace(/["']/g, "").replace(/\n/g, " ").trim();
}

function clean(text) {
  let result = text.replace(/^["']|["']$/g, "").replace(/\n/g, " ").trim();

  // Strip meta-commentary patterns
  result = result.replace(/^In (this|llamas?|phis?|my) (response|reply|continuation)[,:]?\s*/gi, "");
  result = result.replace(/^(Llama|Phi)[:\s]+(agrees?|acknowledges?|emphasizes?|suggests?|builds?)/gi, "");
  result = result.replace(/^\[ollama_phi[^\]]*\]:?\s*/gi, "");
  result = result.replace(/^\[ollama_qwen[^\]]*\]:?\s*/gi, "");
  result = result.replace(/^\[Llama\]:?\s*/gi, "");
  result = result.replace(/^\[Phi\]:?\s*/gi, "");
  result = result.replace(/^\[Qwen\]:?\s*/gi, "");
  result = result.replace(/---.*$/g, "");
  result = result.replace(/In this (response|reply),/gi, "");
  result = result.replace(/Post title:.*$/gi, "");
  result = result.replace(/Post body:.*$/gi, "");
  result = result.replace(/\(as ollama_\w+\)/gi, "");

  result = result.trim();
  if (result.length > 0) {
    result = result[0].toUpperCase() + result.slice(1);
  }
  return result.slice(0, 500);
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
      const response = await generateOllamaResponse(model, systemPrompt, [
        { role: "user", content: `Start a new forum discussion: "${topic}"\n\nWrite a short opening post (1-2 sentences). Be casual and engaging.` },
      ]);
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
        const response = await generateOllamaResponse(model, systemPrompt, [
          { role: "user", content: `Start a new forum discussion: "${topic}"\n\nWrite a short opening post (1-2 sentences). Be casual and engaging.` },
        ]);
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

  // Build conversation as message array for Ollama
  const messages = [];
  messages.push({ role: "user", content: `Post title: "${post.title}"\nPost body: ${post.body || "(no body)"}` });

  for (const comment of post.comments || []) {
    const authorName = comment.author.username;
    const role = authorName === botName ? "assistant" : "user";
    messages.push({ role, content: `[${authorName}]: ${comment.body}` });

    for (const reply of comment.replies || []) {
      const replyRole = reply.author.username === botName ? "assistant" : "user";
      messages.push({ role: replyRole, content: `[${reply.author.username} replying to ${comment.author.username}]: ${reply.body}` });
    }
  }

  if (replyable.length > 0) {
    const target = replyable[Math.floor(Math.random() * replyable.length)];
    console.log(`[${botName}] Replying to ${target.comment.author.username} on "${post.title}"`);

    messages.push({ role: "user", content: `[${target.comment.author.username} says]: ${target.comment.body}\n\n${botName === "ollama_phi" ? "Phi" : "Qwen"}, reply to what ${target.comment.author.username} just said. Keep it short (1-2 sentences). Don't repeat anything you've already said in this conversation.` });

    try {
      const response = await generateOllamaResponse(model, systemPrompt, messages);
      await createComment(token, post.id, clean(response), target.parentId);
      markReplied(state, botName, target.comment.id);
      incrementMessages(state, botName);
      console.log(`[${botName}] Reply posted! (${messagesToday + 1}/${DAILY_LIMIT})`);
    } catch (e) {
      console.error(`[${botName}] Error:`, e.message);
    }
  } else {
    console.log(`[${botName}] Replying to post: "${post.title}"`);

    messages.push({ role: "user", content: `This is a fresh discussion. ${botName === "ollama_phi" ? "Phi" : "Qwen"}, share your initial thoughts (1-2 sentences). Don't be preachy.` });

    try {
      const response = await generateOllamaResponse(model, systemPrompt, messages);
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
      await botTurn("ollama_phi", PHI_TOKEN, "llama3.2:3b", PHI_SYSTEM);
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
