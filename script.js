// Order must match model.classes_ (scikit-learn sorts labels alphabetically by default).
const CLASSES = ["Entire home/apt", "Private room", "Shared room"];
const ICONS   = ["🏠", "🛏️", "👥"];
const COLORS  = ["#4f6bff", "#12b886", "#ff9248"];

const BOROUGHS = {
  "Manhattan":     {c:"M", color:"#f6a800", lat:40.7831, lng:-73.9712, hoods:["Harlem","East Harlem","Upper West Side","Upper East Side","Midtown","Hell's Kitchen","Chelsea","East Village","West Village","Greenwich Village","Lower East Side","SoHo","Chinatown","Financial District","Washington Heights","Inwood","Murray Hill","Gramercy","Kips Bay","Nolita","Tribeca","Theater District"]},
  "Brooklyn":      {c:"B", color:"#00933c", lat:40.6782, lng:-73.9442, hoods:["Williamsburg","Bedford-Stuyvesant","Bushwick","Greenpoint","Crown Heights","Park Slope","Flatbush","Clinton Hill","Fort Greene","Prospect-Lefferts Gardens","East Flatbush","Sunset Park","Brooklyn Heights","Bay Ridge","Cobble Hill","Carroll Gardens","DUMBO","Red Hook"]},
  "Queens":        {c:"Q", color:"#b933ad", lat:40.7282, lng:-73.7949, hoods:["Astoria","Long Island City","Flushing","Ridgewood","Sunnyside","Jamaica","Woodside","Jackson Heights","Elmhurst","Forest Hills","Ditmars Steinway","Rockaway Beach"]},
  "Bronx":         {c:"X", color:"#ee352e", lat:40.8448, lng:-73.8648, hoods:["Concourse","Mott Haven","Kingsbridge","Fordham","Morris Park","Riverdale","Williamsbridge","Port Morris","Longwood"]},
  "Staten Island": {c:"S", color:"#0039a6", lat:40.5795, lng:-74.1502, hoods:["St. George","Tompkinsville","Stapleton","New Springville","Great Kills","Tottenville","West Brighton"]}
};
const NUM = ["latitude","longitude","price","minimum_nights","number_of_reviews","reviews_per_month","calculated_host_listings_count","availability_365"];
const INT = ["minimum_nights","number_of_reviews","calculated_host_listings_count","availability_365"];
const $ = id => document.getElementById(id);
let borough = null;

/* ---------- Skyline: windows light up as the form fills ---------- */
const sky = $("skyline"), windows = [];
(function build(){
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const NS = "http://www.w3.org/2000/svg"; let x = -10;
  while(x < 1210){
    const w = 50 + rnd()*50, h = 110 + rnd()*190;
    const r = document.createElementNS(NS,"rect");
    r.setAttribute("class","b"); r.setAttribute("x",x); r.setAttribute("y",320-h); r.setAttribute("width",w); r.setAttribute("height",h);
    sky.appendChild(r);
    for(let wx = x+8; wx < x+w-10; wx += 14) for(let wy = 320-h+10; wy < 310; wy += 18){
      const win = document.createElementNS(NS,"rect");
      win.setAttribute("class","w"); win.setAttribute("x",wx); win.setAttribute("y",wy); win.setAttribute("width",7); win.setAttribute("height",9);
      win.style.animationDelay = (rnd()*3.5) + "s"; sky.appendChild(win); windows.push(win);
    }
    x += w + 4 + rnd()*8;
  }
  for(let i = windows.length-1; i > 0; i--){ const j = Math.floor(rnd()*(i+1)); [windows[i],windows[j]] = [windows[j],windows[i]]; }
})();
let lit = 0;
function setProgress(p){
  const target = Math.round(windows.length * p);
  windows.forEach((w,i) => w.classList.toggle("on", i < target));
  $("bar").style.width = p*100 + "%"; $("pct").textContent = Math.round(p*100) + "%";
}
function progress(){
  const ids = ["neighbourhood",...NUM.filter(k => k !== "availability_365")];
  const done = ids.filter(k => $(k).value.trim() !== "").length + (borough ? 1 : 0) + 1; // +1 availability slider
  setProgress(done / (ids.length + 2));
}
document.addEventListener("mousemove", e => sky.style.transform = `translateX(${(e.clientX/innerWidth - .5) * -24}px)`);

