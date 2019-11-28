// 云函数入口文件
const cloud = require('wx-server-sdk')
 
cloud.init()
 
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

function formatTime(date) {
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()

  var hour = date.getHours()
  var minute = date.getMinutes()
  var second = date.getSeconds()

  return year+"-"+month+"-"+day+" "+hour+":"+minute+":"+second
}
 
// event 为调用此云函数传递的参数，传递的参数可通过event.xxx得到
 
exports.main = async (event, context) => {
  try {
    console.log("prepare: ", event);
    const db = cloud.database()
    const _ = db.command;
    var d = new Date(Date.now()+8*3600000);
    return await  db.collection('attractions').doc(event.cardid).update({
      data: {
        update_time: formatTime(d),
        sort_time:   d,
      }}).then(res => {
        console.log("已更新条目属性 ", res);
      }).catch(res => {
        console.log("update fail: ", res);
        save_err(event.openid, res);
      });
  } catch (e) {
    console.log("catch: ", e)
  }
}


