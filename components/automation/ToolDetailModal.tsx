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

  // Open dialog on mount
  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }

    // Handle escape key and backdrop click
    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    dialog?.addEventListener('cancel', handleCancel);
    return () => {
      dialog?.removeEventListener('cancel', handleCancel);
      if (dialog?.open) {
        dialog.close();
      }
    };
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    // Close only if clicking on the backdrop (dialog itself), not its content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <dialog ref={dialogRef} className={styles.toolDetailModal} onClick={handleBackdropClick}>
      <div className={styles.toolDetailContent}>
        <AutomationToolDetail toolId={toolId} onClose={onClose} />
      </div>
    </dialog>
  );
};

export default ToolDetailModal;
