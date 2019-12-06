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


class SubMsg {
  static add(cardId) {
    var d = new Date().getTime();
    db.collection('submessage').add({
      data: {
        card_id: cardId,
        status: 1,
        create_time: d,
        create_time_str: formatDate(d)
      }
    }).then(res => {
      console.log(res)
    }).catch(console.error) 
  };
  
  static fetch(cardId, cb) {
    db.collection('submessage').orderBy('create_time', 'asc').where({
      card_id: cardId,
      status: 1
    }).get({
      success: res => {
        console.log("fetch submessage result: ");
        console.log(res.data);
        var openids = [];
        for (var i=0; i<res.data.length; i++) {
          openids.push( res.data[i]._openid );
        }
        cb(openids)
      },
      fail: err => {
        console.log(err);
      }
    })
  };
}
module.exports = SubMsg;
