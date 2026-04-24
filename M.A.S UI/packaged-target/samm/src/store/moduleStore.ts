import { useState, useCallback } from 'react';
import type { Module, ModuleId } from '../types';

const defaultModules: Module[] = [
  { id: 'samm', label: 'samm', icon: 'Cpu', enabled: true },
  { id: 'inbox', label: 'Inbox', icon: 'Inbox', enabled: true },
  { id: 'content', label: 'Content', icon: 'FileText', enabled: true },
  { id: 'metrics', label: 'Metrics', icon: 'BarChart2', enabled: true },
  { id: 'calendar', label: 'Calendar', icon: 'Calendar', enabled: true },
  { id: 'operations', label: 'Operations', icon: 'Settings', enabled: true },
  { id: 'crm', label: 'CRM', icon: 'Users', enabled: true, optional: true },
  { id: 'sales', label: 'Sales', icon: 'TrendingUp', enabled: false, optional: true },
  { id: 'ambassadors', label: 'Ambassadors', icon: 'Star', enabled: false, optional: true },
];

export function useModules() {
  const [modules, setModules] = useState<Module[]>(defaultModules);

  const toggleModule = useCallback((id: ModuleId) => {
    setModules(prev =>
      prev.map(m => (m.id === id ? { ...m, enabled: !m.enabled } : m))
    );
  }, []);

  const enabledModules = modules.filter(m => m.enabled);
  const optionalModules = modules.filter(m => m.optional);

  return { modules, enabledModules, optionalModules, toggleModule };
}
