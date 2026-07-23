/**
 * Platform Connections Settings Page
 *
 * Allows users to connect and disconnect social media platforms.
 * Currently uses an in-memory mock store; will be replaced with OAuth flows.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { platforms, platformConfigurations } from '@/lib/config/platforms';
import { useAnalytics } from '@/hooks/useAnalytics';
import styles from '@/styles/PlatformSettings.module.css';

/** Shape of a stored platform connection (in-memory mock) */
interface PlatformConnection {
  apiKey: string;
  handle: string;
  connectedAt: string;
}

/** Map of platform slug to connection data */
type ConnectionStore = Record<string, PlatformConnection>;

/** Which modal is open */
type ModalState =
  | { type: 'connect'; platformSlug: string }
  | { type: 'disconnect'; platformSlug: string }
  | null;

/** Platform icon letter based on slug */
function getPlatformIconLetter(slug: string): string {
  const map: Record<string, string> = {
    facebook: 'f',
    instagram: 'Ig',
    linkedin: 'in',
    twitter: 'X',
  };
  return map[slug] ?? slug.charAt(0).toUpperCase();
}

/** CSS class for platform icon color */
function getIconColorClass(slug: string): string {
  const map: Record<string, string> = {
    facebook: styles.iconFacebook,
    instagram: styles.iconInstagram,
    linkedin: styles.iconLinkedin,
    twitter: styles.iconTwitter,
  };
  return map[slug] ?? '';
}

/** The four main platforms (excluding custom channel for this settings page) */
const settingsPlatforms = platforms.filter(p => p.slug !== 'custom-channel');

