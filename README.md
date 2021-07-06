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
( cd api && sls credentials set -i AKIDxxxx -k xxxxxxxxxxxx )
```

3. Setup the environments by `.env`:

```bash
cat << END > .env
REGION=ap-guangzhou
ZONE2=ap-guangzhou-2
ZONE4=ap-guangzhou-4
DESCRIPTION=SRS查询可用的稳定版本

MYSQL_DB=srs_version
MYSQL_USER=root

IM_SDKAPPID=xxxxxxxxx
IM_SECRETKEY=xxxxxxxxxxxxxxx
IM_ADMINISTRATOR=administrator

SRS_ADMIN=winlin
SRS_PASSWORD=ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f #sha256('12345678')
END
```

> Note: Please set the right [IM_SDKAPPID, IM_SECRETKEY and IM_ADMINISTRATOR](https://console.cloud.tencent.com/im-detail).

4. Build and deploy serverless:

```bash
make && sls deploy
```

5. Access the API-gateway url in log, like:

```
path:   /service/v1/releases
url:    https://xxxx-xxxx-xxxxxxxx.gz.apigw.tencentcs.com/release/service/v1/releases
```

Winlin 2021.06
