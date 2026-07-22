import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GroupNameState {
  /** Map of convoId → user-defined group name */
  names: Record<string, string>;

  /** Store a group name for a convoId. */
  setName: (convoId: string, name: string) => void;

  /** Get a stored name for a convoId, or undefined. */
  getName: (convoId: string) => string | undefined;

  /** Remove a stored name (e.g. if the user left the group). */
  removeName: (convoId: string) => void;
}

export const useGroupNameStore = create<GroupNameState>()(
  persist(
    (set, get) => ({
      names: {},

      setName: (convoId, name) =>
        set((state) => ({
          names: { ...state.names, [convoId]: name },
        })),

      getName: (convoId) => get().names[convoId],

      removeName: (convoId) =>
        set((state) => {
          const { [convoId]: _, ...rest } = state.names;
          return { names: rest };
        }),
    }),
    {
      name: 'voiceflow-group-names',
    }
  )
);
