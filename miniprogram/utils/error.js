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
    db.collection('error_collect').add({
      data: {
        message: err,
        create_time: formatDate(new Date().getTime()),
        time: new Date()
      }
    }).then(res => {
      console.log(res)
    }).catch(console.error) 
  };
}
module.exports = ErrorCollect;
