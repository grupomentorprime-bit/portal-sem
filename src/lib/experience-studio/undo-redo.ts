import type { CmsPage } from "@/types/page";

export interface UndoRedoState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function createUndoRedo<T>(initial: T): UndoRedoState<T> {
  return { past: [], present: initial, future: [] };
}

export function pushState<T>(state: UndoRedoState<T>, next: T): UndoRedoState<T> {
  if (JSON.stringify(state.present) === JSON.stringify(next)) return state;
  return {
    past: [...state.past, state.present].slice(-50),
    present: next,
    future: [],
  };
}

export function undoState<T>(state: UndoRedoState<T>): UndoRedoState<T> {
  if (state.past.length === 0) return state;
  const previous = state.past[state.past.length - 1];
  return {
    past: state.past.slice(0, -1),
    present: previous,
    future: [state.present, ...state.future],
  };
}

export function redoState<T>(state: UndoRedoState<T>): UndoRedoState<T> {
  if (state.future.length === 0) return state;
  const [next, ...rest] = state.future;
  return {
    past: [...state.past, state.present],
    present: next,
    future: rest,
  };
}

export type StudioPageState = UndoRedoState<CmsPage>;
