# versions

For https://api.ossrs.net/service/v1/releases

## Usage

1. Install [serverless](https://github.com/serverless/serverless)

```bash
brew install node &&
npm install -g serverless
```

2. Setup the environments by `.env`:

```bash
TENCENT_SECRET_ID=AKIDxxxxxxxxx
TENCENT_SECRET_KEY=xxxxxxxxxxxxxxxxxx
```

> Note: Please set the right [TENCENT_SECRET_ID and TENCENT_SECRET_KEY](https://console.cloud.tencent.com/cam) for serverless and captcha, etc.

3. Build and deploy serverless:

```bash
make
```

4. Access the API-gateway url in log, like: https://xxxx-xxxx-xxxxxxxx.gz.apigw.tencentcs.com/release/service/v1/releases

Winlin 2021.06
