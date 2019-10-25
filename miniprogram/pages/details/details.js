// miniprogram/pages/details/details.js
var db = wx.cloud.database();
var recommend = require("../../utils/recommend.js")
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
    defaultImg: "../../images/default.png"
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
      page.setData({
        cardId: options.id,
        latitudeShared: options.latitude,
        longitudeShared: options.longitude
      });
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

            page.getCardsRelated();

            app.addEventLog("into detail", card);
            
            /*recommend.get(function(cards){
              page.setData({ cardList: cards })
            });*/
          }
        },
        fail: err => {
          console.log(err);
        }
      }) 
    }
  },
  onShareAppMessage: function () {
    var page = this;
    app.addEventLog("detail share", page.data.cardId);
    return {
      title: page.data.card.address.replace("广东省", "").replace("广州市", "").replace("番禺区", ""),
      desc: '各种类别都有哦～',
      path: '/pages/details/details?id=' + page.data.cardId + '&latitude=' + app.globalData.latitude + '&longitude=' + app.globalData.longitude
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
    wx.navigateTo({
      url: '/pages/index/index',
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
})
