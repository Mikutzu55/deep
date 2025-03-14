import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader'; // Correct import path

const CarModel = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75, // Field of view
      window.innerWidth / window.innerHeight, // Aspect ratio
      0.1, // Near clipping plane
      1000 // Far clipping plane
    );
    const renderer = new THREE.WebGLRenderer({ alpha: true }); // Alpha for transparency
    renderer.setSize(300, 200); // Set renderer size

    // Attach to the DOM only if mountRef.current exists
    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
    }

    // Load 3D Model
    const loader = new GLTFLoader();
    loader.load(
      '/car.glb', // Replace with your 3D model path
      (gltf) => {
        scene.add(gltf.scene); // Add the loaded model to the scene
      },
      undefined, // Progress callback (optional)
      (error) => {
        console.error('Error loading 3D model:', error);
      }
    );

    // Camera Position
    camera.position.z = 5; // Adjust as needed

    // Animation Loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      if (mountRef.current) {
        // Check if the DOM element still exists
        if (mountRef.current.contains(renderer.domElement)) {
          mountRef.current.removeChild(renderer.domElement);
        }
      }
      renderer.dispose(); // Clean up the renderer
    };
  }, []);

  return <div ref={mountRef}></div>;
};

export default CarModel;
