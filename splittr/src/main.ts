import './style.css'
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, get } from 'firebase/database';
import { Howl, Howler } from 'howler';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<div id="start-screen" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: #111; display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 20000; font-family: sans-serif; box-sizing: border-box; padding: 20px;">
  <div style="text-align: center; max-width: 500px; width: 100%;">
    <h1 style="color: #fff; font-size: 56px; margin-bottom: 5px; letter-spacing: 5px;">
      <span style="color: #ea932e;">Spli</span><span style="color: #292cc5;">ttr</span>
    </h1>
    <br>
    <div style="border-top: 3px dashed #b700ff; width: 150px; margin: 2px auto;"></div>
    
    <p style="color: #aaa; font-size: 16px; line-height: 1.6; margin-bottom: 40px; padding: 0 10px; margin: 20px">
      A precision polygon-splitting game. Challenge yourself to achieve perfect 50/50 splits across 5 rounds and compete on the global leaderboard.
    </p>
    
    <button id="start-game-btn" style="padding: 15px 40px; font-size: 18px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: white; background: linear-gradient(135deg, #ea932e, #292cc5); border: none; border-radius: 30px; cursor: pointer; box-shadow: 0 5px 15px rgba(0,0,0,0.3); transition: transform 0.2s, box-shadow 0.2s;">
      START SPLITTING
    </button>
    <button id="daily-game-btn" style="padding: 15px 40px; margin: 20px 20px; font-size: 18px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: white; background: linear-gradient(135deg, #2b9939, #b33cce); border: none; border-radius: 30px; cursor: pointer; box-shadow: 0 5px 15px rgba(0,0,0,0.3); transition: transform 0.2s, box-shadow 0.2s;">
      DAILY CHALLENGE
    </button>
  </div>
</div>

<section id="game-container" style="display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column; background: #111;">
  <h1 style="color: white; margin-bottom: 10px; font-family: sans-serif;">Splittr</h1><br>
  <h2>Score: <div id="score-display" style="display: inline-block">0</div></h2>
  <canvas id="gameCanvas" width="600" height="600" style="background: #1a1a1a; border: 2px solid #333; max-width: 95vw; max-height: 95vw; box-sizing: border-box;"></canvas>
</section>

<div id="leaderboard-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.9); z-index: 10000; align-items: center; justify-content: center;">
  <div style="background: #1a1a1a; border: 2px solid #333; border-radius: 10px; padding: 25px; max-width: 450px; width: 85%; max-height: 80vh; display: flex; flex-direction: column; box-sizing: border-box; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
    
    <div id="submission-zone" style="display: none; flex-direction: column; text-align: center;">
      <h2 style="color: white; margin-top: 0; font-family: sans-serif;">🎉 Game Over!</h2>
      <p style="color: #ccc; font-family: sans-serif;" id="final-score-display"></p>
      <input type="text" id="player-name-input" placeholder="Your Name" maxlength="15" style="padding: 12px; font-size: 16px; border-radius: 5px; border: 1px solid #333; background: #222; color: white; margin-bottom: 15px; text-align: center; font-family: sans-serif;">
      <button type="button" id="submit-score-btn" style="width: 100%; padding: 12px; background: #4caf50; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; font-weight: bold; font-family: sans-serif;">Submit Score</button>
    </div>

    <div id="leaderboard-zone" style="display: none; flex-direction: column; height: 100%;">
      <h2 style="color: white; text-align: center; margin-top: 0; font-family: sans-serif; font-size: 24px;">🏆 Leaderboard</h2>
      <div id="leaderboard-content" style="color: white; font-family: sans-serif; overflow-y: auto; flex-grow: 1; min-height: 200px; -webkit-overflow-scrolling: touch;">
        <p style="color: #888; text-align: center; margin-top: 40px;">Loading...</p>
      </div>
      <button id="close-leaderboard" onClick="window.location.reload();" style="width: 100%; padding: 12px; margin-top: 15px; background: #292cc5; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; font-weight: bold; font-family: sans-serif;">Close</button>
    </div>
  </div>
