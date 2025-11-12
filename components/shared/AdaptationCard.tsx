import React from 'react';
import Image from 'next/image';
import DOMPurify from 'dompurify';

interface AdaptationCardProps {
  platform: string;
  type?: string;
  title?: string;
  original?: string;
  originalContent?: string;
  adaptation?: string;
  adaptedContent?: string;
  elements?: string[];
  adaptationElements?: string[];
  image?: string;
}

/**
 * Shared component for displaying a content adaptation example
 * Supports multiple prop patterns for backward compatibility
 */
const AdaptationCard: React.FC<AdaptationCardProps> = ({
  platform,
  type,
  title,
  original,
  originalContent,
  adaptation,
  adaptedContent,
  elements,
  adaptationElements,
  image
}) => {
  const displayTitle = title || (type ? `${type} Adaptation` : 'Adaptation');
  const displayOriginal = original ?? originalContent;
  const displayAdaptation = adaptation ?? adaptedContent;
  const displayElements = elements ?? adaptationElements ?? [];

  return (
    <div className="adaptation-card">
      <h4>
        <span className="platform-badge">{platform}</span> {displayTitle}
      </h4>
      <div className="example">
        {displayOriginal && (
          <>
            <div className="title">Original Article Section:</div>
            <p>{displayOriginal}</p>
          </>
        )}
        
        {displayAdaptation && (
          <>
            <div className="title">{platform} Adaptation:</div>
            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(displayAdaptation) }} />
          </>
        )}
      </div>
      {displayElements.length > 0 && (
        <div className="notes">
          <p>Key adaptation elements:</p>
          <ul>
            {displayElements.map((element, index) => (
              <li key={index}>{element}</li>
            ))}
          </ul>
        </div>
      )}
      
      {image && (
        <div className="example-image">
          <Image
            src={image}
            alt={`${platform} adaptation example`}
            width={300}
            height={200}
            objectFit="contain"
          />
        </div>
      )}
    </div>
  );
};

export default AdaptationCard;
