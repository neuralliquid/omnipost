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
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const onCloseRef = React.useRef(onClose);

  // Keep ref updated with latest onClose
  React.useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Open dialog on mount and register cancel listener once
  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }

    // Handle escape key - use ref to get latest onClose
    const handleCancel = (e: Event) => {
      e.preventDefault();
      onCloseRef.current();
    };

    dialog?.addEventListener('cancel', handleCancel);
    return () => {
      dialog?.removeEventListener('cancel', handleCancel);
      if (dialog?.open) {
        dialog.close();
      }
    };
  }, []); // Empty deps - listener registered only once

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    // Close only if clicking on the backdrop (dialog itself), not its content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleBackdropKeyDown = (e: React.KeyboardEvent<HTMLDialogElement>) => {
    // Close if pressing Enter or Space on the backdrop
    if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.toolDetailModal}
      onClick={handleBackdropClick}
      onKeyDown={handleBackdropKeyDown}
      aria-label="Tool details"
    >
      <div className={styles.toolDetailContent}>
        <AutomationToolDetail toolId={toolId} onClose={onClose} />
      </div>
    </dialog>
  );
};

export default ToolDetailModal;
