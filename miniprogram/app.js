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
      source: "",
      type: "家具", //"二手", 
      index: 2, 
      distance: 15000, //default 15km
      distanceDesc: "15km内", 
      newestVersion: "",
      tags: [],
      days: this.daysAgo(7),
      indexDays: 2,  //[1,3,7,15]
      address: "",
    }
    this.getOpenid()
  },//获取用户地理位置权限
  onError: function (err) {
    // 上报错误
    var errorCollect = require("utils/error")
    errorCollect.add(err);
  },
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
                content: '需要获取您的地理位置，请确认授权，否则无法推荐附近的分享信息～',
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
      success: res => {
        console.log("login success: ", res)
        console.log('云函数获取到的openid: ', res.result.openid)
        page.globalData['openid'] = res.result.openid;
      },
      fail: res => {
        console.log("login fail: ", res)
      },
      complete: res => {
        console.log("login complete: ", res)
      }
    })
  },
  isAdmin() {
    //return false;
    console.log("isAdmin: " + this.globalData.openid);
    var lis = ["oV5MQ5YBim_nRH66WxfWLGVcW7yc", "of1Gv4kVHElVpbeBRNZzQ-VzFVMI","of1Gv4iy9Gh2wQnpp9o3vq45SVWk"];
    return lis.indexOf(this.globalData.openid)>=0;
  },
  saveFormid: function(formid, type) {
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
          var data = {
            formids: [formid]
          };
          if (type == "cmt") {
            data = {
              formids_cmt: [formid]
            };
          }
          db.collection('user_formid').add({
            // data 字段表示需新增的 JSON 数据
            data: data,
            success: function (res) {
            },
            fail: function (res) {
              console.log(res);
            }
          })
        } else {
          console.log('user_formid update');
          var _id = res.data[0]._id;
          var data = {
            formids: _.push([formid])
          }
          if (type == "cmt") {
            data = {
              formids_cmt: _.push([formid])
            }
          }
          db.collection('user_formid').doc(_id).update({
            data: data,
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
  addEventLog: function (ev, arg1, arg2, arg3, arg4) {
    var page = this;
    var db = wx.cloud.database();
    const _ = db.command
    var uids = ["of1Gv4u8HogWkBzuZWCsz-JI50Hk"];
    if (page.isAdmin() || uids.indexOf(page.globalData.openid)>=0) {
      return;
    }
    db.collection('user_log').add({
      // data 字段表示需新增的 JSON 数据
      data: {
        event: ev,
        arg1: arg1,
        arg2: arg2,
        arg3: arg3,
        arg4: arg4,
        source: page.globalData.source,
        create_time: formatTime(new Date)
      },
      fail: function (res) {
        var errorCollect = require("utils/error")
        errorCollect.add(res);
      }
    })
  },
  daysAgo: function (days) {
    var d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  },
  save_err: function(openid, err, forced) {
    var page = this;
    var uids = ["of1Gv4u8HogWkBzuZWCsz-JI50Hk"];
    if (!forced) {
      if (page.isAdmin() || uids.indexOf(page.globalData.openid) >= 0) {
        //console.log("isAdmin and ignore: ",err)
        return;
      }      
    }
    wx.cloud.callFunction({
      name: 'log_collect',
      data: {
        openid: openid,
        message: err
      },
      success: res => {
        console.log(res);
      },
      fail: res => {
        console.log(res);
      },
      complete: () => {
        console.log("save_err ok")
      }
    });
  },
  push: function(type, args, cb, _t) {
    //  formid = get(post/cmt)
    //  if formid 空
    //    log.error
    //    return
    //  elif formid 无效
    //    pop(formid, post/cmt)
    //    sendMsg
    //  else 
    //    do()
    //    pop(formid, post/cmt)
    var page = this;
    if (!_t) {
      _t = 0;
    }

    var popFormid = function(popId, type, cb){
      wx.cloud.callFunction({
        name: 'audit_lpop_formid',
        data: { id: popId, type: type },
        success: res => { 
          console.log("cloud.audit_lpop_formid:", res); 
          if (!!cb) {
            cb();
          }
        },
        fail: res => {
          console.log("cloud.audit_lpop_formid:", res);
          page.save_err(args.openid, res);
        },
        complete: () => { console.log("cloud.audit_lpop_formid complete") }
      });
    }

    console.log("push: ", type, args, cb, _t);
    var db = wx.cloud.database();
    db.collection('user_formid').where(
      { _openid: args.openid }
    ).get().then(res => {
      console.log('已获取fomid: ', args.openid, res.data);
      if (res.data.length > 0) {
        var formids = res.data[0].formids;
        if (type=="ask" || type=="reply") {
          formids = res.data[0].formids_cmt;
        }
        var popId = res.data[0]._id;
        wx.showLoading({ title: 'formid len:' + formids.length })
        if (formids.length > 0) {
          var formid = formids[0]
          console.log("formid: ", formid);
          try {
            args.formid = formid
            var funcname = "unimessage"
            if (type == "audit") {
              funcname = "unimessage"
              /*
              var args2 = {
                openid: args.openid,
                formid: formid,
                title: args.title,
                message: args.message,
                cardid: args.cardId,
                path: args.path
              };
              console.log("发送审核消息：", args2);
              wx.cloud.callFunction({
                name: 'unimessage',
                data: args2,
                success: res => {
                  console.log("cloud.unimessage:", res);
                  popFormid(popId, type);
                  cb();
                },
                fail: res => {
                  if (res.errMsg.indexOf("invalid form id") == -1) {
                    console.log("cloud.unimessage:", res);
                    page.save_err(args.openid, res);
                  } else {
                    console.log("cloud.unimessage: invalid formid hint, ignore.");
                  }
                  popFormid(popId, type, function(){
                    page.push(type, args, cb, _t+1);
                  });
                },
                complete: () => {
                  console.log("cloud.unimessage complete")
                }
              });*/
            } else if (type == "ask") {
              console.log("发送留言信息：");
              funcname = "askmessage"
            } else if (type == "reply") {
              console.log("发送回复信息")
              funcname = "replymessage"
            }
            console.log("cloud.callFunction: ",funcname,args);
            wx.cloud.callFunction({
              name: funcname,
              data: args,
              success: res => {
                console.log("cloud.call:", funcname, res);
                wx.showToast({
                  title: '发送成功！',
                })
                popFormid(popId, type);
                cb();
              },
              fail: res => {
                /*if (res.errMsg.indexOf("invalid form id") == -1 && formid.indexOf("the formId is a mock one") == -1) {
                  console.log("cloud.call:", funcname, res);
                  page.save_err(args.openid, res);
                } else */
                if (res.errMsg.indexOf("cloud function service error") >= 0 && (res.errMsg.toLowerCase().indexOf("form id") == -1 && res.errMsg.toLowerCase().indexOf("formid") == -1) ) {
                  console.log("cloud.call exit:", funcname, res);
                  page.save_err(args.openid, res, true);
                  wx.hideLoading();
                  wx.showToast({
                    title: '推送网络错误',
                  })
                  return
                } else {
                  console.log("cloud.call: invalid formid hint, ignore.", funcname, formid);
                }
                console.log("catch: ",res.errMsg);
                popFormid(popId, type, function(){
                  console.log("try page.push... ...");
                  page.push(type, args, cb, _t+1);
                });
              },
              complete: () => {
                console.log("cloud.call complete", funcname)
              }
            });
          } catch (e) {
            console.error(e)
            app.save_err(args.openid, e);
          }
        }
        else{
          wx.hideLoading()
          wx.showToast({
            title: 'formid为空！',
            icon: 'fail',
            duration: 2000
          })
        }
      } else {
        console.log("formid为空");
        wx.showLoading({ title: 'formid为空' })
      }
    }).catch(err => {
      console.error(err)
      app.save_err(args.openid, err);
    });
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
