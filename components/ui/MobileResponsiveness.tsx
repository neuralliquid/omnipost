import React, { ReactNode } from 'react';

interface MobileResponsivenessProps {
  children: ReactNode;
}

const MobileResponsiveness: React.FC<MobileResponsivenessProps> = ({ children }) => {
  return (
    <div
      className="mobile-responsive"
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '1rem',
      }}
    >
      {children}
    </div>
  );
};

export default MobileResponsiveness;
