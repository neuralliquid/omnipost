/**
 * Onboarding Page
 * 3-step guided onboarding: Connect platforms, create first post, success.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import Header from '@/components/ui/Header';
import styles from '@/styles/Onboarding.module.css';

interface Platform {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
}

const INITIAL_PLATFORMS: Platform[] = [
  { id: 'facebook', name: 'Facebook', icon: 'f', connected: false },
  { id: 'instagram', name: 'Instagram', icon: 'ig', connected: false },
  { id: 'linkedin', name: 'LinkedIn', icon: 'in', connected: false },
  { id: 'twitter', name: 'Twitter', icon: 'X', connected: false },
];

const TOTAL_STEPS = 3;

function StepConnectPlatforms({
  platforms,
  onToggleConnect,
}: {
  readonly platforms: Platform[];
  readonly onToggleConnect: (id: string) => void;
}) {
  return (
    <>
      <h2 className={styles.stepTitle}>Connect Your First Platform</h2>
      <p className={styles.stepDescription}>
        Choose the platforms where you want to publish your content.
      </p>
      <div className={styles.platformGrid}>
        {platforms.map(platform => (
          <button
            key={platform.id}
            type="button"
            className={`${styles.platformCard} ${platform.connected ? styles.platformCardConnected : ''}`}
            onClick={() => onToggleConnect(platform.id)}
            aria-pressed={platform.connected}
          >
            <span className={styles.platformIcon}>{platform.icon}</span>
            <span className={styles.platformName}>{platform.name}</span>
            {platform.connected ? (
              <span className={styles.platformStatus}>Connected</span>
            ) : (
              <span className={styles.connectButton}>Connect</span>
            )}
          </button>
        ))}
      </div>
    </>
  );
}

function StepCreatePost({
  postContent,
  onPostChange,
  selectedPlatforms,
  onTogglePlatform,
  platforms,
}: {
  readonly postContent: string;
  readonly onPostChange: (value: string) => void;
  readonly selectedPlatforms: Set<string>;
  readonly onTogglePlatform: (id: string) => void;
  readonly platforms: Platform[];
}) {
  return (
    <>
      <h2 className={styles.stepTitle}>Create Your First Post</h2>
      <p className={styles.stepDescription}>
        Write something to publish across your connected platforms.
      </p>
      <textarea
        className={styles.postTextarea}
        placeholder="What would you like to share?"
        value={postContent}
        onChange={e => onPostChange(e.target.value)}
        aria-label="Post content"
      />
      <div className={styles.platformCheckboxes}>
        {platforms.map(platform => (
          <label key={platform.id} className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={selectedPlatforms.has(platform.id)}
              onChange={() => onTogglePlatform(platform.id)}
            />
            {platform.name}
          </label>
        ))}
      </div>
    </>
  );
}

function StepSuccess() {
  return (
    <div className={styles.successContainer}>
      <div className={styles.successIcon}>&#10003;</div>
      <h2 className={styles.stepTitle}>You&apos;re All Set!</h2>
      <p className={styles.successMessage}>
        Your account is ready. Head to the dashboard to start managing
        your content and publishing across platforms.
      </p>
    </div>
  );
}

function ProgressIndicator({
  currentStep,
}: {
  readonly currentStep: number;
}) {
  return (
    <div className={styles.progressBar}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => {
        const stepNum = i + 1;
        let stepClass = styles.progressStep;
        if (stepNum === currentStep) {
          stepClass += ` ${styles.progressStepActive}`;
        } else if (stepNum < currentStep) {
          stepClass += ` ${styles.progressStepCompleted}`;
        }

        return (
          <React.Fragment key={stepNum}>
            {i > 0 && (
              <div
                className={`${styles.progressLine} ${stepNum <= currentStep ? styles.progressLineActive : ''}`}
              />
            )}
            <div className={stepClass}>{stepNum}</div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [platforms, setPlatforms] = useState<Platform[]>(INITIAL_PLATFORMS);
  const [postContent, setPostContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set());

  // Redirect unauthenticated users to signup
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      router.push('/signup');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleToggleConnect = (platformId: string) => {
    setPlatforms(prev =>
      prev.map(p =>
        p.id === platformId ? { ...p, connected: !p.connected } : p
      )
    );
  };

  const handleTogglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => {
      const next = new Set(prev);
      if (next.has(platformId)) {
        next.delete(platformId);
      } else {
        next.add(platformId);
      }
      return next;
    });
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      router.push('/dashboard');
    }
  };

  const handleSkip = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      router.push('/dashboard');
    }
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <main className={styles.main}>
          <div className={styles.loadingContainer}>Loading...</div>
        </main>
      </>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.container}>
          <ProgressIndicator currentStep={step} />

          {step === 1 && (
            <StepConnectPlatforms
              platforms={platforms}
              onToggleConnect={handleToggleConnect}
            />
          )}

          {step === 2 && (
            <StepCreatePost
              postContent={postContent}
              onPostChange={setPostContent}
              selectedPlatforms={selectedPlatforms}
              onTogglePlatform={handleTogglePlatform}
              platforms={platforms}
            />
          )}

          {step === 3 && <StepSuccess />}

          <div className={styles.buttonRow}>
            {step < TOTAL_STEPS ? (
              <>
                <button
                  type="button"
                  className={styles.skipButton}
                  onClick={handleSkip}
                >
                  Skip
                </button>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={handleNext}
                >
                  Continue
                </button>
              </>
            ) : (
              <>
                <span />
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={handleNext}
                >
                  Go to Dashboard
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
