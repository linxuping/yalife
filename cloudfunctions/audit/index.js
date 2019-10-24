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
        status: event.status
      },
      success: res => {
        //推送
        db.collection('user_formid').where(
          { _openid: event.openid }
        ).get({
          success: res => {
            console.log('sendMessage2: ');
            console.log(res.data);

            if (res.data.length > 0) {
              var formids = res.data[0].formids;
              if (formids.length > 0) {
                var formid = formids[ formids.length-1 ]
                wx.cloud.callFunction({
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
                db.collection('user_formid').doc(event.cardId).update({
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
          }
        });

      },
      fail: res => {
        console.log('pop: ');
        console.log(res);
      }
    })  
  } catch (e) {
    console.error(e)
  }
}
