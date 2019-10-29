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
  const templateId = '5ItETFooNK2GRC4npi3dSqlTRfsx20dj7xFeeVmwPnI'
  //'pl9exbF9lRCnqDYTikZSqYat06rYmxll8BiUYq0ExQY'
  var page = "pages/homepage/homepage";
  if (event.cardid.length > 0) {
    page = "pages/details/details?id=" + event.cardid
  }

  const sendResult = await cloud.openapi.templateMessage.send({
    touser: event.openid,
    templateId: templateId,
    formId: event.formid, //event.formId,
    page: page,
    emphasisKeyword: "",
    data: {
      keyword1: {
        value: event.title,
      },
      keyword2: {
        value: event.message,
      },
    }
  })

  console.log("cloud message.");
  return sendResult
}
/*
demo:
{
  "openid": "oV5MQ5YBim_nRH66WxfWLGVcW7yc",
  "formid": "8cc668a036094bfe917600556088cd8c",
  "title": "123",
  "message": "msg"
}
*/
