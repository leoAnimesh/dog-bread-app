import { fireEvent, screen } from '@testing-library/react-native';
import React from 'react';

import { BreedRow, PartialFailureCard, SyncStatusStrip, TraitsTab } from '@/components';
import { describeFailedPages } from '@/components/molecules/PartialFailureCard';
import { exerciseToScore, traitValueLabel } from '@/components/organisms/TraitsTab';
import type { SyncStatusView } from '@/hooks/useSyncStatus';

import { breedNamed, renderWithProviders } from './testUtils';

const baseStatus: SyncStatusView = {
  state: 'fresh',
  isOnline: true,
  isSyncing: false,
  label: 'Synced 12 min ago',
  detail: '',
  progressRatio: null,
  lastSyncedAt: 1,
  failedPages: [],
  totalPages: 6,
  queuedSync: false,
  lastError: null,
};

describe('BreedRow', () => {
  it('renders name, other names and derived meta, and reports taps', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<BreedRow breed={breedNamed('Affenpinscher')} onPress={onPress} />);
    expect(screen.getByText('Affenpinscher')).toBeOnTheScreen();
    expect(screen.getByText('MONKEY TERRIER · AFFEN')).toBeOnTheScreen();
    expect(screen.getByText('Small · Wire coat · 14–16 yrs')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('breed-row-036feed0-da8a-42c9-ab9a-57449b530b13'));
    expect(onPress).toHaveBeenCalledWith('036feed0-da8a-42c9-ab9a-57449b530b13');
  });

  it('renders in dark mode without crashing', async () => {
    await renderWithProviders(<BreedRow breed={breedNamed('Akita')} onPress={jest.fn()} />, { scheme: 'dark' });
    expect(screen.getByText('Akita')).toBeOnTheScreen();
  });
});

describe('SyncStatusStrip', () => {
  it('shows the fresh state quietly', async () => {
    await renderWithProviders(<SyncStatusStrip status={baseStatus} onRefresh={jest.fn()} />);
    expect(screen.getByText('Synced 12 min ago')).toBeOnTheScreen();
    expect(screen.queryByText(/pages merged/)).toBeNull();
    expect(screen.queryByText('Refresh')).toBeNull();
  });
  it('offers Refresh when stale and online', async () => {
    const onRefresh = jest.fn();
    await renderWithProviders(
      <SyncStatusStrip status={{ ...baseStatus, state: 'stale', label: 'Synced 2 hours ago' }} onRefresh={onRefresh} />,
    );
    await fireEvent.press(screen.getByText('Refresh'));
    expect(onRefresh).toHaveBeenCalled();
  });
  it('tells the user a sync is queued while offline', async () => {
    await renderWithProviders(
      <SyncStatusStrip status={{ ...baseStatus, state: 'offline', isOnline: false, queuedSync: true }} />,
    );
    expect(screen.getByText('Sync queued for reconnect')).toBeOnTheScreen();
  });
  it('shows page progress while syncing', async () => {
    await renderWithProviders(
      <SyncStatusStrip
        status={{ ...baseStatus, state: 'syncing', isSyncing: true, label: 'Syncing page 3 of 6', detail: '50%', progressRatio: 0.5 }}
      />,
    );
    expect(screen.getByText('Syncing page 3 of 6')).toBeOnTheScreen();
    expect(screen.getByText('50%')).toBeOnTheScreen();
  });
});

describe('PartialFailureCard', () => {
  it('describes failed pages and disables retry offline', async () => {
    expect(describeFailedPages([5], 6)).toBe('Page 5 of 6 failed to sync');
    expect(describeFailedPages([2, 5], 6)).toBe('2 of 6 pages failed to sync');
    const onRetry = jest.fn();
    await renderWithProviders(
      <PartialFailureCard failedPages={[5]} totalPages={6} pageSize={48} isOnline={false} onRetry={onRetry} />,
    );
    expect(screen.getByText('Page 5 of 6 failed to sync')).toBeOnTheScreen();
    expect(screen.getByText(/Up to 48 breeds/)).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Retry when online'));
    expect(onRetry).not.toHaveBeenCalled();
  });
});

describe('TraitsTab', () => {
  it('renders all 11 trait scales and temperament tags', async () => {
    await renderWithProviders(<TraitsTab breed={breedNamed('Affenpinscher')} />);
    expect(screen.getAllByRole('progressbar')).toHaveLength(11);
    expect(screen.getByText('30 min/day')).toBeOnTheScreen();
    expect(screen.getByText('Playful')).toBeOnTheScreen();
  });
  it('buckets exercise minutes onto the 5 point scale', () => {
    expect(exerciseToScore(null)).toBeNull();
    expect(exerciseToScore(30)).toBe(1);
    expect(exerciseToScore(61)).toBe(3);
    expect(exerciseToScore(180)).toBe(5);
    expect(traitValueLabel('energy', null)).toBe('n/a');
    expect(traitValueLabel('energy', 4)).toBe('4 / 5');
  });
});
