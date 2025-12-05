import React from 'react';
import dynamic from 'next/dynamic';
import styles from '../../styles/Automation.module.css';

// Dynamic import for the AutomationToolDetail component
const AutomationToolDetail = dynamic(() => import('../AutomationToolDetail'), {
  loading: () => <p className={styles.loadingComponent}>Loading tool details...</p>,
  ssr: true,
});

interface ToolDetailModalProps {
  toolId: string;
  onClose: () => void;
}

/**
 * Component for displaying a modal with detailed information about a tool
 */
const ToolDetailModal: React.FC<ToolDetailModalProps> = ({ toolId, onClose }) => {
  // Handle escape key to close modal
  React.useEffect(() => {
    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      className={styles.toolDetailModal}
      onClick={onClose}
      onKeyDown={e => {
        if (e.key === 'Escape') {
          onClose();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Close modal"
    >
      <div className={styles.toolDetailContent} onClick={e => e.stopPropagation()}>
        <AutomationToolDetail toolId={toolId} onClose={onClose} />
      </div>
    </div>
  );
};

export default ToolDetailModal;
