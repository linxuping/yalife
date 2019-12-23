// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()
// 云函数入口函数
exports.main = async (event, context) => {
  console.log(event)
  return sendTemplateMessage(event)
}

function formatTime(date) {
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()

  var hour = date.getHours()
  var minute = date.getMinutes()
  var second = date.getSeconds()

  return year+"-"+month+"-"+day+" "+hour+":"+minute+":"+second
}

function getNowStr() {
  var d = new Date(Date.now()+8*3600000);
  return formatTime(d);
}

//小程序模版消息推送
async function sendTemplateMessage(event) {
  const {
    OPENID
  } = cloud.getWXContext()

  // 接下来将新增模板、发送模板消息、然后删除模板
  const templateId = 'zLyGroNFbS8B-B-H7p5FL3HjHuizgsobVlwr26JiI0w'

  const sendResult = await cloud.openapi.subscribeMessage.send({
    touser: event.openid,
    templateId: templateId,
    page: event.path,
    data: {
      time2: {
        value: getNowStr(),
      },
      thing1: {
        value: event.message.substr(0,15)+" ...",
      },
    }
  })

  console.log("cloud message.");
  return sendResult
}
