import { useState, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './components/auth/AuthPage';
import { BoardWorkspace } from './components/bureau/BoardWorkspace';
import { MemberWorkspace } from './components/members/MemberWorkspace';
import { Toast } from './components/common/Toast';

import { ForceChangePinModal } from './components/auth/ForceChangePinModal';
import { PWAInstallPrompt } from './components/common/PWAInstallPrompt';

function MainApp() {
  const { currentUser, login, logout } = useAuth();
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = 'info') => setToast({ msg, type }), []);

  if (!currentUser) {
    return <AuthPage onLogin={login} />;
  }

  return (
    <>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <ForceChangePinModal showToast={showToast} />
      {currentUser.is_bureau
        ? <BoardWorkspace member={currentUser} onLogout={logout} showToast={showToast} />
        : <MemberWorkspace member={currentUser} onLogout={logout} showToast={showToast} />
      }
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
      <PWAInstallPrompt />
    </AuthProvider>
  );
}
