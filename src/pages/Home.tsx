import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8" style={{ background: '#0a0a0f', color: '#e2e8f0' }}>
      <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: 'system-ui' }}>Pulse Earth Vibes</h1>
      <p className="text-sm max-w-md text-center" style={{ color: '#94a3b8' }}>
        A live world map of what people are listening to. Jump country to country, hear previews, and generate playlists from local trends.
      </p>
      <button
        onClick={() => navigate('/globe')}
        className="rounded-sm px-8 py-4 text-xs transition-transform hover:-translate-y-0.5"
        style={{
          background: 'linear-gradient(90deg, rgba(0,255,245,0.15), rgba(255,0,153,0.15))',
          color: '#e2e8f0',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        Begin
      </button>
    </div>
  );
};

export default Home;
