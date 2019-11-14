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


class User {
  static add(openid, res) {
    if (!res || !res.userInfo) {
      console.log("add user. invalid res", openid, res);
      return
    }
    var d = new Date().getTime();
    db.collection('user').where({
      _openid: openid
    }).get({
      success: res => {
        console.log("get user: ");
        console.log(res.data);
        if (res.data.length == 0) {
          db.collection('user').add({
            data: res
          }).then(res => {
            console.log(res)
          }).catch(console.error)         
        }
      },
      fail: err => {
        console.log(err);
      }
    })
  };

  static get(openid, cb) {
    db.collection('user').where({
      _openid: openid
    }).get({
      success: res => {
        console.log("get user: ");
        console.log(res.data);
        if (res.data.length > 0) {
          cb(res.data[0]);
        } else {
          console.log("get user. invalid res", openid, res);
        }
      },
      fail: err => {
        console.log(err);
      }
    })
  };
}
module.exports = User;
