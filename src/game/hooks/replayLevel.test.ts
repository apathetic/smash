import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { replayLevel } from './replayLevel';
import { settleMeshes } from '~/game/hooks/settleMeshes';
import { REPLAY_PAUSE_MS } from '~/system/constants';

// Mock dependencies
const { mockState, mockSetGameState, mockPhysics } = vi.hoisted(() => {
  const mockState = { mode: 'smashed' };
  const mockSetGameState = vi.fn((key: string, value: unknown) => {
    (mockState as Record<string, unknown>)[key] = value;
  });
  const mockPhysics = {
    restore: vi.fn(),
    setPaused: vi.fn(),
    setBodiesKinematic: vi.fn(),
    setGravity: vi.fn()
  };
  return { mockState, mockSetGameState, mockPhysics };
});

vi.mock('~/game/store', () => ({
  useGameState: vi.fn(() => [mockState, mockSetGameState])
}));

vi.mock('~/system/physics', () => ({
  usePhysics: vi.fn(() => mockPhysics)
}));

vi.mock('~/game/hooks/settleMeshes', () => ({
  settleMeshes: vi.fn(() => Promise.resolve())
}));

describe('replayLevel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockState.mode = 'smashed';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('enters replay mode and snaps bodies back via the physics snapshot', async () => {
    await replayLevel();

    expect(mockSetGameState).toHaveBeenCalledWith('mode', 'replay');
    expect(mockPhysics.restore).toHaveBeenCalledOnce();

    // Bodies stay frozen until the pause elapses
    expect(mockPhysics.setPaused).toHaveBeenCalledWith(true);
    expect(mockPhysics.setBodiesKinematic).not.toHaveBeenCalled();
    expect(mockPhysics.setGravity).not.toHaveBeenCalled();
  });

  it('holds the world frozen from the moment of the snap-back', async () => {
    await replayLevel();

    // The world must not be stepped between the restore and the resume,
    // or the resumed run would start from a warmed-up solver state
    const pausedAt = mockPhysics.setPaused.mock.invocationCallOrder[0];
    const restoredAt = mockPhysics.restore.mock.invocationCallOrder[0];
    expect(pausedAt).toBeLessThan(restoredAt);
  });

  it('settles the meshes back to the restored bodies, as the reset does', async () => {
    await replayLevel();

    expect(settleMeshes).toHaveBeenCalledOnce();

    // The bodies must already be back before the meshes animate to them
    const restoredAt = mockPhysics.restore.mock.invocationCallOrder[0];
    const settledAt = (settleMeshes as any).mock.invocationCallOrder[0];
    expect(restoredAt).toBeLessThan(settledAt);
  });

  it('resumes smashing after the pause', async () => {
    await replayLevel();
    vi.advanceTimersByTime(REPLAY_PAUSE_MS);

    expect(mockPhysics.setBodiesKinematic).toHaveBeenCalledWith(false);
    expect(mockPhysics.setGravity).toHaveBeenCalledWith(true);
    expect(mockPhysics.setPaused).toHaveBeenLastCalledWith(false);
  });

  it('does not resume if the mode changed during the pause', async () => {
    await replayLevel();
    mockState.mode = 'display'; // e.g. the user navigated to the store
    vi.advanceTimersByTime(REPLAY_PAUSE_MS);

    expect(mockPhysics.setBodiesKinematic).not.toHaveBeenCalled();
    expect(mockPhysics.setGravity).not.toHaveBeenCalled();

    // ...but the world is never left stranded in a paused state
    expect(mockPhysics.setPaused).toHaveBeenLastCalledWith(false);
  });

  it('re-arms the pause when replay is hit again mid-pause', async () => {
    await replayLevel();
    vi.advanceTimersByTime(REPLAY_PAUSE_MS / 2);
    await replayLevel();
    vi.advanceTimersByTime(REPLAY_PAUSE_MS / 2);

    // Snapped back twice, but the first resume timer was cancelled
    expect(mockPhysics.restore).toHaveBeenCalledTimes(2);
    expect(mockPhysics.setGravity).not.toHaveBeenCalled();

    vi.advanceTimersByTime(REPLAY_PAUSE_MS / 2);
    expect(mockPhysics.setGravity).toHaveBeenCalledWith(true);
  });

  it('lets the newest replay win when one is hit mid-snap-back', async () => {
    let releaseFirst: () => void;
    (settleMeshes as any).mockImplementationOnce(
      () => new Promise<void>((res) => { releaseFirst = res; })
    );

    const first = replayLevel();
    const second = replayLevel();
    releaseFirst!(); // the superseded settle finishes late
    await Promise.all([first, second]);

    // Only the newest replay may arm a resume
    vi.advanceTimersByTime(REPLAY_PAUSE_MS);
    expect(mockPhysics.setGravity).toHaveBeenCalledOnce();
  });
});
