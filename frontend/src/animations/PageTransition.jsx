import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

const overlayStyles = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: '#313927', // Hijau solid sesuai request
  zIndex: 99999, // Sangat tinggi
  pointerEvents: 'none',
};

const slideInVariants = {
  initial: { y: '-100%' },
  animate: { y: '-100%' },
  exit: {
    y: '0%',
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
  },
};

const slideOutVariants = {
  initial: { y: '0%' },
  animate: {
    y: '100%',
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
  },
  exit: { y: '100%' },
};

const PageTransition = forwardRef(({ children, className, style }, ref) => {
  return (
    <>
      <motion.div
        className={className}
        style={style}
        ref={ref}
      >
        {children}
      </motion.div>

      {/* Fase Keluar (Exit) - Meluncur naik menutupi layar dari bawah ke atas */}
      <motion.div
        style={overlayStyles}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={slideInVariants}
      />

      {/* Fase Masuk (Enter) - Meluncur naik membuka layar */}
      <motion.div
        style={overlayStyles}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={slideOutVariants}
      />
    </>
  );
});

PageTransition.displayName = 'PageTransition';

export default PageTransition;