/* ---------- Typing headline ---------- */
(function type(){
  const words = ["see what room it is.", "guess the room type.", "meet the model."]; let w = 0, c = 0, del = false;
  (function tick(){
    const t = words[w]; $("typed").textContent = t.slice(0, c);
    if(!del && c === t.length){ del = true; return setTimeout(tick, 1800); }
    if(del && c === 0){ del = false; w = (w+1) % words.length; }
    c += del ? -1 : 1; setTimeout(tick, del ? 35 : 70);
  })();
})();

/* ---------- Form ---------- */
const bWrap = $("boroughs");
Object.entries(BOROUGHS).forEach(([name,b]) => {
  const btn = document.createElement("button");
  btn.type = "button"; btn.className = "chip"; btn.setAttribute("aria-pressed","false");
  btn.innerHTML = `<i style="background:${b.color}">${b.c}</i>${name}`;
  btn.onclick = () => selectBorough(name); bWrap.appendChild(btn);
});
function selectBorough(name, keepCoords){
  borough = name;
  [...bWrap.children].forEach((el,i) => el.setAttribute("aria-pressed", Object.keys(BOROUGHS)[i] === name));
  $("hoods").innerHTML = BOROUGHS[name].hoods.map(h => `<option value="${h}">`).join("");
  if(!keepCoords){ $("latitude").value = BOROUGHS[name].lat; $("longitude").value = BOROUGHS[name].lng; }
  progress();
}
$("availability_365").oninput = e => { $("availOut").textContent = e.target.value; progress(); };
$("priceRange").oninput = e => { $("price").value = e.target.value; progress(); };
$("price").addEventListener("input", e => { if(e.target.value) $("priceRange").value = Math.min(1000, e.target.value); });
$("form").addEventListener("input", progress);

function setValues(v, b){
  selectBorough(b, true);
  Object.entries(v).forEach(([k,val]) => $(k).value = val);
  $("availOut").textContent = v.availability_365; $("priceRange").value = Math.min(1000, v.price);
  clearErrors(); progress();
}
$("sample").onclick = () => setValues({neighbourhood:"Williamsburg", latitude:40.7081, longitude:-73.9571, price:140, minimum_nights:3, number_of_reviews:48, reviews_per_month:1.6, calculated_host_listings_count:1, availability_365:210}, "Brooklyn");
$("reset").onclick = () => {
  $("form").reset(); borough = null; $("availOut").textContent = 180;
  [...bWrap.children].forEach(el => el.setAttribute("aria-pressed","false"));
  clearErrors(); progress(); $("result").innerHTML = `<div class="empty"><div class="pulse">🏙️</div><p>Your prediction will appear here.</p></div>`;
};

function clearErrors(){
  document.querySelectorAll(".err").forEach(e => e.textContent = "");
  document.querySelectorAll(".invalid").forEach(e => e.classList.remove("invalid"));
}
function validate(){
  clearErrors(); const errs = {}, data = {};
  if(!borough) return showError("<b>Choose a borough first.</b><br>Tap one of the borough buttons."), null;
  const hood = $("neighbourhood").value.trim();
  if(!hood) errs.neighbourhood = "Enter a neighbourhood.";
  data.neighbourhood_group = borough; data.neighbourhood = hood;
  NUM.forEach(k => {
    const raw = $(k).value; if(raw === "") return errs[k] = "Required.";
    const n = Number(raw);
    if(INT.includes(k) && !Number.isInteger(n)) return errs[k] = "Use a whole number.";
    if(k === "latitude" && !(n > -90 && n <= 90)) return errs[k] = "Must be between -90 and 90.";
    if(k === "longitude" && !(n > -180 && n <= 180)) return errs[k] = "Must be between -180 and 180.";
    if(!["latitude","longitude"].includes(k) && !(n > 0)) return errs[k] = "Must be greater than 0.";
    if(k === "availability_365" && n > 365) return errs[k] = "Max is 365.";
    data[k] = n;
  });
  Object.entries(errs).forEach(([k,msg]) => { document.querySelector(`[data-for="${k}"]`).textContent = msg; $(k).classList.add("invalid"); });
  return Object.keys(errs).length ? null : data;
}
function showError(html){ $("result").innerHTML = `<div class="errbox">${html}</div>`; }

