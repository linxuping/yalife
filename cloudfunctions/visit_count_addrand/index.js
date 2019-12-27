// 云函数入口文件
const cloud = require('wx-server-sdk')
 
cloud.init()
 
// 云函数入口函数
const db = cloud.database()
 
exports.main = async (event, context) => {
  try {
    console.log("update visit count: ");
    const _ = db.command
    var data = {
      visit_count_all: _.inc(event.count)
    };
    return await db.collection('attractions').doc(event.cardid).update({
          data: data
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
