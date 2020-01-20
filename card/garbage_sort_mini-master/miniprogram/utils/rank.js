var db = wx.cloud.database();
const app = getApp()

function formatDate(time) {
  var date = new Date(time);
  var year = date.getFullYear(),
    month = date.getMonth() + 1,//月份是从0开始的
    day = date.getDate(),
    hour = date.getHours(), min = date.getMinutes(),
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
  static update(cb) {
    var d = new Date().getTime();
    var now = new Date();
    var day = now.getMonth().toString()+now.getDate().toString();
    const _ = db.command;
    db.collection('rank').where({
      _openid: app.globalData.openid
    }).get({
      success: res => {
        var count = 0
        if (res.data.length == 0) {
          app.globalData.create_time = d;
          app.globalData.create_time_str = formatDate(d);
          app.globalData.punch_days = [day];
          app.globalData.punch_count = 1;
          count = 1
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
          count = res.data[0].punch_days.length;
          if (res.data[0].punch_days.indexOf(day) == -1) { 
            count += 1;
          }
          db.collection('rank').doc(res.data[0]._id).update({
            data: {
              punch_days: _.addToSet(day),
              punch_count: count,
            },
            success: function(res) {
              console.log("rank update ok:", res)
            },
            fail: function(res) {
              console.log("rank update fail:", res)
            },
          });   
        }
        cb(count);
      },
      fail: err => {
        cb(1);
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
        if (res.data.length > 0) {
          cb(res.data[0].punch_count);
        } else {
          cb(0);
        }
      },
      fail: err => {
        console.log(err);
        err_cb();
      }
    })
  };

  static getm(cb, err_cb) {
    db.collection('rank').orderBy('punch_count','desc').limit(20).get({
      success: res => {
        console.log("get ranks: ", res.data);
      },
      fail: err => {
        console.log(err);
        err_cb();
      }
    })
  };


  static getimgs(cb, err_cb) {
    var imgs = [
      "http://img.yojiang.cn/upload/user/portrait/166691/20181114_211120?imageView2/2/w/80",
      "http://img.yojiang.cn/upload/user/portrait/37151/20181111_221250?imageView2/2/w/80",
      "http://img.yojiang.cn/upload/user/portrait/2268418/20180807_235945?imageView2/2/w/80",
      "http://img.yojiang.cn/upload/user/portrait/1041169/20181130_231918?imageView2/2/w/80",
      "http://img.yojiang.cn/upload/user/portrait/1236796/20180806_191512?imageView2/2/w/80",
      "http://img.yojiang.cn/upload/user/portrait/4808362/20190523_064759?imageView2/2/w/80",
    ];
    cb(imgs);
  };

}
module.exports = Rank;
