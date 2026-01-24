from http.server import BaseHTTPRequestHandler
import json
from datetime import datetime, timedelta
from trendspyg import download_google_trends_rss


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # 한국 실시간 트렌드 가져오기 (RSS 방식, 0.2초로 빠름)
            trends_raw = download_google_trends_rss(geo='KR', cache=False)

            print(f"[Trends] trendspyg RSS returned {len(trends_raw)} trends")

            # 트렌드 데이터 변환 (상위 20개, Google RSS가 제공하는 만큼)
            trends = []
            max_trends = min(len(trends_raw), 20)

            for index, trend_item in enumerate(trends_raw[:max_trends], 1):
                trends.append({
                    'keyword': trend_item['trend'],
                    'rank': index,
                    'country': 'south_korea',
                    'traffic': trend_item.get('traffic', 'N/A'),
                    'news_headline': (
                        trend_item['news_articles'][0]['headline']
                        if trend_item.get('news_articles') and len(trend_item['news_articles']) > 0
                        else None
                    )
                })

            # 한국 시간 (UTC+9)
            korea_time = datetime.utcnow() + timedelta(hours=9)

            # JSON 응답
            response_data = {
                'success': True,
                'data': trends,
                'source': 'google_trends_trendspyg_rss',
                'cached': False,
                'total': len(trends),
                'collectedAt': korea_time.isoformat()
            }

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response_data, ensure_ascii=False).encode('utf-8'))

        except Exception as e:
            # 에러 응답
            error_response = {
                'success': False,
                'error': str(e),
                'message': 'Failed to fetch Google Trends data using trendspyg'
            }

            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(error_response, ensure_ascii=False).encode('utf-8'))
