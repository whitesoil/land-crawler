const axios = require('axios');
const csv = require('csv');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

/**
 * Naver 부동산 전용 CSV Writer 객체를 생성한다.
 * @param area 지역명칭 ex.송도, 영등포
 */
const createCSVWriter = (area) => {
  return createCsvWriter({
    path: `result/${area}_naver.csv`,
    header: [
      { id: 'articleName', title: '단지이름' },
      { id: 'tradeTypeName', title: '매물종류' },
      { id: 'areaName', title: '공급면적' },
      { id: 'area2', title: '전용면적' },
      { id: 'dealOrWarrantPrc', title: '매매가격' },
      { id: 'buildingName', title: '동' },
      { id: 'direction', title: '방향' },
      { id: 'floorInfo', title: '층' },
      { id: 'financePrice', title: '융자금' },
      { id: 'moveInTypeName', title: '입주가능일' },
      { id: 'realtorName', title: '부동산' },
      { id: 'representativeTelNo', title: '대표번호' },
      { id: 'aptParkingCount', title: '총 주차 대수' },
      { id: 'aptHouseholdCount', title: '세대 수' },
      { id: 'constructYearMonth', title: '준공년월' },
      { id: 'detailDescription', title: '설명' }
    ],
    encoding: 'utf8'
  });
};

/**
 * Naver 부동산에서 단지별로 매물 정보를 얻어온다.
 * @param code Naver 부동산의 단지별 코드
 */
const naverCrawler = async (code) => {
  try {
    const roomList = [];
    const output = [];

    const town = await axios.get(
      `https://new.land.naver.com/api/complexes/overview/${code}?complexNo=${code}`
    );

    const constructYearMonth = town.data.constructYearMonth; // 준공년월

    /**
     * 단지별 매물 코드 목록 수집
     */
    for (let i = 1; i < 21; i++) {
      const res = await axios.get(
        `https://new.land.naver.com/api/articles/complex/${code}?realEstateType=APT%3AABYG&tradeType=&tag=%3A%3A%3A%3A%3A%3A%3A%3A&rentPriceMin=0&rentPriceMax=900000000&priceMin=0&priceMax=900000000&areaMin=0&areaMax=900000000&oldBuildYears&recentlyBuildYears&minHouseHoldCount&maxHouseHoldCount&showArticle=false&sameAddressGroup=false&minMaintenanceCost&maxMaintenanceCost&priceType=RETAIL&directions=&page=${i}&complexNo=104544&buildingNos=&areaNos=&type=list&order=rank`
      );
      const articleList = res.data.articleList;

      /**
       * 월세 매물 제외 필터링
       */
      const filteredList = articleList.filter((article) => {
        return article.tradeTypeName !== '월세';
      });

      /**
       * 단지의 매물별 코드 수집
       */
      filteredList.map((article) => {
        roomList.push(article.articleNo);
      });
    }

    /**
     * 매물별 상세정보 수집
     */
    for (const i of roomList) {
      const res = await axios.get(
        `https://new.land.naver.com/api/articles/${i}?complexNo=${code}`
      );

      const {
        articleAddition,
        articlePrice,
        articleDetail,
        articleRealtor
      } = res.data;

      const data = {
        articleName: articleAddition.articleName, // 단지이름
        tradeTypeName: articleAddition.tradeTypeName, // 매물종류
        areaName: articleAddition.areaName, // 공급면적
        area2: articleAddition.area2, // 전용면적
        dealOrWarrantPrc: articleAddition.dealOrWarrantPrc, // 매매가
        buildingName: articleAddition.buildingName, //동
        direction: articleAddition.direction, // 방향
        floorInfo: articleAddition.floorInfo, // 층
        financePrice: articlePrice.financePrice, // 융자
        moveInTypeName: articleDetail.moveInTypeName, // 입주가능일,
        realtorName: articleRealtor.realtorName, // 부동산 이름
        representativeTelNo: articleRealtor.representativeTelNo, // 부동산 대표번호
        aptParkingCount: articleDetail.aptParkingCount, // 총 주차 대수
        aptHouseholdCount: articleDetail.aptHouseholdCount, // 세대 수
        constructYearMonth: constructYearMonth, // 준공년월
        detailDescription: articleDetail.detailDescription // 매물 설명
      };

      output.push(data);
    }

    return output;
  } catch (e) {
    console.error(e);
    throw new Error(`Naver Crwaling Error: ${code}`);
  }
};

const cache = [];

fs.createReadStream(`${__dirname}/resource/naver.csv`)
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
            const res = await naverCrawler(cache[i][j]);
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
    
    console.log("네이버 부동산 데이터의 수집이 완료되었습니다.")
  });
