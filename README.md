# Land Cralwer
- KB Real Estate (Pupetter, Headless)
- Naver Real Estate

## Set Up
```
# 패키지 설치
$ npm install

# 실행
$ npm start
```

## How To Use (KB)
1. resource 폴더에 아래 양식과 같이 작성된 kb.csv 파일을 넣는다. (지역,코드,코드,코드,...)
> 송도,KB12345,KB1234,KB39003,KB12322,KB12423

> 영등포,KB13345,KB12634,KB31203,KB19822,KB12823

2. `npm run kb`

## How To Use (NAVER)
1. resource 폴더에 아래 양식과 같이 작성된 naver.csv 파일을 넣는다. (지역,코드,코드,코드,...)
> 송도,NV12345,NV1234,NV39003,NV12322,NV12423

> 영등포,NV13345,NV12634,NV31203,NV19822,NV12823

2. `npm run naver`

## 결과물
- result 폴더의 하위에 csv 파일로 생성된다.
- ***데이터가 덮어씌여질 수 있으니 항상 외부로 옮겨서 작업하십시오***

## 한글 깨짐 문제
1. 생성된 csv 파일을 오픈한다.
2. 상단 탭의 `데이터` 탭을 클릭한다.
3. 메뉴에서 `텍스트/CSV` 를 클릭한다.
4. csv 파일을 선택해서 `가져오기`를 클릭한다.
5. 좌측상단 `파일원본`을 `65001: 유니코드(UTF-8)`로 선택한다.
6. 우측하단 `로드`를 클릭한다.
