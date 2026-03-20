import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Play, Pause, Loader2, Music } from 'lucide-react';
import { COUNTRY_NAME_TO_CODE, COUNTRY_META, resolveCountryCode } from '@/data/countryData';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface ApiTrack {
  id: string;
  name: string;
  artist: string;
  preview_url: string | null;
  spotify_url: string;
}

interface ApiCountryData {
  country: string;
  code: string;
  tracks: ApiTrack[];
  energy: number;
  danceability: number;
  valence: number;
  updatedAt: string;
}

interface CountryPanelProps {
  countryName: string;
  onClose: () => void;
  isClosing: boolean;
}

function withAlpha(color: string, alpha: number): string {
  return color.replace('hsl(', 'hsla(').replace(')', `, ${alpha})`);
}

const CountryPanel = ({ countryName, onClose, isClosing }: CountryPanelProps) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ApiCountryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);
  const [playlistResult, setPlaylistResult] = useState<{
    url: string;
    name: string;
    tracks: string[];
    error?: string;
  } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [resolvedCode, setResolvedCode] = useState<string | null>(COUNTRY_NAME_TO_CODE[countryName] || null);
  const code = resolvedCode;
  const meta = code ? COUNTRY_META[code] : undefined;
  const displayName = meta?.displayName || countryName;
  const flag = meta?.flag || '🌍';
  const vibe = meta?.vibe || 'Eclectic';
  const vibeColor = meta?.vibeColor || 'hsl(240, 10%, 50%)';

  useEffect(() => {
    let cancelled = false;
    const initialCode = COUNTRY_NAME_TO_CODE[countryName];
    if (initialCode) {
      setResolvedCode(initialCode);
      return;
    }

    setResolvedCode(null);
    setLoading(true);
    setError(null);

    resolveCountryCode(countryName).then(codeFromApi => {
      if (!cancelled) setResolvedCode(codeFromApi);
    });

    return () => {
      cancelled = true;
    };
  }, [countryName]);

  useEffect(() => {
    if (!code) {
      setLoading(false);
      setError('No music data available for this country yet.');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);
    setPlayingId(null);
    setPlaylistResult(null);

    fetch(`${API_BASE}/api/country/${code}`)
      .then(res => {
        if (!res.ok) throw new Error('not found');
        return res.json();
      })
      .then(d => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setError('No music data available for this country yet.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [code]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handlePlay = useCallback(
    (track: ApiTrack) => {
      if (!track.preview_url) return;

      if (playingId === track.id) {
        audioRef.current?.pause();
        setPlayingId(null);
        return;
      }

      if (audioRef.current) audioRef.current.pause();

      const audio = new Audio(track.preview_url);
      audio.play();
      audio.onended = () => setPlayingId(null);
      audioRef.current = audio;
      setPlayingId(track.id);
    },
    [playingId],
  );

  const handleCreatePlaylist = async () => {
    if (!code) return;
    setCreatingPlaylist(true);
    setPlaylistResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/create-playlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countryCode: code }),
      });
      const json = await res.json();
      if (json.url) {
        setPlaylistResult({ url: json.url, name: json.name, tracks: json.tracks || [] });
      } else {
        setPlaylistResult({ url: '', name: '', tracks: [], error: json.error || 'Failed to create playlist' });
      }
    } catch (_e) {
      setPlaylistResult({ url: '', name: '', tracks: [], error: 'Network error — is the server running?' });
    } finally {
      setCreatingPlaylist(false);
    }
  };

  return (
    <div
      className={`absolute right-0 top-0 h-full flex transition-transform duration-300 ${isClosing ? 'translate-x-full' : 'translate-x-0'}`}
      style={{ zIndex: 50 }}
    >
      {/* Close bar */}
      <button
        onClick={onClose}
        className="flex items-center justify-center w-8 h-full transition-colors"
        style={{ background: 'rgba(10,10,15,0.6)' }}
      >
        <X size={14} style={{ color: '#94a3b8' }} />
      </button>

      {/* Panel */}
      <div
        className="w-80 h-full overflow-y-auto flex flex-col"
        style={{ background: 'rgba(10,10,15,0.92)', borderLeft: '1px solid rgba(68,136,204,0.2)' }}
      >
        {/* Energy bar at top */}
        {data && (
          <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${vibeColor}, transparent)` }} />
        )}

        <div className="p-5 flex flex-col gap-5 flex-1">
          {/* Header */}
          <div className="flex items-center gap-3">
            <span className="text-3xl">{flag}</span>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: '#e2e8f0' }}>{displayName}</h2>
              <span className="text-xs" style={{ color: vibeColor }}>{vibe}</span>
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin" size={20} style={{ color: '#64748b' }} />
            </div>
          )}

          {/* Error / no data */}
          {error && !loading && (
            <div className="text-center py-8">
              <p className="text-xs" style={{ color: '#64748b' }}>{error}</p>
            </div>
          )}

          {/* Data content */}
          {data && !loading && (
            <>
              {/* Track list */}
              <div className="flex flex-col gap-1">
                <h3 className="text-xs font-medium mb-2" style={{ color: '#94a3b8' }}>Top Tracks</h3>
                {data.tracks.slice(0, 5).map((track, i) => {
                  const isPlaying = playingId === track.id;
                  return (
                    <div
                      key={track.id}
                      className="flex items-center gap-2 py-1.5 px-2 rounded-sm transition-colors"
                      style={{ background: isPlaying ? 'rgba(68,136,204,0.1)' : 'transparent' }}
                    >
                      <span className="text-[10px] w-4 text-right" style={{ color: '#475569' }}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs truncate" style={{ color: '#e2e8f0' }}>{track.name}</div>
                        <div className="text-[10px] truncate" style={{ color: '#64748b' }}>{track.artist}</div>
                      </div>
                      {isPlaying && <SoundWave color={vibeColor} />}
                      {track.preview_url ? (
                        <button
                          onClick={() => handlePlay(track)}
                          className="w-7 h-7 flex items-center justify-center rounded-sm transition-colors shrink-0 cursor-pointer"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)' }}
                        >
                          {isPlaying ? (
                            <Pause size={12} style={{ color: '#e2e8f0' }} />
                          ) : (
                            <Play size={12} style={{ color: '#e2e8f0' }} />
                          )}
                        </button>
                      ) : (
                        <Music size={12} style={{ color: '#334155' }} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Mood */}
              <div className="flex flex-col gap-2">
                <h3 className="text-xs font-medium" style={{ color: '#94a3b8' }}>Mood</h3>
                <MoodBar label="Energy" value={data.energy} color={vibeColor} />
                <MoodBar label="Dance" value={data.danceability} color={vibeColor} />
                <MoodBar label="Valence" value={data.valence} color={vibeColor} />
              </div>
            </>
          )}

          {/* Action buttons */}
          {data && !loading && (
            <div className="flex flex-col gap-2 mt-auto pb-4">
              <button
                onClick={handleCreatePlaylist}
                disabled={creatingPlaylist}
                className="flex items-center justify-center gap-2 py-2.5 rounded-sm text-xs transition-colors"
                style={{
                  background: withAlpha(vibeColor, 0.15),
                  color: '#e2e8f0',
                  border: `1px solid ${withAlpha(vibeColor, 0.3)}`,
                }}
              >
                {creatingPlaylist ? <Loader2 size={14} className="animate-spin" /> : '🎵'}
                {creatingPlaylist ? 'Creating…' : 'Create Playlist'}
              </button>

              {playlistResult && (
                <div
                  className="rounded-sm p-3 text-xs"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  {playlistResult.error ? (
                    <p style={{ color: '#f87171' }}>{playlistResult.error}</p>
                  ) : (
                    <>
                      <p className="font-medium mb-1" style={{ color: '#e2e8f0' }}>
                        🎵 {playlistResult.name}
                      </p>
                      {playlistResult.tracks.length > 0 && (
                        <div className="flex flex-col gap-0.5 mb-2">
                          {playlistResult.tracks.map((t, i) => (
                            <span key={i} style={{ color: '#94a3b8' }}>{t}</span>
                          ))}
                        </div>
                      )}
                      <a
                        href={playlistResult.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-1"
                        style={{ color: '#4ade80' }}
                      >
                        🎧 Open in Spotify
                      </a>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function SoundWave({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-[2px] h-3">
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className="w-[2px] rounded-full animate-pulse"
          style={{
            background: color,
            height: `${4 + Math.random() * 8}px`,
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}

function MoodBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-[10px]">
        <span style={{ color: '#94a3b8' }}>{label}</span>
        <span style={{ color: '#64748b' }}>{value}%</span>
      </div>
      <div className="h-1 rounded-full w-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
    </div>
  );
}

export default CountryPanel;
