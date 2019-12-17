// 云函数入口文件
const cloud = require('wx-server-sdk')
 
cloud.init()
 
// 云函数入口函数
const db = cloud.database()
var uids = ["oV5MQ5YBim_nRH66WxfWLGVcW7yc", "of1Gv4kVHElVpbeBRNZzQ-VzFVMI","of1Gv4iy9Gh2wQnpp9o3vq45SVWk"];
 
exports.main = async (event, context) => {
  try {
    console.log("update visit count: ");
    const _ = db.command
    var data = {
      visit_count_all: _.inc(1)
    };
    if (uids.indexOf(event.openid) == -1) {
      data.visit_count = _.inc(1) //真实
    }
    return await db.collection('attractions').doc(event.cardId).update({
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
