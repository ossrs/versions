# versions

For https://api.ossrs.net/service/v1/releases

## Usage

1. Install [serverless](https://github.com/serverless/serverless)

```bash
brew install node &&
npm install -g serverless
```

2. Create a [user with AK](https://console.cloud.tencent.com/cam):

```bash
cd api && sls credentials set -i AKIDxxxx -k xxxxxxxxxxxx
```

3. Build and deploy serverless:

```bash
make && sls deploy
```

4. Access the API-gateway url in log, like:

```
path:   /service/v1/releases
url:    https://xxxx-xxxx-xxxxxxxx.gz.apigw.tencentcs.com/release/service/v1/releases
```

Winlin 2021.06
