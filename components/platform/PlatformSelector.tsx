import React, { useState, useEffect } from 'react';
import { apiClient } from '../../lib/api-client';
import styles from '@/styles/PlatformSelector.module.css';

interface Platform {
  id: number;
  name: string;
  icon: string;
}

interface PlatformSelectorProps {
  onSelect: (platform: Platform) => void;
  selectedPlatformId?: number;
}

const PlatformSelector: React.FC<PlatformSelectorProps> = ({ onSelect, selectedPlatformId }) => {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch platforms using the API client
    const fetchPlatforms = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use the API client instead of direct fetch/axios calls
        const data = await apiClient.getPlatforms();
        setPlatforms(data);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load platforms';
        setError(errorMessage);
        console.error('Error fetching platforms:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlatforms();
  }, []);

  // Handle platform selection
  const handlePlatformSelect = (platform: Platform) => {
    onSelect(platform);
  };

  if (loading) {
    return <div className={styles.loading}>Loading platforms...</div>;
  }

  if (error) {
    return <div className={styles.error}>Error: {error}</div>;
  }

  if (platforms.length === 0) {
    return <div className={styles.empty}>No platforms available.</div>;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Select a Platform</h2>
      <div className={styles.grid}>
        {platforms.map(platform => (
          <button
            key={platform.id}
            type="button"
            className={`${styles.platformButton} ${
              selectedPlatformId === platform.id ? styles.platformButtonSelected : ''
            }`}
            onClick={() => handlePlatformSelect(platform)}
          >
            <div className={styles.platformContent}>
              {platform.icon && (
                <img
                  src={platform.icon}
                  alt={`${platform.name} icon`}
                  className={styles.platformIcon}
                />
              )}
              <span className={styles.platformName}>{platform.name}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PlatformSelector;
