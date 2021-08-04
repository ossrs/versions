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
# .env

TENCENT_SECRET_ID=AKIDxxxxxxxxx
TENCENT_SECRET_KEY=xxxxxxxxxxxxxxxxxx

# 系统颁发用户Token的基础密钥
JWT_SECRET=xxxxxxxxxxxxxxxxxx

REGION=ap-guangzhou
DESCRIPTION=SRS查询可用的稳定版本

# SCF日志服务配置 scf_logtopic scf_logset
SCF_LOGTOPIC=xxxxxxxxx
SCF_LOGSET=xxxxxxxxx

IM_SDKAPPID=xxxxxxxxx
IM_SECRETKEY=xxxxxxxxxxxxxxx
IM_ADMINISTRATOR=administrator

SRS_ADMIN=winlin
SRS_PASSWORD=ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f #sha256('12345678')
SRS_ADMIN1=admin
SRS_PASSWORD1=ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f
SRS_ADMIN2=guest
SRS_PASSWORD2=ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f

# 系统默认的IM群组名称，api模块初始化时创建
IM_GROUP_SYSLOG=SrsSystemLogs
# GroupType: Private,Public,ChatRoom,AVChatRoom @see https://cloud.tencent.com/document/product/269/1502#GroupType
#       Private, 好友工作群（Work）
#       Public, 陌生人社交群（Public）
#       ChatRoom, 临时会议群（Meeting）
#       AVChatRoom, 直播群（AVChatRoom）
IM_GROUP_TYPE=AVChatRoom
END
```

> Note: Please set the right [TENCENT_SECRET_ID and TENCENT_SECRET_KEY](https://console.cloud.tencent.com/cam) for serverless and captcha, etc.

> Note: Please set the right [IM_SDKAPPID, IM_SECRETKEY and IM_ADMINISTRATOR](https://console.cloud.tencent.com/im-detail).

> Note: Please set the right [CAPTCHA_APP_ID and CAPTCHA_APP_SECRET_KEY](https://console.cloud.tencent.com/captcha/graphical) for captcha.

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
