import './style.css'
import typescriptLogo from './assets/typescript.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import { setupCounter } from './counter.ts'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<section id="game-container" style="display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column;">
  <h1 style="color: white; margin-bottom: 10px; font-family: sans-serif;">Splittr Prototype</h1><br>
  <canvas id="gameCanvas" width="600" height="600" style="background: #1a1a1a; border: 2px solid #333;"></canvas>
</section>
`

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

const square = [
  { x: 200, y: 200 },
  { x: 400, y: 200 },
  { x: 400, y: 400 },
  { x: 200, y: 400}
];

let isDrawing = false;
let lineStart = { x: 0, y: 0 };
let lineEnd = { x: 0, y: 0};
let currentAccuracy: number | null = null;
let blueArea: number | null = null;
let redArea: number | null = null;

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.moveTo(square[0].x, square[0].y);
  square.forEach(pt => ctx.lineTo(pt.x, pt.y));
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
    ctx.strokeStyle = '#ec9539';
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  requestAnimationFrame(draw);
}

draw();

function drawSplit() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  if (shapeOne.length > 0) {
    ctx.beginPath();
    ctx.moveTo(shapeOne[0].x, shapeOne[0].y);
    shapeOne.forEach(pt => ctx.lineTo(pt.x, pt.y));
    ctx.closePath();
    ctx.strokeStyle = '#292cc5';
    ctx.fillStyle = '#292cc5';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fill();
  }
  
  if (shapeTwo.length > 0) {
    ctx.beginPath();
    ctx.moveTo(shapeTwo[0].x, shapeTwo[0].y);
    shapeTwo.forEach(pt => ctx.lineTo(pt.x, pt.y));
    ctx.closePath();
    ctx.strokeStyle = '#ea6161';
    ctx.fillStyle = '#ea6161';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fill();
  }

  if (currentAccuracy !== null && redArea !== null && blueArea !== null) {
    ctx.font = "bold 30px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText(`Accuracy: ${currentAccuracy.toFixed(2)}%`, canvas.width / 2, 100);
    ctx.font = "bold 20px sans-serif";
    ctx.fillStyle = "#292cc5";
    ctx.fillText(`Blue Area: ${redArea.toFixed(2)}%`, canvas.width / 2 - 100, 150);
    ctx.fillStyle = "#ea6161";
    ctx.fillText(`Red Area: ${blueArea.toFixed(2)}%`, canvas.width / 2 + 100, 150);
  }
  
  requestAnimationFrame(drawSplit);
}

const handleMouseDown = (event: MouseEvent): void => {
  isDrawing = true;

  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  lineStart = { x: mouseX, y: mouseY };
  lineEnd = { x: mouseX, y: mouseY };
};

canvas.addEventListener('mousedown', handleMouseDown);

const handleMouseMove = (event: MouseEvent): void => {
  if (!isDrawing) {
    return;
  }

  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;
  lineEnd = { x: mouseX, y: mouseY };
}

canvas.addEventListener('mousemove', handleMouseMove);

const handleMouseUp = (event: MouseEvent): void => {
  if (!isDrawing) {
    return;
  }

  isDrawing = false;
  processSlice(lineStart, lineEnd);
}

window.addEventListener('mouseup', handleMouseUp);

let pts: Point[] = [];
let shapeOne: Point[] = [];
let shapeTwo: Point[] = [];

function processSlice(lineStart:Point, lineEnd:Point) {
  pts = [];
  shapeOne = [];
  shapeTwo = [];
  
  for (let i = 0; i < square.length; i++) {
    let currIntersect = intersection(square[i], square[(i + 1) % square.length], lineStart, lineEnd);
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
  for (let i = 0; i < square.length; i++) {
    if (onLeftSide(square[i])) {
      shapeOne.push(square[i]);
    } else {
      shapeTwo.push(square[i]);
    }
  }

  shapeOne = orderQuadrilateralVertices(shapeOne);
  shapeTwo = orderQuadrilateralVertices(shapeTwo);

  const areaA = getArea(shapeOne);
  const areaB = getArea(shapeTwo);
  const totalArea = areaA + areaB;
  const pctA = (areaA / totalArea) * 100;
  const pctB = (areaB / totalArea) * 100;
  let accuracy = 100 - (Math.abs(50 - pctA) * 2);
  redArea = pctA;
  blueArea = pctB;
  
  currentAccuracy = accuracy;
  drawSplit();
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

function orderQuadrilateralVertices(vertices: Point[]): Point[] {
  if (vertices.length < 4) {
    return vertices;
  }

  const centroid = {
    x: (vertices[0].x + vertices[1].x + vertices[2].x + vertices[3].x) / 4,
    y: (vertices[0].y + vertices[1].y + vertices[2].y + vertices[3].y) / 4,
  };

  const sorted = [...vertices].sort((a, b) => {
    const angleA = Math.atan2(a.y - centroid.y, a.x - centroid.x);
    const angleB = Math.atan2(b.y - centroid.y, b.x - centroid.x);
    return angleA - angleB;
  });

  return sorted;
}

function getArea(poly: Point[]): number {
  let area = 0;
  for (let i = 0; i < poly.length; i++) {
    const next = poly[(i + 1) % poly.length];
    area += poly[i].x * next.y - next.x * poly[i].y;
  }
  return Math.abs(area) / 2;
}
