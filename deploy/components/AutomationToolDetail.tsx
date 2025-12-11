import React from 'react';
import styles from '../styles/Automation.module.css';

interface AutomationToolDetailProps {
  toolId: string;
  onClose: () => void;
}

/**
 * Component that displays detailed information about an automation tool
 */
const AutomationToolDetail: React.FC<AutomationToolDetailProps> = ({ toolId, onClose }) => {
  // Mock tool data - in a real app, this would come from an API or props
  const toolData = {
    id: toolId,
    name: 'Automation Tool',
    description: 'This is a detailed description of the automation tool.',
    features: ['Feature 1', 'Feature 2', 'Feature 3'],
    category: 'Automation',
    rating: 4.5,
  };

  return (
    <div className={styles.toolDetail}>
      <div className={styles.toolDetailHeader}>
        <h2 className={styles.toolDetailTitle}>{toolData.name}</h2>
        <button onClick={onClose} className={styles.toolDetailClose} aria-label="Close">
          ×
        </button>
      </div>
      <div className={styles.toolDetailBody}>
        <p className={styles.toolDetailDescription}>{toolData.description}</p>
        <div className={styles.toolDetailFeatures}>
          <h3>Features:</h3>
          <ul>
            {toolData.features.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
        </div>
        <div className={styles.toolDetailMeta}>
          <span className={styles.toolDetailCategory}>{toolData.category}</span>
          <span className={styles.toolDetailRating}>Rating: {toolData.rating}</span>
        </div>
      </div>
    </div>
  );
};

export default AutomationToolDetail;
