from http.server import BaseHTTPRequestHandler
import json
from datetime import datetime
from trendspyg import download_google_trends_rss


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # 한국 실시간 트렌드 가져오기 (캐시 비활성화)
            trends_raw = download_google_trends_rss(geo='KR', cache=False)

            print(f"[Trends] trendspyg returned {len(trends_raw)} trends")

            # 트렌드 데이터 변환 (제한 없이 모두 가져오기)
            trends = []
            for index, trend_item in enumerate(trends_raw, 1):
                trends.append({
                    'keyword': trend_item['trend'],
                    'rank': index,
                    'country': 'south_korea',
                    'traffic': trend_item.get('traffic', 'N/A'),
                    # 뉴스 정보 (첫 번째 기사만)
                    'news_headline': (
                        trend_item['news_articles'][0]['headline']
                        if trend_item.get('news_articles') and len(trend_item['news_articles']) > 0
                        else None
                    )
                })

            # JSON 응답
            response_data = {
                'success': True,
                'data': trends,
                'source': 'google_trends_trendspyg_rss',
                'cached': False,
                'total': len(trends),
                'collectedAt': datetime.now().isoformat()
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
