// miniprogram/pages/homepage/homepage.js
var db = wx.cloud.database();
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    cardList: [],
    openid: "",
    loaded: false,
    defaultImg: "../../images/default.png"
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var page = this;
    wx.cloud.callFunction({
      name: 'login',
      complete: res => {
        console.log("login:")
        console.log(res);
        page.setData({
          openid: res.result.openid
        });
        //page.onShow()

        //app.sendMessage(res.result.openid, "title", "msg...");
      }
    });

    app.addEventLog("into homepage");

    /*wx.cloud.callFunction({
      name: 'message',
      data: {
        openid: "oV5MQ5YBim_nRH66WxfWLGVcW7yc",
        formid: "8cc668a036094bfe917600556088cd8c",
        title: "123",
        message: "msg"
      },
      complete: res => {
        console.log("message:")
        console.log(res);
      }
    });*/


    wx.setNavigationBarTitle({
      title: '我发布了什么'
    });
    wx.hideShareMenu({
    });
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
    var page = this;
    console.log(page.data);
    const _ = db.command
    var cond = {
      status: _.gt(0)
    };
    console.log("app.globalData: ");
    console.log(app.isAdmin());
    if (!app.isAdmin()) {
      cond._openid = app.globalData.openid
    }
    /*db.collection('attractions').orderBy('update_time', 'desc').where(cond).get({
      success: res => {
        console.log("geo result: ");
        console.log(res.data);
        page.setData({
          cardList: res.data
        })
        setTimeout(function () {
          page.setData({
            loaded: true
          })
        }, 1000);
      },
      fail: err => {
        console.log(err);
      }
    })*/
    page.getCardsRecursively(cond, 0, 20);
  },
  getCardsRecursively: function(cond, offset,limit){
    var page = this;
    db.collection('attractions').orderBy('sort_time', 'desc').where(cond).skip(offset).limit(limit).get({
      success: res => {
        console.log("cards: ");
        console.log(res.data);
        page.setData({
          cardList: page.data.cardList.concat( res.data )
        })
        if (res.data.length == limit) {
          console.log("getCardsRecursively: "+offset+" "+limit);
          page.getCardsRecursively(cond, offset+limit, limit);
        }
        setTimeout(function () {
          page.setData({
            loaded: true
          })
        }, 1000);
      },
      fail: err => {
        console.log(err);
      }
    })
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
  jumpEdit: function (event) {
    var page = this;
    console.log(event);
    var cardId = event.currentTarget.dataset.cardid;
    wx.navigateTo({
      url: '/pages/editCard/editCard?id=' + cardId,
    })
  },
  onDeleteCard: function (event) {
    var page = this;
    console.log(event);
    var cardId = event.currentTarget.dataset.cardid;
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
              page.onShow()
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

  goMainPage: function(){
    wx.navigateTo({
      url: '/pages/index/index'
    })
  },

  goAddPage: function () {
    app.addEventLog("into homepage.add");
    wx.navigateTo({
      url: '/pages/editCard/editCard'
    })
  }
})
