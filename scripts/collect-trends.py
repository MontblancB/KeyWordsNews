#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Google Trends 실시간 검색어 수집 스크립트
Pytrends를 사용하여 한국의 실시간 트렌드 키워드를 수집합니다.
"""

import json
import sys
from datetime import datetime

try:
    from pytrends.request import TrendReq
except ImportError:
    # Pytrends가 설치되지 않은 경우
    error_result = {
        'success': False,
        'error': 'Pytrends not installed. Please run: pip install pytrends',
        'collectedAt': datetime.now().isoformat()
    }
    print(json.dumps(error_result, ensure_ascii=False), file=sys.stderr)
    sys.exit(1)

def get_trending_searches():
    """한국의 실시간 트렌드 검색어를 가져옵니다."""
    try:
        # Pytrends 초기화 (한국 시간대: UTC+9 = 540분)
        pytrend = TrendReq(hl='ko', tz=540, timeout=(10, 25), retries=2, backoff_factor=0.1)

        # 한국 실시간 트렌드 가져오기
        trending_df = pytrend.trending_searches(pn='south_korea')

        # DataFrame을 리스트로 변환
        keywords = trending_df[0].tolist()

        # JSON 형식으로 출력
        result = {
            'success': True,
            'data': [
                {
                    'keyword': keyword,
                    'rank': idx + 1,
                    'country': 'south_korea',
                    'collectedAt': datetime.now().isoformat()
                }
                for idx, keyword in enumerate(keywords[:20])  # 상위 20개
            ],
            'collectedAt': datetime.now().isoformat(),
            'count': len(keywords[:20])
        }

        print(json.dumps(result, ensure_ascii=False))
        return 0

    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e),
            'collectedAt': datetime.now().isoformat()
        }
        print(json.dumps(error_result, ensure_ascii=False), file=sys.stderr)
        return 1

if __name__ == '__main__':
    sys.exit(get_trending_searches())
