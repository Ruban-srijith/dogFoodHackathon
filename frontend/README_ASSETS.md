# Asset Customization & Swapping Guide

This document explains where to swap in custom 3D WebGL relief textures, project media assets, fonts, and copywriting strings for the **DOGFOOD Telemetry & Quiet Luxury Relief** frontend.

---

## 1. 🖼️ WebGL Relief Background Textures (`<Relief />`)
The bas-relief normal-mapped background is rendered in [`frontend/src/components/Relief.tsx`](file:///e:/DogFoodHackathon/frontend/src/components/Relief.tsx).

- **Current Implementation**: Generates a 512x512 procedural canvas heightmap with botanical/animal relief contours and normal-mapping shaders.
- **Custom Image Swap**:
  1. Place your custom grayscale heightmap images in `frontend/public/relief/` (e.g. `relief_hero_bird.jpg`, `relief_branch.jpg`, `relief_antlers.jpg`).
  2. In `Relief.tsx`, load the image via Three.js TextureLoader:
     ```ts
     const textureLoader = new THREE.TextureLoader();
     const customReliefTexture = textureLoader.load('/relief/relief_hero_bird.jpg');
     ```

---

## 2. 🎬 Project Showcase Media (`<ProjectCard />`)
Project showcase cards with 16:10 floating media, clip-path inset reveals, and parallax scrub are defined in [`frontend/src/pages/HomePage.tsx`](file:///e:/DogFoodHackathon/frontend/src/pages/HomePage.tsx) and [`frontend/src/components/ProjectCard.tsx`](file:///e:/DogFoodHackathon/frontend/src/components/ProjectCard.tsx).

- **To add/swap projects**: Update the `showcaseProjects` array in `HomePage.tsx`:
  ```ts
  {
    title: 'Your Custom Project Title',
    tagline: 'Short caption text describing the project...',
    category: 'Product Innovation',
    position: 'left', // 'left' | 'center' | 'right'
    imageUrl: '/projects/your_project_cover.webp',
    repoUrl: 'https://github.com/your-repo',
    demoUrl: 'https://your-demo.com',
    techStack: ['React', 'TypeScript', 'Docker'],
  }
  ```
- **Looping Video Support**: In `ProjectCard.tsx`, replace `<img>` with `<video autoPlay loop muted playsInline poster="...">` for video previews.

---

## 3. 🔤 Fonts & Typography Setup
Typography is configured in [`frontend/index.html`](file:///e:/DogFoodHackathon/frontend/index.html) and [`frontend/src/index.css`](file:///e:/DogFoodHackathon/frontend/src/index.css).

- **Current Fonts**:
  - `Outfit` (Headlines & 3D Extruded Master Title)
  - `Inter` / `PP Editorial New` (Serif & Body text)
  - `JetBrains Mono` (Telemetry & UI Microcopy)
- **To swap custom fonts**: Update the font-family CSS variables in `index.css`:
  ```css
  :root {
    --font-heading: 'PP Editorial New', 'Cormorant Garamond', serif;
    --font-sans: 'Inter', sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
  }
  ```

---

## 4. ✍️ Copywriting & Statements
- **Statement Section**: [`frontend/src/components/StatementSection.tsx`](file:///e:/DogFoodHackathon/frontend/src/components/StatementSection.tsx)
- **Approach & Mission Sections**: [`frontend/src/components/ScrubTextSection.tsx`](file:///e:/DogFoodHackathon/frontend/src/components/ScrubTextSection.tsx)
