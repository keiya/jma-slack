import { IncomingWebhook } from "@slack/webhook";
import * as fs from "fs/promises";
import * as path from "path";

import { Crawler } from "./lib/crawler";
import { Chart } from "./lib/chart";

const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL || "";

const webhook = new IncomingWebhook(slackWebhookUrl);

(async () => {
  const cr = new Crawler();
  const data = await cr.fetchData();
  console.log(data);

  const lastSunlightData = data[data.length - 1];

  const chartUrl = await Chart.generateChart(data);
  console.log(chartUrl);
  await webhook.send({
    text: `${lastSunlightData.date} の日照時間は ${lastSunlightData.sunlight_duration} 時間、合計全天日射量は ${lastSunlightData.sunlight_amount} MJ/m^2 でした`,
    attachments: [
      {
        image_url: chartUrl,
        title: `${lastSunlightData.date} までの日照履歴`,
      },
    ],
  });
})();
