import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '🏠' },
    { name: 'Persona', path: '/persona', icon: '👤' },
    { name: 'Generate', path: '/generate', icon: '✨' },
    { name: 'History', path: '/history', icon: '📜' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link to="/dashboard" className="text-2xl font-bold text-blue-600">
              Personify
            </Link>

            <div className="flex items-center gap-6">
              <span className="text-gray-700">
                Hi, {user?.name || user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Side Navigation + Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm p-4 sticky top-8">
              <nav className="space-y-2">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 font-semibold'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}