var db = wx.cloud.database();
const app = getApp()

function formatDate(time) {
  var date = new Date(time);
  var year = date.getFullYear(),
    month = date.getMonth() + 1,//月份是从0开始的
    day = date.getDate(),
    hour = date.getHours(),
    min = date.getMinutes(),
    sec = date.getSeconds();
  var newTime = year + '-' +
    (month < 10 ? '0' + month : month) + '-' +
    (day < 10 ? '0' + day : day) + ' ' +
    (hour < 10 ? '0' + hour : hour) + ':' +
    (min < 10 ? '0' + min : min) + ':' +
    (sec < 10 ? '0' + sec : sec);
  return newTime;
}


class Comment {
  static add(cardId, content) {
    db.collection('comment').add({
      data: {
        card_id: cardId,
        content: content,
        status: 2,
        reason: "",
        create_time: formatDate(new Date().getTime())
      }
    }).then(res => {
      console.log(res)
    }).catch(console.error) 
  };
  
  static remove(cardId) {
    db.collection('comment').doc(cardId).update({
      data: {
        status: 0
      }
    }) 
  };

  static fetch(cardId, cb) {
    db.collection('comment').orderBy('create_time', 'desc').where({
      card_id: cardId,
      status: _.gte(0)
    }).get({
      success: res => {
        console.log("fetch comment result: ");
        console.log(res.data);
        for (var i=0; i<res.data.length; i++) {
          res.data[i].mine = (res.data[i]._openid == app.globalData.openid);
        }
        cb(res.data)
      },
      fail: err => {
        console.log(err);
      }
    })
  };
}
module.exports = Comment;
