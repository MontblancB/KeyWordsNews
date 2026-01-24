from http.server import BaseHTTPRequestHandler
import json
from pytrends.request import TrendReq


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # Pytrends 초기화
            pytrends = TrendReq(hl='ko-KR', tz=540)  # 한국 시간대

            keywords = []
            method_used = None

            # 방법 1: realtime_trending_searches (실시간 트렌드)
            try:
                realtime_df = pytrends.realtime_trending_searches(pn='KR')
                if 'title' in realtime_df.columns:
                    keywords = realtime_df['title'].tolist()[:20]
                else:
                    keywords = realtime_df.iloc[:, 0].tolist()[:20]
                method_used = 'realtime_trending_searches'
            except Exception as e1:
                # 방법 2: today_searches (오늘의 검색어)
                try:
                    today_df = pytrends.today_searches(pn='KR')
                    keywords = today_df.iloc[:, 0].tolist()[:20]
                    method_used = 'today_searches'
                except Exception as e2:
                    # 방법 3: trending_searches (일반 트렌드)
                    try:
                        # 다양한 파라미터 시도
                        for pn_param in ['south_korea', 'korea', 'KR']:
                            try:
                                trending_df = pytrends.trending_searches(pn=pn_param)
                                keywords = trending_df.iloc[:, 0].tolist()[:20]
                                method_used = f'trending_searches({pn_param})'
                                break
                            except:
                                continue

                        if not keywords:
                            raise Exception(f'All methods failed. realtime: {str(e1)}, today: {str(e2)}')
                    except Exception as e3:
                        raise Exception(f'All methods failed. realtime: {str(e1)}, today: {str(e2)}, trending: {str(e3)}')

            # 키워드가 없으면 에러
            if not keywords or len(keywords) == 0:
                raise Exception('No keywords found from Google Trends')

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
                'source': f'google_trends_pytrends_{method_used}',
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
