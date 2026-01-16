/**
 * 환경 변수 확인
 */

console.log('환경 변수 확인:\n')
console.log('FINNHUB_API_KEY:', process.env.FINNHUB_API_KEY ? `${process.env.FINNHUB_API_KEY.substring(0, 10)}...` : 'undefined')
console.log('GROQ_API_KEY:', process.env.GROQ_API_KEY ? `${process.env.GROQ_API_KEY.substring(0, 10)}...` : 'undefined')
console.log('USE_DATABASE:', process.env.USE_DATABASE)
console.log('\n모든 환경 변수 (FINNHUB로 시작하는 것):')
Object.keys(process.env).filter(key => key.includes('FINNHUB')).forEach(key => {
  console.log(`  ${key}:`, process.env[key]?.substring(0, 20) + '...')
})
