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
 
// event 为调用此云函数传递的参数，传递的参数可通过event.xxx得到
 
exports.main = async (event, context) => {
  try {
    console.log("prepare: ", event.status, event.reason || '', event.tags || [], event.cardId);
    const db = cloud.database()
    const _ = db.command;

    //删除数组尾部元素
    return await db.collection('user_formid').doc(event.id).update({
      data: {
        formids: _.pop()
      }}).then(res => {
        console.log("已移除formid：");
      }).catch(res => {
        console.log('pop: ');
        console.log(res);
        save_err(event.openid, res);
      });

  } catch (e) {
    console.log("catch: ", e)
  }
}


