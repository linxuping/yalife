// 云函数入口文件
const cloud = require('wx-server-sdk')
 
cloud.init()
 
// 云函数入口函数
const db = cloud.database()
 
exports.main = async (event, context) => {
  try {
    console.log("add cloud log: ");
    console.log(event.openid);
    const _ = db.command
    db.collection('error_collect').add({
      data: {
        openid: event.openid,
        message: event.message,
        create_time: formatDate(new Date().getTime())
      }
    }).then(res => {
      console.log(res)
    })
    .catch(console.error)
        
  } catch (e) {
    console.error(e)
  }
}
