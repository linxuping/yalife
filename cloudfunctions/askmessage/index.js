// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()
// 云函数入口函数
exports.main = async (event, context) => {
  console.log(event)
  return sendTemplateMessage(event)
}

function getDayStr() {
  var d=new Date();
  var year=d.getFullYear();
  var month=change(d.getMonth()+1);
  var day=change(d.getDate());
  var hour=change(d.getHours());
  var minute=change(d.getMinutes());
  var second=change(d.getSeconds());
  function change(t){
    if(t<10){
     return "0"+t;
    }else{
     return t;
    }
  }
  var time=year+'-'+month+'-'+day+' '+hour+':'+minute+':'+second;
  return time;
}

//小程序模版消息推送
async function sendTemplateMessage(event) {
  const {
    OPENID
  } = cloud.getWXContext()

  // 接下来将新增模板、发送模板消息、然后删除模板
  const templateId = '1zj4KB4BB1Zx-lnx6FH0VYAK7hZ_U8BjV8soPo9Fotg'

  const sendResult = await cloud.openapi.uniformMessage.send({
    touser: event.openid,
    weappTemplateMsg: {
      templateId: templateId,
      formId: event.formid, //event.formId,
      page: event.path,
      emphasisKeyword: "",
      data: {
        keyword1: {
          value: getDayStr(),
        },
        keyword2: {
          value: event.content,
        },
      },
    },
  })

  console.log("cloud message.");
  return sendResult
}