`

const firebaseConfig = {
  apiKey: "AIzaSyACDKDuExGWH3fsrgbMBRcOMbB9w_9DCeY",
  authDomain: "splittr-dee33.firebaseapp.com",
  databaseURL: "https://splittr-dee33-default-rtdb.firebaseio.com",
  projectId: "splittr-dee33",
  storageBucket: "splittr-dee33.firebasestorage.app",
  messagingSenderId: "888712319044",
  appId: "1:888712319044:web:4bade4e9da4b3b3640ac11",
  measurementId: "G-T9PJX7S85J"
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

const sliceSound = new Howl({
  src: ['./audio/slice.mp3'],
  volume: 0.5,
  preload: true
});

const backgroundTrack = new Howl({
  src: ['./audio/8bit Bossa.mp3'],
  volume: 0.4,
  preload: true
})

let isDrawing = false;
let lineStart = { x: 0, y: 0 };
let lineEnd = { x: 0, y: 0};
let currentAccuracy: number | null = null;
let blueArea: number | null = null;
let redArea: number | null = null;
let currentRound = 1;
let scoreHistory: number[] = [];
let activePolygon: Point[] = [];
let isDisplayingResult = false;
let animationFrameCount = 0;
let feedbackColor = '#ffffff';
let globalFinalScore = 0;
let cumAccuracy: number[] = [];
let gameState: 'MENU' | 'PLAYING' = 'MENU';

function submitScore(e?: Event) {
  if (e) {
    e.preventDefault();
  }

  const nameInput = document.getElementById('player-name-input') as HTMLInputElement;
  const submitBtn = document.getElementById('submit-score-btn') as HTMLButtonElement;
  const playerName = nameInput?.value?.trim();

  console.log("submitScore called. Name:", playerName, "Score:", globalFinalScore);

  if (playerName && playerName !== "") {
    if (submitBtn) {
      submitBtn.disabled = true;
    }
    
    console.log("Pushing to Firebase with:", { playerName, score: globalFinalScore, timestamp: Date.now() });
    
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Firebase request timed out after 10 seconds")), 10000)
    );
    
    Promise.race([
      push(ref(db, 'scores'), {
        playerName: playerName,
        score: globalFinalScore,
        timestamp: Date.now()
      }),
      timeoutPromise
    ]).then(() => {
      showLeaderboard();
    }).catch((error) => {
      console.error("Firebase push error:", error);
      console.error("Error code:", error?.code || "N/A");
      console.error("Error message:", error?.message || String(error));
      alert("Firebase Error:\n" + (error?.code || "TIMEOUT") + "\n" + (error?.message || "Request failed"));
      if (submitBtn) submitBtn.disabled = false;
    });
  } else {
    console.log("✗ Name was empty");
    alert("Please enter a name");
  }
}

function showLeaderboard() {
  console.log("=== showLeaderboard called ===");

  const modal = document.getElementById('leaderboard-modal') as HTMLDivElement;
  const subZone = document.getElementById('submission-zone') as HTMLDivElement;
  const lbZone = document.getElementById('leaderboard-zone') as HTMLDivElement;
  const content = document.getElementById('leaderboard-content') as HTMLDivElement;

  if (!modal || !content || !subZone || !lbZone) {
    console.error("DOM Elements missing from showLeaderboard!");
    return;
  }

  modal.style.setProperty('display', 'flex', 'important');
  subZone.style.setProperty('display', 'none', 'important');
  lbZone.style.setProperty('display', 'flex', 'important');

  get(ref(db, 'scores')).then((snapshot) => {
    const data = snapshot.val();
    if (data) {
      const leaderboard = Object.entries(data)
        .map(([_, score]: any) => ({...score, score: Number(score.score)}))
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 10);
      
      let html = '<table style="width: 100%; table-layout: fixed; border-collapse: collapse; color: white; font-family: sans-serif;">';
      html += '<tr style="border-bottom: 2px solid #333;"><th style="padding: 12px 5px; text-align: left; width: 20%;">Rank</th><th style="padding: 12px 5px; text-align: left; width: 50%;">Name</th><th style="padding: 12px 5px; text-align: right; width: 30%;">Score</th></tr>';
      
      leaderboard.forEach((entry: any, rank: number) => {
        const medals = ['🥇', '🥈', '🥉'];
        const medal = rank < 3 ? medals[rank] : `${rank + 1}.`;
        html += `<tr style="border-bottom: 1px solid #222;"><td style="padding: 12px 5px;">${medal}</td><td style="padding: 12px 5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${entry.playerName}</td><td style="padding: 12px 5px; text-align: right; color: #ec9539; font-weight: bold;">${entry.score.toFixed(2)}</td></tr>`;
      });
      
      html += '</table>';
      content.innerHTML = html;
    } else {
      content.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">No scores yet!</p>';
    }
  }).catch((error) => {
    console.error("Firebase fetch error:", error);
    content.innerHTML = `<p style="color: #f44336; text-align: center; padding: 20px;">Error loading stats</p>`;
  });
}

