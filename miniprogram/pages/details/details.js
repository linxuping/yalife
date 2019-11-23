// miniprogram/pages/details/details.js
var db = wx.cloud.database();
var recommend = require("../../utils/recommend")
const app = getApp()
const _ = db.command

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
    isScroll: true,
    cmtContent: "",
    comments: []
  },
  showInputBox: function () {
    this.setData({ inputBoxShow: true });
    this.setData({ isScroll: false });
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

      if (!!options.latitude && !!options.longitude) {
        app.globalData.latitude = parseFloat( options.latitude );
        app.globalData.longitude = parseFloat( options.longitude );
        app.globalData.address = decodeURIComponent(options.address);
        console.log("app.globalData update: ", app.globalData);        
      }
      
      if (!!options.source) {
        app.globalData.source = options.source;
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
              card: card
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
      db.collection('comment').where({
        card_id: options.id
      }).get({
        success: res => {
          page.setData({
            comments: res.data
          });
        },
        fail: res=> {
          console.log(res);
        }
      });
    } else {
      page.setData({ showHome: true })
    }
  },
  onShareAppMessage: function () {
    var page = this;
    var latitude = page.data.latitudeShared > 0 ? page.data.latitudeShared : app.globalData.latitude;
    var longitude = page.data.longitudeShared > 0 ? page.data.longitudeShared : app.globalData.longitude;
    var address = app.globalData.address;
    //console.log("addr: ", page.data.addressShared, app.globalData.address, address);
    var path = '/pages/details/details?id=' + page.data.cardId + '&latitude=' + latitude + '&longitude=' + longitude + '&address=' + encodeURIComponent(address);
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
    this.setData({
      cmtContent: e.detail.value
    });
  },
  addComment: function(event) {
    var page = this;
    wx.showLoading({
      title: '新增评论...',
    })
    app.saveFormid(event.detail.formId);
    db.collection('comment').add({
      // data 字段表示需新增的 JSON 数据
      data: {
        card_id: page.data.card._id,
        content: page.data.cmtContent,
        reply_id: "",
      },
      success: function (res) {
        page.invisible();
      },
      fail: function(res) {
        console.log(res);
      },
      complete: function(res) {
        wx.hideLoading();
      }
    });
  }
})
