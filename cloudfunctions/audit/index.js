// 云函数入口文件
const cloud = require('wx-server-sdk')
 
cloud.init()
 
// 云函数入口函数
 
const db = cloud.database()
const _ = db.command;
// 云函数入口函数

function save_err(openid, err) {
   cloud.callFunction({
     name: 'log_collect',
     data: {
       openid: openid,
       message: err
     },
     success: res => {
       console.log(res);
     },
     fail: res => {
       console.log(res);
     },
     complete: () => {
       console.log("save_err ok")
     }
   });
}
 
// event 为调用此云函数传递的参数，传递的参数可通过event.xxx得到
 
exports.main = async (event, context) => {
  try {
    console.log("prepare: ", event.status, event.reason || '', event.tags, event.cardId);
    
    db.collection('attractions').doc(event.cardId).update({
      data: {
        status: event.status,
        reason: (event.reason || ""),
        tags: (event.tags || [])
      },
      success: function(res){
        console.log("已更新条目属性 ");
        db.collection('user_formid').where(
          { _openid: event.openid }
        ).get().then(res => {
          console.log('已获取fomid: ',event.openid,res.data);

          if (res.data.length > 0) {
            var formids = res.data[0].formids;
            if (formids.length > 0) {
              var formid = formids[formids.length - 1]
              console.log("formid: ", formid);
              try {
                var args = {
                  openid: event.openid,
                  formid: formid,
                  title: event.title,
                  message: event.message,
                  cardid: event.cardId
                };
                console.log("发送message：", args);
                cloud.callFunction({
                  name: 'message',
                  data: args,
                  success: res => {
                    console.log(res);
                  },
                  fail: res => {
                    console.log(res);
                    save_err(event.openid, res);
                  },
                  complete: () => {
                    console.log("message:")
                    console.log(res);
                  }
                });
              } catch (e) {
                console.error(e)
                save_err(event.openid, e);
              }

              //删除数组尾部元素
              db.collection('user_formid').doc(res.data[0]._id).update({
                data: {
                  formids: _.pop()
                },
                success: res => {
                  console.log("已移除formid：");
                },
                fail: res => {
                  console.log('pop: ');
                  console.log(res);
                  save_err(event.openid, res);
                }
              })
            }
          } else {
            console.log("formid为空");
          }
        })
        .catch(err => {
          console.error(err)
          save_err(event.openid, err);
        });
      },
      fail: function(res){
        console.log("update fail: ", res);
        save_err(event.openid, res);
      },
      complete: function(res) {
        console.log("complete.", res);
      }
    })
  } catch (e) {
    console.log("catch: ", e)
  }
  console.log("end.");
}

//小程序模版消息推送
function sendTemplateMessage(event) {
  const {
    OPENID
  } = cloud.getWXContext()

  // 接下来将新增模板、发送模板消息、然后删除模板
  const templateId = 'pl9exbF9lRCnqDYTikZSqYat06rYmxll8BiUYq0ExQY'
  var page = "pages/homepage/homepage";
  if (event.cardid > 0) {
    page = "pages/details/details?id=" + event.cardid
  }

  cloud.openapi.templateMessage.send({
    touser: event.openid,
    templateId,
    formId: event.formid, //event.formId,
    page: page,
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
}

