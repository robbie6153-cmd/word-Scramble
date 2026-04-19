const rounds = [
  { round: 1, letters: 4, time: 10, penalty: 1 },
  { round: 2, letters: 5, time: 15, penalty: 2 },
  { round: 3, letters: 6, time: 20, penalty: 3 },
  { round: 4, letters: 7, time: 25, penalty: 4 },
  { round: 5, letters: 8, time: 30, penalty: 5 },
  { round: 6, letters: 9, time: 35, penalty: 6 },
  { round: 7, letters: 10, time: 40, penalty: 7 }
];

const els = {
  startScreen: document.getElementById("start-screen"),
  gameScreen: document.getElementById("game-screen"),
  recapScreen: document.getElementById("recap-screen"),
  endScreen: document.getElementById("end-screen"),

  startBtn: document.getElementById("start-btn"),
  submitBtn: document.getElementById("submit-btn"),
  nextRoundBtn: document.getElementById("next-round-btn"),
  playAgainBtn: document.getElementById("play-again-btn"),
  changeBtn: document.getElementById("change-btn"),

  scrambleDisplay: document.getElementById("scramble-display"),
  answerInput: document.getElementById("answer-input"),
  timer: document.getElementById("timer"),
  round: document.getElementById("round"),
  totalScore: document.getElementById("total-score"),
  message: document.getElementById("message"),

  recapTitle: document.getElementById("recap-title"),
  recapText: document.getElementById("recap-text"),
  countdownText: document.getElementById("countdown-text"),

  finalScore: document.getElementById("final-score"),
  finalSummary: document.getElementById("final-summary")
};

let currentRoundIndex = 0;
let currentSet = null;
let timeLeft = 0;
let timerInterval = null;
let totalScore = 0;
let usedChange = false;
let roundSolved = false;
let lastRoundPoints = 0;
let lastRoundPenaltyUsed = 0;

const dictionary = Array.isArray(window.DICTIONARY)
  ? [...new Set(window.DICTIONARY.map(word => String(word).trim().toUpperCase()))]
  : [];

// ---------- Utility ----------
function shuffleString(str) {
  const arr = str.split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join("");
}

function sortLetters(str) {
  return str.split("").sort().join("");
}

function getDictionaryWordsOfLength(length) {
  return dictionary.filter(word => /^[A-Z]+$/.test(word) && word.length === length);
}

function getRandomWordForRound(roundObj) {
  const wordsOfLength = getDictionaryWordsOfLength(roundObj.letters);

  if (!wordsOfLength.length) {
    return null;
  }

  const selectedWord = wordsOfLength[Math.floor(Math.random() * wordsOfLength.length)];

  return {
    letters: selectedWord.toUpperCase(),
    answers: [selectedWord.toUpperCase()]
  };
}

function showScreen(screenName) {
  els.startScreen.style.display = "none";
  els.gameScreen.style.display = "none";
  els.recapScreen.style.display = "none";
  els.endScreen.style.display = "none";

  if (screenName === "start") els.startScreen.style.display = "block";
  if (screenName === "game") els.gameScreen.style.display = "block";
  if (screenName === "recap") els.recapScreen.style.display = "block";
  if (screenName === "end") els.endScreen.style.display = "block";
}

function setMessage(text, type = "normal") {
  els.message.textContent = text;
  els.message.className = "";
  els.message.classList.add(type);
}

function updateHUD() {
  els.round.textContent = `Round ${currentRoundIndex + 1} of ${rounds.length}`;
  els.timer.textContent = timeLeft;
  els.totalScore.textContent = totalScore;
}

function updateChangeButton() {
  const penalty = rounds[currentRoundIndex].penalty;

  if (usedChange) {
    els.changeBtn.disabled = true;
    els.changeBtn.textContent = "✖ Used";
    els.changeBtn.classList.add("used");
    els.changeBtn.classList.remove("available");
  } else {
    els.changeBtn.disabled = false;
    els.changeBtn.textContent = `Change Letters (-${penalty} point${penalty > 1 ? "s" : ""})`;
    els.changeBtn.classList.add("available");
    els.changeBtn.classList.remove("used");
  }
}

function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    updateHUD();

    if (timeLeft <= 5 && timeLeft > 0) {
      els.timer.classList.add("warning");
    } else {
      els.timer.classList.remove("warning");
    }

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timeLeft = 0;
      updateHUD();
      endRound(false);
    }
  }, 1000);
}

