const puppeteer = require('puppeteer');
const csv = require('csv');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

/**
 * KB 시세 전용 CSV Writer 객체를 생성한다.
 * @param area 지역명칭 ex.송도, 영등포
 */
const createCSVWriter = (area) => {
  return createCsvWriter({
    path: `result/${area}_kb.csv`,
    header: [
      { id: 'name', title: '단지이름' },
      { id: 'size', title: '평형' },
      { id: 'avgTrade', title: '평균 매매가' },
      { id: 'avgCharter', title: '평균 전세가' }
    ],
    encoding: 'utf8'
  });
}

/**
 * KB 시세에서 단지별로 매물 정보를 얻어온다.
 * @param code KB 시세의 단지별 코드
 */
async function kbCrawler(code) {
  try {
    const browser = await puppeteer.launch({
      headless: true // 브라우저가 동작하지 않도록 셋팅
    });
    const page = await browser.newPage();

    await page.goto(
      `https://onland.kbstar.com/quics?page=C059689&물건식별자=${code}&탭구분=1&QSL=F`,
      {
        waitUntil: 'domcontentloaded'
      }
    );

    /**
     * 시세/실거래가 탭으로 이동
     */
    await page.click('li#siseTabBtn > a');

    await page.waitForNavigation();

    /**
     * 데이터 크롤링
     */
    const result = await page.evaluate(() => {
      let rows = $('tbody#siseDataTbodyArea tr');
      const datas = [];

      for (let i = 0; i < rows.length; i++) {
        const cols = rows.eq(i).find('td');
        const name = $('div.info_main span.name').text();
        const size = cols.eq(0).text();
        const avgTrade = cols.eq(2).text();
        const avgCharter = cols.eq(5).text();

        datas.push({
          name: name || '',
          size: size || '',
          avgTrade: avgTrade || '',
          avgCharter: avgCharter || ''
        });
      }

      return datas;
    });

    browser.close();

    return result;
  } catch (e) {
    console.error(e);
    throw new Error(`Naver Crwaling Error: ${code}`);
  }
}

const cache = [];

fs.createReadStream(`${__dirname}/resource/kb.csv`)
  .pipe(csv.parse())
  .on('data', (row) => {
    cache.push(row);
  })
  .on('end', async () => {
    /**
     * 파싱된 CSV를 바탕으로 지역별 데이터 수집
     */
    for (let i = 0; i < cache.length; i = i + 1) {
      try {
        const csvWriter = createCSVWriter(cache[i][0]); // 지역별로 다른 CSV 파일에 저장
        let output = [];

        /**
         * 단지별 데이터 수집
         */
        for (let j = 1; j < cache[i].length; j++) {
          if (cache[i][j]) {
            const res = await kbCrawler(cache[i][j]);
            output = output.concat(res);
          }
        }

        /**
         * CSV에 저장
         */
        await csvWriter.writeRecords(output);
      } catch (e) {
        console.error(e);
      }
    }
    
    console.log("KB 시세의 데이터의 수집이 완료되었습니다.")
  });