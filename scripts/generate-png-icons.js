const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const svgPath = path.join(__dirname, '../public/icon.svg');
const iconsDir = path.join(__dirname, '../public/icons');

async function generateIcons() {
  console.log('📰 키워드뉴스 PWA 아이콘 생성 시작');
  console.log('='.repeat(60));

  // icons 디렉토리 생성
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
    console.log('✅ icons 폴더 생성 완료');
  }

  // SVG 읽기
  const svgBuffer = fs.readFileSync(svgPath);

  // 각 사이즈별로 PNG 생성
  for (const size of sizes) {
    const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);

    try {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);

      console.log(`✅ icon-${size}x${size}.png 생성 완료`);
    } catch (error) {
      console.error(`❌ icon-${size}x${size}.png 생성 실패:`, error.message);
    }
  }

  console.log('='.repeat(60));
  console.log('✨ 모든 아이콘 생성 완료!');
}

generateIcons().catch(console.error);
