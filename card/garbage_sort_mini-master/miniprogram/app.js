//app.js
App({
    onLaunch: function() {

        if (!wx.cloud) {
            console.error('请使用 2.2.3 或以上的基础库以使用云能力')
        } else {
            wx.cloud.init({
              env: 'yalife-3e57c3',
              traceUser: true,
            })
        }
        const updateManager = wx.getUpdateManager()
        updateManager.onCheckForUpdate(function(res) {
            console.log(res.hasUpdate)
            if (res.hasUpdate) {
                updateManager.onUpdateReady(function() {
                    wx.showModal({
                        title: '更新提示',
                        content: '新版本已经准备好，是否重启应用？',
                        success: function(res) {
                            if (res.confirm) {
                                updateManager.applyUpdate()
                            }
                        }
                    })
                })
            }
        })
        updateManager.onUpdateFailed(function() {
            // 新版本下载失败
        })

    },
    globalData: {},
    getOpenid(cb) {
      var page = this;
      wx.cloud.callFunction({
        name: 'login',
        success: res => {
          console.log("login success: ", res)
          console.log('云函数获取到的openid: ', res.result.openid)
          page.globalData.openid = res.result.openid;
          if (!!cb) {
            cb();
          }
        },
        fail: res => {
          console.log("login fail: ", res)
        },
        complete: res => {
          console.log("login complete: ", res)
        }
      })
    },
})