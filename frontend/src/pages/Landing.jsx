import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700">
      <nav className="p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Personify</h1>
          <div className="space-x-4">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-6 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-6 py-2 text-white hover:text-gray-200 transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h2 className="text-6xl font-bold text-white mb-6">
          AI Content Generation,
          <br />
          Personalized to You
        </h2>
        <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
          Create stunning AI-generated images and text that match your unique brand identity.
          Build your digital persona and let AI do the rest.
        </p>
        
        <div className="flex gap-4 justify-center">
          <Link
            to="/register"
            className="px-8 py-4 bg-white text-blue-600 rounded-lg text-lg font-semibold hover:bg-gray-100 transition shadow-xl"
          >
            Start Creating Free
          </Link>
          <Link
            to="/login"
            className="px-8 py-4 bg-blue-500 text-white rounded-lg text-lg font-semibold hover:bg-blue-400 transition"
          >
            Sign In
          </Link>
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-8 text-white">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold mb-2">AI Image Generation</h3>
            <p className="text-white/80">
              Create stunning visuals with DALL-E, customized to your brand
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8">
            <div className="text-4xl mb-4">✍️</div>
            <h3 className="text-xl font-semibold mb-2">Smart Text Creation</h3>
            <p className="text-white/80">
              Generate content that matches your voice and audience
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold mb-2">Your Digital Persona</h3>
            <p className="text-white/80">
              One profile, infinite personalized creations
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}