import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture, ScrollControls, Scroll } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';

// Load textures based on the paths requested
import bgImg from '../parallax/layers/bg.png';
import cloudsImg from '../parallax/layers/clouds.png';
import wayangKiriImg from '../parallax/layers/wayang_kiri.png';
import wayangKananImg from '../parallax/layers/wayang_kanan.png';

const ParallaxLayers = () => {
  const { viewport } = useThree();
  const cloudsRef = useRef(null);
  const wayangKiriRef = useRef(null);
  const wayangKananRef = useRef(null);

  // Load all 4 textures using TextureLoader via useTexture
  const [bg, clouds, wayangKiri, wayangKanan] = useTexture([
    bgImg,
    cloudsImg,
    wayangKiriImg,
    wayangKananImg
  ]);


  useFrame(({ clock }) => {
    const t = clock.elapsedTime;

    // ============================================
    // TWEAK ANIMATION SPEED & AMPLITUDE HERE:
    // ============================================

    // clouds animation (position.x)
    // t * 0.1 (speed), * 0.5 (amplitude/distance)
    if (cloudsRef.current) {
      cloudsRef.current.position.x = Math.sin(t * 0.1) * 0.5;
    }

    // wayang_kiri rotation (rotation.z)
    // t * 0.8 (speed), * 0.02 (angle)
    if (wayangKiriRef.current) {
      wayangKiriRef.current.rotation.z = Math.sin(t * 0.8) * 0.02;
    }

    // wayang_kanan rotation (rotation.z)
    // t * 0.6 (speed), * 0.02 (angle)
    if (wayangKananRef.current) {
      wayangKananRef.current.rotation.z = Math.cos(t * 0.6) * 0.02;
    }
  });

  return (
    <>
      {/* 1. bg.png - plane paling belakang z = -2, statis */}
      <mesh position={[0, 0, -2]}>
        <planeGeometry args={[viewport.width, viewport.height]} />
        <meshBasicMaterial map={bg} transparent={true} depthWrite={false} />
      </mesh>

      {/* 2. clouds.png - plane z = -1, animasi position.x */}
      <mesh ref={cloudsRef} position={[0, 0, -1]}>
        <planeGeometry args={[viewport.width, viewport.height]} />
        <meshBasicMaterial map={clouds} transparent={true} depthWrite={false} />
      </mesh>

      {/* 3. wayang_kiri.png - plane z = 0, animasi rotation.z */}
      <mesh ref={wayangKiriRef} position={[0, 0, 0]}>
        <planeGeometry args={[viewport.width, viewport.height]} />
        <meshBasicMaterial map={wayangKiri} transparent={true} depthWrite={false} />
      </mesh>

      {/* 4. wayang_kanan.png - plane z = 0.1, animasi rotation.z */}
      <mesh ref={wayangKananRef} position={[0, 0, 0.1]}>
        <planeGeometry args={[viewport.width, viewport.height]} />
        <meshBasicMaterial map={wayangKanan} transparent={true} depthWrite={false} />
      </mesh>
    </>
  );
};

const WayangParallax = () => {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        {/* ScrollControls memberikan efek parallax jika layer dipisah di Scroll */}
        <ScrollControls pages={1.5} damping={0.2} distance={1}>
          <Scroll>
            <ParallaxLayers />
          </Scroll>
        </ScrollControls>
      </Canvas>
    </div>
  );
};

export default WayangParallax;
