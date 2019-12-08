// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()
// 云函数入口函数
exports.main = async (event, context) => {
  console.log(event)
  return sendTemplateMessage(event)
}

//小程序模版消息推送
async function sendTemplateMessage(event) {
  const {
    OPENID
  } = cloud.getWXContext()

  // 接下来将新增模板、发送模板消息、然后删除模板
  const templateId = 'j-4XK2DeMlOsMyNsyn06oXor6L_tL9aQhfMrNk6Gpzg'

  const sendResult = await cloud.openapi.subscribeMessage.send({
    touser: event.openid,
    templateId: templateId,
    page: event.path,
    data: {
      thing2: {
        value: event.message,
      },
      thing1: {
        value: "邻里",
      },
    }
  })

  console.log("cloud message.");
  return sendResult
}
