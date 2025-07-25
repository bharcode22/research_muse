import React, { useEffect, useState, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function DataVisualizer() {
  const [chartData, setChartData] = useState({});
  const [lastUpdate, setLastUpdate] = useState(null);
  const [systemStats, setSystemStats] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState(null);
  const [settings, setSettings] = useState({
    maxDataPoints: 500,
    chartHeight: 384,
    lineWidth: 3,
    showPoints: false,
    lineTension: 0.1,
    showGrid: true,
    autoSkipLabels: true,
    maxVisibleLabels: 20,
    showSystemInfo: false
  });

  // Fungsi untuk mengupdate chart data secara efisien
  const updateChartData = useCallback((topic, numericValues, timestamp, dataType, detectedPattern) => {
    setChartData(prev => {
      const newData = { ...prev };
      
      if (!newData[topic]) {
        newData[topic] = {
          labels: [],
          datasets: numericValues.map((_, i) => ({
            label: `${dataType || detectedPattern || 'Sensor'} ${i+1}`,
            data: [],
            borderColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
            tension: settings.lineTension,
            borderWidth: settings.lineWidth,
            pointRadius: settings.showPoints ? 3 : 0,
            pointHoverRadius: settings.showPoints ? 5 : 0
          }))
        };
      }
      
      // Tambahkan data baru
      newData[topic].labels.push(new Date(timestamp).toLocaleTimeString());
      if (newData[topic].labels.length > settings.maxDataPoints) {
        newData[topic].labels.shift();
      }
      
      numericValues.forEach((value, i) => {
        if (newData[topic].datasets[i]) {
          newData[topic].datasets[i].data.push(value);
          if (newData[topic].datasets[i].data.length > settings.maxDataPoints) {
            newData[topic].datasets[i].data.shift();
          }
        }
      });
      
      return newData;
    });
    
    setLastUpdate(new Date().toLocaleTimeString());
  }, [settings.lineTension, settings.lineWidth, settings.maxDataPoints, settings.showPoints]);

  // Fungsi untuk menghandle WebSocket messages
  const handleWebSocketMessage = useCallback((event) => {
    try {
      const msg = JSON.parse(event.data);
      
      switch(msg.type) {
        case 'info':
          console.log('Server info:', msg.message);
          setIsConnected(true);
          break;
          
        case 'stats':
          setSystemStats(msg);
          break;
          
        default:
          if (msg.topic && msg.numericValues) {
            updateChartData(
              msg.topic, 
              msg.numericValues, 
              msg.timestamp, 
              msg.dataType, 
              msg.detectedPattern
            );
          }
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  }, [updateChartData]);

  // Setup WebSocket connection
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080');
    setSocket(ws);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };

    ws.onmessage = handleWebSocketMessage;

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [handleWebSocketMessage]);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Tampilkan status koneksi
  const connectionStatus = isConnected 
    ? <span className="text-green-500">Connected</span>
    : <span className="text-red-500">Disconnected</span>;

  return (
    <div className="w-full min-h-screen p-4 bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">Sensor Data Visualization</h1>
            <div className="text-sm text-white">
              Status: {connectionStatus} | Last update: {lastUpdate || 'Waiting for data...'}
            </div>
          </div>
          
          {systemStats && settings.showSystemInfo && (
            <div className="mt-3 p-3 bg-slate-800 rounded-lg text-xs text-white">
              <h3 className="font-bold mb-1">System Statistics:</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div>Total Messages: {systemStats.statistics.totalMessages}</div>
                <div>Topics: {systemStats.topics.length}</div>
                <div>Memory: {Math.round(systemStats.systemInfo.freeMem/1024/1024)}MB free</div>
                <div>Load: {systemStats.systemInfo.load[0].toFixed(2)}</div>
              </div>
            </div>
          )}
        </header>

        {/* Control Panel - tetap sama seperti sebelumnya */}
        {/* Control Panel */}
        <div className="mb-6 p-4 bg-slate-800 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-white mb-3">Chart Controls</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Max Data Points: {settings.maxDataPoints}
              </label>
              <input
                type="range"
                min="50"
                max="1000"
                value={settings.maxDataPoints}
                onChange={(e) => handleSettingChange('maxDataPoints', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Chart Height: {settings.chartHeight}px
              </label>
              <input
                type="range"
                min="200"
                max="800"
                step="10"
                value={settings.chartHeight}
                onChange={(e) => handleSettingChange('chartHeight', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Line Width: {settings.lineWidth}px
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={settings.lineWidth}
                onChange={(e) => handleSettingChange('lineWidth', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Line Tension: {settings.lineTension}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.lineTension}
                onChange={(e) => handleSettingChange('lineTension', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="showPoints"
                checked={settings.showPoints}
                onChange={(e) => handleSettingChange('showPoints', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="showPoints" className="ml-2 text-sm font-medium text-white">
                Show Data Points
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="showGrid"
                checked={settings.showGrid}
                onChange={(e) => handleSettingChange('showGrid', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="showGrid" className="ml-2 text-sm font-medium text-white">
                Show Grid Lines
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoSkipLabels"
                checked={settings.autoSkipLabels}
                onChange={(e) => handleSettingChange('autoSkipLabels', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="autoSkipLabels" className="ml-2 text-sm font-medium text-white">
                Auto-Skip Labels
              </label>
            </div>

            {settings.autoSkipLabels && (
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Max Visible Labels: {settings.maxVisibleLabels}
                </label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={settings.maxVisibleLabels}
                  onChange={(e) => handleSettingChange('maxVisibleLabels', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>
        
        {/* ... */}

        <div className="space-y-8">
          {Object.entries(chartData).map(([topic, data]) => (
            <div key={topic} className="w-full bg-slate-900/70 rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b border-amber-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-white">{topic}</h2>
                <span className="text-sm text-amber-300">
                  {data.datasets.length} signal(s) | {data.labels.length} points
                </span>
              </div>
              <div className="p-4" style={{ height: `${settings.chartHeight}px` }}>
                <Line 
                  data={data}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                      duration: 0 // Nonaktifkan animasi untuk performa lebih baik
                    },
                    // ... opsi lainnya tetap sama
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}