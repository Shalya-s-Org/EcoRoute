import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { getToasts, removeToast, subscribe } from '../services/notifierService';

const icons = {
  success: <CheckCircle size={18} color="var(--accent)" />,
  warning: <AlertTriangle size={18} color="var(--amber-400)" />,
  error: <AlertCircle size={18} color="var(--red-400)" />,
  info: <Info size={18} color="var(--blue-400)" />,
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const update = () => setToasts([...getToasts()]);
    update();
    return subscribe(update);
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className="toast">
          <div className="toast-icon">{icons[t.type] || icons.info}</div>
          <div className="toast-content">
            <div className="toast-title">{t.title}</div>
            <div className="toast-message">{t.message}</div>
          </div>
          <button className="toast-close" onClick={() => removeToast(t.id)}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
