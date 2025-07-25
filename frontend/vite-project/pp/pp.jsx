modifikasi kode berikut supaya sesuai seperti yang anda sarankan 

import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function DataVisualizer() {
  const [chartData, setChartData] = useState({});
  const [lastUpdate, setLastUpdate] = useState(null);
  const [settings, setSettings] = useState({
    maxDataPoints: 500,
    chartHeight: 384, // h-96 in pixels (24rem)
    lineWidth: 3,
    showPoints: false,
    lineTension: 0.1,
    showGrid: true,
    autoSkipLabels: true,
    maxVisibleLabels: 20, 
    showSystemInfo: false 
  });

  // useEffect(() => {
  //   const socket = new WebSocket('ws://localhost:8080');

  //   socket.onmessage = (event) => {
  //     const msg = JSON.parse(event.data);
      
  //     if (msg.topic && msg.numericValues) {
  //       setChartData(prev => {
  //         const newData = { ...prev };
          
  //         // Initialize topic if not exists
  //         if (!newData[msg.topic]) {
  //           newData[msg.topic] = {
  //             labels: [],
  //             datasets: msg.numericValues.map((_, i) => ({
  //               label: `${msg.dataType || 'Sensor'} ${i+1}`,
  //               data: [],
  //               borderColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
  //               tension: settings.lineTension,
  //               borderWidth: settings.lineWidth,
  //               pointRadius: settings.showPoints ? 3 : 0,
  //               pointHoverRadius: settings.showPoints ? 5 : 0
  //             }))
  //           };
  //         }
          
  //         // Add new data point
  //         newData[msg.topic].labels.push(new Date(msg.timestamp).toLocaleTimeString());
  //         if (newData[msg.topic].labels.length > settings.maxDataPoints) {
  //           newData[msg.topic].labels.shift();
  //         }
          
  //         msg.numericValues.forEach((value, i) => {
  //           if (newData[msg.topic].datasets[i]) {
  //             newData[msg.topic].datasets[i].data.push(value);
  //             if (newData[msg.topic].datasets[i].data.length > settings.maxDataPoints) {
  //               newData[msg.topic].datasets[i].data.shift();
  //             }
  //           }
  //         });
          
  //         return newData;
  //       });
        
  //       setLastUpdate(new Date().toLocaleTimeString());
  //     }
  //   };

  //   return () => socket.close();
  // }, [settings.lineTension, settings.lineWidth, settings.maxDataPoints, settings.showPoints]);

useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080');

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      
      // Handle different message types
      switch(msg.type) {
        case 'info':
          console.log('Server info:', msg.message);
          break;
          
        case 'stats':
          setSystemStats(msg);
          break;
          
        default:
          if (msg.topic && msg.numericValues) {
            setChartData(prev => {
              const newData = { ...prev };
              
              if (!newData[msg.topic]) {
                newData[msg.topic] = {
                  labels: [],
                  datasets: msg.numericValues.map((_, i) => ({
                    label: `${msg.dataType || msg.detectedPattern || 'Sensor'} ${i+1}`,
                    data: [],
                    borderColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
                    tension: settings.lineTension,
                    borderWidth: settings.lineWidth,
                    pointRadius: settings.showPoints ? 3 : 0,
                    pointHoverRadius: settings.showPoints ? 5 : 0
                  }))
                };
              }
              
              newData[msg.topic].labels.push(new Date(msg.timestamp).toLocaleTimeString());
              if (newData[msg.topic].labels.length > settings.maxDataPoints) {
                newData[msg.topic].labels.shift();
              }
              
              msg.numericValues.forEach((value, i) => {
                if (newData[msg.topic].datasets[i]) {
                  newData[msg.topic].datasets[i].data.push(value);
                  if (newData[msg.topic].datasets[i].data.length > settings.maxDataPoints) {
                    newData[msg.topic].datasets[i].data.shift();
                  }
                }
              });
              
              return newData;
            });
            
            setLastUpdate(new Date().toLocaleTimeString());
          }
      }
    };

    return () => socket.close();
  }, [settings.lineTension, settings.lineWidth, settings.maxDataPoints, settings.showPoints]);

  // const handleSettingChange = (key, value) => {
  //   setSettings(prev => ({
  //     ...prev,
  //     [key]: value
  //   }));
  // };



  // const handleSettingChange = (key, value) => {
  //   setSettings(prev => ({
  //     ...prev,
  //     [key]: value
  //   }));
  // };

  return (
    <div className="w-full min-h-screen p-4 bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-white">Sensor Data Visualization</h1>
          <p className="text-sm text-white">
            Last update: {lastUpdate || 'Waiting for data...'}
          </p>
        </header>

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
        
        <div className="space-y-8">
          {Object.entries(chartData).map(([topic, data]) => (
            <div key={topic} className="w-full bg-slate-900/70 rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b border-amber-200">
                <h2 className="text-lg font-semibold text-white">{topic}</h2>
              </div>
              <div className="p-4" style={{ height: `${settings.chartHeight}px` }}>
                <Line 
                  data={data}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { 
                        position: 'top',
                        labels: {
                          boxWidth: 30,
                          padding: 50,
                          font: {
                            size: 14,
                            weight: 'bold'
                          },
                          color: '#ffffff'
                        }
                      },
                      title: { 
                        display: true, 
                        text: `${topic} - Real-time Data (${data.labels.length}/${settings.maxDataPoints} points)`,
                        font: {
                          size: 20,
                          weight: 'bold'
                        },
                        color: '#ffffff'
                      },
                      tooltip: {
                        mode: 'index',
                        intersect: false,
                        titleFont: {
                          size: 16,
                          weight: 'bold'
                        },
                        bodyFont: {
                          size: 14,
                          weight: 'bold'
                        }
                      }
                    },
                    scales: {
                      x: {
                        grid: {
                          display: settings.showGrid,
                          color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                          maxRotation: 45,
                          minRotation: 45,
                          color: '#ffffff',
                          autoSkip: settings.autoSkipLabels,
                          maxTicksLimit: settings.maxVisibleLabels
                        }
                      },
                      y: {
                        grid: {
                          display: settings.showGrid,
                          color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                          color: '#ffffff'
                        }
                      }
                    },
                    elements: {
                      line: {
                        tension: settings.lineTension,
                        borderWidth: settings.lineWidth
                      },
                      point: {
                        radius: settings.showPoints ? 3 : 0,
                        hoverRadius: settings.showPoints ? 5 : 0
                      }
                    },
                    animation: {
                      duration: 0
                    },
                    interaction: {
                      intersect: false,
                      mode: 'index'
                    }
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