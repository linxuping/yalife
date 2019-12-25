// miniprogram/pages/editCard/editCard.js
let wechat = require("../../utils/wechat");
let submessage = require("../../utils/submessage");
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
    auto_height: true,
    items: [
      { name: 'USA', value: '美国' },
      { name: 'CHN', value: '中国', checked: 'true' },
      { name: 'BRA', value: '巴西' },
      { name: 'JPN', value: '日本' },
      { name: 'ENG', value: '英国' },
      { name: 'TUR', value: '法国' },
    ],
    seletedStr: "",
    selectedOpenids: "",
    showNotify: false,
    notifyCards: [],
    isSub: 0,
    tagsCalc: ""
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

    if (options.sub == 1) {
      page.setData({
        isSub: 1
      });
    }

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
              tags:    card.tags,
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
            if (page.data.isAdmin) {
              console.log("fetchNoSend.card: ",card);
              submessage.fetchNoSend(card.longitude, card.latitude, function(dic){
                var s = "非Admin订阅：";
                for (var key in dic) { 
                  s += (key+":"+dic[key]+" ");
                }
                page.setData({tagsCalc:s});
              });
            }
          }
        },
        fail: err => {
          console.log(err);
        }
      });      
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
    wx.showModal({
      title: '提示',
      content: '审核失败？',
      success: function (sm) {
        if (sm.confirm) {
          page.data.card.status = 3;
          page.setData({
            card: page.data.card
          });
          var args = {
            openid: page.data.card._openid,
            title: page.data.card.content.substr(0, 66) || "[图片]",
            message: "审核不通过(" + page.data.reason + ")",
            cardid: page.data.card._id,
            reason: page.data.reason,
            status: 3,
            path: '/pages/homepage/homepage'
          }
          page.audit(args)
        } else if (sm.cancel) {
          console.log('用户点击取消')
        }
      }
    });
  },
  auditOk: function (e) {
    var page = this;
    wx.showModal({
      title: '提示',
      content: '审核通过？',
      success: function (sm) {
        if (sm.confirm) {
          page.data.card.status = 1;
          page.setData({
            card: page.data.card
          });
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
            cardid: page.data.card._id,
            tags: page.data.tags,
            reason: "",
            status: 1,
            path: '/pages/details/details?id=' + page.data.card._id + '&latitude=' + page.data.card.latitude + '&longitude=' + page.data.card.longitude + '&address=' + encodeURIComponent(page.data.card.address)
          };
          page.audit(args)
        } else if (sm.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  },
  audit: function (args) {
    var page = this;
    wx.showLoading({
      title: '处理中...',
    })
    wx.cloud.callFunction({
      name: 'audit_status',
      data: args,
      success: res => {
        app.push("audit", args, function (res) {
          wx.hideLoading()
          wx.redirectTo({
            url: '/pages/homepage/homepage',
          })
        });
        /*console.log("cloud.audit succ: ", args, res);
        wx.hideLoading()
        wx.showLoading({ title: 'cloud.audit succ'  })

        args.path = '/pages/details/details?id=' + page.data.card._id + '&latitude=' + page.data.card.latitude + '&longitude=' + page.data.card.longitude + '&address=' + encodeURIComponent(page.data.card.address);

        db.collection('user_formid').where(
            { _openid: args.openid }
          ).get().then(res => {
            console.log('已获取fomid: ',args.openid,res.data);
            wx.hideLoading()
            if (res.data.length > 0) {
              var formids = res.data[0].formids;
              var popId = res.data[0]._id;
              wx.showLoading({ title: 'formid len:' + formids.length })
              if (formids.length > 0) {
                var formid = formids[formids.length - 1]
                console.log("formid: ", formid);
                try {
                  var args2 = {
                    openid: args.openid,
                    formid: formid,
                    title: args.title,
                    message: args.message,
                    cardid: args.cardId,
                    path: '/pages/details/details?id=' + page.data.card._id + '&latitude=' + page.data.card.latitude + '&longitude=' + page.data.card.longitude + '&address=' + encodeURIComponent(page.data.card.address)
                  };
                  console.log("发送message：", args2);
                  wx.cloud.callFunction({
                    name: 'unimessage',
                    data: args2,
                    success: res => {
                      console.log("cloud.unimessage:", res);
                      wx.hideLoading()
                      wx.redirectTo({
                        url: '/pages/homepage/homepage',
                      })
                    },
                    fail: res => {
                      //formid无效时触发
                      console.log("cloud.unimessage:", res);
                      app.save_err(args.openid, res);
                    },
                    complete: () => {
                      console.log("cloud.unimessage complete")
                      wx.cloud.callFunction({
                        name: 'audit_lpop_formid',
                        data: {
                          id: popId
                        },
                        success: res => {
                          console.log("cloud.audit_lpop_formid:", res);
                        },
                        fail: res => {
                          console.log("cloud.audit_lpop_formid:", res);
                          app.save_err(args.openid, res);
                        },
                        complete: () => {
                          console.log("cloud.audit_lpop_formid complete")
                        }
                      });
                    }
                  });
                } catch (e) {
                  console.error(e)
                  app.save_err(args.openid, e);
                }
              }
            } else {
              console.log("formid为空");
              wx.showLoading({ title: 'formid为空' })
            }
          })
          .catch(err => {
            console.error(err)
            app.save_err(args.openid, err);
          });
          */
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
  chooseImage: function (event) {
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
    });
    app.saveFormid(event.detail.formId, "cmt");
  },

  choosePos: function (event) {
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
    });
    app.saveFormid(event.detail.formId, "cmt");
  },
  saveFormid: function (event) {
    if (event.detail.formId != 'the formId is a mock one') {
    }
    console.log("formid: ", event.detail.formId);
    app.saveFormid(event.detail.formId);
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

    if (page.data.content == "") {
      console.log("content empty...");
      wx.showToast({
        title: '发布内容为空！',
        icon: 'none',
        duration: 2000
      })
      return
    }


    if (page.data.isSub == 1) {
      wx.requestSubscribeMessage({
        tmplIds: ['j-4XK2DeMlOsMyNsyn06oXor6L_tL9aQhfMrNk6Gpzg'],
        success(res) {
          if (res['j-4XK2DeMlOsMyNsyn06oXor6L_tL9aQhfMrNk6Gpzg'] == "accept") {
            wx.showToast({
              title: '订阅成功！',
            });
            page._updateCard(event);
          } else {
            wx.showToast({
              title: '没有订阅！',
            });
          }
        },
        fail(res) {
          wx.showToast({
            title: '请开订阅权限',
          })
          console.error(res);
        }
      })
    } else {
      page._updateCard(event);
    }
  },
  _updateCard: function (event) {
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
    console.log("formid: ", event.detail.formId);
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
      address: page.data.address || "附近",
      latitude: page.data.latitude,
      longitude: page.data.longitude,
      imgurl: page.data.imgurl,
      imgurls: page.data.imgurls,
      content: page.data.content,
      update_time: formatTime(new Date), //formatTime(new Date)
      sort_time:   new Date,
      unread_count:  0   //消息未读数
    };
    if (page.data.latitude && page.data.longitude) {
      cardData["location"] = db.Geo.Point(page.data.longitude, page.data.latitude)
    }
    if (!page.data.unread_count) {
      cardData["unread_count"] = 0
    }
    console.log("update card." + page.data.cardId);

    if (opType == "add" && page.data.cardId == 0) {
      console.log("add.")
      //add
      cardData["create_time"] = formatTime(new Date)
      cardData["status"] = 2
      cardData["visit_count"] = 1
      cardData["visit_count_all"] = 1
      cardData["type"] = "邻里"
      cardData["reason"] = ""
      cardData["tags"] = [ "二手" ]
      cardData["priority"] = 0
      cardData["finished"] = 0
      cardData["notify_tag"] = ""
      cardData["is_sub"] = page.data.isSub
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
        cardData["status"] = page.data.status
        cardData["tags"] = page.data.tags
        cardData["notify_tag"] = page.data.notify_tag
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
  },
  notifyAll: function () {
    var page = this;
    var notifyCards = page.data.notifyCards;
    console.log(notifyCards);
    var len = notifyCards.length;
    if (len == 0) {
      return;
    }
    var count = 0;
    var selectedOpenids = page.data.selectedOpenids;
    console.log(selectedOpenids);
    if (selectedOpenids.length == 0) {
      return;
    }
    wx.showLoading({
      title: '开始通知',
    })
    for (var i=0; i<len; i++) {
      var notify_openid = notifyCards[i].name;
      if (selectedOpenids.indexOf(notify_openid) == -1){
        console.log("ignore: ", notify_openid);
        continue;
      }
      wx.showLoading({
        title: i,
      })
      //推送给对方，保持对方的打开信息
      var openid = notify_openid;
      var card = page.data.card; //notifyCards[i].card;
      var sub_id = notifyCards[i].sub_id;
      //参考details.getSharePath
      var path = '/pages/details/details?id=' + card._id + '&latitude=' + card.latitude + '&longitude=' + card.longitude + '&address=' + encodeURIComponent(card.address) + '&from=notify' + '&tag=' + encodeURIComponent(page.data.card.notify_tag);
      console.log("submessage:",openid,card);
      wx.cloud.callFunction({
        name: 'submessage',
        data: {
          path: path,
          openid: openid,
          message: card.content.substr(0,15)+" ...",
          tag: page.data.card.notify_tag,
        },
        success: res => {
          console.log("cloud.submessage ok:", card, res);
          wx.showLoading({
            title: openid,
          })
          count += 1;
        },
        fail: res => {
          count += 1;
          console.log("cloud.submessage:", res);
          app.save_err(openid, res);
        },
        complete: () => {
          console.log("cloud.submessage complete")
          if (count >= len) {
            wx.showToast({
              title: count
            })
            wx.hideLoading();

            /*
            wx.showLoading({
              title: "submessage_reset...",
            })
            wx.cloud.callFunction({
              name: 'submessage_reset',
              data: {
                sub_id: sub_id
              },
              success: res => {
                console.log("cloud.submessage_reset:", res);
              },
              fail: res => {
                console.log("cloud.submessage_reset:", res);
                app.save_err(sub_id, res);
              },
              complete: () => {
                console.log("cloud.submessage_reset complete")
                wx.hideLoading();
              }
            });*/

          }
        }
      });

      wx.showLoading({
        title: "submessage_reset...",
      })
      wx.cloud.callFunction({
        name: 'submessage_reset',
        data: {
          sub_id: sub_id
        },
        success: res => {
          console.log("cloud.submessage_reset:", res);
        },
        fail: res => {
          console.log("cloud.submessage_reset:", res);
          app.save_err(sub_id, res);
        },
        complete: () => {
          console.log("cloud.submessage_reset complete")
          wx.hideLoading();
        }
      });

    }
  },
  onSubscribe: function(event) {
    var page = this;
    wx.requestSubscribeMessage({
      tmplIds: ['j-4XK2DeMlOsMyNsyn06oXor6L_tL9aQhfMrNk6Gpzg'],
      success(res) {
        console.log(res);
        if (res['j-4XK2DeMlOsMyNsyn06oXor6L_tL9aQhfMrNk6Gpzg'] == "accept") {
          wx.showToast({
            title: '订阅成功！',
          });
          page._updateCard(event);
        } else {
          wx.showToast({
            title: '没有订阅！',
          });
        }       
       }
    })
  },
  onSaveNotifyInput: function(e) {
    console.log("onSaveNotifyInput", e.detail.value);
    var card = this.data.card;
    card.notify_tag = e.detail.value;
    this.setData({
      card: card
    })
  },
  saveNotify: function (event) {
    var page = this;
    submessage.add(page.data.card._openid, page.data.card._id, page.data.card.notify_tag, "admin");
  },
  pullNotify: function(event) {
    var page = this;
    page.setData({
      notifyCards: []
    });
    wx.showLoading({
      title: '拉取订阅...',
      mask: true,
      success: function (res) { },
      fail: function (res) { },
      complete: function (res) { },
    });
    var cond = {
      notify_tag: page.data.card.notify_tag,
      status: 1,
    }
    const dc = db.command;
    cond.location = dc.geoNear({
      geometry: db.Geo.Point(page.data.card.longitude, page.data.card.latitude),
      minDistance: 0,
      maxDistance: app.globalData.distanceDefault,
    });
    db.collection('submessage').where(cond).get({
      success: res => {
        var items = [];
        var selectedOpenids = [];
        var tmpDic = {};
        for (var i=0; i<res.data.length; i++) {
          var card_id = res.data[i].card_id;
          var notify_openid = res.data[i].notify_openid;
          var sub_id = res.data[i]._id;
          tmpDic[card_id] = res.data[i];
          selectedOpenids.push(notify_openid);
          if (!!card_id) {
            db.collection('attractions').where({
              _id: card_id
            }).get({
              success: res2 => {
                if (res2.data.length == 0) {
                  console.error("card_id not exists: ", card_id);
                } else {
                  var card = res2.data[0];
                  console.log("get card:",card);
                  items.push({
                    name: card._openid, 
                    value: card.content, 
                    card: card, 
                    checked: 'true',
                    sub_id: tmpDic[card._id]._id
                  });
                  page.setData({
                    notifyCards: items,
                    selectedOpenids: selectedOpenids,
                    showNotify: true
                  })
                  console.log("get card fin.");           
                }
              },
              fail: res2 => {
                console.error(res2);
              }
            });
          } else {
            items.push({
              name: notify_openid, 
              value: res.data[i].address + notify_openid, 
              card: {}, 
              checked: 'true',
              sub_id: sub_id
            });
            page.setData({
              notifyCards: items,
              selectedOpenids: selectedOpenids,
              showNotify: true
            })
          }

        }
        wx.hideLoading();
      }
    });
  },
  checkboxChange: function (event) {
    /*
      1\“订阅”点击提交，进入待审
      2\“订阅”过审，绑定到submessage表 - 推送标签
      3\
    */
    console.log('checkbox发生change事件，携带value值为：', typeof(event.detail.value), event.detail.value);
    this.setData({
      seletedStr: "选中的values值：" + event.detail.value,
      selectedOpenids: event.detail.value
    });
  }
})



