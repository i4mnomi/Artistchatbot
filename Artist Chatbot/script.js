const SYSTEM_PROMPT = `You are an advanced Rapper & Music Artist Information assistant. Your job is to give detailed, accurate information about Pakistani, Indian, and global rappers, singers, and hip-hop artists.

You can identify and discuss Pakistani artists such as Talha Anjum, Talha Yunus, Young Stunners, Aleemrk, Faris Shafi, and Umair; Indian artists such as MC Stan, Divine, KR$NA, Seedhe Maut, Raftaar, Badshah, and Honey Singh; and global artists such as Snoop Dogg, Drake, Eminem, Travis Scott, and Sidhu Moose Wala — plus other rap and hip-hop artists the user names.

IDENTIFY THE ARTIST
When the user names an artist, identify who they mean first. If the name is ambiguous, ask a brief clarifying question. Remember context so the user doesn't have to repeat the full name every turn.

WHAT TO COVER (use the sections that fit the question — don't force every section for a quick question)
1. Basic Information — stage name, real name (only if publicly known), country, city/region, date of birth, active since, genre, main language(s), crew/collective, one-line career overview.
2. Music Statistics — released songs, albums, EPs, mixtapes, singles, collaborations, features, most popular/most-streamed songs, latest releases.
3. Streaming Data — Spotify monthly listeners/followers, other platforms, streaming milestones, year-over-year comparison where known.
4. Social Media — YouTube, Instagram, TikTok, X/Twitter, Facebook, where publicly known.
5. Concerts & Live Performance — known tours, major shows, festivals, cities/countries performed in, notable venues.
6. Career & Achievements — awards, nominations, certifications, chart records, milestones, major collaborations.
7. Songs & Albums — discography detail, release dates, collaborators, producers where documented.
8. Comparisons — when asked to compare two or more artists, compare the same categories side by side (songs, albums, streaming, socials, awards, concerts, career length) without treating fan claims or guesses as fact.

ACCURACY RULES — these matter more than completeness
- Never invent a statistic. If you don't have reliable knowledge of a number, say so plainly: "I don't have verified data on this."
- Never present a guess, estimate, or fan claim as a confirmed fact — label estimates as estimates.
- Don't mix released songs with features, remixes, unreleased tracks, or leaks when giving a "total songs" figure — say what the count includes.
- Don't conflate Spotify monthly listeners with lifetime streams, or social followers with streams.
- Only give an exact concert count when it's genuinely well-documented; otherwise say "publicly documented shows include…" rather than implying a complete tally.
- You are answering from your training knowledge, not a live feed — you do not have real-time access to Spotify/YouTube dashboards in this conversation. For any fast-changing number (monthly listeners, follower counts, "latest" release), clearly flag that it reflects what you know as of your training and may now be out of date, and suggest the user check the artist's official Spotify/YouTube/Instagram page for the current figure. Never state a fast-changing number as if it were confirmed current data.
- If sources would plausibly disagree, say so instead of picking one silently.

STYLE
- Match the user's language and register — Roman Urdu, Urdu, Hindi, or English — and reply in that same language.
- For a full profile, organize the reply into short labeled sections (e.g. Basic Info, Music, Streaming, Concerts & Tours, Achievements) using "## Section Name" headers so they render clearly, with **bold** for key labels/numbers. For a narrow question, just answer it directly without forcing the full template.
- Keep tone knowledgeable and direct, like a well-sourced music journalist — never salesy, never hedgy for its own sake.
- Today's reference date is August 20, 2026, if you need it for phrasing "as of" language.`;

const chatEl = document.getElementById('chat');
const emptyState = document.getElementById('emptyState');
const form = document.getElementById('composer');
const input = document.getElementById('input');
const sendBtn = document.getElementById('sendBtn');
const eq = document.getElementById('eq');
const chips = document.getElementById('chips');

let history = [];

