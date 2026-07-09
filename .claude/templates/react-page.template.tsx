import { useEffect, useState, useCallback } from 'react';
import { api{{PascalCase}}Client } from '../api/{{kebab-case}}.client';

type {{PascalCase}} = {
  id: string;
  name: string;
  status?: string;
};

type LoadState = 'loading' | 'empty' | 'error' | 'ready';

/**
 * List page for {{PascalCase}}. Covers loading, empty, error and success
 * states, dark-mode friendly (uses theme tokens, not hardcoded colors),
 * and a confirmation dialog before delete.
 */
export default function {{PascalCase}}Page() {
  const [items, setItems] = useState<{{PascalCase}}[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState('loading');
    setError(null);
    try {
      const { items: data } = await api{{PascalCase}}Client.list();
      setItems(data);
      setState(data.length === 0 ? 'empty' : 'ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la información.');
      setState('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const confirmDelete = async (id: string) => {
    await api{{PascalCase}}Client.remove(id);
    setPendingDeleteId(null);
    load();
  };

  if (state === 'loading') {
    return <div className="page page--loading" role="status">Cargando {{PascalCase}}…</div>;
  }

  if (state === 'error') {
    return (
      <div className="page page--error" role="alert">
        <p>{error}</p>
        <button onClick={load}>Reintentar</button>
      </div>
    );
  }

  if (state === 'empty') {
    return <div className="page page--empty">No hay {{PascalCase}} registrados todavía.</div>;
  }

  return (
    <div className="page">
      <ul className="page__list">
        {items.map((item) => (
          <li key={item.id} className="page__item">
            <span>{item.name}</span>
            <button aria-label={`Eliminar ${item.name}`} onClick={() => setPendingDeleteId(item.id)}>
              Eliminar
            </button>
          </li>
        ))}
      </ul>

      {pendingDeleteId && (
        <div className="dialog" role="dialog" aria-modal="true">
          <p>¿Confirmas eliminar este registro?</p>
          <button onClick={() => confirmDelete(pendingDeleteId)}>Confirmar</button>
          <button onClick={() => setPendingDeleteId(null)}>Cancelar</button>
        </div>
      )}
    </div>
  );
}
