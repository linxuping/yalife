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


class Rank {
  static update() {
    var d = new Date().getTime();
    var now = new Date();
    var day = now.getMonth().toString()+now.getDay().toString();
    const _ = db.command;
    db.collection('rank').where({
      _openid: app.globalData.openid
    }).get({
      success: res => {
        if (res.data.length == 0) {
          app.globalData.create_time = d;
          app.globalData.create_time_str = formatDate(d);
          app.globalData.punch_days = [day];
          console.log("add rank: ", app.globalData);
          db.collection('rank').add({
            data: app.globalData
          }).then(res => {
            console.log(res)
          }).catch(console.error)         
        } else {
          app.globalData.update_time = formatDate(d);
          app.globalData.update_time_str = formatDate(d);
          console.log("update rank: ", app.globalData);
          delete app.globalData._id
          delete app.globalData._openid
          db.collection('rank').doc(res.data[0]._id).update({
            data: {
              punch_days: _.addToSet(day)
            },
            success: function(res) {
              console.log("rank update ok:", res)
            },
            fail: function(res) {
              console.log("rank update fail:", res)
            },
          });   
        }
      },
      fail: err => {
        console.log(err);
      }
    })
  };

  static get(openid, cb, err_cb) {
    if (!openid) {
      console.log("invalid openid: ", openid);
      err_cb();
      return;
    }
    db.collection('rank').where({
      _openid: openid
    }).get({
      success: res => {
        console.log("get rank: ", openid, res.data);
        cb(res.data.length);
      },
      fail: err => {
        console.log(err);
        err_cb();
      }
    })
  };
}
module.exports = Rank;
