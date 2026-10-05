"use client";

import { useEffect, useRef } from "react";
import type { Group, Material, Mesh } from "three";

/**
 * A 3D footballer (three.js) in the site's black-and-gold kit. Timeline:
 *   0 – 1.35s  runs in from the left, dribbling a ball
 *   1.35 – 2.4s reaches out and pulls (calls `onPull` so the login card slides in)
 *   2.4s →      turns to the visitor, breathes, follows the mouse with his head,
 *               juggles the ball (keepy-uppies) and waves now and then.
 * The character is built from primitives, so there is no model file to download.
 */
export function Footballer3D({ onPull, className = "" }: { onPull: () => void; className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const pulled = useRef(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let raf = 0;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      if (disposed) return;

      const W = el.clientWidth || 320;
      const H = el.clientHeight || 400;

      // ------------------------------------------------------------------ scene
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(W, H);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 50);
      camera.position.set(-0.05, 1.0, 4.4);
      camera.lookAt(-0.05, 0.78, 0);

      scene.add(new THREE.HemisphereLight(0xffffff, 0xd9b26a, 1.25));
      const key = new THREE.DirectionalLight(0xffffff, 2.3);
      key.position.set(2.5, 4.5, 4);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.camera.left = -3;
      key.shadow.camera.right = 3;
      key.shadow.camera.top = 3;
      key.shadow.camera.bottom = -1;
      key.shadow.radius = 4;
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xf7dc8b, 2.2);
      rim.position.set(-3, 2.5, -3);
      scene.add(rim);

      const ground = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.ShadowMaterial({ opacity: 0.18 }));
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);

      // -------------------------------------------------------------- materials
      const mat = {
        jersey: new THREE.MeshStandardMaterial({ color: 0x111216, roughness: 0.55, metalness: 0.1 }),
        shorts: new THREE.MeshStandardMaterial({ color: 0x1c1d22, roughness: 0.6 }),
        gold: new THREE.MeshStandardMaterial({ color: 0xd4a646, roughness: 0.35, metalness: 0.65 }),
        sock: new THREE.MeshStandardMaterial({ color: 0xe0b552, roughness: 0.5, metalness: 0.25 }),
        skin: new THREE.MeshStandardMaterial({ color: 0xb9804c, roughness: 0.72 }),
        hair: new THREE.MeshStandardMaterial({ color: 0x141518, roughness: 0.85 }),
        boot: new THREE.MeshStandardMaterial({ color: 0x0b0c0f, roughness: 0.35, metalness: 0.2 }),
        eye: new THREE.MeshStandardMaterial({ color: 0x0b0c0f, roughness: 0.2 }),
        white: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 }),
        mouth: new THREE.MeshStandardMaterial({ color: 0x5b3418, roughness: 0.6 }),
      };

      const shadowy = (m: Mesh) => {
        m.castShadow = true;
        return m;
      };
      /** Capsule hanging down from its group's origin (so the group is the joint). */
      const limb = (r: number, len: number, material: Material) => {
        const m = shadowy(new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 16), material));
        m.position.y = -(len / 2 + r * 0.6);
        return m;
      };

      // --------------------------------------------------------------- character
      const root = new THREE.Group();
      scene.add(root);
      const hips = new THREE.Group();
      hips.position.y = 0.77;
      root.add(hips);

      // shorts + torso
      const shorts = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.235, 0.24, 24), mat.shorts));
      shorts.position.y = -0.03;
      hips.add(shorts);
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.205, 0.012, 8, 32), mat.gold);
      band.rotation.x = Math.PI / 2;
      band.position.y = 0.085;
      hips.add(band);

      const chest = new THREE.Group();
      chest.position.y = 0.1;
      hips.add(chest);
      const torso = shadowy(new THREE.Mesh(new THREE.CapsuleGeometry(0.205, 0.26, 8, 24), mat.jersey));
      torso.scale.set(1.15, 1, 0.82);
      torso.position.y = 0.2;
      chest.add(torso);
      const collar = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.02, 10, 24), mat.gold);
      collar.rotation.x = Math.PI / 2;
      collar.position.y = 0.45;
      chest.add(collar);
      // side stripes
      for (const s of [-1, 1]) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.36, 0.06), mat.gold);
        stripe.position.set(s * 0.235, 0.2, 0);
        chest.add(stripe);
      }
      // chest badge + number on the back
      const badge = new THREE.Mesh(new THREE.CircleGeometry(0.035, 24), mat.gold);
      badge.position.set(0.09, 0.32, 0.175);
      badge.rotation.y = 0.35;
      chest.add(badge);
      const numCanvas = document.createElement("canvas");
      numCanvas.width = numCanvas.height = 256;
      const nctx = numCanvas.getContext("2d")!;
      const ng = nctx.createLinearGradient(0, 40, 0, 220);
      ng.addColorStop(0, "#FFF3C4");
      ng.addColorStop(1, "#C79A3B");
      nctx.fillStyle = ng;
      nctx.font = "900 170px Arial Black, Arial, sans-serif";
      nctx.textAlign = "center";
      nctx.textBaseline = "middle";
      nctx.fillText("10", 128, 136);
      const numTex = new THREE.CanvasTexture(numCanvas);
      numTex.colorSpace = THREE.SRGBColorSpace;
      const number = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.26), new THREE.MeshStandardMaterial({ map: numTex, transparent: true, roughness: 0.4, metalness: 0.4 }));
      number.position.set(0, 0.22, -0.172);
      number.rotation.y = Math.PI;
      chest.add(number);

      // neck + head
      const neck = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.1, 16), mat.skin));
      neck.position.y = 0.5;
      chest.add(neck);
      const head = new THREE.Group();
      head.position.y = 0.55;
      chest.add(head);
      const skull = shadowy(new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 24), mat.skin));
      skull.position.y = 0.17;
      skull.scale.set(1, 1.05, 0.98);
      head.add(skull);
      const hair = shadowy(new THREE.Mesh(new THREE.SphereGeometry(0.212, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.52), mat.hair));
      hair.position.set(0, 0.18, -0.01);
      hair.rotation.x = -0.28;
      head.add(hair);
      const fringe = shadowy(new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), mat.hair));
      fringe.scale.set(1.6, 0.55, 1);
      fringe.position.set(0.03, 0.33, 0.13);
      head.add(fringe);
      for (const s of [-1, 1]) {
        const ear = shadowy(new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 10), mat.skin));
        ear.position.set(s * 0.198, 0.16, 0);
        ear.scale.set(0.6, 1, 1);
        head.add(ear);
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.026, 16, 12), mat.eye);
        eye.position.set(s * 0.068, 0.185, 0.178);
        head.add(eye);
        const shine = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), mat.white);
        shine.position.set(s * 0.068 + 0.009, 0.195, 0.2);
        head.add(shine);
        const brow = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.011, 0.012), mat.hair);
        brow.position.set(s * 0.07, 0.235, 0.176);
        brow.rotation.z = s * -0.12;
        head.add(brow);
      }
      const smile = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.009, 8, 20, Math.PI), mat.mouth);
      smile.rotation.z = Math.PI;
      smile.position.set(0, 0.11, 0.184);
      head.add(smile);

      // arms: shoulder → elbow → hand
      const arms: { shoulder: Group; elbow: Group }[] = [];
      for (const s of [-1, 1]) {
        const shoulder = new THREE.Group();
        shoulder.position.set(s * 0.265, 0.39, 0);
        shoulder.rotation.z = s * 0.12;
        chest.add(shoulder);
        shoulder.add(limb(0.07, 0.13, mat.jersey));
        const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.066, 0.014, 8, 20), mat.gold);
        cuff.rotation.x = Math.PI / 2;
        cuff.position.y = -0.2;
        shoulder.add(cuff);
        const elbow = new THREE.Group();
        elbow.position.y = -0.22;
        shoulder.add(elbow);
        elbow.add(limb(0.055, 0.15, mat.skin));
        const hand = shadowy(new THREE.Mesh(new THREE.SphereGeometry(0.065, 16, 12), mat.skin));
        hand.position.y = -0.27;
        elbow.add(hand);
        arms.push({ shoulder, elbow });
      }

      // legs: hip → knee → boot
      const legs: { hip: Group; knee: Group; boot: Mesh }[] = [];
      for (const s of [-1, 1]) {
        const hip = new THREE.Group();
        hip.position.set(s * 0.11, -0.06, 0);
        hips.add(hip);
        hip.add(limb(0.082, 0.16, mat.skin));
        const knee = new THREE.Group();
        knee.position.y = -0.3;
        hip.add(knee);
        knee.add(limb(0.074, 0.2, mat.sock));
        const sockBand = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.012, 8, 20), mat.jersey);
        sockBand.rotation.x = Math.PI / 2;
        sockBand.position.y = -0.06;
        knee.add(sockBand);
        const boot = shadowy(new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.14, 6, 16), mat.boot));
        boot.rotation.x = Math.PI / 2;
        boot.scale.set(1, 1, 0.75);
        boot.position.set(0, -0.335, 0.06);
        knee.add(boot);
        legs.push({ hip, knee, boot });
      }

      // ball with a classic pattern
      const ballCanvas = document.createElement("canvas");
      ballCanvas.width = 512;
      ballCanvas.height = 256;
      const bctx = ballCanvas.getContext("2d")!;
      bctx.fillStyle = "#ffffff";
      bctx.fillRect(0, 0, 512, 256);
      bctx.fillStyle = "#111216";
      const pent = (cx: number, cy: number, r: number) => {
        bctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
          bctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        }
        bctx.closePath();
        bctx.fill();
      };
      for (let i = 0; i < 5; i++) {
        pent(51 + i * 102, 70, 26);
        pent(102 + i * 102, 186, 26);
      }
      pent(256, 8, 40);
      pent(256, 250, 40);
      const ballTex = new THREE.CanvasTexture(ballCanvas);
      ballTex.colorSpace = THREE.SRGBColorSpace;
      const BALL_R = 0.11;
      const ball = shadowy(new THREE.Mesh(new THREE.SphereGeometry(BALL_R, 32, 24), new THREE.MeshStandardMaterial({ map: ballTex, roughness: 0.45 })));
      scene.add(ball);

      // ----------------------------------------------------------------- motion
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const pointer = { x: 0, y: 0 };
      const onMove = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        pointer.x = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2)));
        pointer.y = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height * 0.3)) / (window.innerHeight / 2)));
      };
      window.addEventListener("pointermove", onMove);

      const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
      const ease = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x));
      const RUN_END = 1.35;
      const PULL_END = 2.4;
      const START_X = -2.6;
      const footPos = new THREE.Vector3();
      let last = performance.now();
      const t0 = last;
      let ballSpin = 0;

      const frame = (now: number) => {
        const t = reduce ? 99 : (now - t0) / 1000;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;

        // reset pose each frame
        for (const a of arms) {
          a.shoulder.rotation.x = 0;
          a.elbow.rotation.x = 0;
          a.elbow.rotation.z = 0;
        }
        arms[0].shoulder.rotation.z = -0.12;
        arms[1].shoulder.rotation.z = 0.12;
        for (const l of legs) {
          l.hip.rotation.x = 0;
          l.knee.rotation.x = 0;
        }
        hips.rotation.set(0, 0, 0);
        chest.rotation.set(0, 0, 0);
        head.rotation.set(0, 0, 0);
        hips.position.y = 0.77;

        if (t < RUN_END) {
          // ---- run in
          const p = t / RUN_END;
          const x = lerp(START_X, 0, 1 - Math.pow(1 - p, 2.2));
          root.position.x = x;
          root.rotation.y = Math.PI / 2;
          const speed = 1 - p * 0.6;
          const c = t * 13;
          for (let i = 0; i < 2; i++) {
            const s = i === 0 ? 1 : -1;
            legs[i].hip.rotation.x = Math.sin(c) * 0.85 * s * speed;
            legs[i].knee.rotation.x = Math.max(0, Math.sin(c + (s > 0 ? -1.4 : 1.7))) * 1.2 * speed;
            arms[i].shoulder.rotation.x = -Math.sin(c) * 0.75 * s * speed;
            arms[i].elbow.rotation.x = -0.9 * speed;
          }
          hips.position.y = 0.77 + Math.abs(Math.sin(c)) * 0.04 * speed;
          chest.rotation.x = 0.22 * speed;
          // ball rolls just ahead of his feet
          const bx = x + 0.38;
          ballSpin -= ((bx - ball.position.x) / BALL_R) || 0;
          ball.position.set(bx, BALL_R, 0.05);
          ball.rotation.z = ballSpin;
        } else if (t < PULL_END) {
          // ---- reach out and pull the card in
          const p = (t - RUN_END) / (PULL_END - RUN_END);
          if (!pulled.current && p > 0.12) {
            pulled.current = true;
            onPull();
          }
          root.position.x = 0;
          root.rotation.y = Math.PI / 2;
          const reach = ease(p / 0.3) * (1 - ease((p - 0.75) / 0.25));
          const pull = ease((p - 0.3) / 0.35) * (1 - ease((p - 0.75) / 0.25));
          for (const a of arms) {
            a.shoulder.rotation.x = -1.45 * reach + 0.35 * pull;
            a.elbow.rotation.x = -0.15 * reach - 0.9 * pull;
          }
          chest.rotation.x = 0.28 * reach - 0.32 * pull;
          legs[0].hip.rotation.x = -0.35 * reach;
          legs[1].hip.rotation.x = 0.3 * reach;
          legs[0].knee.rotation.x = 0.25 * reach;
          ball.position.set(0.38, BALL_R, 0.05);
        } else {
          // ---- idle: face the visitor, juggle, wave, look at the mouse
          const it = t - PULL_END;
          root.position.x = 0;
          root.rotation.y = lerp(Math.PI / 2, 0.42, ease(it / 0.6));
          hips.position.y = 0.77 + Math.sin(it * 2.2) * 0.006;
          chest.rotation.x = Math.sin(it * 2.2) * 0.015;
          head.rotation.y = lerp(head.rotation.y, pointer.x * 0.7 - (root.rotation.y - 0.42) * 0.5, 1);
          head.rotation.x = pointer.y * 0.25;

          const cycle = (it - 0.8) % 9; // juggle 0–3.2s, wave 4.6–6.4s
          const kickLeg = legs[1];
          if (it > 0.8 && cycle < 3.2) {
            const b = cycle / 0.8;
            const bp = b % 1;
            const contact = 1 - Math.min(bp, 1 - bp) * 5;
            kickLeg.hip.rotation.x = -0.75 * Math.max(0, contact);
            kickLeg.knee.rotation.x = 0.45 * Math.max(0, contact);
            arms[0].shoulder.rotation.z = -0.45;
            arms[1].shoulder.rotation.z = 0.45;
            kickLeg.boot.getWorldPosition(footPos);
            const lift = Math.floor(b) === 3 ? 0 : 1; // last touch lets it drop to the ground
            const top = 0.95;
            const base = 0.26;
            ball.position.x = lerp(ball.position.x, footPos.x + 0.06, 0.35);
            ball.position.z = lerp(ball.position.z, footPos.z + 0.1, 0.35);
            ball.position.y = lift ? base + (top - base) * 4 * bp * (1 - bp) : lerp(ball.position.y, BALL_R, 0.2);
            ball.rotation.x += dt * 9;
          } else {
            // ball rests by his front foot
            ball.position.x = lerp(ball.position.x, 0.36, 0.08);
            ball.position.z = lerp(ball.position.z, 0.22, 0.08);
            ball.position.y = Math.max(BALL_R, lerp(ball.position.y, BALL_R, 0.25));
            if (cycle > 4.6 && cycle < 6.4) {
              const w = (cycle - 4.6) / 1.8;
              const up = ease(w / 0.2) * (1 - ease((w - 0.8) / 0.2));
              arms[1].shoulder.rotation.z = 0.12 + 2.5 * up;
              arms[1].elbow.rotation.z = Math.sin(w * Math.PI * 6) * 0.35 * up;
            }
          }
        }

        renderer.render(scene, camera);
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("pointermove", onMove);
        scene.traverse((o: any) => {
          o.geometry?.dispose?.();
          const m = o.material;
          if (Array.isArray(m)) m.forEach((x) => x.dispose());
          else m?.dispose?.();
        });
        numTex.dispose();
        ballTex.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
      if (disposed) cleanup();
    })().catch(() => onPull());

    return () => {
      disposed = true;
      cleanup();
    };
  }, [onPull]);

  return <div ref={host} aria-hidden className={className} />;
}
