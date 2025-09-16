import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPhysics } from './physics';


describe('Physics', () => {
  let physics: IPhysics;

  beforeEach(() => {
    vi.clearAllMocks();
    physics = createPhysics();
  });

  it('should initialize the physics world with correct parameters', () => {
    expect(physics.world).toBeDefined();
    expect(physics.update).toBeDefined();
    expect(physics.collisions).toBeDefined();

    // Check that the world was created with zero gravity initially
    expect(physics.world.gravity.y).toBe(0);

    // Check that solver iterations were increased
    expect(physics.world.integrationParameters.numSolverIterations).toBe(20);
  });

  it('should update the physics world when update is called', () => {
    physics.update(1/60);

    expect(physics.world.step).toHaveBeenCalled();
  });

  it('should set posable mode when in edit mode', () => {
    // Physics is created in edit mode by default in our test

    // Check that each body had damping set to high values
    physics.world.forEachRigidBody((body: any) => {
      expect(body.setLinearDamping).toHaveBeenCalledWith(10.0);
      expect(body.setAngularDamping).toHaveBeenCalledWith(10.0);
      expect(body.setLinvel).toHaveBeenCalled();
      expect(body.setAngvel).toHaveBeenCalled();
    });
  });

  // it('should enable gravity and disable posable mode in smash mode', () => {
  //   // Change game mode to 'smash'
  //   // Since the test setup mocks this, we can access it directly
  //   const mockStore = vi.hoisted(() => ({
  //     useGameState: vi.fn(() => [{ mode: 'smash' }])
  //   }));

  //   // Mock the module for this test
  //   vi.doMock('~/game/store', () => mockStore);

  //   // Recreate physics to trigger the effect
  //   physics = createPhysics();

  //   // Gravity should be enabled
  //   expect(physics.world.gravity.y).toBe(-9.81);

  //   // Check that each body had damping set to normal values
  //   physics.world.forEachRigidBody((body: any) => {
  //     expect(body.setLinearDamping).toHaveBeenCalledWith(0.2);
  //     expect(body.setAngularDamping).toHaveBeenCalledWith(0.2);
  //   });
  // });

  it('should handle collision events', () => {
    const mockEvent = {
      collider1: vi.fn().mockReturnValue(1),
      collider2: vi.fn().mockReturnValue(2),
      totalForce: vi.fn().mockReturnValue(10)
    };

    // Spy on console.log to check if it's called
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    physics.collisions(mockEvent);

    // Verify that the event handlers were called
    expect(mockEvent.collider1).toHaveBeenCalled();
    expect(mockEvent.collider2).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should increment stepId on each update', () => {
    // Initial stepId should be 0
    expect((physics.world as any).stepId).toBeUndefined();

    physics.update(1/60);
    expect((physics.world as any).stepId).toBe(1);

    physics.update(1/60);
    expect((physics.world as any).stepId).toBe(2);
  });
});