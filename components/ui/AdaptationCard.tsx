import React from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import styles from './AdaptationCard.module.css';

interface AdaptationCardProps {
  platform: string;
  type?: string;
  title?: string;
  original: string;
  adaptation: string;
  elements: string[];
  image?: string;
  notes?: string[];
}

/**
 * Shared component for displaying a content adaptation example
 */
const AdaptationCard: React.FC<AdaptationCardProps> = ({
  platform,
  type,
  title,
  original,
  adaptation,
  elements,
  image
}) => {
  const displayTitle = title || (type ? `${type} Adaptation` : 'Adaptation');

  return (
    <div className={styles.adaptationCard}>
      <h4>
        <span className={styles.platformBadge}>{platform}</span> {displayTitle}
      </h4>
      <div className={styles.example}>
        {original && (
          <>
            <div className={styles.title}>Original Article Section:</div>
            <p>{original}</p>
          </>
        )}
        
        {adaptation && (
          <>
            <div className={styles.title}>{platform} Adaptation:</div>
            <ReactMarkdown>{adaptation}</ReactMarkdown>
          </>
        )}
      </div>
      {elements.length > 0 && (
        <div className={styles.notes}>
          <p>Key adaptation elements:</p>
          <ul>
            {elements.map((element, index) => (
              <li key={`${element.slice(0, 20)}-${index}`}>{element}</li>
            ))}
          </ul>
        </div>
      )}
      
      {image && (
        <div className={styles.exampleImage}>
          <Image
            src={image}
            alt={`${platform} adaptation example`}
            width={300}
            height={200}
            style={{ objectFit: 'contain' }}
          />
        </div>
      )}
    </div>
  );
};

export default AdaptationCard;