document.getElementById('close-leaderboard')?.addEventListener('click', () => {
  const modal = document.getElementById('leaderboard-modal') as HTMLDivElement;
  modal.style.display = 'none';
  currentRound = 1;
  scoreHistory = [];
  isDisplayingResult = false;
  activePolygon = generateConvexPolygon(4);
  while (activePolygon.length < 4) {
    activePolygon = generateConvexPolygon(4);
  }
  draw();
});

document.getElementById('submit-score-btn')?.addEventListener('click', (e) => submitScore(e));

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.moveTo(activePolygon[0].x, activePolygon[0].y);
  activePolygon.forEach(pt => ctx.lineTo(pt.x, pt.y));
  ctx.closePath();
  ctx.strokeStyle = '#ffffff';
  ctx.fillStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fill();
  if (isDrawing) {
    ctx.beginPath();
    ctx.moveTo(lineStart.x, lineStart.y);
    ctx.lineTo(lineEnd.x, lineEnd.y);
    ctx.strokeStyle = '#9839ec';
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  requestAnimationFrame(draw);
}

function initStartScreen() {
  const startScreen = document.getElementById('start-screen') as HTMLDivElement;
  const startBtn = document.getElementById('start-game-btn') as HTMLButtonElement;

  if (!startScreen || !startBtn) {
    return;
  }

  startBtn.addEventListener('click', () => {
    if (Howler.ctx && Howler.ctx.state == 'suspended') {
      Howler.ctx.resume();
    }
    backgroundTrack.play();
    startScreen.style.display = 'none';
    gameState = 'PLAYING';
    activePolygon = generateConvexPolygon(5);
    draw();
  });
}

initStartScreen();

function drawSplit() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  let normal = calculatePerp();
  animationFrameCount++;

  const offset = animationFrameCount;
  
  if (shapeOne.length > 0) {
    ctx.beginPath();
    const offsetPt1 = { x: shapeOne[0].x - normal.x * offset, y: shapeOne[0].y - normal.y * offset };
    ctx.moveTo(offsetPt1.x, offsetPt1.y);
    shapeOne.forEach(pt => {
      const offsetPt = { x: pt.x - normal.x * offset, y: pt.y - normal.y * offset };
      ctx.lineTo(offsetPt.x, offsetPt.y)
    });
    ctx.closePath();
    ctx.strokeStyle = feedbackColor;
    ctx.fillStyle = '#292cc5';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.fill();
  }
  
  if (shapeTwo.length > 0) {
    ctx.beginPath();
    const offsetPt2 = { x: shapeTwo[0].x + normal.x * offset, y: shapeTwo[0].y + normal.y * offset };
    ctx.moveTo(offsetPt2.x, offsetPt2.y);
    shapeTwo.forEach(pt => {
      const offsetPt = { x: pt.x + normal.x * offset, y: pt.y + normal.y * offset };
      ctx.lineTo(offsetPt.x, offsetPt.y)
    });
    ctx.closePath();
    ctx.strokeStyle = feedbackColor;
    ctx.fillStyle = '#ea932e';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.fill();
  }

  if (currentAccuracy !== null && redArea !== null && blueArea !== null) {
    if (currentAccuracy >= 90) {
      feedbackColor = '#4caf50';
    } else if (currentAccuracy >= 60) {
      feedbackColor = '#f7da34';
    } else if (currentAccuracy < 60) {
      feedbackColor = '#f44336';
    } else {
      feedbackColor = '#ffffff';
    }
    
    ctx.font = "bold 30px sans-serif";
    ctx.fillStyle = feedbackColor;
    ctx.textAlign = "center";
    ctx.fillText(`Accuracy: ${currentAccuracy.toFixed(2)}%`, canvas.width / 2, 80);
    ctx.font = "bold 20px sans-serif";
    ctx.fillStyle = "#292cc5";
    ctx.fillText(`Blue Area: ${redArea.toFixed(2)}%`, canvas.width / 2 - 100, 130);
    ctx.fillStyle = "#ea932e";
    ctx.fillText(`Orange Area: ${blueArea.toFixed(2)}%`, canvas.width / 2 + 100, 130);
  }

  requestAnimationFrame(drawSplit);
}

