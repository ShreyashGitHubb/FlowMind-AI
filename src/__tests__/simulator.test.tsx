import { renderHook, act } from '@testing-library/react';
import { useStadiumSimulation } from '@/lib/simulator'; // Ensure correct path!

// Mock requestAnimationFrame for tests since it's not available in standard jsdom natively sometimes,
// though React testing library usually handles scheduling.
global.requestAnimationFrame = (callback) => setTimeout(callback, 100);
global.cancelAnimationFrame = (id) => clearTimeout(id);

describe('Stadium Simulation Logic', () => {
  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useStadiumSimulation());
    
    expect(result.current.state).toBeDefined();
    expect(result.current.state.agents).toBeInstanceOf(Array);
    expect(result.current.state.phase).toBe('PRE-GAME');
  });

  it('should advance phase to IN-GAME eventually', () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useStadiumSimulation());
    
    // Fast-forward time to simulate the progression of the match phases
    act(() => {
      jest.advanceTimersByTime(20000); 
    });

    expect(result.current.state.phase).not.toBe('PRE-GAME');
    jest.useRealTimers();
  });
});
