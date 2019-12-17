// 云函数入口文件
const cloud = require('wx-server-sdk')
 
cloud.init()
 
// 云函数入口函数
const db = cloud.database()
 
exports.main = async (event, context) => {
  try {
    console.log("update help uids: ");
    const _ = db.command

    return await db.collection('attractions').doc(event.cardId).update({
        data: {
          //help_uids: _.addToSet(event.openid),
          help_uids: _.push([event.openid]),
          help_uids_len: _.inc(1)
        }
      }).then(res => {
        console.log("已更新条目属性 ", res);
      }).catch(res => {
        console.log("update fail: ", res);
        save_err(event.openid, res);
      });
  } catch (e) {
    console.error(e)
  }
}
