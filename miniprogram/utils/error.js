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


class ErrorCollect {
  static add(err) {
    console.log("error add: ", err);
    wx.getSystemInfo({
      success(res) {
        console.log("get system: ", res)
        ErrorCollect.add2(err, res);
      }
    });
    ErrorCollect.add2(err, null);
  };
  static add2(err, res) {
    console.log("error add: ",err);
    db.collection('error_collect').add({
      data: {
        message: err,
        create_time: formatDate(new Date().getTime()),
        time: new Date(),
        system: res
      }
    }).then(res => {
      console.log(res)
    }).catch(console.error) 

    /*if (typeof err.indexOf != "function") { 
    }*/
    if (err.indexOf("geoNear is not a function") >= 0) {
      
    }
    else if (err.indexOf("is not a function") != -1) {
      wx.showModal({
        title: '温馨提示',
        content: '微信版本低，会影响该小程序正常运行哦～',
        success(res) {
          if (res.confirm) {
            console.log('用户点击确定')
          } else if (res.cancel) {
            console.log('用户点击取消')
          }
        }
      })
    }
  };
}
module.exports = ErrorCollect;