function renderScramble(baseLetters) {
  let scrambled = shuffleString(baseLetters);

  let safety = 0;
  while (scrambled === baseLetters && safety < 10) {
    scrambled = shuffleString(baseLetters);
    safety++;
  }

  els.scrambleDisplay.innerHTML = "";
  scrambled.split("").forEach(letter => {
    const tile = document.createElement("div");
    tile.className = "letter-tile";
    tile.textContent = letter;
    els.scrambleDisplay.appendChild(tile);
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function flashResult(text, type, duration = 900) {
  if (!els.message) return;

  els.message.textContent = text;
  els.message.className = "message";

  void els.message.offsetWidth;

  if (type === "success") {
    els.message.classList.add("success");
  } else if (type === "error") {
    els.message.classList.add("error");
  } else {
    els.message.classList.add("normal");
  }

  await delay(duration);
}

function startRound() {
  roundSolved = false;
  usedChange = false;
  lastRoundPoints = 0;
  lastRoundPenaltyUsed = 0;

  const roundObj = rounds[currentRoundIndex];
  currentSet = getRandomWordForRound(roundObj);

  if (!currentSet) {
    setMessage(`No ${roundObj.letters}-letter words found in dictionary.js`, "error");
    return;
  }

  timeLeft = roundObj.time;

  els.answerInput.value = "";
  els.answerInput.maxLength = roundObj.letters;
  els.answerInput.focus();
  setMessage(`Solve the ${roundObj.letters}-letter anagram`, "normal");
  updateChangeButton();
  updateHUD();
  renderScramble(currentSet.letters);
  showScreen("game");
  startTimer();
}

function runCountdownAndStartRound() {
  showScreen("recap");
  let count = 3;
  const nextRoundNum = currentRoundIndex + 1;

  els.recapTitle.textContent = `Get ready for Round ${nextRoundNum}`;
  els.recapText.textContent = `${rounds[currentRoundIndex].letters}-letter anagram coming up`;
  els.countdownText.textContent = count;

  const countdownInterval = setInterval(() => {
    count--;
    if (count > 0) {
      els.countdownText.textContent = count;
    } else if (count === 0) {
      els.countdownText.textContent = "Go!";
    } else {
      clearInterval(countdownInterval);
      startRound();
    }
  }, 1000);
}

async function validateAnswer() {
  if (!currentSet || roundSolved) return;

  const guess = els.answerInput.value.trim().toUpperCase();
  const requiredLength = rounds[currentRoundIndex].letters;

  if (guess.length !== requiredLength) {
    setMessage(`Enter a ${requiredLength}-letter word`, "error");
    return;
  }

  const guessIsInDictionary = dictionary.includes(guess);
  const sameLetters = sortLetters(guess) === sortLetters(currentSet.letters);

  if (guessIsInDictionary && sameLetters) {
    roundSolved = true;
    clearInterval(timerInterval);

    const earned = Math.max(0, timeLeft - lastRoundPenaltyUsed);
    lastRoundPoints = earned;
    totalScore += earned;
    updateHUD();

    await flashResult("✔ CORRECT!", "success", 900);
    endRound(true, guess);
  } else {
    await flashResult("✖ WRONG!", "error", 900);
    setMessage(`Solve the ${requiredLength}-letter anagram`, "normal");
    els.answerInput.focus();
    els.answerInput.select();
  }
}

function useChangeLetters() {
  if (usedChange || roundSolved || !currentSet) return;

  usedChange = true;
  lastRoundPenaltyUsed = rounds[currentRoundIndex].penalty;

  renderScramble(currentSet.letters);

  timeLeft = rounds[currentRoundIndex].time;
  els.timer.classList.remove("warning");
  updateHUD();

  updateChangeButton();
  setMessage(`Letters changed. Penalty applied: -${lastRoundPenaltyUsed}. Timer reset.`, "normal");
}

function endRound(solved, answer = "") {
  clearInterval(timerInterval);

  const roundNumber = currentRoundIndex + 1;
  const answerList = currentSet ? currentSet.letters : "";
  showScreen("recap");

  if (solved) {
    els.recapTitle.textContent = `Round ${roundNumber} complete`;
    els.recapText.innerHTML = `
      You answered <strong>${answer}</strong><br>
      Time left: <strong>${timeLeft}</strong><br>
      Penalty used: <strong>${lastRoundPenaltyUsed}</strong><br>
      Round score: <strong>${lastRoundPoints}</strong><br>
      Total score: <strong>${totalScore}</strong>
    `;
  } else {
    els.recapTitle.textContent = `Round ${roundNumber} over`;
    els.recapText.innerHTML = `
      Time ran out.<br>
      One possible answer: <strong>${answerList}</strong><br>
      Round score: <strong>0</strong><br>
      Total score: <strong>${totalScore}</strong>
    `;
  }

  els.countdownText.textContent = "";

  if (currentRoundIndex >= rounds.length - 1) {
    setTimeout(showEndScreen, 1800);
  } else {
    setTimeout(() => {
      currentRoundIndex++;
      runCountdownAndStartRound();
    }, 1800);
  }
}

function showEndScreen() {
  showScreen("end");
  els.finalScore.textContent = totalScore;
  els.finalSummary.textContent = `You completed ${currentRoundIndex + 1} round${currentRoundIndex + 1 > 1 ? "s" : ""}. Final score: ${totalScore}`;
}

function resetGame() {
  clearInterval(timerInterval);
  currentRoundIndex = 0;
  currentSet = null;
  timeLeft = 0;
  totalScore = 0;
  usedChange = false;
  roundSolved = false;
  lastRoundPoints = 0;
  lastRoundPenaltyUsed = 0;

  els.answerInput.value = "";
  els.message.textContent = "";
  els.timer.classList.remove("warning");
  updateHUD();
  showScreen("start");
}

// ---------- Events ----------
els.startBtn.addEventListener("click", () => {
  currentRoundIndex = 0;
  totalScore = 0;
  runCountdownAndStartRound();
});

els.submitBtn.addEventListener("click", validateAnswer);

els.answerInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") validateAnswer();
});

els.changeBtn.addEventListener("click", useChangeLetters);

els.playAgainBtn.addEventListener("click", resetGame);

if (els.nextRoundBtn) {
  els.nextRoundBtn.addEventListener("click", () => {
    if (currentRoundIndex < rounds.length - 1) {
      currentRoundIndex++;
      runCountdownAndStartRound();
    } else {
      showEndScreen();
    }
  });
}

// ---------- Start ----------
resetGame();