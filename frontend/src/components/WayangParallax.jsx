import React, { useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import { useTexture, ScrollControls, Scroll } from '@react-three/drei';

import { Canvas } from '@react-three/fiber';

// Load textures
import bgImg from '../parallax/layers/bg.png';
import cloudsImg from '../parallax/layers/clouds.png';
import wayangKiriImg from '../parallax/layers/wayang_kiri.png';
import wayangKananImg from '../parallax/layers/wayang_kanan.png';


const ParallaxLayers = () => {

  const { viewport } = useThree();

  const cloudsRef = useRef(null);

  const wayangKiriRef = useRef(null);

  const wayangKananRef = useRef(null);


  // Load textures
  const [bg, clouds, wayangKiri, wayangKanan] = useTexture([
    bgImg,
    cloudsImg,
    wayangKiriImg,
    wayangKananImg
  ]);


  useFrame(({ clock }) => {

    const t = clock.elapsedTime;


    // ============================================
    // CLOUDS
    // ============================================

    if (cloudsRef.current) {

      cloudsRef.current.position.x =
        Math.sin(t * 0.1) * 0.5;

    }


    // ============================================
    // WAYANG KIRI
    // 
    // ============================================

    if (wayangKiriRef.current) {

      wayangKiriRef.current.rotation.z =
        Math.sin(t * 0.8) * 0.02;

    }


    // ============================================
    // WAYANG KANAN
    // ============================================

    if (wayangKananRef.current) {

      wayangKananRef.current.rotation.z =
        Math.cos(t * 0.6) * 0.02;

    }

  });


  return (

    <>

      {/* ==========================================
          1. BG / GUNUNG

        
          ========================================== */}

      <mesh
        position={[0, -0.19, -1]}
        scale={[1.50, 1.15, 1]}
      >

        <planeGeometry
          args={[
            viewport.width,
            viewport.height
          ]}
        />

        <meshBasicMaterial
          map={bg}
          transparent={true}
          depthWrite={false}
        />

      </mesh>


      {/* ==========================================
          2. CLOUDS

          - Dilebarkan ke samping
          - Sedikit diperbesar vertikal
          - Sedikit diturunkan
          ========================================== */}

      <mesh
        ref={cloudsRef}
        position={[0, -0.03, -1]}
        scale={[1.35, 1.10, 1]}
      >

        <planeGeometry
          args={[
            viewport.width,
            viewport.height
          ]}
        />

        <meshBasicMaterial
          map={clouds}
          transparent={true}
          depthWrite={false}
        />

      </mesh>


      {/* ==========================================
          3. WAYANG KIRI

          
          ========================================== */}

      <mesh
        ref={wayangKiriRef}
        position={[0, 0, 0]}
      >

        <planeGeometry
          args={[
            viewport.width,
            viewport.height
          ]}
        />

        <meshBasicMaterial
          map={wayangKiri}
          transparent={true}
          depthWrite={false}
        />

      </mesh>


      {/* ==========================================
          4. WAYANG KANAN

          
          ========================================== */}

      <mesh
        ref={wayangKananRef}
        position={[0, 0, 0.1]}
      >

        <planeGeometry
          args={[
            viewport.width,
            viewport.height
          ]}
        />

        <meshBasicMaterial
          map={wayangKanan}
          transparent={true}
          depthWrite={false}
        />

      </mesh>

    </>

  );

};


const WayangParallax = () => {

  return (

    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1
      }}
    >

      <Canvas
        camera={{
          position: [0, 0, 5],
          fov: 75
        }}
      >

        <ScrollControls
          pages={1.5}
          damping={0.2}
          distance={1}
        >

          <Scroll>

            <ParallaxLayers />

          </Scroll>

        </ScrollControls>

      </Canvas>

    </div>

  );

};


export default WayangParallax;