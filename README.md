# Splittr Prototype

A web-based polygon splitting game where you aim for perfect 50/50 splits.

## Overview

Splittr challenges you to draw lines across random polygons, attempting to divide each shape into two equal areas. Your accuracy is scored based on how close you get to a perfect 50/50 split. Complete 5 rounds and see your final score.

## How to Play

1. **Draw a Line**: Click and drag on the canvas to draw a line across the polygon
2. **Aim for 50/50**: Try to split the shape into two parts with equal area
3. **See Your Score**: After each split, watch the two pieces slide apart and see your accuracy percentage
4. **Complete 5 Rounds**: Play through all 5 rounds with progressively larger polygons (4-8 sides)
5. **Get Your Final Score**: Your total accuracy score is calculated across all 5 rounds

### Scoring

- **100% accuracy** = perfect 50/50 split
- **Lower accuracy** = greater deviation from 50/50
- Your final score is the average across all 5 rounds

## Setup & Run

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

```bash
cd splittr
npm install
```

### Development Server

```bash
npm run dev
```

Open your browser and navigate to the local development URL (typically `http://localhost:5173`)

### Build for Production

```bash
npm run build
```

## Project Structure

```
splittr/
├── src/
│   ├── main.ts           # Game logic and canvas rendering
│   ├── counter.ts        # Counter component
│   ├── style.css         # Styling
│   └── assets/           # Images and SVGs
├── index.html            # HTML entry point
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md
```

## Technologies

- **Vite** - Fast build tool
- **TypeScript** - Type-safe JavaScript
- **Canvas API** - 2D rendering

## Game Features

- Random convex polygon generation
- Line-polygon intersection detection
- Area calculation using the Shoelace formula
- Smooth piece separation animation
- Progressive difficulty (polygons increase in complexity)
