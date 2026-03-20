import { useState, useRef, useCallback } from 'react';
import GlobeScene, { GlobeHandle } from '@/components/GlobeScene';
import CountryPanel from '@/components/CountryPanel';

const Index = () => {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const globeRef = useRef<GlobeHandle>(null);

  const handleCountryClick = useCallback((name: string) => {
    setSelectedCountry(name);
    setIsClosing(false);
    globeRef.current?.flyTo(name);
  }, []);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setSelectedCountry(null);
      setIsClosing(false);
    }, 300);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ background: '#0a0a0f' }}>
      <GlobeScene
        ref={globeRef}
        onCountryClick={handleCountryClick}
        isPanelOpen={!!selectedCountry}
      />
      {selectedCountry && (
        <CountryPanel
          countryName={selectedCountry}
          onClose={handleClose}
          isClosing={isClosing}
        />
      )}
    </div>
  );
};

export default Index;