export function PlatformSettingsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [connections, setConnections] = useState<ConnectionStore>({});
  const [modal, setModal] = useState<ModalState>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [handleInput, setHandleInput] = useState('');
  const { trackPlatformConnected, track } = useAnalytics();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const connectedCount = Object.keys(connections).length;

  const handleConnect = useCallback(
    (platformSlug: string) => {
      if (!apiKeyInput.trim()) return;

      const handle = handleInput.trim() || `@${platformSlug}_user`;
      setConnections(prev => ({
        ...prev,
        [platformSlug]: {
          apiKey: apiKeyInput.trim(),
          handle,
          connectedAt: new Date().toISOString(),
        },
      }));

      const platform = settingsPlatforms.find(p => p.slug === platformSlug);
      trackPlatformConnected(platform?.name ?? platformSlug, connectedCount + 1);

      setModal(null);
      setApiKeyInput('');
      setHandleInput('');
    },
    [apiKeyInput, handleInput, connectedCount, trackPlatformConnected]
  );

  const handleDisconnect = useCallback(
    (platformSlug: string) => {
      setConnections(prev => {
        const next = { ...prev };
        delete next[platformSlug];
        return next;
      });

      const platform = settingsPlatforms.find(p => p.slug === platformSlug);
      track('platform_disconnected', {
        platformName: platform?.name ?? platformSlug,
        totalPlatforms: connectedCount - 1,
      });

      setModal(null);
    },
    [connectedCount, track]
  );

  const openConnectModal = (slug: string) => {
    setApiKeyInput('');
    setHandleInput('');
    setModal({ type: 'connect', platformSlug: slug });
  };

  const openDisconnectModal = (slug: string) => {
    setModal({ type: 'disconnect', platformSlug: slug });
  };

  const closeModal = () => {
    setModal(null);
    setApiKeyInput('');
    setHandleInput('');
  };

  if (isLoading) return <LoadingSpinner size="lg" label="Loading..." />;
  if (!isAuthenticated) return null;

  return (
    <>
      <div className={styles.pageHeader}>
        <h1>Platform Connections</h1>
        <p>Connect your social media accounts to publish content across platforms.</p>
      </div>

      <div className={styles.platformGrid}>
        {settingsPlatforms.map(platform => {
          const connection = connections[platform.slug];
          const isConnected = Boolean(connection);
          const config = platformConfigurations[platform.slug];
          const isComingSoon = platform.comingSoon;

          return (
            <div
              key={platform.slug}
              className={`${styles.platformCard} ${isConnected ? styles.platformCardConnected : ''} ${
                isComingSoon ? styles.platformCardComingSoon : ''
              }`}
            >
              <div className={styles.cardTop}>
                <div className={`${styles.platformIcon} ${getIconColorClass(platform.slug)}`}>
                  {getPlatformIconLetter(platform.slug)}
                </div>
                <div className={styles.platformInfo}>
                  <h3>{platform.name}</h3>
                  {platform.description && (
                    <p className={styles.platformDescription}>{platform.description}</p>
                  )}
                </div>
              </div>

              <div>
                <span
                  className={`${styles.statusBadge} ${
                    isComingSoon
                      ? styles.statusComingSoon
                      : isConnected
                        ? styles.statusConnected
                        : styles.statusDisconnected
                  }`}
                >
                  <span
                    className={`${styles.statusDot} ${
                      isComingSoon
                        ? styles.statusDotComingSoon
                        : isConnected
                          ? styles.statusDotConnected
                          : styles.statusDotDisconnected
                    }`}
                  />
                  {isComingSoon ? 'Coming Soon' : isConnected ? 'Connected' : 'Not Connected'}
                </span>
              </div>

              {isConnected && connection && (
                <div className={styles.connectedInfo}>
                  <strong>Handle:</strong> {connection.handle}
                </div>
              )}

              {config?.capabilities && (
                <div className={styles.capabilities}>
                  {config.capabilities.map(cap => (
                    <span key={cap} className={styles.capabilityTag}>
                      {cap}
                    </span>
                  ))}
                </div>
              )}

              <div className={styles.cardActions}>
                {isConnected ? (
                  <button
                    className={`${styles.connectButton} ${styles.connectButtonDanger}`}
                    onClick={() => openDisconnectModal(platform.slug)}
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    className={`${styles.connectButton} ${styles.connectButtonPrimary}`}
                    onClick={() => openConnectModal(platform.slug)}
                    disabled={isComingSoon}
                  >
                    {isComingSoon ? 'Coming Soon' : 'Connect'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Connect Modal */}
      {modal?.type === 'connect' && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2>
              Connect{' '}
              {settingsPlatforms.find(p => p.slug === modal.platformSlug)?.name ??
                modal.platformSlug}
            </h2>
            <p>Enter your API credentials to connect this platform.</p>

            <div className={styles.mockNotice}>
              This is a simplified mock connection. OAuth integration will replace this in a future
              release.
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="api-key-input">
                {settingsPlatforms.find(p => p.slug === modal.platformSlug)?.name ?? 'Platform'} API
                Key
              </label>
              <input
                id="api-key-input"
                type="text"
                value={apiKeyInput}
                onChange={e => setApiKeyInput(e.target.value)}
                placeholder="Enter your API key"
                autoFocus
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="handle-input">Username / Handle (optional)</label>
              <input
                id="handle-input"
                type="text"
                value={handleInput}
                onChange={e => setHandleInput(e.target.value)}
                placeholder="@yourhandle"
              />
            </div>

            <div className={styles.modalActions}>
              <button className={styles.modalButtonCancel} onClick={closeModal}>
                Cancel
              </button>
              <button
                className={styles.modalButtonSubmit}
                onClick={() => handleConnect(modal.platformSlug)}
                disabled={!apiKeyInput.trim()}
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disconnect Confirmation Modal */}
      {modal?.type === 'disconnect' && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2>
              Disconnect{' '}
              {settingsPlatforms.find(p => p.slug === modal.platformSlug)?.name ??
                modal.platformSlug}
              ?
            </h2>
            <p className={styles.confirmText}>
              This will remove your connection. You can reconnect at any time.
            </p>

            <div className={styles.modalActions}>
              <button className={styles.modalButtonCancel} onClick={closeModal}>
                Cancel
              </button>
              <button
                className={styles.modalButtonDanger}
                onClick={() => handleDisconnect(modal.platformSlug)}
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default PlatformSettingsPage;
