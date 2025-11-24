import React, { useState, useEffect, useRef } from 'react';
import { MarketData, AISignal, AppConfig } from './types';
import { DEFAULT_CONFIG, INITIAL_PRICE } from './constants';
import { simulateMarketStep, fetchRealMarketData } from './services/marketService';
import { getAiSignal } from './services/geminiService';

import { PriceTicker } from './components/PriceTicker';
import { ChartComponent } from './components/ChartComponent';
import { SignalPanel } from './components/SignalPanel';
import { TradeHistory } from './components/TradeHistory';
import { SettingsModal } from './components/SettingsModal';

const App: React.FC = () => {
  // State
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [marketData, setMarketData] = useState<MarketData>({
    timestamp: Date.now(),
    price: INITIAL_PRICE,
    change: 0,
    changePercent: 0,
    high: INITIAL_PRICE,
    low: INITIAL_PRICE,
    volatility: 0
  });
  
  const [history, setHistory] = useState<MarketData[]>([]);
  const [currentSignal, setCurrentSignal] = useState<AISignal | null>(null);
  const [signalHistory, setSignalHistory] = useState<AISignal[]>([]);
  const [loadingSignal, setLoadingSignal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Refs for loop management
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const aiCooldownRef = useRef(false);

  // Initialize
  useEffect(() => {
    // Fill initial mock history for chart
    const initialHist: MarketData[] = [];
    let price = INITIAL_PRICE;
    for(let i=0; i<30; i++) {
        price += (Math.random() - 0.5) * 10000;
        initialHist.push({
            timestamp: Date.now() - (30 - i) * 3000,
            price: price,
            change: 0,
            changePercent: 0,
            high: price,
            low: price,
            volatility: 10
        });
    }
    setHistory(initialHist);
  }, []);

  // Main Market Loop
  useEffect(() => {
    const tick = async () => {
      let newData: MarketData | null = null;

      if (config.apiUrl && !config.isSimulation) {
        // Try Fetch Real API
        newData = await fetchRealMarketData(config.apiUrl);
        if (!newData) {
           // Fallback to simulation if API fails temporarily
           newData = simulateMarketStep();
        }
      } else {
        // Simulation
        newData = simulateMarketStep();
      }

      if (newData) {
        setMarketData(newData);
        setHistory(prev => {
          const newHist = [...prev, newData!];
          if (newHist.length > 50) newHist.shift(); // Keep last 50 points
          return newHist;
        });
      }
    };

    intervalRef.current = setInterval(tick, config.refreshRate);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [config]);

  // AI Trigger Logic
  useEffect(() => {
    if (history.length < 10 || aiCooldownRef.current) return;

    // Trigger AI every 5 market updates or if high volatility
    const triggerAI = async () => {
      setLoadingSignal(true);
      aiCooldownRef.current = true;
      
      const signal = await getAiSignal(history);
      
      if (signal) {
        setCurrentSignal(signal);
        setSignalHistory(prev => [signal, ...prev]);
      }
      
      setLoadingSignal(false);
      
      // Cooldown for 10 seconds before next AI call to save quota/avoid spam
      setTimeout(() => {
        aiCooldownRef.current = false;
      }, 10000); 
    };

    triggerAI();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history.length]); // Dependencies simplified to trigger on history updates

  const handleSaveSettings = (url: string) => {
    setConfig(prev => ({
      ...prev,
      apiUrl: url,
      isSimulation: url.length === 0 
    }));
  };

  return (
    <div className="min-h-screen bg-dark-900 text-gray-200 pb-10">
      {/* Header */}
      <header className="border-b border-dark-700 bg-dark-800/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 rounded-full bg-gold-500 flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.5)]">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
               </svg>
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tighter">
                <span className="text-gold-500">TEHRAN</span> GOLD HUNTER
              </h1>
              <div className="flex items-center space-x-2 space-x-reverse mt-1">
                 <span className="text-[10px] text-gold-500 font-mono tracking-wider border border-gold-500/30 px-1.5 py-0.5 rounded">
                   ساخته شده توسط Hamidreza.Ab[8612]
                 </span>
                <span className={`w-2 h-2 rounded-full ml-2 ${config.isSimulation ? 'bg-blue-500' : 'bg-green-500'}`}></span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors text-gray-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 pt-6 space-y-6">
        
        {/* Top Section: Price & Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <PriceTicker data={marketData} />
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
               <div className="bg-dark-card p-4 rounded-xl border border-dark-700 text-center">
                 <span className="text-gray-500 text-xs">سقف روزانه</span>
                 <p className="text-white font-mono font-bold">{new Intl.NumberFormat('fa-IR').format(marketData.high)}</p>
               </div>
               <div className="bg-dark-card p-4 rounded-xl border border-dark-700 text-center">
                 <span className="text-gray-500 text-xs">کف روزانه</span>
                 <p className="text-white font-mono font-bold">{new Intl.NumberFormat('fa-IR').format(marketData.low)}</p>
               </div>
            </div>
          </div>
          <div className="lg:col-span-2">
            <ChartComponent data={history} />
          </div>
        </div>

        {/* Bottom Section: Signals & History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-full">
            <SignalPanel signal={currentSignal} loading={loadingSignal} />
          </div>
          <div className="h-full">
            <TradeHistory signals={signalHistory} />
          </div>
        </div>

      </main>

      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)}
        currentUrl={config.apiUrl}
        onSave={handleSaveSettings}
      />
    </div>
  );
};

export default App;