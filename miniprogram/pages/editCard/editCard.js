// miniprogram/pages/editCard/editCard.js
let wechat = require("../../utils/wechat");
var db = wx.cloud.database();
const app = getApp()

function formatTime(date) {
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()

  var hour = date.getHours()
  var minute = date.getMinutes()
  var second = date.getSeconds()

  return year+"-"+month+"-"+day+" "+hour+":"+minute+":"+second
}

Page({

  /**
   * 页面的初始数据
   */
  data: {
    card: undefined,
    cardOld: undefined,
    cardId: 0,
    address: "",
    latitude: 0,
    longitude: 0,
    imgurl: "",
    imgurls: [],
    content: "",
    index: 0,
    //array: ['二手','招聘','求助','邻里','全部'],
    array: ['二手', '儿童', '保姆', '招聘', '求助', '爱心', '租卖房', '租车位'],
    //array: ['家具', '化妆品', '图书', '衣鞋', '电器', '零食', '保姆', '租房/车位', '其他二手', '招聘','求助','邻里','全部'],
    index2: 0,
    array2: ['家具', '化妆品', '图书', '衣鞋', '电器', '零食', '保姆', '租房/车位', '招聘', '求助', '邻里', '全部'],
    isAdmin: false,
    tags: [],
    loading: false,
    reason: "",
    auto_height: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var page = this;
    wx.setNavigationBarTitle({
      title: '新建条目发布'
    })
    page.setData({
      isAdmin: app.isAdmin()
    });

    console.log(options);
    console.log(options.id);

    if (options.id != undefined) {
      app.addEventLog("into card.update", options.id);
      page.setData({
        cardId: options.id
      });

      const _ = db.command
      db.collection('attractions').where({
        _id: options.id
      }).get({
        success: res => {
          console.log("edit card: ");
          console.log(res.data);
          if (res.data.length > 0) {
            let card = res.data[0]
            page.setData({
              card: card,
              cardOld: card,
              cardId: card._id,
              address: card.address.replace("广东省", "").replace("广州市", "").replace("番禺区", ""),
              latitude: card.latitude,
              longitude: card.longitude,
              imgurl: card.imgurl,
              imgurls: card.imgurls || [card.imgurl],
              content: card.content,
              isAdmin: app.isAdmin(),
            })

            if (card.address == "") {
              wx.getLocation({
                type: 'gcj02',
                success(res) {
                  const latitude = res.latitude
                  const longitude = res.longitude
                  const speed = res.speed
                  const accuracy = res.accuracy
                  page.onUpdateLocation(latitude, longitude);
                }
              })
            }
          }
        },
        fail: err => {
          console.log(err);
        }
      })      
    } else {
      console.log("get location:");
      if (app.globalData.address) {
        page.setData({ 
          address: app.globalData.address.replace("广东省", "").replace("广州市", "").replace("番禺区", ""),
          latitude: app.globalData.latitude,
          longitude: app.globalData.longitude
        });
      } else {
        wx.getLocation({
          type: 'gcj02',
          success: function(res) {
            console.log(res);
            page.onUpdateLocation(res.latitude, res.longitude);
          },
          fail: function (res) {
            console.log(res); //{errMsg: "getLocation:fail auth deny"} 不授权的结果
          }
        })      
      }
    }

    wx.hideShareMenu({
    })
  },
  bindPickerChange: function (e) {
    var page = this;
    console.log('picker发送选择改变，携带值为', e.detail.value);//index为数组点击确定后选择的item索引
    page.setData({
      index: e.detail.value,
      tags: [ page.data.array[e.detail.value] ] 
    })
  },
  bindPickerChange2: function (e) {
    console.log('picker发送选择改变，携带值为', e.detail.value);//index为数组点击确定后选择的item索引
    this.setData({
      index2: e.detail.value
    })
  },
  getInput: function (e) {
    var page = this;
    //if (e.detail.value.indexOf(",") == -1) {
    if (e.detail.value.length == 0) {
      return
    }
    var tags = e.detail.value.split(",");
    if (e.detail.value.indexOf("，") > 0) {
      tags = e.detail.value.split("，");
    }
    if (!!page.data.card && (!page.data.card.tags || page.data.card.tags.length == 0)) {
      tags.push(page.data.array[ page.data.index ]);
    }
    console.log(tags);
    page.setData({
      tags: tags
    });
  },
  getReason: function (e) {
    var page = this;
    page.setData({
      reason: e.detail.value
    });
  },
  auditFail: function (e) {
    var page = this;
    this.data.card.status = 3;
    this.setData({
      card: this.data.card
    });
    args = {
      openid: page.data.card._openid, 
      title: page.data.card.content.substr(0, 66) || "[图片]",
      message: "审核不通过("+page.data.reason+")",  
      cardId: page.data.card._id,
      reason: page.data.reason,
      status: 3
    }
    page.audit(args)
    /*wx.cloud.callFunction({
      name: 'audit',
      data: {
        openid: page.data.card._openid, 
        title: page.data.card.content.substr(0, 66) || "[图片]",
        message: "审核不通过("+page.data.reason+")",  
        cardId: page.data.card._id,
        reason: page.data.reason,
        status: 3
      },
      success: res => {
        // output: res.result === 3
        console.log("audit succ");
        wx.redirectTo({
          url: '/pages/homepage/homepage',
        })
      },
      fail: err => {
        // handle error
        console.log(err);
      }
    })*/
  },
  auditOk: function (e) {
    var page = this;
    this.data.card.status = 1;
    this.setData({
      card: this.data.card
    });
    //app.sendMessage(this.data.card._openid, "title222", "msg222...");
    console.log(page.data.card);
    var len = page.data.card.content.length;
    var title = page.data.card.content.substr(0, 50);
    if (len > 50) {
      title += " ...";
    }
    var args = {
      openid: page.data.card._openid,
      title: title || "[图片]",
      message: "审核通过，请保持联系方式通畅哟～",
      cardId: page.data.card._id,
      tags: page.data.tags,
      reason: "",
      status: 1
    };
    page.audit(args)
    /*wx.cloud.callFunction({
      name: 'audit',
      data: args,
      success: res => {
        // output: res.result === 3
        console.log(args);
        console.log("audit succ");
        wx.redirectTo({
          url: '/pages/homepage/homepage',
        })
      },
      fail: err => {
        // handle error
        console.log(err);
      }
    })*/
  },
  audit: function (args) {
    wx.cloud.callFunction({
      name: 'audit_status',
      data: args,
      success: res => {
        console.log("cloud.audit succ: ", args, res);

        db.collection('user_formid').where(
            { _openid: args.openid }
          ).get().then(res => {

            console.log('已获取fomid: ',args.openid,res.data);
            if (res.data.length > 0) {
              var formids = res.data[0].formids;
              var popId = res.data[0]._id;
              if (formids.length > 0) {
                var formid = formids[formids.length - 1]
                console.log("formid: ", formid);
                try {
                  var args = {
                    openid: args.openid,
                    formid: formid,
                    title: args.title,
                    message: args.message,
                    cardid: args.cardId
                  };
                  console.log("发送message：", args);
                  wx.cloud.callFunction({
                    name: 'unimessage',
                    data: args,
                    success: res => {
                      console.log("cloud.unimessage:", res);

                      wx.cloud.callFunction({
                        name: 'audit_pop_formid',
                        data: {
                          id: popId
                        },
                        success: res => {
                          console.log("cloud.audit_pop_formid:", res);

                          wx.redirectTo({
                            url: '/pages/homepage/homepage',
                          })

                        },
                        fail: res => {
                          console.log("cloud.audit_pop_formid:", res);
                          app.save_err(args.openid, res);
                        },
                        complete: () => {
                          console.log("cloud.audit_pop_formid complete")
                        }
                      });

                    },
                    fail: res => {
                      console.log("cloud.unimessage:", res);
                      app.save_err(args.openid, res);
                    },
                    complete: () => {
                      console.log("cloud.unimessage complete")
                    }
                  });
                } catch (e) {
                  console.error(e)
                  app.save_err(event.openid, e);
                }
              }
            } else {
              console.log("formid为空");
            }
          })
          .catch(err => {
            console.error(err)
            app.save_err(event.openid, err);
          });
      },
      fail: err => {
        console.log("cloud.audit: ", err);
      }
    })
  },
  onUpdateLocation: function (latitude, longitude) {
    var page = this;
    let url = `https://apis.map.qq.com/ws/geocoder/v1/`;
    let key = 'V3WBZ-LO4WK-FEYJS-AXWMR-YT5YO-A3FXR';
    let params = {
      location: latitude + "," + longitude,
      key
    }
    wechat.request(url, params).then(function (value) {
      console.log(`fulfilled: ${value}`);
      console.log(value);
      /*wx.showToast({
        title: value.data.result.address_component.street_number,
      })*/
      page.setData({ 
        address: value.data.result.address_component.street_number.replace("广东省", "").replace("广州市", "").replace("番禺区", ""),
        latitude: latitude,
        longitude: longitude
      });
    })
    .catch(function (value) {
      console.log(`rejected: ${value}`); // 'rejected: Hello World'
    });
  },
  onFinish: function () {
    var page = this;
    var finished = (page.data.finished==1)? 0:1; //改成反状态
    app.addEventLog("update card");
    wx.showLoading({
      title: '正在更新状态...',
      mask: true
    })
    db.collection('attractions').doc(page.data.card._id).update({
      data: {
        finished: finished
      },
      success: function (res) {
        wx.showToast({
          title: finished==1?'已更新到状态：已成交':'已更新到状态：待成交',
        })
        wx.hideLoading();
      },
      fail: function (res) {
        console.log(res);
        wx.showToast({
          title: '更新失败',
        })
        wx.hideLoading();
      }
    });
  },
  onDeleteCard: function () {
    var page = this;
    var cardId = page.data.cardId;
    console.log(cardId);
    console.log(page.data.openid)
    wx.showModal({
      title: '提示',
      content: '确定要删除吗？',
      success: function (sm) {
        if (sm.confirm) {
          // 用户点击了确定 可以调用删除方法了
          db.collection('attractions').doc(cardId).update({
            data: {
              status: 0
            },
            success: function (res) {
              wx.showToast({
                title: '删除成功',
              })
              wx.redirectTo({
                url: '/pages/homepage/homepage',
              })
            },
            fail: function (res) {
              console.log(res);
              wx.showToast({
                title: '删除失败',
              })
            }
          });
        } else if (sm.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

  chooseImage: function () {
    var page = this;
    wx.chooseImage({
      count: 9, // 默认9 
      sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有 
      sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有 
      success: function (res) {
        // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片 
        page.setData({
          tempFilePaths: res.tempFilePaths
        })
        console.log(res.tempFilePaths);
        console.log(res.tempFilePaths.length);

        var timestamp = Date.parse(new Date());
        timestamp = timestamp / 1000;  
        wx.showLoading({
          title: '文件上传中...',
          mask: true
        })
        page.setData({ loading: true });
        var imgsCount = res.tempFilePaths.length;
        var imgs = [];
        for (var i = 0; i < imgsCount; i++) {
          wx.cloud.uploadFile({
            cloudPath: timestamp+'.'+i+'.png',
            filePath: res.tempFilePaths[i], // 文件路径
          }).then(res => {
            // get resource ID
            console.log("img uploaded.")
            console.log(res)            
            imgs.push(res.fileID);
            if (imgs.length >= imgsCount) {
              page.setData({ imgurl:imgs[0], imgurls: imgs });
              setTimeout(function () {
                wx.hideLoading();
                page.setData({ loading: false });
              }, 1000);
            }
          }).catch(error => {
            // handle error
            console.log(error)
            wx.hideLoading()
            page.setData({ loading: false });
          })
        }
      }
    })
  },

  choosePos: function () {
    console.log("choose pos");
    var page = this;
    wx.chooseLocation({
      success: function (res) {
        console.log(res);
        page.setData({ 
          address: res.address,
          latitude: res.latitude, 
          longitude: res.longitude
        });
        //page.onUpdateLocation(res.latitude, res.longitude);
        wx.showToast({
          title: '修改成功！',
        })
      },
    })
  },

  updateCard: function (event) {
    console.log("update card.");
    var page = this;
    var opType = event.currentTarget.dataset.type;

    if (page.data.loading) {
      wx.showToast({
        title: '正在上传图片...',
        icon: 'none',
        duration: 2000
      })
      return
    }

    if (event.detail.formId != 'the formId is a mock one') {

    }
    console.log("formid: ");
    console.log(event.detail.formId);
    /*wx.showToast({
      title: event.detail.formId
    })
    wx.setClipboardData({
      data: event.detail.formId,
      success() {
        wx.hideToast();   
      }
    })*/
    app.saveFormid(event.detail.formId);
    

    if (page.data.content == "") {
      console.log("content empty...");
      wx.showToast({
        title: '发布内容为空！',
        icon: 'none',
        duration: 2000
      })
      return
    }

    var cardData = {
      title: page.data.title,
      address: page.data.address,
      latitude: page.data.latitude,
      longitude: page.data.longitude,
      imgurl: page.data.imgurl,
      imgurls: page.data.imgurls,
      content: page.data.content,
      update_time: formatTime(new Date), //formatTime(new Date)
      sort_time:   new Date
    };
    if (page.data.latitude && page.data.longitude) {
      cardData["location"] = db.Geo.Point(page.data.longitude, page.data.latitude)
    }
    console.log("update card." + page.data.cardId);

    if (opType == "add" && page.data.cardId == 0) {
      console.log("add.")
      //add
      cardData["create_time"] = formatTime(new Date)
      cardData["status"] = 2
      cardData["visit_count"] = 1
      cardData["type"] = "邻里"
      cardData["reason"] = ""
      cardData["tags"] = [ "二手" ]
      cardData["priority"] = 0
      cardData["finished"] = 0
      wx.showLoading({
        title: '正在新建...',
        mask: true
      })
      if (app.isAdmin()) { //admin直接添加上线
        cardData["status"] = 1
        cardData["tags"] = page.data.tags
      }
      page.setData({loading: true});
      app.addEventLog("add card");
      db.collection('attractions').add({
        // data 字段表示需新增的 JSON 数据
        data: cardData,
        success: function (res) {
          // res 是一个对象，其中有 _id 字段标记刚创建的记录的 id
          page.setData({
            cardId: res._id
          });
          wx.showToast({
            title: '新增成功',
          })
          wx.redirectTo({
            url: '/pages/homepage/homepage',
          })
          wx.hideLoading();
          page.setData({ loading: false });
        },
        fail: function (res) {
          console.log(res);
          wx.showToast({
            title: '新增失败',
          })
          wx.hideLoading();
          page.setData({ loading: false });
        }
      })
    } 
    console.log(opType);
    console.log(page.data.cardId);
    if (opType == "update" && page.data.cardId.length>0){
      
      cardData.status = 2; //page.data.card.status;
      cardData.tags = page.data.tags;
      if (app.isAdmin()) { //admin直接添加上线
        cardData["status"] = 1
        cardData["tags"] = page.data.tags
      }
      //update
      wx.showLoading({
        title: '正在更新...',
        mask: true
      })
      console.log(123456);
      app.addEventLog("update card");
      db.collection('attractions').doc(this.data.cardId).update({
        data: cardData,
        success: function (res) {
          wx.showToast({
            title: '更新成功',
          })
          wx.redirectTo({
            url: '/pages/homepage/homepage',
          })
          wx.hideLoading();
        },
        fail: function (res) {
          console.log(res);
          wx.showToast({
            title: '更新失败',
          })
          wx.hideLoading();
        }
      });
    }
  },

  onInput: function (e) {
    console.log("on input");
    this.setData({
      content: e.detail.value
    })
  },

  goBack: function () {
    wx.navigateBack({
      fail: function(){
        wx.redirectTo({
          url: '/pages/index/index',
        })
      }
    });
  },
  areablur: function () {
    this.setData({
      auto_height: false
    })
  },
  areafocus: function () {
    this.setData({
      auto_height: true
    })
  }
})



