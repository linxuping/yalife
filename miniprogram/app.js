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

    this.globalData = {
      distance: 15000 //default 15km
    }
    this.getOpenid()
  },//获取用户地理位置权限
  chooseLocation: function (cb) {
    var page = this;
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
                content: '需要获取您的地理位置，才能查看邻里的发布信息哦～',
                success: function (tip) {
                  if (tip.confirm) {
                    page.getOpenid();
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
      name: 'login',
      complete: res => {
        //console.log("call getopenid: ")
        //console.log(res)
        console.log('云函数获取到的openid: ', res.result.openId)
        page.globalData['openid'] = res.result.openId;
      }
    })
  },
  isAdmin() {
    //return false;
    console.log("isAdmin: " + this.globalData.openid);
    return this.globalData.openid == "oV5MQ5YBim_nRH66WxfWLGVcW7yc";
  },
  saveFormid: function(formid) {
    var page = this;
    var db = wx.cloud.database();
    const _ = db.command
    db.collection('user_formid').where(
      { _openid: page.globalData.openid }
    ).get({
      success: res => {
        console.log('user_formid addf');
        console.log(res.data);
        if (res.data.length == 0) {
          db.collection('user_formid').add({
            // data 字段表示需新增的 JSON 数据
            data: {
              formids: [formid]
            },
            success: function (res) {
            },
            fail: function (res) {
              console.log(res);
            }
          })
        } else {
          console.log('user_formid update');
          var _id = res.data[0]._id;
          db.collection('user_formid').doc(_id).update({
            data: {
              formids: _.push([formid])
            },
            success: console.log,
            fail: console.error
          })
        }
      }
    });
  },
  sendMessage: function (openid, title, message, cardId) {
    console.log("sendMessage: ");
    wx.cloud.callFunction({
      name: 'sendmsg',
      data: {
        openid: openid, 
        title: title, 
        message: message, 
        cardId: cardId
      },
      success: res => {
        // output: res.result === 3
        console.log("sendmsg succ");
      },
      fail: err => {
        // handle error
        console.log(err);
      },
      complete: () => {
        // ...
      }
    })    
    return;
    
    var page = this;
    var db = wx.cloud.database();
    const _ = db.command

    db.collection('user_formid').where(
      { _openid: openid }
    ).get({
      success: res => {
        console.log('sendMessage2: ');
        console.log(res.data);

        if (res.data.length > 0) {
          var formids = res.data[0].formids;
          if (formids.length > 0) {
            var formid = formids[ formids.length-1 ]
            wx.cloud.callFunction({
              name: 'message',
              data: {
                openid: openid,
                formid: formid,
                title: title,
                message: message,
                cardid: cardId
              },
              fail: function (res) {
                console.log(res);
              },
              complete: res => {
                console.log("message:")
                console.log(res);
              }
            });
            //删除数组尾部元素
            db.collection('user_formid').doc(res.data[0]._id).update({
              data: {
                formids: _.pop()
              },
              fail: res => {
                console.log('pop: ');
                console.log(res);
              }
            })            
          }

        }
      }
    });
  },
  addEventLog: function (ev, arg1, arg2) {
    var page = this;
    var db = wx.cloud.database();
    const _ = db.command
    db.collection('user_log').add({
      // data 字段表示需新增的 JSON 数据
      data: {
        event: ev,
        arg1: arg1,
        arg2: arg2,
        create_time: formatTime(new Date)
      },
    })
  }
})

function formatTime(date) {
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()

  var hour = date.getHours()
  var minute = date.getMinutes()
  var second = date.getSeconds()

  return year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second
}