function drawEndScreen() {
  globalFinalScore = cumAccuracy[4];

  const modal = document.getElementById('leaderboard-modal') as HTMLDivElement;
  const subZone = document.getElementById('submission-zone') as HTMLDivElement;
  const lbZone = document.getElementById('leaderboard-zone') as HTMLDivElement;
  const scoreDisplay = document.getElementById('final-score-display') as HTMLParagraphElement;

  if (modal && subZone && lbZone && scoreDisplay) {
    scoreDisplay.innerText = `Your Accuracy: ${globalFinalScore.toFixed(2)}`
    modal.style.display = 'flex';
    subZone.style.display = 'flex';
    lbZone.style.display = 'none';
  }
}

const handleMouseDown = (event: MouseEvent): void => {
  if (isDisplayingResult) {
    return;
  }
  
  isDrawing = true;

  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  lineStart = { x: mouseX, y: mouseY };
  lineEnd = { x: mouseX, y: mouseY };
};

canvas.addEventListener('mousedown', handleMouseDown);

const handleMouseMove = (event: MouseEvent): void => {
  if (!isDrawing || isDisplayingResult || gameState == 'MENU') {
    return;
  }

  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;
  lineEnd = { x: mouseX, y: mouseY };
}

canvas.addEventListener('mousemove', handleMouseMove);

const handleMouseUp = (): void => {
  if (!isDrawing || isDisplayingResult) {
    return;
  }

  isDrawing = false;
  sliceSound.play();
  let score = processSlice(lineStart, lineEnd);
  animationFrameCount = 0;
  if (score != null) {
    scoreHistory.push(score);
    isDisplayingResult = true;
    setTimeout(() => {
      console.log("2 second intermission");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      currentRound++;
      if (currentRound <= 5) {
        activePolygon = generateConvexPolygon(5 + currentRound);
        while (activePolygon.length < 4) {
          activePolygon = generateConvexPolygon(5 + currentRound);
        }
        draw();
        isDisplayingResult = false;
      } else {
        drawEndScreen();
      }
    }, 1800);
  }
}

window.addEventListener('mouseup', handleMouseUp);

const handleTouchStart = (event: TouchEvent): void => {
  if (isDisplayingResult || gameState == 'MENU') {
    return;
  }
  
  event.preventDefault();
  isDrawing = true;

  const rect = canvas.getBoundingClientRect();
  const touch = event.touches[0];

  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const mouseX = (touch.clientX - rect.left) * scaleX;
  const mouseY = (touch.clientY - rect.top) * scaleY;

  lineStart = { x: mouseX, y: mouseY };
  lineEnd = { x: mouseX, y: mouseY };
};

canvas.addEventListener('touchstart', handleTouchStart);

const handleTouchMove = (event: TouchEvent): void => {
  if (!isDrawing || isDisplayingResult) {
    return;
  }

  event.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const touch = event.touches[0];

  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const mouseX = (touch.clientX - rect.left) * scaleX;
  const mouseY = (touch.clientY - rect.top) * scaleY;

  lineEnd = { x: mouseX, y: mouseY };
}

canvas.addEventListener('touchmove', handleTouchMove);

const handleTouchEnd = (): void => {
  if (!isDrawing || isDisplayingResult) {
    return;
  }

  isDrawing = false;
  sliceSound.play();
  let score = processSlice(lineStart, lineEnd);
  animationFrameCount = 0;
  if (score != null) {
    scoreHistory.push(score);
    isDisplayingResult = true;
    setTimeout(() => {
      console.log("2 second intermission");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      currentRound++;
      if (currentRound <= 5) {
        activePolygon = generateConvexPolygon(5 + currentRound);
        while (activePolygon.length <= 3) {
          activePolygon = generateConvexPolygon(5 + currentRound);
        }
        draw();
        isDisplayingResult = false;
      } else {
        drawEndScreen();
      }
    }, 1800);
  }
}

window.addEventListener('touchend', handleTouchEnd);

let pts: Point[] = [];
let shapeOne: Point[] = [];
let shapeTwo: Point[] = [];