$("form").addEventListener("submit", async e => {
  e.preventDefault();
  const data = validate(); if(!data) return;
  const btn = $("go"), base = $("apiUrl").value.trim().replace(/\/+$/,"");
  btn.disabled = true; btn.classList.add("loading"); document.body.classList.add("scan");
  try{
    const res = await fetch(base + "/predict", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(data)});
    if(!res.ok){
      const body = await res.json().catch(() => ({}));
      const detail = Array.isArray(body.detail) ? body.detail.map(d => `${d.loc.slice(1).join(".")}: ${d.msg}`).join("<br>") : (body.detail || res.statusText);
      showError(`<b>The API rejected the input (${res.status}).</b><br>${detail}`);
    } else render(await res.json());
    $("dot").className = "dot ok";
  }catch(err){
    $("dot").className = "dot bad";
    showError(`<b>Can’t reach the API at <code>${base}</code>.</b><br>Check that uvicorn is running and that CORS is enabled in <code>main.py</code>.`);
  }finally{ btn.disabled = false; btn.classList.remove("loading"); document.body.classList.remove("scan"); }
});

/* ---------- Result ---------- */
function render(r){
  const probs = r.Probability || [], pred = r.Predicted_room_type;
  const top = Math.max(0, probs.indexOf(Math.max(...probs))), C = 2*Math.PI*76;
  let cum = 0;
  const segs = probs.map((p,i) => { const s = `<circle class="seg" cx="100" cy="100" r="76" stroke="${COLORS[i]}" stroke-dasharray="0 ${C}" data-d="${p*C} ${C}" stroke-dashoffset="${-cum*C}"/>`; cum += p; return s; }).join("");
  $("result").innerHTML = `
    <div class="donut"><svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="76" stroke="#eceaf6"/>${segs}</svg>
      <div class="center"><b id="count">0%</b><span>confidence</span></div></div>
    <div class="verdict" style="color:${COLORS[top]}">${ICONS[top]} ${pred}</div>
    <div class="tiles">${probs.map((p,i) => `
      <div class="tile ${i === top ? "top" : ""}" style="--c:${COLORS[i]};animation-delay:${.15*i}s">
        <span class="ic">${ICONS[i]}</span><b>${CLASSES[i]}</b><em>${(p*100).toFixed(1)}%</em>
        <div class="track"><div class="fill" data-w="${p*100}"></div></div></div>`).join("")}</div>
    <div class="note">Probabilities follow the model’s class order: ${CLASSES.join(", ")}.</div>`;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.querySelectorAll(".seg").forEach(s => s.setAttribute("stroke-dasharray", s.dataset.d));
    document.querySelectorAll(".fill").forEach(f => f.style.width = f.dataset.w + "%");
  }));
  const target = probs[top]*100, t0 = performance.now();
  (function step(t){ const k = Math.min(1,(t-t0)/1100), e = 1-Math.pow(1-k,3);
    const el = $("count"); if(el) el.textContent = (target*e).toFixed(1) + "%"; if(k < 1) requestAnimationFrame(step); })(t0);
  if(innerWidth < 860) $("result").scrollIntoView({behavior:"smooth", block:"start"});
}

fetch($("apiUrl").value.trim() + "/").then(r => $("dot").className = r.ok ? "dot ok" : "dot bad").catch(() => $("dot").className = "dot bad");
progress();
