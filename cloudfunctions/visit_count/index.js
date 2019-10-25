// 云函数入口文件
const cloud = require('wx-server-sdk')
 
cloud.init()
 
// 云函数入口函数
const db = cloud.database()
 
exports.main = async (event, context) => {
  try {
    console.log("sendMessage1: ");
    console.log(event.openid);
    const _ = db.command
    for (var i=0; i<event.cardIds.length; i++) {
      db.collection('attractions').doc(event.cardIds[i]).update({
        data: {
          visit_count: _.inc(parseInt(Math.random()*10)%2+1)
        },
        success: console.log,
        fail: console.error
      })
    }
  } catch (e) {
    console.error(e)
  }
}
