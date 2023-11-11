import { CookieJar, MemoryCookieStore } from "tough-cookie";
import qs from "qs";
import * as cheerio from "cheerio";
import * as csv from "csv-parse/sync";
import * as chardet from "chardet";

import * as iconv from "iconv-lite";

export interface SunlightRecord {
  date: string;
  sunlight_duration: number;
  sunlight_duration_normal: number;
  sunlight_amount: number;
  sunlight_amount_normal: number;
}

function formatDateComponent(component: string | number) {
  // Format the date component to ensure it's always two digits
  return component.toString().padStart(2, "0");
}

function getDateRangeString() {
  const today = new Date();
  const oneWeekAgo = new Date();
  const yesterday = new Date();

  // Set oneWeekAgo to 10 days before today
  oneWeekAgo.setDate(today.getDate() - 10);

  // Set yesterday to 1 day before today
  yesterday.setDate(today.getDate() - 1);

  // Extract the year, month, and day components
  const startYear = oneWeekAgo.getFullYear();
  const endYear = yesterday.getFullYear();
  const startMonth = formatDateComponent(oneWeekAgo.getMonth() + 1); // getMonth() is zero-based
  const endMonth = formatDateComponent(yesterday.getMonth() + 1); // getMonth() is zero-based
  const startDay = formatDateComponent(oneWeekAgo.getDate());
  const endDay = formatDateComponent(yesterday.getDate());

  // Format the string
  return `["${startYear}","${endYear}","${startMonth}","${endMonth}","${startDay}","${endDay}"]`;
}

export class Crawler {
  private cookieJar: CookieJar;
  constructor() {
    this.cookieJar = new CookieJar();
  }

  async fetchWithCookies(
    url: string,
    options: RequestInit = {}
  ): Promise<string> {
    console.log(url);
    // クッキーをヘッダーにセット
    const cookies = await this.cookieJar.getCookieString(url);
    //console.log(cookies)
    options.headers = {
      ...options.headers,
      Cookie: cookies,
    };

    const response = await fetch(url, options);
    //console.log(response)

    // レスポンスからクッキーを取得して保存
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "set-cookie") {
        return;
      }
      const setCookie = value;
      if (!setCookie) {
        return;
      }
      this.cookieJar.setCookieSync(setCookie, url);
    });

    const respBuf = Buffer.from(await response.arrayBuffer());

    const charset = chardet.detect(respBuf);
    if (charset) {
      return iconv.decode(respBuf, charset);
    }

    return response.text();
  }

  buildForm(tree: cheerio.CheerioAPI, body: any = {}): RequestInit {
    //#sid
    const token = tree.root().find("input#sid").first().val();
    return {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
        "Accept-Encoding": "gzip, deflate",
        Accept: "text/html,application/xhtml+xml,application/xml;",
        // 'Referer': loginPageUrl,
      },
      body: qs.stringify({
        PHPSESSID: token,
        ...body,
      }),
      credentials: "include",
      redirect: "manual",
    };
  }

  async fetchData(): Promise<SunlightRecord[]> {
    const formPageResponse = await this.fetchWithCookies(
      "https://www.data.jma.go.jp/risk/obsdl/index.php"
    );

    const resultResponse = await this.fetchWithCookies(
      "https://www.data.jma.go.jp/risk/obsdl/show/table",
      this.buildForm(cheerio.load(formPageResponse), {
        stationNumList: '["s47662"]',
        aggrgPeriod: "1",
        elementNumList: '[["401",""],["610",""]]',
        interAnnualFlag: "1",
        ymdList: getDateRangeString(),
        optionNumList: '[["op1",0]]',
        downloadFlag: "true",
        rmkFlag: "0",
        disconnectFlag: "0",
        youbiFlag: "0",
        fukenFlag: "0",
        kijiFlag: "0",
        huukouFlag: "0",
        csvFlag: "1",
        jikantaiFlag: "0",
        jikantaiList: "[]",
        ymdLiteral: "0",
      })
    );

    let data: any[] = [];
    const records = csv.parse(resultResponse, {
      relax_column_count: true,
      columns: [
        "year",
        "month",
        "day",
        "sunlight_duration",
        "sunlight_duration_ignore",
        "sunlight_duration_normal",
        "sunlight_duration_normal_ignore",
        "sunlight_amount",
        "sunlight_amount_normal",
      ],
    });
    records.splice(0, 6);

    const sunlightRecords = records.map((r: any) => {
      return {
        date: `${r.year}-${String(r.month).padStart(2, "0")}-${String(
          r.day
        ).padStart(2, "0")}`,
        sunlight_duration: parseFloat(r.sunlight_duration),
        sunlight_duration_normal: parseFloat(r.sunlight_duration_normal),
        sunlight_amount: parseFloat(r.sunlight_amount),
        sunlight_amount_normal: parseFloat(r.sunlight_amount_normal),
      } as SunlightRecord;
    });

    return sunlightRecords;
  }
}
