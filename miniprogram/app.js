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
    this.getOpenid()
  },//获取用户地理位置权限
  chooseLocation: function (cb) {
    wx.chooseLocation({
      success: function (res) {
        /*obj.setData({
          addr: res.address      //调用成功直接设置地址
        })*/
        cb(res);
      },
      fail: function () {
        wx.getSetting({
          success: function (res) {
            var statu = res.authSetting;
            if (!statu['scope.userLocation']) {
              wx.showModal({
                title: '是否授权当前位置',
                content: '需要获取您的地理位置，请确认授权，否则地图功能将无法使用',
                success: function (tip) {
                  if (tip.confirm) {
                    wx.openSetting({
                      success: function (data) {
                        if (data.authSetting["scope.userLocation"] === true) {
                          wx.showToast({
                            title: '授权成功',
                            icon: 'success',
                            duration: 1000
                          })
                          //授权成功之后，再调用chooseLocation选择地方
                          wx.chooseLocation({
                            success: function (res) {
                              cb(res);
                            },
                          })
                        } else {
                          wx.showToast({
                            title: '授权失败',
                            icon: 'success',
                            duration: 1000
                          })
                        }
                      }
                    })
                  }
                }
              })
            }
          },
          fail: function (res) {
            wx.showToast({
              title: '调用授权窗口失败',
              icon: 'success',
              duration: 1000
            })
          }
        })
      }
    })
  },
  getLocation: function (cb) {
    wx.getLocation({
      type: 'gcj02',
      success: function (res) {
        cb(res);
      },
      fail: function () {
        wx.getSetting({
          success: function (res) {
            var statu = res.authSetting;
            if (!statu['scope.userLocation']) {
              wx.showModal({
                title: '是否授权当前位置',
                content: '需要获取您的地理位置，请确认授权，否则地图功能将无法使用',
                success: function (tip) {
                  if (tip.confirm) {
                    wx.openSetting({
                      success: function (data) {
                        if (data.authSetting["scope.userLocation"] === true) {
                          wx.showToast({
                            title: '授权成功',
                            icon: 'success',
                            duration: 1000
                          })
                          //授权成功之后，再调用chooseLocation选择地方
                          wx.getLocation({
                            success: function (res) {
                              cb(res);
                            },
                          })
                        } else {
                          wx.showToast({
                            title: '授权失败',
                            icon: 'success',
                            duration: 1000
                          })
                        }
                      }
                    })
                  }
                }
              })
            }
          },
          fail: function (res) {
            wx.showToast({
              title: '调用授权窗口失败',
              icon: 'success',
              duration: 1000
            })
          }
        })
      }
    })
  },
  saveLocation() {
    var page = this;
    var db = wx.cloud.database();
    db.collection('user_location').where(
        { uid: page.globalData.openid }
      ).get({
        success: res => {
          console.log('save_location addf');
          console.log(res.data);
          if (res.data.length == 0){
            db.collection('user_location').add({
              // data 字段表示需新增的 JSON 数据
              data: {
                uid: page.globalData.openid,
                latitude: page.globalData.latitude,
                longitude: page.globalData.longitude,
                address: page.globalData.address
              },
              success: function (res) {
              },
              fail: function (res) {
                console.log(res);
              }
            })
          } else {
            console.log('save_location update');
            var _id = res.data[0]._id;
            db.collection('user_location').doc(_id).update({
              data: {
                latitude: page.globalData.latitude,
                longitude: page.globalData.longitude,
                address: page.globalData.address
              },
              success: console.log,
              fail: console.error
            })
          }
        }
      });
  },
  getOpenid() {
    let page = this;
    wx.cloud.callFunction({
      name: 'getOpenid',
      complete: res => {
        console.log(res)
        console.log('云函数获取到的openid: ', res.result.openId)
        page.globalData['openid'] = res.result.openId;
      }
    })
  }
})
