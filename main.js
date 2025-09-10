// =======================
// GLOBAL VARIABLES
// =======================
let trainees = [];
let filteredTrainees = [];
let ranking = [];
const rowNums = [1, 2, 4, 5];
let showEliminated = false;
let showTop12 = true;
const currentURL = "https://yourgithubusername.github.io/";

// =======================
// TRAINEE CONSTRUCTORS
// =======================
function newTrainee() {
  return {
    id: -1,
    name_romanized: '&#8203;',
    name_hangul: '&#8203;',
    grade: 'no',
    image: 'crown.png', // 👑 use crown.png for empty spots
    selected: false,
    eliminated: false,
    top12: false
  };
}

function newRanking() {
  let r = [];
  for (let i = 0; i < 12; i++) {
    r.push(newTrainee());
  }
  return r;
}

// =======================
// CSV READING
// =======================
function readFromCSV(path) {
  const rawFile = new XMLHttpRequest();
  rawFile.open("GET", path, false);
  rawFile.onreadystatechange = function() {
    if (rawFile.readyState === 4 && (rawFile.status === 200 || rawFile.status === 0)) {
      const allText = rawFile.responseText;
      const csvArray = CSV.parse(allText);
      trainees = csvArray.map((row, index) => {
        const t = {};
        t.name_romanized = row[0];
        t.name_hangul = row[2] === "-" ? row[1] : row[2];
        t.birthyear = row[5];
        t.eliminated = row[6] === 'e';
        t.top12 = row[6] === 't';
        t.id = parseInt(row[7]) - 1;
        t.image = t.name_romanized.replace(" ", "").replace("-", "") + ".png";
        t.selected = false;
        return t;
      });
      filteredTrainees = trainees;
      populateTable(filteredTrainees);
    }
  };
  rawFile.send(null);
}

// =======================
// TABLE POPULATION
// =======================
function populateTable(list) {
  const container = document.getElementById("table__entry-container");
  container.innerHTML = ""; // clear table

  list.forEach(t => {
    const eliminatedClass = (showEliminated && t.eliminated) ? "eliminated" : "";
    const top12Class = (showTop12 && t.top12) ? "top12" : "";

    const html = `
      <div class="table__entry ${eliminatedClass}" data-id="${t.id}">
        <div class="table__entry-icon">
          <img class="table__entry-img" src="assets/trainees/${t.image}" />
          <div class="table__entry-icon-border ${t.grade}-rank-border"></div>
          ${top12Class ? '<div class="table__entry-icon-crown"></div>' : ''}
          ${t.selected ? '<img class="table__entry-check" src="assets/check.png"/>' : ''}
        </div>
        <div class="table__entry-text">
          <span class="name"><strong>${t.name_romanized}</strong></span>
          <span class="hangul">(${t.name_hangul})</span>
          <span class="year">${t.birthyear}</span>
        </div>
      </div>
    `;
    container.insertAdjacentHTML("beforeend", html);

    // Add click handler
    container.lastChild.addEventListener("click", () => tableClicked(t));
  });
}

// =======================
// PYRAMID / RANKING
// =======================
function populateRanking() {
  const pyramid = document.getElementById("ranking__pyramid");
  const rows = Array.from(pyramid.children).slice(1); // skip title
  let rankIndex = 0;

  rows.forEach((row, rowIdx) => {
    row.innerHTML = "";
    for (let i = 0; i < rowNums[rowIdx]; i++) {
      const t = ranking[rankIndex];
      const eliminatedClass = (showEliminated && t.eliminated) ? "eliminated" : "";
      const top12Class = (showTop12 && t.top12) ? "top12" : "";

      const html = `
        <div class="ranking__entry ${eliminatedClass}" data-id="${t.id}">
          <div class="ranking__entry-view">
            <div class="ranking__entry-icon" draggable="${t.id>=0}">
              <img class="ranking__entry-img" src="assets/trainees/${t.image}" />
              <div class="ranking__entry-icon-border ${t.grade}-rank-border"></div>
              ${top12Class ? '<div class="ranking__entry-icon-crown"></div>' : ''}
            </div>
            <div class="ranking__entry-icon-badge">${rankIndex+1}</div>
          </div>
          <div class="ranking__row-text">
            <div class="name"><strong>${t.name_romanized}</strong></div>
            <div class="year">${t.birthyear}</div>
          </div>
        </div>
      `;
      row.insertAdjacentHTML("beforeend", html);
      rankIndex++;
    }
  });
}

// =======================
// INTERACTIONS
// =======================
function tableClicked(t) {
  if (t.selected) removeRankedTrainee(t);
  else addRankedTrainee(t);
  rerenderAll();
}

function rankingClicked(t) {
  if (t.selected) removeRankedTrainee(t);
  rerenderAll();
}

function addRankedTrainee(t) {
  const idx = ranking.findIndex(r => r.id === -1);
  if (idx !== -1) {
    ranking[idx] = t;
    t.selected = true;
  }
}

function removeRankedTrainee(t) {
  const idx = ranking.findIndex(r => r.id === t.id);
  if (idx !== -1) {
    ranking[idx] = newTrainee();
    t.selected = false;
  }
}

function rerenderAll() {
  populateTable(filteredTrainees);
  populateRanking();
}

// =======================
// SEARCH FILTER
// =======================
function filterTrainees(event) {
  const query = event.target.value.toLowerCase();
  filteredTrainees = trainees.filter(t => {
    const matchName = t.name_romanized.toLowerCase().includes(query);
    return matchName;
  });
  rerenderAll();
}

// =======================
// SHARE LINK
// =======================
function generateShareLink() {
  const code = ranking.map(t => ("0"+t.id).slice(-2)).join("");
  const shareURL = currentURL + "?r=" + btoa(code);
  const box = document.getElementById("getlink-textbox");
  box.value = shareURL;
  box.style.display = "block";
  document.getElementById("copylink-button").style.display = "block";
}

function copyLink() {
  const box = document.getElementById("getlink-textbox");
  box.select();
  document.execCommand("copy");
}

// =======================
// INITIALIZATION
// =======================
window.addEventListener("load", () => {
  ranking = newRanking();
  readFromCSV("./trainees.csv"); // your CSV
  populateRanking();
  getRankingFromURL();
});

function getRankingFromURL() {
  const params = new URLSearchParams(window.location.search);
  if (!params.has("r")) return;

  const code = atob(params.get("r"));
  for (let i=0; i<12; i++) {
    const id = parseInt(code.substr(i*2, 2));
    ranking[i] = id >= 0 ? trainees[id] : newTrainee();
    if (id >= 0) trainees[id].selected = true;
  }
  rerenderAll();
}