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
  static add(openid, card_id, tag, source) {
    //to cloud
    if (source == "admin") {
      if (app.globalData.openid != "of1Gv4kVHElVpbeBRNZzQ-VzFVMI") {
        wx.showToast({
          title: "can't add",
        })
        return
      }
    }

    var d = new Date().getTime();
    const _ = db.command;
    var data = {
      notify_openid: openid,
      notify_tag: tag,
      card_id: card_id,
      create_time: d,
      create_time_str: formatDate(d),
      address: app.globalData.address,
      location: db.Geo.Point(app.globalData.longitude, app.globalData.latitude),
      status: 1 //0:used 2:success
    };
    db.collection('submessage').add({
      data: data
    }).then(res => {
      wx.showToast({
        title: '订阅成功:' + tag,
      })
    }).catch(console.error) 
  };
  
  static fetch(tag, cb) {
    db.collection('submessage').orderBy('create_time', 'asc').where({
      notify_tag: tag
    }).get({
      success: res => {
        console.log("fetch submessage result: ");
        console.log(res.data);
        var openids = [];
        for (var i=0; i<res.data.length; i++) {
          openids.push( res.data[i].notify_openid );
        }
        cb(openids)
      },
      fail: err => {
        console.log(err);
      }
    })
  };

  static fetchNoSend(longitude, latitude, cb) {
    const dc = db.command;
    db.collection('submessage').where({
      status: 1,
      _openid: dc.nin(app.getAdmins()),
      location: dc.geoNear({
        geometry: db.Geo.Point(longitude, latitude),
        minDistance: 0,
        maxDistance: app.globalData.distanceDefault,
      }),
    }).orderBy("create_time", "desc").get({
      success: res => {
        console.log("fetch submessage result: ", res.data);
        var openids = [];
        var tmpdic = {};
        for (var i=0; i<res.data.length; i++) {
          if (app.getAdmins().indexOf(res.data[i].notify_openid) >= 0) {
            continue
          }
          tmpdic[ res.data[i].notify_tag ] = (tmpdic[ res.data[i].notify_tag ] || 0) + 1;
        }
        cb(tmpdic)
      },
      fail: err => {
        console.log(err);
      }
    })
  };

  static getTags(cb) {
    var offset = 0;
    var limit = 20;
    var tags = [];
    SubMsg.getTags2(offset,limit,tags,cb);
  };

  static getTags2(offset,limit,tags,cb) {
    db.collection('submessage').skip(offset).limit(limit).where({
      status: 1,
      notify_openid: app.globalData.openid,
    }).get({
      success: res => {
        console.log("fetch submessage result: ", res.data);
        for (var i=0; i<res.data.length; i++) {
          if (tags.indexOf(res.data[i].notify_tag) >= 0) 
            continue
          tags.push(res.data[i].notify_tag);
        }
        console.log("SubMsg.getTags2: ",offset,limit,res.data.length);
        if (res.data.length == limit) {
          offset = offset+limit;
          SubMsg.getTags2(offset,limit,tags,cb);
        } else {
          cb(tags);
        }
      },
      fail: err => {
        console.log(err);
        cb([]);
      }
    })
  };
}
module.exports = SubMsg;
