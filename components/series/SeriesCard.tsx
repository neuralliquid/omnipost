import React, { useState } from 'react';
import Link from 'next/link';
import styles from '../../styles/Series.module.css';
import { Series } from '../../types/series';

interface SeriesCardProps {
  series: Series;
  index: number;
  onEdit: (index: number, updatedSeries: Series) => void;
  onDelete: (index: number) => void;
}

const SeriesCard: React.FC<SeriesCardProps> = ({ series, index, onEdit, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSeries, setEditedSeries] = useState<Series>(series);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedSeries({ ...editedSeries, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onEdit(index, editedSeries);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedSeries(series);
    setIsEditing(false);
  };

  const getStatusClass = (status?: string) => {
    switch (status) {
      case 'planning':
        return styles.statusPlanning;
      case 'in-progress':
        return styles.statusInProgress;
      case 'completed':
        return styles.statusCompleted;
      case 'paused':
        return styles.statusPaused;
      default:
        return styles.statusPlanning;
    }
  };

  return (
    <article className={styles.seriesCard}>
      {isEditing ? (
        <form onSubmit={handleSubmit} className={styles.editForm}>
          <div className={styles.formGroup}>
            <label htmlFor={`title-${index}`}>Title</label>
            <input
              id={`title-${index}`}
              name="title"
              type="text"
              value={editedSeries.title}
              onChange={handleInputChange}
              required
              className={styles.formInput}
              placeholder="Enter series title"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor={`description-${index}`}>Description</label>
            <textarea
              id={`description-${index}`}
              name="description"
              value={editedSeries.description}
              onChange={handleInputChange}
              required
              className={styles.formTextarea}
              placeholder="Describe your series"
              rows={4}
            />
          </div>

          <div className={styles.seriesActions}>
            <button type="button" onClick={handleCancelEdit} className={styles.secondaryButton}>
              Cancel
            </button>
            <button type="submit" className={styles.primaryButton}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Save Changes
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className={styles.seriesContent}>
            {/* Status Badge */}
            {series.status && (
              <span className={`${styles.statusBadge} ${getStatusClass(series.status)}`}>
                {series.status.replace('-', ' ')}
              </span>
            )}

            <h2 className={styles.seriesTitle}>{series.title}</h2>
            <p className={styles.seriesDescription}>{series.description}</p>

            {/* Series Metadata */}
            {(series.estimatedArticles || series.publishFrequency) && (
              <div className={styles.seriesMeta}>
                {series.estimatedArticles && (
                  <span className={styles.metaItem}>
                    <svg
                      className={styles.metaIcon}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path d="M14 2v6h6" />
                    </svg>
                    {series.estimatedArticles} articles
                  </span>
                )}
                {series.publishFrequency && (
                  <span className={styles.metaItem}>
                    <svg
                      className={styles.metaIcon}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    {series.publishFrequency}
                  </span>
                )}
              </div>
            )}

            {/* Topics */}
            {series.topics && series.topics.length > 0 && (
              <div className={styles.seriesTopics}>
                <h3>Topics</h3>
                <ul>
                  {series.topics.map((topic: string, i: number) => (
                    <li key={`${series.id}-topic-${i}`}>{topic}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className={styles.seriesActions}>
            <Link
              href={`/campaigns?seriesId=${series.id}`}
              className={styles.campaignButton}
              title="Create a campaign using this series"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
              Campaign
            </Link>
            <button
              onClick={() => setIsEditing(true)}
              className={styles.editButton}
              aria-label="Edit series"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit
            </button>
            <button
              onClick={() => onDelete(index)}
              className={styles.deleteButton}
              aria-label="Delete series"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Delete
            </button>
          </div>
        </>
      )}
    </article>
  );
};

export default SeriesCard;
