// 云函数入口文件
const cloud = require('wx-server-sdk')
 
cloud.init()
 
// 云函数入口函数
 
const db = cloud.database()
// 云函数入口函数
 
// event 为调用此云函数传递的参数，传递的参数可通过event.xxx得到
 
exports.main = async (event, context) => {
  try {
    /*
    // 调用 update 方法
    // users 是我要修改的集合的名字
    // event.dataId 和 event.lover 是我调用此云函数带的参数
    return await db.collection('users').doc(event.dataId).update({
      // data 为 users 集合内我要修改的内容 lover 为字段名 event.lover 为要修改成的内容
      data: {
        lover: event.lover
      }
    })*/
  
    console.log("sendMessage1: ");
    console.log(event.openid);
    const _ = db.command

    db.collection('user_formid').where(
      { _openid: event.openid }
    ).get().then(res => {
        console.log('sendMessage2: ');
        console.log(res.data);

        if (res.data.length > 0) {
          var formids = res.data[0].formids;
          if (formids.length > 0) {
            var formid = formids[ formids.length-1 ]
            console.log("formid: ");
            console.log(formid);
            cloud.callFunction({
              name: 'message',
              data: {
                openid: event.openid,
                formid: formid,
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
    
  } catch (e) {
    console.error(e)
  }
}
