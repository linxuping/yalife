// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()
// 云函数入口函数
exports.main = async (event, context) => {
  console.log(event)
  return sendKfMessage(event)
}

//小程序模版消息推送
async function sendKfMessage(event) {
  try {
    var page = "pages/homepage/homepage";
    if (event.cardid.length > 0) {
      page = "pages/details/details?id=" + event.cardid
    }

    const result = await cloud.openapi.customerServiceMessage.send({
      touser: event.openid,
      msgtype: 'text',
      text: {
        content: 'Hello World'
      }
    })
    /*const result = await cloud.openapi.customerServiceMessage.send({
      touser: event.openid,
      msgtype: 'miniprogrampage',
      miniprogrampage: {
        title: event.title,
        pagepath: page,
        thumbMediaId: 'thumb_media_id'
      }
    })*/
    console.log(result)
    return result
  } catch (err) {
    console.log(err)
    return err
  }
}