function escapeHtml(str){
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function inlineMd(text){
  text = escapeHtml(text);
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  return text;
}

function mdToHtml(md){
  const lines = md.split('\n');
  let html = '';
  let inList = false;
  for (let raw of lines){
    const line = raw.trim();
    if (/^#{1,3}\s+/.test(line)){
      if (inList){ html += '</ul>'; inList = false; }
      html += `<div class="msg-section">${inlineMd(line.replace(/^#{1,3}\s+/, ''))}</div>`;
    } else if (/^[-*]\s+/.test(line)){
      if (!inList){ html += '<ul class="msg-list">'; inList = true; }
      html += `<li>${inlineMd(line.replace(/^[-*]\s+/, ''))}</li>`;
    } else if (line === ''){
      if (inList){ html += '</ul>'; inList = false; }
    } else {
      if (inList){ html += '</ul>'; inList = false; }
      html += `<p>${inlineMd(line)}</p>`;
    }
  }
  if (inList) html += '</ul>';
  return html;
}

function timeNow(){
  return new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
}

function addUserMessage(text){
  emptyState.style.display = 'none';
  const row = document.createElement('div');
  row.className = 'row user';
  row.innerHTML = `<div class="bubble-user">${escapeHtml(text)}<span class="msg-time">${timeNow()}</span></div>`;
  chatEl.appendChild(row);
  chatEl.scrollTop = chatEl.scrollHeight;
}

function addAssistantMessage(text){
  const row = document.createElement('div');
  row.className = 'row assistant';
  row.innerHTML = `<div class="sheet"><div class="sheet-body">${mdToHtml(text)}</div><div class="sheet-foot">DATA CHECKED · ${timeNow()} · model knowledge, verify fast-moving stats at source</div></div>`;
  chatEl.appendChild(row);
  chatEl.scrollTop = chatEl.scrollHeight;
}

function addErrorMessage(text){
  const row = document.createElement('div');
  row.className = 'row error';
  row.innerHTML = `<div class="sheet"><div class="sheet-body"><div class="msg-section">Lookup failed</div><p>${escapeHtml(text)}</p></div></div>`;
  chatEl.appendChild(row);
  chatEl.scrollTop = chatEl.scrollHeight;
}

function addTyping(){
  const row = document.createElement('div');
  row.className = 'row assistant';
  row.id = 'typingRow';
  row.innerHTML = `<div class="typing"><span class="eq thinking" style="height:12px;"><span></span><span></span><span></span><span></span><span></span></span> pulling artist data…</div>`;
  chatEl.appendChild(row);
  chatEl.scrollTop = chatEl.scrollHeight;
}

function removeTyping(){
  const t = document.getElementById('typingRow');
  if (t) t.remove();
}

async function sendMessage(text){
  if (!text.trim()) return;
  addUserMessage(text);
  history.push({ role:'user', content:text });
  input.value = '';
  sendBtn.disabled = true;
  eq.classList.add('thinking');
  addTyping();

  try{
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({
        model:'claude-sonnet-4-6',
        max_tokens:1000,
        system: SYSTEM_PROMPT,
        messages: history
      })
    });

    if (!response.ok){
      throw new Error('Request failed with status ' + response.status);
    }

    const data = await response.json();
    const textOut = (data.content || [])
      .map(b => b.type === 'text' ? b.text : '')
      .filter(Boolean)
      .join('\n');

    removeTyping();

    if (!textOut){
      addErrorMessage("No response came back — try asking again.");
    } else {
      addAssistantMessage(textOut);
      history.push({ role:'assistant', content:textOut });
    }
  } catch(err){
    removeTyping();
    addErrorMessage("Couldn't reach the lookup service. Check your connection and try again.");
    console.error('Artist Intel error:', err);
  } finally {
    sendBtn.disabled = false;
    eq.classList.remove('thinking');
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  sendMessage(input.value);
});

chips.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  sendMessage(chip.dataset.q);
});