function processSlice(lineStart:Point, lineEnd:Point) {
  pts = [];
  shapeOne = [];
  shapeTwo = [];
  
  for (let i = 0; i < activePolygon.length; i++) {
    let currIntersect = intersection(activePolygon[i], activePolygon[(i + 1) % activePolygon.length], lineStart, lineEnd);
    if (currIntersect != null) {
      pts.push(currIntersect);
    }
  }
  if (pts.length < 2) {
    return null;
  }

  shapeOne.push(pts[0]);
  shapeTwo.push(pts[0]);
  shapeOne.push(pts[1]);
  shapeTwo.push(pts[1]);
  for (let i = 0; i < activePolygon.length; i++) {
    if (onLeftSide(activePolygon[i])) {
      shapeOne.push(activePolygon[i]);
    } else {
      shapeTwo.push(activePolygon[i]);
    }
  }

  shapeOne = orderPolygonVertices(shapeOne);
  shapeTwo = orderPolygonVertices(shapeTwo);

  const areaA = getArea(shapeOne);
  const areaB = getArea(shapeTwo);
  const totalArea = areaA + areaB;
  const pctA = (areaA / totalArea) * 100;
  const pctB = (areaB / totalArea) * 100;
  let accuracy = (100 - (Math.abs(50 - pctA) * 2));
  redArea = pctA;
  blueArea = pctB;
  
  currentAccuracy = accuracy;

  cumAccuracy[currentRound - 1] = currentAccuracy + (currentRound > 1 ? cumAccuracy[currentRound - 2] : 0);
  const displayElement = document.getElementById("score-display");
  if (displayElement !== null) {
    displayElement.textContent = String(cumAccuracy[currentRound - 1].toFixed(2));
  }

  drawSplit();
  return accuracy;
}

interface Point { x: number; y: number; }


function intersection(p1:Point, p2:Point, p3:Point, p4:Point): Point | null {
    const denominator = ((p4.y - p3.y) * (p2.x - p1.x)) - ((p4.x - p3.x) * (p2.y - p1.y));

    if (denominator == 0) {
      return null;
    }

    const ua = (((p4.x - p3.x) * (p1.y - p3.y)) - ((p4.y - p3.y) * (p1.x - p3.x))) / denominator;
    const ub = (((p2.x - p1.x) * (p1.y - p3.y)) - ((p2.y - p1.y) * (p1.x - p3.x))) / denominator;

    if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {
      const intersection_x = p1.x + ua * (p2.x - p1.x);
      const intersection_y = p1.y + ua * (p2.y - p1.y);
      return { x: intersection_x, y: intersection_y };
    } else {
      return null;
    }
}

function onLeftSide(pt:Point) {
  const cross_product = ((lineEnd.x - lineStart.x) * (pt.y - lineStart.y) - (pt.x - lineStart.x) * (lineEnd.y - lineStart.y));
  return cross_product >= 0;
}

function orderPolygonVertices(vertices: Point[]): Point[] {
  if (vertices.length < 3) {
    return [...vertices];
  }

  let lowestVertex = vertices[0];
  for (let i = 1; i < vertices.length; i++) {
    if (vertices[i].y < lowestVertex.y || (vertices[i].y == lowestVertex.y && vertices[i].x < lowestVertex.x)) {
      lowestVertex = vertices[i];
    }
  }

  const remaining = vertices.filter(v => v !== lowestVertex);

  remaining.sort((a, b) => {
    const angleA = Math.atan2(a.y - lowestVertex.y, a.x - lowestVertex.x);
    const angleB = Math.atan2(b.y - lowestVertex.y, b.x - lowestVertex.x);
    return angleA - angleB;
  });

  return [lowestVertex, ...remaining];
}

function getArea(poly: Point[]): number {
  let area = 0;
  for (let i = 0; i < poly.length; i++) {
    const next = poly[(i + 1) % poly.length];
    area += poly[i].x * next.y - next.x * poly[i].y;
  }
  return Math.abs(area) / 2;
}

function generateConvexPolygon(numVertices: number): Point[] {
  const center = { x: 300, y: 350 };
  const angles: number[] = [];

  for (let i = 0; i < numVertices; i++) {
    angles.push(Math.random() * Math.PI * 2);
  }

  return grahamScan(orderPolygonVertices(angles.map(angle => {
    const radius = 120 + Math.random() * 90;
    return {
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle)
    };
  })));
}

function calculatePerp() {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const normal = { x: dy / len, y: -dx / len };
  return normal;
}

function grahamScan(sortedVertices: Point[]) {
  let stack: Point[] = [];
  if (sortedVertices.length < 3) {
    return [...sortedVertices];
  }
  stack.push(sortedVertices[0]);
  stack.push(sortedVertices[1]);
  for (let i = 2; i < sortedVertices.length; i++) {
    while (stack.length > 1 && crossProduct(stack[stack.length - 2], stack[stack.length - 1], sortedVertices[i]) <= 0) {
      stack.pop();
    }
    stack.push(sortedVertices[i]);
  }
  return stack;
}

function crossProduct(p1: Point, p2: Point, p3: Point) {
  return (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y)* (p3.x - p1.x);
}
