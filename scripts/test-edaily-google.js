const Parser = require('rss-parser');
const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media', { keepArray: true }],
      ['media:thumbnail', 'thumbnail'],
      ['description', 'description'],
      ['content:encoded', 'contentEncoded']
    ]
  }
});

async function testEdaily() {
  console.log('========================================');
  console.log('1. 이데일리 RSS 분석');
  console.log('========================================\n');
  
  try {
    const feed = await parser.parseURL('http://rss.edaily.co.kr/edaily_news.xml');
    const item = feed.items[0];
    
    console.log('제목:', item.title);
    console.log('\n--- 이미지 소스 확인 ---');
    console.log('enclosure:', item.enclosure);
    console.log('media:', item.media);
    console.log('thumbnail:', item.thumbnail);
    console.log('\n--- HTML 콘텐츠 ---');
    console.log('description (첫 400자):', item.description?.substring(0, 400));
    console.log('\ncontent (첫 400자):', item.content?.substring(0, 400));
    console.log('\ncontentEncoded (첫 400자):', item.contentEncoded?.substring(0, 400));
    
    // 이미지 추출 시도
    const htmlContent = item.contentEncoded || item.content || item.description || '';
    if (htmlContent) {
      const imgMatch = htmlContent.match(/<img[^>]+src=["']?([^"'\s>]+)["']?/i);
      console.log('\n⭐ 추출된 이미지:', imgMatch ? imgMatch[1] : '없음');
    }
    
  } catch (error) {
    console.error('❌ 에러:', error.message);
  }
}

async function testGoogleNews() {
  console.log('\n\n========================================');
  console.log('2. 구글 뉴스 RSS 분석');
  console.log('========================================\n');
  
  try {
    const feed = await parser.parseURL('https://news.google.com/rss/search?q=삼성전자&hl=ko&gl=KR&ceid=KR:ko');
    const item = feed.items[0];
    
    console.log('제목:', item.title);
    console.log('\n--- 이미지 소스 확인 ---');
    console.log('enclosure:', item.enclosure);
    console.log('media:', item.media);
    console.log('thumbnail:', item.thumbnail);
    console.log('\n--- HTML 콘텐츠 ---');
    console.log('description (첫 600자):', item.description?.substring(0, 600));
    console.log('\ncontent (첫 600자):', item.content?.substring(0, 600));
    console.log('\ncontentEncoded (첫 400자):', item.contentEncoded?.substring(0, 400));
    
    // 이미지 추출 시도
    const htmlContent = item.contentEncoded || item.content || item.description || '';
    if (htmlContent) {
      const imgMatch = htmlContent.match(/<img[^>]+src=["']?([^"'\s>]+)["']?/i);
      console.log('\n⭐ 추출된 이미지:', imgMatch ? imgMatch[1] : '없음');
    }
    
  } catch (error) {
    console.error('❌ 에러:', error.message);
  }
}

async function run() {
  await testEdaily();
  await testGoogleNews();
  
  console.log('\n\n========================================');
  console.log('📊 결론');
  console.log('========================================');
}

run();
