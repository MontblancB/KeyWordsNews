from http.server import BaseHTTPRequestHandler
import json
from pytrends.request import TrendReq


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # Pytrends 초기화
            pytrends = TrendReq(hl='ko-KR', tz=540)  # 한국 시간대

            # 한국 실시간 인기 검색어 가져오기
            trending_searches_df = pytrends.trending_searches(pn='south_korea')

            # DataFrame을 리스트로 변환
            keywords = trending_searches_df[0].tolist()[:20]  # 상위 20개

            # 트렌드 데이터 생성
            trends = [
                {
                    'keyword': keyword,
                    'rank': index + 1,
                    'country': 'south_korea'
                }
                for index, keyword in enumerate(keywords)
            ]

            # JSON 응답
            response_data = {
                'success': True,
                'data': trends,
                'source': 'google_trends_pytrends',
                'cached': False
            }

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response_data, ensure_ascii=False).encode('utf-8'))

        except Exception as e:
            # 에러 응답
            error_response = {
                'success': False,
                'error': str(e),
                'message': 'Failed to fetch Google Trends data'
            }

            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(error_response, ensure_ascii=False).encode('utf-8'))
