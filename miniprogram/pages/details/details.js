// miniprogram/pages/details/details.js
var db = wx.cloud.database();
var recommend = require("../../utils/recommend")
let submessage = require("../../utils/submessage");
let user = require("../../utils/user");
const app = getApp()
const _ = db.command

function formatTime(date) {
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()

  var hour = date.getHours()
  var minute = date.getMinutes()
  var second = date.getSeconds()

  return year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second
}

Page({

  /**
   * 页面的初始数据
   */
  data: {
    cardId: 0,
    card: undefined,
    cardList: [],
    latitudeShared: 0,
    longitudeShared: 0,
    addressShared: "",
    defaultImg: "../../images/default.png",
    showHome: false,
    inputBoxShow: false,
    replyId: "",
    isScroll: true,
    cmtContent: "",
    comments: [],
    isAdmin: false,
    openid: "",
    openSwitch: false,
    source: "",
    notify_tag: "", //only for continue notify
    liked: false,
  },
  showInputBox: function () {
    this.setData({ inputBoxShow: true });
    this.setData({ isScroll: false });
    this.setData({ replyId: "" });
    this.setData({ openSwitch: false });
  },
  invisible: function () {
    this.setData({ inputBoxShow: false });
    this.setData({ isScroll: true });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var page = this;
    page.setData({
      isAdmin: app.isAdmin(),
      openid: app.globalData.openid,
    });
    wx.setNavigationBarTitle({
      title: "邻里小事"
    })
    if (options.id != undefined) {
      console.log("options: ", options);
      page.setData({
        cardId: options.id,
        latitudeShared: parseFloat( options.latitude ),
        longitudeShared: parseFloat( options.longitude ),
        addressShared: decodeURIComponent(options.address)
      });

      if (!!options.latitude && !!options.longitude && !!options.address) {
        app.globalData.latitude = parseFloat( options.latitude );
        app.globalData.longitude = parseFloat( options.longitude );
        app.globalData.address = decodeURIComponent(options.address);
        console.log("app.globalData update: ", app.globalData);        
      }
      
      if (!!options.source) {
        app.globalData.source = options.source;
        page.setData({source: options.source});
        page.setData({notify_tag: decodeURIComponent(options.notify_tag)});
      }

      if (!!options.from && !!options.tag) {
        app.globalData.source = options.from;
        page.setData({source: options.from});
        page.setData({notify_tag: decodeURIComponent(options.tag)});
      }

      db.collection('attractions').where({
        _id: options.id
      }).get({
        success: res => {
          console.log("details: ");
          console.log(res.data);
          if (res.data.length > 0) {
            let card = res.data[0]
            if (card.update_time.toString().indexOf("-") > 0) {
              card.create_time = card.update_time;
            }
            console.log(card);
            card.address = card.address.replace("广东省", "").replace("广州市", "").replace("番禺区", "");
            card.imgurls = card.imgurls || [card.imgurl]
            page.setData({
              card: card, 
              liked: (card.help_uids || []).indexOf(app.globalData.openid)>-1
            });

            //page.getCardsRelated();

            app.addEventLog("into detail", card);
            
            var latitude = page.data.latitudeShared > 0 ? page.data.latitudeShared : app.globalData.latitude;
            var longitude = page.data.longitudeShared > 0 ? page.data.longitudeShared : app.globalData.longitude;
            var address = !!page.data.addressShared ? page.data.addressShared : app.globalData.address;
            recommend.get(card, latitude, longitude, function(cards){
              console.log("recommend cb: ");
              console.log(cards);
              page.setData({ cardList: cards, showHome: true })
            });
          }
        },
        fail: err => {
          console.log(err);
          page.setData({ showHome: true })
        }
      });
      page.loadComments();

      wx.cloud.callFunction({
        name: 'visit_count',
        data: {
          cardId: page.data.cardId,
          openid: app.globalData.openid
        },
        success: res => {
          console.log("add visit_count succ", page.data.cardId);
        },
        fail: err => {
          console.log(err);
        }
      });

    } else {
      page.setData({ showHome: true })
    }
  },
  getSharePath: function() {
    var page = this;
    var latitude = page.data.latitudeShared > 0 ? page.data.latitudeShared : app.globalData.latitude;
    var longitude = page.data.longitudeShared > 0 ? page.data.longitudeShared : app.globalData.longitude;
    var address = app.globalData.address;
    //console.log("addr: ", page.data.addressShared, app.globalData.address, address);
    return '/pages/details/details?id=' + page.data.cardId + '&latitude=' + latitude + '&longitude=' + longitude + '&address=' + encodeURIComponent(address);
  },
  onShareAppMessage: function () {
    var page = this;
    var path = page.getSharePath();
    app.addEventLog("detail share", path, page.data.cardId);
    console.log("share path: ", path);
    return {
      title: page.data.card.address.replace("广东省", "").replace("广州市", "").replace("番禺区", "").replace("石楼镇", ""),
      desc: '各种类别都有哦～',
      path: path
    }
  },
  getCardsRelated: function (loadHigh) {
    var page = this;
    var latitude = page.data.latitudeShared > 0 ? page.data.latitudeShared : app.globalData.latitude;
    var longitude = page.data.longitudeShared > 0 ? page.data.longitudeShared : app.globalData.longitude;
    console.log("getCardsRelated: ");
    console.log(longitude);
    console.log(latitude);
    var tags = !!page.data.card.tags ? page.data.card.tags:[];
    if (!!loadHigh) {
      tags = ["高"];
    }
    var cond = {
      location: _.geoNear({
        geometry: db.Geo.Point(parseFloat(longitude), parseFloat(latitude)),
        minDistance: 0,
        maxDistance: page.globalData.distance || 15000,
      }),
      status: 1,
      tags: _.in(tags)
    };
    console.log(cond);
    db.collection('attractions').orderBy('sort_time', 'desc').where(cond).limit(10).get({
      success: res => {
        console.log("cards: ");
        console.log(res.data);
        for (var i=0; i<res.data.length; i++) {
          res.data[i].address = res.data[i].address.replace("广东省", "").replace("广州市", "").replace("番禺区", "");
        }
        if (page.data.cardList.length == 0){
          page.setData({ cardList: page.data.cardList.concat(res.data) })
        } else {
          //加载高优，排重
          var ids = []
          for (var i=0; i<page.data.cardList.length; i++) {
            ids.push(page.data.cardList[i]._id);
          }
          for (var i = 0; i < res.data.length; i++) {
            if (ids.indexOf(res.data[i]._id) == -1) {
              page.data.cardList.push(res.data[i]);
            }
          }
          page.setData({ cardList: page.data.cardList })
        }
        
        if (!loadHigh) {
          page.getCardsRelated(1);
        }
      },
      fail: err => {
        console.log(err);
      }
    })
  },
  goIndex: function() {
    var page = this;
    var url = '/pages/index/index';
    var latitude = page.data.latitudeShared > 0 ? page.data.latitudeShared : app.globalData.latitude;
    var longitude = page.data.longitudeShared > 0 ? page.data.longitudeShared : app.globalData.longitude;
    var address = app.globalData.address;
    url += "?latitude=" + latitude + "&longitude=" + longitude + '&address=' + encodeURIComponent(address);
    wx.redirectTo({
      url: url,
      success: function (res) {
        console.log("goIndex success: ");
      },
      fail: function (res) {
        console.log("goIndex fail: ");
        console.log(res);
      }
    })
  },
  previewImage: function (e) {
    var page = this;
    var current = e.target.dataset.src;
    wx.previewImage({
      current: current, // 当前显示图片的http链接  
      urls: page.data.card.imgurls // 需要预览的图片http链接列表  
    })
  },
  goDetails: function (event) {
    var page = this;
    var cardId = event.currentTarget.dataset.cardid;
    var latitude = page.data.latitudeShared > 0 ? page.data.latitudeShared : app.globalData.latitude;
    var longitude = page.data.longitudeShared > 0 ? page.data.longitudeShared : app.globalData.longitude;
    var address = !!page.data.addressShared ? page.data.addressShared : app.globalData.address;
    var url = "/pages/details/details?id=" + cardId + "&latitude=" + latitude + "&longitude=" + longitude + '&address=' + encodeURIComponent(address);
    wx.navigateTo({
      url: url,
      success: function (res) {
        console.log("goDetails success: ");
      },
      fail: function (res) {
        console.log("goDetails fail: ");
        console.log(res);
        wx.redirectTo({
          url: url,
        });
      }
    })
  },
  onCmtChanged: function(e) {
    console.log("onCmtChanged:", e.detail.value);
    this.setData({
      cmtContent: e.detail.value
    });
  },
  loadComments: function(event) {
    var page = this;
    const _ = db.command
    db.collection('comment').orderBy("create_time", "asc").where({
      card_id: page.data.cardId,
      status: _.gt(0)
    }).get({
      success: res => {
        console.log("load comments before: ", res.data);
        var cmts = res.data;
        //分离 ask/reply
        var replies = {};
        var asks = [];
        for (var i=0; i<cmts.length; i++) {
          if (!!cmts[i].reply_id) {
            replies[ cmts[i].reply_id ] = cmts[i];
          }
        }
        console.log("replies: ",replies);
        for (var i=0; i<cmts.length; i++) {
          if (!!cmts[i].reply_id) {
            //有reply, ignore
          }
          else {
            //没有reply说明是ask
            if ( !!replies[ cmts[i]._id ] ) {
              //匹配reply
              cmts[i].reply = replies[ cmts[i]._id ];
            }
            asks.push( cmts[i] );
          }
        }
        console.log("load comments after: ",asks);
        page.setData({
          comments: asks
        });
      },
      fail: res => {
        console.log(res);
      }
    });
  },
  addComment: function(event) {
    var page = this;
    wx.showLoading({
      title: '正在新增...',
    })
    app.saveFormid(event.detail.formId, "cmt");
    db.collection('comment').add({
      // data 字段表示需新增的 JSON 数据
      data: {
        card_id: page.data.card._id,
        content: page.data.cmtContent,
        reply_id: page.data.replyId,
        create_time_str: formatTime(new Date), //formatTime(new Date)
        create_time: new Date,
        status: 2,
        anonymous: page.data.openSwitch?1:0,
      },
      success: function (res) {
        page.loadComments();
        page.invisible();
        page.updateUnread();
      },
      fail: function(res) {
        console.log(res);
      },
      complete: function(res) {
        wx.hideLoading();
      }
    });
  },
  delComment: function(event) {
    var page = this;
    wx.showModal({
      title: '提示',
      content: '确认删除该评论？',
      success: function (res) {
        if (res.confirm) {
          wx.showLoading({
            title: '正在删除...',
          })
          app.saveFormid(event.detail.formId, "cmt");
          var cmtId = event.currentTarget.dataset.cid;
          console.log("del comment: ", cmtId);
          db.collection('comment').doc(cmtId).remove({
            success: function (res) {
              page.loadComments();
              page.updateUnread();
            },
            fail: function (res) {
              console.log(res);
            },
            complete: function (res) {
              wx.hideLoading();
            }
          });           
        }
      },
      fail: function(res) {
        console.log(res);
      }
    });
  },
  updateUnread: function() {
    var page = this;
    var cardId = page.data.card._id;
    db.collection('comment').where({
      card_id: cardId,
      status:  1,
      reply_id:  "",
    }).get({success: function (res) {
      console.log(res);
      if (res.data.length == 0) {
        console.log("msg_unread_reset: 0");
        wx.cloud.callFunction({
          name: 'msg_unread_reset',
          data: {
            openid: app.globalData.openid,
            cardid: cardId,
            count: left,
          },
          fail: res => {
            console.log("msg_unread_reset:", res)
          }
        });
        return
      }

      //else //减掉已回复的
      const _ = db.command
      var _ids = [];
      console.log("comment 1 level len:", res.data.length);
      for (var i=0; i<res.data.length; i++) {
        _ids.push( res.data[i]._id )
      }
      db.collection('comment').where({
        card_id: cardId,
        status:  _.gt(0), //非删除都算
        reply_id:  _.in(_ids),
      }).get({success: function(res){
        var total = res.data.length;
        console.log("comment 2 level len:", total);
        var left = _ids.length - total;
        console.log("msg_unread_reset left: ", _ids.length, total, left);
        wx.cloud.callFunction({
          name: 'msg_unread_reset',
          data: {
            openid: app.globalData.openid,
            cardid: cardId,
            count: left,
          },
          fail: res => {
            console.log("msg_unread_reset:", res)
          }
        });
      },fail: function(res){
        console.log("get comment fail: ", res);
      }});
    },fail: function (res){
      console.log("get comments: ", res);
    }});
  },
  auditOk: function(event) {
    var page = this;
    var cmtId = event.currentTarget.dataset.cid;
    var nopush = event.currentTarget.dataset.nopush;
    var isreply = event.currentTarget.dataset.isreply;
    var recvopenid = event.currentTarget.dataset.recvopenid;
    var content = event.currentTarget.dataset.content;
    var hint = "审核通过？";
    if (nopush == 1) {
      hint = "审核通过？(nopush)";
    }
    var type = "ask";
    if (isreply == 1) {
      type = "reply";
    }
    wx.showModal({
      title: '提示',
      content: hint,
      success: function (res) {
        if (res.confirm) {
          wx.showLoading({
            title: '审核开始...',
          })
          // 静默 status=1，并给 发帖作者发 留言通知          
    	    var path = page.getSharePath();
          var args = {
            openid: recvopenid,
            cmtid: cmtId,
            status: 1,
            path: path,
            content: content
          }
          wx.cloud.callFunction({
            name: 'audit_status_cmt',
            data: args,
            success: res => {
              page.updateUnread();
              console.log("cloud.audit_status_cmt:", res);
              if (nopush == 1) {
                page.loadComments();
                wx.hideLoading()
                return
              } else {
                app.push(type, args, function (res) {
                  page.loadComments();
                  wx.hideLoading()
                });                
              };
            },
            fail: res => {
              console.log("cloud.audit_status_cmt:", res);
              app.save_err(args.openid, res);
            },
            complete: () => {
              console.log("cloud.unimessage complete")
            }
          });
        }
      },
      fail: function (res) {
        console.log(res);
      }
    });
  },
  auditFail: function(event) {
    var page = this;
    var cmtId = event.currentTarget.dataset.cid;
    wx.showModal({
      title: '提示',
      content: '审核失败？',
      success: function (res) {
        if (res.confirm) {
          wx.showLoading({
            title: '审核开始...',
          })
          // 静默 status=3        
          var args = {
            openid: app.globalData.openid,
            cmtid: cmtId,
            status: 3 
          }
          wx.cloud.callFunction({
            name: 'audit_status_cmt',
            data: args,
            success: res => {
              page.loadComments();
              page.updateUnread();
              wx.hideLoading();
              console.log("cloud.audit_status_cmt:", res);
            },
            fail: res => {
              console.log("cloud.audit_status_cmt:", res);
              app.save_err(args.openid, res);
            },
            complete: () => {
              console.log("cloud.unimessage complete")
            }
          });
        }
      },
      fail: function (res) {
        console.log(res);
      }
    });
  },
  openReply: function(event) {
    this.showInputBox();
    var replyId = event.currentTarget.dataset.replyid;
    this.setData({ replyId: replyId });
  },
  toTopCard: function() {
    var page = this;
    if (app.isAdmin()) {
      wx.showModal({
        title: '提示',
        content: '置顶？',
        success: function (res) {
          if (res.confirm) {
            var data = {
              cardid: page.data.card._id,
              openid: page.data.card._openid,
            }
            wx.cloud.callFunction({
              name: 'totop_card',
              data: data,
              success: res => {
                console.log('[云函数] [totop_card]: ', data)
                wx.showToast({title: 'totop OK.'});
              },
              fail: err => {
                console.error('[云函数] [totop_card] 调用失败', err)
              }
            })            
          }
        }
      });
    } else {
      console.log("it's not admin, can not totop.", data);
    }
  }, 
  setSeek: function() {
    var page = this;
    if (app.isAdmin()) {
      wx.showModal({
        title: '提示',
        content: '设置寻找？',
        success: function (res) {
          if (res.confirm) {
            var data = {
              cardid: page.data.card._id,
              openid: page.data.card._openid,
              is_seek: 1,
            }
            wx.cloud.callFunction({
              name: 'set_seek',
              data: data,
              success: res => {
                console.log('[云函数] [set_seek]: ', data)
                wx.showToast({title: 'totop OK.'});
              },
              fail: err => {
                console.error('[云函数] [set_seek] 调用失败', err)
              }
            })            
          }
        }
      });
    } else {
      console.log("it's not admin, can not seek.", data);
    }
  },
  switchChange: function(e) {
    console.log("switchChange: ", e.detail.value);
    this.data.openSwitch = e.detail.value;
  },
  goEdit: function (event){
    var url = "/pages/editCard/editCard?id=" + this.data.card._id;
    wx.navigateTo({
      url: url,
      success: function (res) {
        console.log("goDetails success: ");
      },
      fail: function (res) {
        console.log("goDetails fail: ");
        console.log(res);
        wx.redirectTo({
          url: url,
        });
      }
    })    
  },
  saveFormid: function (event) {
    app.saveFormid(event.detail.formId, "cmt");
  },
  continueSubscribe: function(event) {
    var page = this;
    wx.requestSubscribeMessage({
      tmplIds: ['j-4XK2DeMlOsMyNsyn06oXor6L_tL9aQhfMrNk6Gpzg'],
      success(res) {
        if (res['j-4XK2DeMlOsMyNsyn06oXor6L_tL9aQhfMrNk6Gpzg'] == "accept") {
          wx.showToast({
            title: '订阅成功！',
          });
          submessage.add(app.globalData.openid, page.data.card._id, page.data.notify_tag);
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
  },
  onLike: function() {
    var page = this;  
    //var help_uids = page.data.card.help_uids || [];
    //help_uids.push(app.globalData.openid);
    //page.data.card.help_uids = help_uids;
    page.setData({
      liked: true
    });
    db.collection('attractions').where({
      _id: page.data.cardId
    }).get({
      success: res => {
        console.log("details: ");
        console.log(res.data);
        var card = res.data[0];
        if ( (card.help_uids || []).indexOf(app.globalData.openid) == -1 ) {
          wx.cloud.callFunction({
            name: 'card_help',
            data: {
              cardId: page.data.card._id,
              openid: app.globalData.openid
            },
            success: res => {
              console.log("card_help succ", page.data.card._id);
              wx.showToast({
                title: '感谢点赞哈',
              })
            },
            fail: err => {
              console.log(err);
            }
          });
        }
      },
      fail: err => {
        console.error(err);
      }
    });
  },
  bindGetUserInfo: function(e) {
    var page = this;
    var userInfo = e.detail.userInfo;
    //拒绝 e.detail.userInfo -> undefined
    console.log("bindGetUserInfo: ", userInfo);
    if (!!userInfo) {
      //save user info
      app.globalData.userInfo = userInfo;
      user.update()
      page.onLike()
    }
  }
})
