import { useSystemAccess } from '../hooks/useSystemAccess';

export const SystemGate = ({ allowedSystems, children, fallback = null }) => {
  const { hasAnySystem } = useSystemAccess();
  
  const hasAccess = hasAnySystem(allowedSystems);
  
  return hasAccess ? children : fallback;
};

export default SystemGate;
