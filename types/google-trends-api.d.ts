declare module 'google-trends-api' {
  interface RealTimeTrendsOptions {
    geo: string
    category?: string
  }

  interface DailyTrendsOptions {
    geo: string
  }

  const googleTrends: {
    realTimeTrends(options: RealTimeTrendsOptions): Promise<string>
    dailyTrends(options: DailyTrendsOptions): Promise<string>
  }

  export default googleTrends
}
