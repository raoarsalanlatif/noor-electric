import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { get } from '../../lib/api';

export const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

/** Load an API resource; returns { data, error, loading, reload, setData }. */
export function useLoad(path) {
  const [state, setState] = useState({ data: null, error: '', loading: true });
  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true }));
    return get(path)
      .then((data) => setState({ data, error: '', loading: false }))
      .catch((e) => setState((s) => ({ ...s, error: e.message, loading: false })));
  }, [path]);
  useEffect(() => { reload(); }, [reload]);
  const setData = (fn) => setState((s) => ({ ...s, data: typeof fn === 'function' ? fn(s.data) : fn }));
  return { ...state, reload, setData };
}

/** Active team members for assignee pickers. */
export function useTeam() {
  const { data } = useLoad('team');
  return data?.items || [];
}
