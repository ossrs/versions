
const url = require('url')
const http = require('http')
const https = require('https')
const TLSSigAPIv2 = require('tls-sig-api-v2')

// The param SDKAppID is the sdkappid is of https://cloud.tencent.com/document/product/269/1519
// The param administrator is the identifier of https://cloud.tencent.com/document/product/269/1519
// The param SECRETKEY is used to generate the usersig of https://cloud.tencent.com/document/product/269/1519
function create(SDKAppID, SECRETKEY, administrator) {
  // TODO: FIMXE: Cache the sig util expired.
  administratorSig = function() {
    return new TLSSigAPIv2.Api(parseInt(SDKAppID), SECRETKEY).genSig(administrator, 1 * 24 * 3600)
  }

  // Do HTTP/HTTPS request.
  apiRequest  = async function (r, data) {
    const postData = JSON.stringify(data)
    const urlObj = url.parse(r)
    const m = (urlObj.protocol === 'http:')? http : https
  
    return await new Promise((resolve, reject) => {
      const req = m.request({
          method: 'POST',
          host: urlObj.host,
          path: urlObj.path,
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        }, (res) => {
          var body = '';
          res.setEncoding('utf8')
          res.on('data', (chunk) => {
            body += chunk
          })
          res.on('end', () => {
            resolve(JSON.parse(body))
          })
        }
      )
  
      req.on('error', (e) => {
        reject(e)
      })
  
      req.write(postData)
      req.end()
    })
  }

  // Generate the request url by api.
  generateUrl = function(api) {
    return 'https://console.tim.qq.com/' + api + '?' 
      + 'sdkappid=' + SDKAppID + '&identifier=' + administrator + '&usersig=' + administratorSig()
      + '&random=' + parseInt(Math.random() * 1000000000) +'&contenttype=json'
  }

  // Export SDK API.
  return {
    // 导入单个帐号 @see https://cloud.tencent.com/document/product/269/1608
    account_import: async function(Identifier, Nick, FaceUrl) {
      return apiRequest(generateUrl('v4/im_open_login_svc/account_import'), {
        Identifier: Identifier,
        Nick: Nick,
        FaceUrl: FaceUrl,
      })
    },
    // 创建群组 @see https://cloud.tencent.com/document/product/269/1615
    create_group: async function(Owner_Account, Type, GroupId, Name) {
      return apiRequest(generateUrl('v4/group_open_http_svc/create_group'), {
        Owner_Account: Owner_Account,
        Type: Type,
        GroupId: GroupId,
        Name: Name,
      })
    },
    // 解散群组 @see https://cloud.tencent.com/document/product/269/1624
    destroy_group: async function(GroupId) {
      return apiRequest(generateUrl('v4/group_open_http_svc/destroy_group'), {
        GroupId: GroupId,
      })
    },
    // 增加群成员 @see https://cloud.tencent.com/document/product/269/1621
    add_group_member: async function(GroupId, Silence, Member_Accounts) {
      return apiRequest(generateUrl('v4/group_open_http_svc/add_group_member'), {
        GroupId: GroupId,
        Silence: Silence,
        MemberList: Member_Accounts.map(function(x) { return {Member_Account: x}; }),
      })
    },
    // 删除群成员 @see https://cloud.tencent.com/document/product/269/1622
    delete_group_member: async function(GroupId, Silence, MemberToDel_Accounts) {
      return apiRequest(generateUrl('v4/group_open_http_svc/delete_group_member'), {
        GroupId: GroupId,
        Silence: Silence,
        MemberToDel_Account: MemberToDel_Accounts,
      })
    },
    // 转让群主 @see https://cloud.tencent.com/document/product/269/1633
    change_group_owner: async function(GroupId, NewOwner_Account) {
      return apiRequest(generateUrl('v4/group_open_http_svc/change_group_owner'), {
        GroupId: GroupId,
        NewOwner_Account: NewOwner_Account,
      })
    },
    // 单发单聊消息 @see https://cloud.tencent.com/document/product/269/2282
    sendmsg: async function(From_Account, SyncOtherMachine, To_Account, MsgContent) {
      return apiRequest(generateUrl('v4/openim/sendmsg'), {
        From_Account: From_Account,
        SyncOtherMachine: SyncOtherMachine,
        To_Account: To_Account,
        MsgLifeTime: 1 * 3600, // in seconds
        MsgRandom: parseInt(Math.random() * 1000000),
        MsgTimeStamp: parseInt(new Date().getTime() / 1000), // timestamp in seconds
        MsgBody: [{
          MsgType: 'TIMTextElem',
          MsgContent: {
            Text: MsgContent,
          },
        }],
      })
    },
    // 在群组中发送普通消息 @see https://cloud.tencent.com/document/product/269/1629
    send_group_msg: async function(From_Account, GroupId, MsgContent) {
      return apiRequest(generateUrl('v4/group_open_http_svc/send_group_msg'), {
        From_Account: From_Account,
        GroupId: GroupId,
        MsgRandom: parseInt(Math.random() * 1000000),
        MsgBody: [{
          MsgType: 'TIMTextElem',
          MsgContent: {
            Text: MsgContent,
          },
        }],
      })
    },
    // 在群组中发送系统通知 @see https://cloud.tencent.com/document/product/269/1630
    send_group_system_notification: async function(GroupId, ToMembers_Accounts, MsgContent) {
      return apiRequest(generateUrl('v4/group_open_http_svc/send_group_system_notification'), {
        GroupId: GroupId,
        ToMembers_Account: ToMembers_Accounts,
        Content: MsgContent,
      })
    },
    // Enums and Consts.
    TYPES: {
      // GroupType @see https://cloud.tencent.com/document/product/269/1502#GroupType
      GRP_WORK: 'Private',
      GRP_PUBLIC: 'Public',
      GRP_MEETING: 'ChatRoom',
      GRP_AVCHATROOM: 'AVChatRoom',
    },
  }
}

module.exports = {
  create,
}
