import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useTheme, ThemeMode } from '../contexts/ThemeContext';

const THEME_PALETTES: Record<ThemeMode, { base: [number, number, number]; glow: [number, number, number]; highlight: [number, number, number]; alpha: number }> = {
  telemetry: {
    base: [0.024, 0.035, 0.067], // #060911
    glow: [0.0, 0.94, 1.0],      // Cyan #00f0ff
    highlight: [1.0, 0.16, 0.37], // Hot Pink #ff2a5f
    alpha: 0.65,
  },
  royal: {
    base: [0.027, 0.043, 0.086], // Regal Navy #070b16
    glow: [1.0, 0.843, 0.0],      // Imperial Gold #ffd700
    highlight: [0.88, 0.11, 0.28], // Ruby #e11d48
    alpha: 0.65,
  },
  swiss: {
    base: [0.957, 0.957, 0.941], // Crisp Swiss Paper #f4f4f0
    glow: [0.12, 0.12, 0.12],     // Print Ink #111111
    highlight: [0.90, 0.10, 0.10], // Swiss Red #e61919
    alpha: 0.20,                  // Transparent watermark emboss
  },
  matrix: {
    base: [0.015, 0.04, 0.015],  // Phosphor Black #040a04
    glow: [0.29, 0.96, 0.15],     // Terminal Green #4af626
    highlight: [0.0, 1.0, 0.3],   // Emerald
    alpha: 0.70,
  },
  obsidian: {
    base: [0.031, 0.047, 0.078], // Slate Void #080c14
    glow: [0.22, 0.74, 0.97],     // Sky #38bdf8
    highlight: [0.96, 0.25, 0.37], // Rose #f43f5e
    alpha: 0.65,
  },
  monochrome: {
    base: [0.0, 0.0, 0.0],        // Deep Black #000000
    glow: [0.85, 0.85, 0.85],     // High Contrast White
    highlight: [1.0, 1.0, 1.0],   // Crisp White
    alpha: 0.55,
  },
};

export const Relief: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const { theme } = useTheme();

  // Dynamically update WebGL Shader Uniforms when theme changes
  useEffect(() => {
    if (!materialRef.current) return;
    const palette = THEME_PALETTES[theme] || THEME_PALETTES.telemetry;
    materialRef.current.uniforms.uBaseColor.value.set(...palette.base);
    materialRef.current.uniforms.uGlowColor.value.set(...palette.glow);
    materialRef.current.uniforms.uHighlightColor.value.set(...palette.highlight);
    materialRef.current.uniforms.uAlpha.value = palette.alpha;
  }, [theme]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Three.js Scene Setup
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // 2. Procedural Heightmap & Normalmap Texture Generator
    const createProceduralTextures = () => {
      const size = 512;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      // Background height map
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, size, size);

      // Draw Embossed Botanical & Animal Sculpted Relief Shapes
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 30;

      // Central Embossed Motif: Bird & Flower Leaves
      ctx.beginPath();
      ctx.arc(256, 256, 120, 0, Math.PI * 2);
      ctx.fill();

      // Branch & Antler contours
      ctx.lineWidth = 16;
      ctx.strokeStyle = '#e0e0e0';
      ctx.beginPath();
      ctx.moveTo(100, 400);
      ctx.bezierCurveTo(180, 300, 320, 200, 420, 100);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(160, 160, 45, 0, Math.PI * 2);
      ctx.arc(360, 340, 55, 0, Math.PI * 2);
      ctx.fill();

      const heightTexture = new THREE.CanvasTexture(canvas);
      heightTexture.wrapS = THREE.RepeatWrapping;
      heightTexture.wrapT = THREE.RepeatWrapping;
      return heightTexture;
    };

    const reliefTexture = createProceduralTextures();

    // 3. Custom Fragment Shader: Point Light Normal Map Relighting + Noise Grain
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform sampler2D uMap;
      uniform vec2 uResolution;
      uniform vec2 uMouse;
      uniform float uScroll;
      uniform float uTime;
      uniform vec3 uBaseColor;
      uniform vec3 uGlowColor;
      uniform vec3 uHighlightColor;
      uniform float uAlpha;
      varying vec2 vUv;

      // Pseudo-random noise
      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }

      void main() {
        vec2 uv = vUv;
        uv.y += uScroll * 0.15; // Parallax drift

        // Sample height map & compute surface normals dynamically
        float texel = 1.0 / 512.0;
        float hC = texture2D(uMap, uv).r;
        float hR = texture2D(uMap, uv + vec2(texel, 0.0)).r;
        float hU = texture2D(uMap, uv + vec2(0.0, texel)).r;

        vec3 normal = normalize(vec3((hC - hR) * 6.0, (hC - hU) * 6.0, 1.0));

        // Soft Point Light following lerped mouse position
        vec3 lightPos = vec3(uMouse.x, 1.0 - uMouse.y, 0.4);
        vec3 surfacePos = vec3(uv, 0.0);
        vec3 lightDir = normalize(lightPos - surfacePos);

        // Diffuse & Specular Lighting
        float diff = max(dot(normal, lightDir), 0.0);
        float spec = pow(max(dot(normal, lightDir), 0.0), 16.0);

        // Dynamically themed lighting
        vec3 dynamicGlow = uGlowColor * (diff * 0.35 + spec * 0.4);
        vec3 dynamicHighlight = uHighlightColor * (spec * 0.5);

        vec3 finalColor = uBaseColor + dynamicGlow + dynamicHighlight;

        // Subtle analog noise grain
        float noise = (random(uv * uTime) - 0.5) * 0.025;
        finalColor += vec3(noise);

        gl_FragColor = vec4(finalColor, uAlpha);
      }
    `;

    const initialPalette = THEME_PALETTES[theme] || THEME_PALETTES.telemetry;

    const uniforms = {
      uMap: { value: reliefTexture },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uScroll: { value: 0 },
      uTime: { value: 0 },
      uBaseColor: { value: new THREE.Vector3(...initialPalette.base) },
      uGlowColor: { value: new THREE.Vector3(...initialPalette.glow) },
      uHighlightColor: { value: new THREE.Vector3(...initialPalette.highlight) },
      uAlpha: { value: initialPalette.alpha },
    };

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
    });
    materialRef.current = material;

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // 4. Mouse Tracking & Scroll Smooth Interpolation
    const mouseTarget = { x: 0.5, y: 0.5 };
    const mouseLerped = { x: 0.5, y: 0.5 };
    let scrollTarget = 0;
    let scrollCurrent = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseTarget.x = e.clientX / window.innerWidth;
      mouseTarget.y = e.clientY / window.innerHeight;
    };

    const onScroll = () => {
      scrollTarget = window.scrollY / (document.body.scrollHeight || 1);
    };

    const onResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('scroll', onScroll);
    window.addEventListener('resize', onResize);

    // 5. Render Loop with Visibility Optimization
    let isVisible = true;
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    let animationFrameId: number;
    let startTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!isVisible) return;

      // Mouse lerping (factor ~0.08)
      mouseLerped.x += (mouseTarget.x - mouseLerped.x) * 0.08;
      mouseLerped.y += (mouseTarget.y - mouseLerped.y) * 0.08;
      uniforms.uMouse.value.set(mouseLerped.x, mouseLerped.y);

      // Scroll lerping
      scrollCurrent += (scrollTarget - scrollCurrent) * 0.05;
      uniforms.uScroll.value = scrollCurrent;

      uniforms.uTime.value = (performance.now() - startTime) * 0.001;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);

      geometry.dispose();
      material.dispose();
      reliefTexture.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{ opacity: 0.85 }}
    />
  );
};
