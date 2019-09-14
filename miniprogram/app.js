//app.js
App({
  onLaunch: function () {
    
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        traceUser: true,
      })
    }

    this.globalData = {}
    //this.getOpenid()
  }/*,
  getOpenid() {
    let that = this;
    wx.cloud.callFunction({
      name: 'getOpenid',
      complete: res => {
        console.log(res)
        console.log('云函数获取到的openid: ', res.result.openId)
        this.globalData['openid'] = res.result.openId;
      }
    })
  }*/
})
