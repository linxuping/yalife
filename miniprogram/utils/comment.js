
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

  /**
   * 发起网络请求
   * @param {string} url  
   * @param {object} params 
   * @return {Promise} 
   */
  static request(url, params, method = "GET", type = "json") {
    console.log("向后端传递的参数", params);
    return new Promise((resolve, reject) => {
      let opts = {
        url: url,
        data: Object.assign({}, params),
        method: method,
        header: { 'Content-Type': type },
        success: resolve,
        fail: reject
      }
      console.log("请求的URL", opts.url);
      wx.request(opts);
    });
  };
}
module.exports = Comment;
