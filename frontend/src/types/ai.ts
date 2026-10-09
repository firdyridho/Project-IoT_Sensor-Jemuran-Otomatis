export interface AIPredictRequest {
  deviceId: string;
  lookbackMinutes?: number;
}

export interface AIPredictResponse {
  status: string;
  deviceId: string;
  analyzedAt: string;
  prediction: {
    willRain: boolean;
    probabilityPct: number;
    estimatedMinutesUntilRain: number;
    confidenceLevel: 'high' | 'medium' | 'low';
    trendFactors: {
      humidityDelta: string;
      tempDelta: string;
      adcTrend: 'falling' | 'rising' | 'stable';
    };
    summary: string;
  };
}

export interface AIDryingAdviceResponse {
  status: string;
  deviceId: string;
  advice: {
    recommendation: 'aman_jemur' | 'waspada_jemur' | 'angkat_segera';
    dryingScore: number;
    estimatedDryHours: number;
    bestDryingWindow: string;
    bmkgWeatherDesc: string;
    actionMessage: string;
  };
}

export interface RainForecastAlertPayload {
  deviceId: string;
  alert: 'rain_forecast_alert';
  probabilityPct: number;
  estimatedMin: number;
  humidityDelta: string;
  tempDelta: string;
  message: string;
  timestamp: number;
}
