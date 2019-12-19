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
  static update() {
    var d = new Date().getTime();
    db.collection('user').where({
      _openid: app.globalData.openid
    }).get({
      success: res => {
        if (res.data.length == 0) {
          app.globalData.create_time = d;
          app.globalData.create_time_str = formatDate(d);
          console.log("add user: ", app.globalData);
          db.collection('user').add({
            data: app.globalData
          }).then(res => {
            console.log(res)
          }).catch(console.error)         
        } else {
          app.globalData.update_time = formatDate(d);
          app.globalData.update_time_str = formatDate(d);
          console.log("update user: ", app.globalData);
          delete app.globalData._id
          delete app.globalData._openid
          db.collection('user').doc(res.data[0]._id).update({
            data: app.globalData,
            success: function(res) {
              console.log("user update ok:", res)
            },
            fail: function(res) {
              console.log("user update fail:", res)
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
    db.collection('user').where({
      _openid: openid
    }).get({
      success: res => {
        console.log("get user: ", openid, res.data);
        if (res.data.length > 0) {
          if (res.data[0].address == "undefined") {
            res.data[0].address = "附近";
          }
          cb(res.data[0]);
        } else {
          console.log("get user. invalid res", openid, res);
          err_cb();
        }
      },
      fail: err => {
        console.log(err);
        err_cb();
      }
    })
  };

  static getm(openids, cb, err_cb) {
    if (!openids || openids.length == 0) {
      console.log("invalid openids: ", openids);
      err_cb();
      return;
    }
    const _ = db.command;
    db.collection('user').where({
      _openid: _.in(openids)
    }).get({
      success: res => {
        console.log("get users: ", openids, res.data);
        if (res.data.length > 0) {
          for (var i=0; i<res.data.length; i++) {
            if (res.data[i].address == "undefined") {
              res.data[i].address = "附近";
            }
          }
          cb(res.data);
        } else {
          console.log("get user. invalid res", openids, res);
          err_cb();
        }
      },
      fail: err => {
        console.log(err);
        err_cb();
      }
    })
  };
}
module.exports = User;
