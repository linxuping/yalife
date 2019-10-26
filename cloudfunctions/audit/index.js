// 云函数入口文件
const cloud = require('wx-server-sdk')
 
cloud.init()
 
// 云函数入口函数
 
const db = cloud.database()
// 云函数入口函数
 
// event 为调用此云函数传递的参数，传递的参数可通过event.xxx得到
 
exports.main = async (event, context) => {
  try {
    console.log("sendMessage1: ");
    const _ = db.command
    
    db.collection('attractions').doc(event.cardId).update({
        data: {
          status: event.status,
          reason: event.reason,
          tags: event.tags
        }
      }).then(res => {
        console.log("sendMessage2: ");

        db.collection('user_formid').where(
          { _openid: event.openid }
        ).get().then(res => {
          console.log('sendMessage3: ');
          console.log(res.data);

          if (res.data.length > 0) {
            var formids = res.data[0].formids;
            if (formids.length > 0) {
              var formid = formids[formids.length - 1]
              console.log("formid: ");
              console.log(formid);

              try {
                //event.formid = formid;
                //sendTemplateMessage(event);
/*demo
{
  "cardid": "753391b25db3a5060060ce993897b66e",
  "message": "审核通过",
  "openid": "oV5MQ5aN_i_ea9dGxZOHHBC8Bosg",
  "formid": "5a7d5dbc71bc469e8b2c13c3ea8ae014",
  "title": "天韵"
} */
                var args = {
                  openid: event.openid,
                  formid: formid,
                  title: event.title,
                  message: event.message,
                  cardid: event.cardId
                };
                console.log(args);
                cloud.callFunction({
                  name: 'message',
                  data: args,
                  success: res => {
                    console.log(res);
                  },
                  fail: res => {
                    console.log(res);
                  },
                  complete: () => {
                    console.log("message:")
                    console.log(res);
                  }
                });
              } catch (e) {
                console.error(e)
              }

              //删除数组尾部元素
              db.collection('user_formid').doc(res.data[0]._id).update({
                data: {
                  formids: _.pop()
                },
                fail: res => {
                  console.log('pop: ');
                  console.log(res);
                }
              })
            }
          }
        })
        .catch(err => {
          console.error(err)
        });

        /*
        //推送
        cloud.callFunction({
          name: 'sendmsg',
          data: {
            openid: event.openid,
            title: event.title,
            message: event.message,
            cardid: event.cardId
          },
          fail: function (res) {
            console.log(res);
          },
          complete: res => {
            console.log("message:")
            console.log(res);
          }
        });*/
      })
      .catch(res => {
        console.log('catch: ');
        console.log(res);
      }); 
  } catch (e) {
    console.error(e)
  }
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

