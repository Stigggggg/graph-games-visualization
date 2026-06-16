# An Application for Visualizing Games on Finite Graphs with a Special Focus on Ehrenfeucht–Fraïssé Games

This is the source code for an engineering thesis project designed to visualize and simulate graph theory games, specifically Pebbles and Ehrenfeucht-Fraïssé (EF).

## Overview

This full-stack application allows users to explore graph theory concepts through interactive gameplay. Users can set up game parameters, generate random graphs based on vertices and edges, or draw custom graphs. The platform supports gameplay against another human player or a basic AI agent.

This project was built focusing on modern software engineering practices, including full containerization (Docker), continuous integration principles, and extensive testing (unit, integration, and E2E browser testing).

## Key Features

- Simulation and visualization of both EF and Pebbles games.
- Possibility to play as both the Spoiler and the Duplicator against Human/AI.
- Generating graphs randomly, from a JSON file, or drawing them manually.
- Interactive UI, real-time graph rendering and editing.

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Cytoscape.js, Vitest (Unit Testing), Playwright (E2E Testing).
- **Backend:** Python Flask, NetworkX (Graph Theory Library), Pytest (Testing).
- **Containerization:** Docker, Docker Compose.

## Prerequisites

To run this application locally, you only need to have **Docker** and **Docker Compose** installed on your machine.

- [Install Docker Engine](https://docs.docker.com/engine/install/)
- [Install Docker Compose](https://docs.docker.com/compose/install/)

## Getting Started

Follow these steps to get the full-stack environment up and running in minutes.

### 1. Clone the repository

```bash
git clone git@github.com:Stigggggg/graph-games-visualization.git
cd graph-games-visualization
```

### 2. Run with Docker Compose

This single command will build all the images, install all dependencies (Python and Node), and start both the Flask backend and the React frontend.

```bash
docker-compose up --build
```

### 3. Access the application

Once the containers are running:
- **Frontend**: Open your browser and navigate to `http://localhost:5173`
- **Backend (API)**: Available at `http://localhost:5000`

## Running tests

A robust testing strategy was implemented. The repo contains unit tests for both frontend and backend, and E2E test checking the communication between the client and the server.

### 1. Backend tests (Pytest)

Run unit and API integration tests inside the running flask container:
```bash
cd flask
docker-compose exec flask pytest
```

### 2. Frontend unit tests (Vitest)
Run unit tests for React components inside the running Vite container:
```bash
cd src
docker-compose exec vite npm run test:unit
```

### 3. End-to-End browser tests (Playwright)
To run system tests in real browser engine (Chromium), you need to have the server running in Docker, but run the tests from your host machine.
```
cd src/tests/e2e
npm run test:browser:ui
```

## Authors:
- Mikołaj Drozd - 339139@uwr.edu.pl

## License
For academic review only. All rights reserved.
