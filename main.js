// =======================
// GLOBAL VARIABLES
// =======================
let trainees = [];
let filteredTrainees = [];
let ranking = [];
const rowNums = [1, 2, 4, 5]; // pyramid rows
let showEliminated = false;
let showTop12 = true;
const currentURL = "https://yourgithubusername.github.io/";

// =======================
// TRAINEE CONSTRUCTORS
// =======================
function newTrainee() {
  return {
    id: -1,
    name_romanized: 'Empty',
    name_hangul: '',
    name_japanese: '',
    birthyear: '',
    grade: 'no',
    image: 'crown.PNG', // use crown.png for empty spots
    selected: false,
    eliminated: false,
    top12: false
  };
}

function newRanking() {
  return Array.from({length: 12}, () => newTrainee());
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
        return {
          id: index,
          name_romanized: row[0],
          name_hangul: row[2] === "-" ? row[1] : row[2],
          name_japanese: row[3] === "-" ? "" : row[3],
          birthyear: row[5],
          eliminated: row[6] === 'e',
          top12: row[6] === 't',
          grade: 'no',
          selected: false,
          image: row[0].replace(" ", "").replace("-", "") + ".png"
        };
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

    const age = t.birthyear ? new Date().getFullYear() - t.birthyear : "";

    const html = `
      <div class="table__entry ${eliminatedClass}" data-id="${t.id}">
        <div class="table__entry-icon">
          <img class="table__entry-img" src="assets/trainees/${t.image}" />
          <div class="table__entry-icon-border ${t.grade}-rank-border"></div>
          ${top12Class ? '<div class="table__entry-icon-crown"></div>' : ''}
        </div>
        <div class="table__entry-text">
          <span class="name">${t.name_romanized}</span>
          <span class="hangul">${t.name_hangul}</span>
          ${t.name_japanese ? `<span class="natl">(${t.name_japanese})</span>` : ''}
          ${age ? `<span class="year">${age} yrs</span>` : ''}
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

  // Clear all rows except title
  pyramid.querySelectorAll(".ranking__row").forEach(row => row.remove());

  let rankIndex = 0;

  rowNums.forEach(numInRow => {
    const rowDiv = document.createElement("div");
    rowDiv.classList.add("ranking__row");

    for (let i = 0; i < numInRow; i++) {
      const t = ranking[rankIndex] || newTrainee();
      const eliminatedClass = (showEliminated && t.eliminated) ? "eliminated" : "";
      const top12Class = (showTop12 && t.top12) ? "top12" : "";
      const age = t.birthyear ? new Date().getFullYear() - t.birthyear : "";

      const entryHtml = `
        <div class="ranking__entry ${eliminatedClass}" data-id="${t.id}">
          <div class="ranking__entry-view">
            <div class="ranking__entry-icon">
              <img class="ranking__entry-img" src="assets/trainees/${t.image}" />
              <div class="ranking__entry-icon-border ${t.grade}-rank-border"></div>
              ${top12Class ? '<div class="ranking__entry-icon-crown"></div>' : ''}
            </div>
            <div class="ranking__entry-icon-badge">${rankIndex + 1}</div>
          </div>
          <div class="ranking__row-text">
            <div class="name">${t.name_romanized}</div>
            <div class="hangul">${t.name_hangul}</div>
            ${t.name_japanese ? `<div class="natl">${t.name_japanese}</div>` : ''}
            ${age ? `<div class="year">${age} yrs</div>` : ''}
          </div>
        </div>
      `;
      rowDiv.insertAdjacentHTML("beforeend", entryHtml);
      rankIndex++;
    }

    pyramid.appendChild(rowDiv);
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
  filteredTrainees = trainees.filter(t => t.name_romanized.toLowerCase().includes(query));
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
  readFromCSV("./trainees.csv"); 
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