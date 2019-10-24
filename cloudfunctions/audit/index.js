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
        }
      }).then(res => {
        console.log("sendMessage2: ");
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
        });
      })
      .catch(res => {
        console.log('catch: ');
        console.log(res);
      }); 
  } catch (e) {
    console.error(e)
  }
}
